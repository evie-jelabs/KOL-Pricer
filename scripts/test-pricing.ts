/**
 * Test pricing model v5.1 against real X API data + Claude analysis
 * Usage: npx tsx scripts/test-pricing.ts
 */

import { getUserByUsername, getUserTweets } from "../src/lib/x-api";
import { analyzeAccount } from "../src/lib/anthropic";
import {
  calculateScores,
  calculatePricing,
  trimOutliers,
  removeIQROutliers,
} from "../src/lib/scoring";

// Load env
import { config } from "dotenv";
config({ path: ".env.local", override: true });

const TEST_ACCOUNTS: { handle: string; actualPrice: number | null }[] = [
  // Original 5
  { handle: "0xEvieYang", actualPrice: null },
  { handle: "0xBeyondLee", actualPrice: null },
  { handle: "wolfyxbt", actualPrice: 3000 },
  { handle: "Kkkatia1", actualPrice: null },
  { handle: "jiroucaigou", actualPrice: null },
  // 19 new accounts
  { handle: "Bitwux", actualPrice: 2250 },
  { handle: "KuiGas", actualPrice: 3000 },
  { handle: "thecryptoskanda", actualPrice: 1500 },
  { handle: "_FORAB", actualPrice: 1500 },
  { handle: "ai_9684xtpa", actualPrice: 2500 },
  { handle: "wenxue600", actualPrice: 1000 },
  { handle: "btc563", actualPrice: 2000 },
  { handle: "Moon1ightSt", actualPrice: 400 },
  { handle: "EmberCN", actualPrice: 1000 },
  { handle: "momochenming", actualPrice: 800 },
  { handle: "JYdmnLFG", actualPrice: 1500 },
  { handle: "cryptowilson_", actualPrice: 400 },
  { handle: "wanghebbf", actualPrice: 800 },
  { handle: "Monica_xiaoM", actualPrice: 500 },
  { handle: "KongBTC", actualPrice: 750 },
  { handle: "belizardd", actualPrice: 600 },
  { handle: "Hercules_Defi", actualPrice: 500 },
  { handle: "CryptoGirlNova", actualPrice: 650 },
  { handle: "abgweb3", actualPrice: 300 },
];

async function analyzeOne(handle: string, actualPrice: number | null) {
  try {
    // Step 1: Fetch user
    const user = await getUserByUsername(handle);
    const followers = user.public_metrics.followers_count;

    // Step 2: Fetch 30 tweets
    const tweets = await getUserTweets(user.id, 30);
    if (tweets.length === 0) {
      console.log(`@${handle}: No tweets found, skipping`);
      return null;
    }

    // Step 3: Trim top/bottom 3
    const trimmed = trimOutliers(tweets, 3);

    // Step 4: IQR outlier removal
    const cleaned = removeIQROutliers(trimmed);

    // Step 5: Claude analysis
    const tweetTexts = tweets.map((t) => t.text);
    const { domain, analysis } = await analyzeAccount(
      user.description || "",
      tweetTexts,
      followers,
      user.public_metrics.following_count,
      user.public_metrics.tweet_count,
      user.created_at
    );

    // Step 6: Calculate scores (for display)
    const scores = calculateScores(followers, cleaned);

    // Step 7: V2.1 pricing
    const pricing = calculatePricing(
      scores,
      cleaned,
      followers,
      domain,
      analysis.credibilityScore,
      analysis.relevanceScore,
      analysis.identityTags,
      analysis.capabilityTags
    );

    // Calculate deviation
    const deviation = actualPrice
      ? ((pricing.price - actualPrice) / actualPrice) * 100
      : null;

    console.log(
      `@${handle.padEnd(18)} | ${String(followers).padStart(8)} flw | ${String(pricing.avgImpressions).padStart(7)} avgImp | EffImp ${pricing.effectiveImpressions.toFixed(1).padStart(5)} | Score ${pricing.overallScore} | CPM $${pricing.cpm} | Dom ${pricing.domainMultiplier} | Cred ${analysis.credibilityScore}→${pricing.credibilityMultiplier}x | Relev ${analysis.relevanceScore}→${pricing.relevanceMultiplier}x | Id ${analysis.identityTags.join("+")}×${analysis.capabilityTags.join("+")}→${pricing.identityMultiplier}x | Mods ${pricing.combinedModifiers}x | Tw ${tweets.length}→${trimmed.length}→${cleaned.length} | $${String(pricing.price).padStart(6)}${pricing.floorApplied ? "(floor)" : ""} | Actual ${actualPrice ? "$" + actualPrice : "-".padStart(6)} | Dev ${deviation !== null ? deviation.toFixed(0) + "%" : "-"}`
    );

    return {
      handle,
      followers,
      pricing,
      domain,
      analysis,
      scores,
      tweetCounts: `${tweets.length}→${trimmed.length}→${cleaned.length}`,
      actualPrice,
      deviation,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`@${handle}: ERROR - ${message}`);
    return null;
  }
}

async function main() {
  console.log("=== KOL Pricer v5.1 - Real Data Test ===\n");
  console.log("Formula: Price = $60 × (AvgImp/1000)^0.85 × Modifiers");
  console.log("Modifiers = FF × Domain × Cred × Relev × Identity × ER × RE");
  console.log("Data: 30 tweets → trim top/bottom 3 → IQR 1.5x filter\n");

  const results: NonNullable<Awaited<ReturnType<typeof analyzeOne>>>[] = [];

  for (const account of TEST_ACCOUNTS) {
    const result = await analyzeOne(account.handle, account.actualPrice);
    if (result) results.push(result);
    // Small delay to avoid rate limiting
    await new Promise((r) => setTimeout(r, 1500));
  }

  // Summary
  console.log("\n\n=== SUMMARY ===\n");

  const withActual = results.filter((r) => r.actualPrice !== null);
  const within15 = withActual.filter((r) => Math.abs(r.deviation!) <= 15);
  const within25 = withActual.filter((r) => Math.abs(r.deviation!) <= 25);
  const within50 = withActual.filter((r) => Math.abs(r.deviation!) <= 50);
  const over50 = withActual.filter((r) => Math.abs(r.deviation!) > 50);

  console.log(`Total accounts analyzed: ${results.length}`);
  console.log(`Accounts with actual price: ${withActual.length}`);
  console.log(
    `Within ±15%: ${within15.length}/${withActual.length} (${((within15.length / withActual.length) * 100).toFixed(0)}%)`
  );
  console.log(
    `Within ±25%: ${within25.length}/${withActual.length} (${((within25.length / withActual.length) * 100).toFixed(0)}%)`
  );
  console.log(
    `Within ±50%: ${within50.length}/${withActual.length} (${((within50.length / withActual.length) * 100).toFixed(0)}%)`
  );
  console.log(`Over ±50% deviation: ${over50.length}`);

  if (over50.length > 0) {
    console.log("\nHigh deviation accounts:");
    over50.forEach((r) => {
      console.log(
        `  @${r.handle}: $${r.pricing.price} vs actual $${r.actualPrice} (${r.deviation!.toFixed(0)}%)`
      );
    });
  }
}

main().catch(console.error);
