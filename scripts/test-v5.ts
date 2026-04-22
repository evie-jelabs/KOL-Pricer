import * as fs from "fs";
import * as path from "path";

// Custom .env.local loader that handles = in values correctly
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    let val = trimmed.substring(eqIdx + 1).trim();
    // Remove surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}
loadEnv();

const X_API_BASE = "https://api.x.com/2";
const TOKEN = process.env.X_BEARER_TOKEN!;

// ====== V5 Formula Constants ======
const BASE_CPM = 60;
const IMP_EXPONENT = 0.85;

// Follower Factor (9 tiers)
function followerFactor(f: number): number {
  if (f > 200_000) return 1.80;
  if (f >= 80_000) return 1.60;
  if (f >= 30_000) return 1.40;
  if (f >= 15_000) return 1.20;
  if (f >= 8_000) return 1.00;
  if (f >= 3_000) return 0.80;
  if (f >= 1_000) return 0.65;
  if (f >= 500) return 0.50;
  return 0.30;
}

// Domain multiplier
const DOMAIN_MULT: Record<string, number> = {
  crypto: 1.40, tech: 1.30, finance: 1.40, business: 1.20, entertainment: 1.00, other: 1.00,
};

// Credibility multiplier (max 1.00, penalty only)
function credMult(score: number): number {
  if (score >= 85) return 1.00;
  if (score >= 70) return 0.90;
  if (score >= 55) return 0.70;
  if (score >= 40) return 0.45;
  return 0.25;
}

// Relevance multiplier (max 1.00, penalty only)
function relMult(score: number): number {
  if (score >= 85) return 1.00;
  if (score >= 70) return 0.90;
  if (score >= 55) return 0.70;
  if (score >= 40) return 0.45;
  return 0.25;
}

// Identity multiplier
function identMult(identity: string[], capability: string[]): number {
  const idFactor = identity.includes("Builder") ? 1.20 : 1.00;
  const capMap: Record<string, number> = { Branding: 1.10, Trading: 1.10, Traffic: 0.90 };
  const capFactor = capability.length > 0
    ? Math.max(...capability.map(c => capMap[c] ?? 1.00))
    : 1.00;
  return Math.round(idFactor * capFactor * 100) / 100;
}

// ER multiplier (adjusted for crypto)
function erMult(er: number): number {
  if (er > 2) return 1.10;
  if (er >= 1) return 1.00;
  if (er >= 0.5) return 0.90;
  if (er >= 0.2) return 0.80;
  return 0.60;
}

// Reach Efficiency multiplier (adjusted for crypto)
function reMult(re: number): number {
  if (re > 20) return 1.10;
  if (re >= 10) return 1.00;
  if (re >= 5) return 0.90;
  if (re >= 2) return 0.80;
  return 0.60;
}

// Floor rules
function getFloor(followers: number, credScore: number): number {
  // >80K no floor
  if (followers > 80_000) return 0;

  let floor = 0;
  if (followers >= 30_000) floor = 500;
  else if (followers >= 15_000) floor = 500;
  else if (followers >= 8_000) floor = 350;
  else if (followers >= 3_000) floor = 200;
  else if (followers >= 1_000) floor = 100;
  else floor = 50;

  // Cred gating
  if (credScore < 55) return 0;
  if (credScore < 70) return Math.round(floor * 0.5);
  return floor;
}

// ====== X API helpers ======
async function xFetch(path: string, params: Record<string, string>) {
  const url = new URL(`${X_API_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (res.status === 429) {
    const reset = res.headers.get("x-rate-limit-reset");
    const waitSec = reset ? Math.max(0, Number(reset) - Math.floor(Date.now() / 1000)) : 60;
    console.log(`  ⏳ Rate limited, waiting ${waitSec}s...`);
    await new Promise(r => setTimeout(r, (waitSec + 2) * 1000));
    return xFetch(path, params);
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`X API ${res.status}: ${body}`);
  }
  return res.json();
}

async function getUser(username: string) {
  const data = await xFetch(`/users/by/username/${username}`, {
    "user.fields": "public_metrics,description,created_at",
  });
  return data.data;
}

async function getTweets(userId: string) {
  const data = await xFetch(`/users/${userId}/tweets`, {
    max_results: "30",
    "tweet.fields": "public_metrics,created_at,text",
    exclude: "retweets,replies",
  });
  return data.data ?? [];
}

// ====== Data preprocessing ======
function trimTopBottom(tweets: any[], n: number): any[] {
  if (tweets.length <= n * 2) return tweets;
  const sorted = [...tweets].sort(
    (a, b) => a.public_metrics.impression_count - b.public_metrics.impression_count
  );
  return sorted.slice(n, sorted.length - n);
}

function removeIQROutliers(tweets: any[], factor: number = 1.5): any[] {
  if (tweets.length < 4) return tweets;
  const imps = tweets.map((t: any) => t.public_metrics.impression_count).sort((a: number, b: number) => a - b);
  const q1 = imps[Math.floor(imps.length * 0.25)];
  const q3 = imps[Math.floor(imps.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - factor * iqr;
  const upper = q3 + factor * iqr;
  return tweets.filter((t: any) => {
    const imp = t.public_metrics.impression_count;
    return imp >= lower && imp <= upper;
  });
}

// ====== Main ======
interface AccountTest {
  handle: string;
  actualPrice: number | null;
  // Mock Claude scores (we'll estimate these)
}

const ACCOUNTS: AccountTest[] = [
  { handle: "0xEvieYang", actualPrice: null },
  { handle: "0xBeyondLee", actualPrice: null },
  { handle: "wolfyxbt", actualPrice: 3000 },
  { handle: "Kkkatia1", actualPrice: null },
  { handle: "jiroucaigou", actualPrice: null },
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

// Simple heuristic Claude scores (to be replaced by actual Claude API calls)
function estimateClaudeScores(handle: string, followers: number, following: number, tweetCount: number, createdAt: string, avgImp: number, er: number, tweets: any[]) {
  // Default
  let cred = 75, relev = 80;
  let identity: string[] = ["KOL"];
  let capability: string[] = ["Trading"];
  const domain = "crypto";

  const accountAgeDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const tweetsPerDay = tweetCount / Math.max(1, accountAgeDays);

  // Credibility heuristics
  if (following > followers) cred = Math.min(cred, 60); // follow > follower = mutual follow
  if (tweetsPerDay > 30) cred = Math.min(cred, 50); // too many tweets per day
  if (er < 0.3 && followers > 50000) cred = Math.min(cred, 60); // large but no engagement
  if (er < 0.5 && followers > 100000) cred = Math.min(cred, 55);

  // Known account overrides based on our earlier analysis
  const overrides: Record<string, { cred: number; relev: number; identity: string[]; capability: string[] }> = {
    "0xEvieYang": { cred: 88, relev: 75, identity: ["Builder", "KOL"], capability: ["Branding"] },
    "0xBeyondLee": { cred: 82, relev: 90, identity: ["KOL"], capability: ["Branding"] },
    "wolfyxbt": { cred: 75, relev: 42, identity: ["KOL"], capability: ["Traffic"] },
    "Kkkatia1": { cred: 65, relev: 60, identity: ["Builder"], capability: ["Branding"] },
    "jiroucaigou": { cred: 40, relev: 65, identity: ["Content Creator"], capability: ["Traffic"] },
    "Bitwux": { cred: 80, relev: 78, identity: ["KOL"], capability: ["Trading"] },
    "KuiGas": { cred: 78, relev: 85, identity: ["KOL"], capability: ["Branding"] },
    "thecryptoskanda": { cred: 80, relev: 88, identity: ["KOL"], capability: ["Branding"] },
    "_FORAB": { cred: 75, relev: 75, identity: ["KOL"], capability: ["Branding"] },
    "ai_9684xtpa": { cred: 58, relev: 88, identity: ["KOL"], capability: ["Trading"] },
    "wenxue600": { cred: 60, relev: 55, identity: ["KOL"], capability: ["Trading"] },
    "btc563": { cred: 80, relev: 80, identity: ["KOL"], capability: ["Trading"] },
    "Moon1ightSt": { cred: 55, relev: 50, identity: ["KOL"], capability: ["Traffic"] },
    "EmberCN": { cred: 45, relev: 60, identity: ["KOL"], capability: ["Trading"] },
    "momochenming": { cred: 65, relev: 55, identity: ["KOL"], capability: ["Branding"] },
    "JYdmnLFG": { cred: 78, relev: 78, identity: ["KOL"], capability: ["Trading"] },
    "cryptowilson_": { cred: 78, relev: 78, identity: ["KOL"], capability: ["Trading"] },
    "wanghebbf": { cred: 75, relev: 75, identity: ["KOL"], capability: ["Trading"] },
    "Monica_xiaoM": { cred: 60, relev: 85, identity: ["KOL"], capability: ["Branding"] },
    "KongBTC": { cred: 78, relev: 80, identity: ["KOL"], capability: ["Trading"] },
    "belizardd": { cred: 78, relev: 78, identity: ["KOL"], capability: ["Trading"] },
    "Hercules_Defi": { cred: 78, relev: 85, identity: ["Builder"], capability: ["Branding"] },
    "CryptoGirlNova": { cred: 55, relev: 85, identity: ["KOL"], capability: ["Branding"] },
    "abgweb3": { cred: 70, relev: 60, identity: ["Content Creator"], capability: ["Traffic"] },
  };

  if (overrides[handle]) {
    const o = overrides[handle];
    cred = o.cred;
    relev = o.relev;
    identity = o.identity;
    capability = o.capability;
  }

  return { domain, cred, relev, identity, capability };
}

async function analyzeAccount(account: AccountTest) {
  const { handle, actualPrice } = account;

  try {
    // Fetch data
    const user = await getUser(handle);
    const rawTweets = await getTweets(user.id);

    if (rawTweets.length === 0) {
      return { handle, error: "No tweets" };
    }

    // Step 1: Trim top/bottom 3
    const trimmed = trimTopBottom(rawTweets, 3);

    // Step 2: IQR 1.5x outlier removal
    const cleaned = removeIQROutliers(trimmed, 1.5);

    // Calculate metrics from cleaned tweets
    const impressions = cleaned.map((t: any) => t.public_metrics.impression_count);
    const avgImp = impressions.reduce((a: number, b: number) => a + b, 0) / impressions.length;

    const totalEng = cleaned.reduce((sum: number, t: any) => {
      const m = t.public_metrics;
      return sum + m.like_count + m.reply_count + m.retweet_count + (m.quote_count || 0);
    }, 0);
    const avgEng = totalEng / cleaned.length;

    const followers = user.public_metrics.followers_count;
    const following = user.public_metrics.following_count;

    // ER = avg engagement / avg impressions * 100
    const er = avgImp > 0 ? (avgEng / avgImp) * 100 : 0;
    // RE = avg impressions / followers * 100
    const re = followers > 0 ? (avgImp / followers) * 100 : 0;

    // Get Claude scores (estimated)
    const claude = estimateClaudeScores(
      handle, followers, following,
      user.public_metrics.tweet_count,
      user.created_at, avgImp, er, cleaned
    );

    // Calculate v5 price
    const effImp = Math.pow(avgImp / 1000, IMP_EXPONENT);
    const ff = followerFactor(followers);
    const dom = DOMAIN_MULT[claude.domain] || 1.0;
    const cm = credMult(claude.cred);
    const rm = relMult(claude.relev);
    const im = identMult(claude.identity, claude.capability);
    const erm = erMult(er);
    const rem = reMult(re);

    const mods = ff * dom * cm * rm * im * erm * rem;
    const price = BASE_CPM * effImp * mods;

    const floor = getFloor(followers, claude.cred);
    const finalPrice = Math.max(floor, price);

    const deviation = actualPrice ? ((finalPrice - actualPrice) / actualPrice * 100) : null;

    return {
      handle,
      followers,
      rawTweets: rawTweets.length,
      afterTrim: trimmed.length,
      afterIQR: cleaned.length,
      avgImp: Math.round(avgImp),
      effImp: Math.round(effImp * 100) / 100,
      er: Math.round(er * 100) / 100,
      re: Math.round(re * 100) / 100,
      ff, dom,
      cred: claude.cred, cm,
      relev: claude.relev, rm,
      identity: claude.identity.join("+"),
      capability: claude.capability.join("+"),
      im,
      erm, rem,
      mods: Math.round(mods * 100) / 100,
      calcPrice: Math.round(price),
      floor,
      finalPrice: Math.round(finalPrice),
      actualPrice,
      deviation: deviation !== null ? `${deviation > 0 ? "+" : ""}${Math.round(deviation)}%` : "-",
    };
  } catch (err: any) {
    return { handle, error: err.message };
  }
}

async function main() {
  console.log("🚀 V5 Pricing Model Test (Real X API Data)\n");
  console.log("Formula: Price = $60 × (AvgImp/1000)^0.85 × FF × Dom × Cred × Relev × Identity × ER × RE\n");

  const results: any[] = [];

  for (const account of ACCOUNTS) {
    console.log(`📊 Analyzing @${account.handle}...`);
    const result = await analyzeAccount(account);
    results.push(result);

    if ("error" in result && result.error) {
      console.log(`  ❌ Error: ${result.error}\n`);
    } else {
      const r = result as any;
      console.log(`  Followers: ${r.followers?.toLocaleString()} | AvgImp: ${r.avgImp?.toLocaleString()} (eff: ${r.effImp}) | Tweets: ${r.rawTweets}→${r.afterTrim}→${r.afterIQR}`);
      console.log(`  ER: ${r.er}% (${r.erm}x) | RE: ${r.re}% (${r.rem}x)`);
      console.log(`  FF: ${r.ff} | Dom: ${r.dom} | Cred: ${r.cred}→${r.cm} | Relev: ${r.relev}→${r.rm} | Id: ${r.identity}×${r.capability}=${r.im}`);
      console.log(`  Mods: ${r.mods} | Calc: $${r.calcPrice} | Floor: $${r.floor} | Final: $${r.finalPrice} | Actual: ${r.actualPrice ? "$" + r.actualPrice : "-"} | Dev: ${r.deviation}`);
      console.log();
    }

    // Rate limit safety: wait between requests
    await new Promise(r => setTimeout(r, 1500));
  }

  // Summary table
  console.log("\n" + "=".repeat(130));
  console.log("SUMMARY");
  console.log("=".repeat(130));
  console.log(
    "Handle".padEnd(20) +
    "Followers".padStart(10) +
    "AvgImp".padStart(10) +
    "ER%".padStart(7) +
    "RE%".padStart(7) +
    "FF".padStart(6) +
    "Cred".padStart(6) +
    "Relev".padStart(6) +
    "ER.M".padStart(6) +
    "RE.M".padStart(6) +
    "Id".padStart(6) +
    "Mods".padStart(7) +
    "Price".padStart(8) +
    "Actual".padStart(8) +
    "Dev".padStart(8)
  );
  console.log("-".repeat(130));

  let within25 = 0, within50 = 0, over50 = 0, total = 0;

  for (const r of results) {
    if (r.error) continue;
    console.log(
      `@${r.handle}`.padEnd(20) +
      (r.followers?.toLocaleString() || "").padStart(10) +
      (r.avgImp?.toLocaleString() || "").padStart(10) +
      `${r.er}`.padStart(7) +
      `${r.re}`.padStart(7) +
      `${r.ff}`.padStart(6) +
      `${r.cm}`.padStart(6) +
      `${r.rm}`.padStart(6) +
      `${r.erm}`.padStart(6) +
      `${r.rem}`.padStart(6) +
      `${r.im}`.padStart(6) +
      `${r.mods}`.padStart(7) +
      `$${r.finalPrice}`.padStart(8) +
      (r.actualPrice ? `$${r.actualPrice}` : "-").padStart(8) +
      r.deviation.padStart(8)
    );

    if (r.actualPrice) {
      total++;
      const devNum = Math.abs(parseInt(r.deviation));
      if (devNum <= 25) within25++;
      else if (devNum <= 50) within50++;
      else over50++;
    }
  }

  console.log("\n" + "=".repeat(130));
  console.log(`Accuracy (${total} accounts with actual prices):`);
  console.log(`  ±25%: ${within25} (${Math.round(within25/total*100)}%)`);
  console.log(`  ±25-50%: ${within50} (${Math.round(within50/total*100)}%)`);
  console.log(`  >50%: ${over50} (${Math.round(over50/total*100)}%)`);
}

main().catch(console.error);
