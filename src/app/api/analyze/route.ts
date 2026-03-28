import { NextRequest } from "next/server";
import { getUserByUsername, getUserTweets } from "@/lib/x-api";
import { analyzeAccount } from "@/lib/anthropic";
import {
  calculateScores,
  calculatePricing,
  trimOutliers,
  removeIQROutliers,
} from "@/lib/scoring";
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS } from "@/lib/constants";

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((entry, ip) => {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  });
}, 5 * 60 * 1000);

function parseHandle(input: string): string {
  let handle = input.trim();
  // Handle x.com/username or twitter.com/username URLs
  const urlMatch = handle.match(
    /(?:x\.com|twitter\.com)\/(@?[\w]+)/i
  );
  if (urlMatch) {
    handle = urlMatch[1];
  }
  // Remove @ prefix
  handle = handle.replace(/^@/, "");
  // Remove query params like ?s=21
  handle = handle.split("?")[0];
  return handle;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(ip)) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded. Please wait a minute and try again.",
      }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }

  let handle: string;
  try {
    const body = await req.json();
    handle = parseHandle(body.handle || "");
    if (!handle) {
      return new Response(
        JSON.stringify({ error: "Please provide a valid X handle" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function sendLog(message: string, type: "info" | "success" | "error" = "info") {
        const data = JSON.stringify({
          type: "log",
          log: { timestamp: new Date().toISOString(), message, type },
        });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }

      function sendResult(result: unknown) {
        const data = JSON.stringify({ type: "result", data: result });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }

      function sendError(error: string) {
        const data = JSON.stringify({ type: "error", error });
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }

      try {
        // Step 1: Fetch user profile
        sendLog(`Fetching profile for @${handle}...`);
        const user = await getUserByUsername(handle);
        sendLog(
          `Found @${user.username} — ${user.public_metrics.followers_count.toLocaleString()} followers`,
          "success"
        );

        // Step 2: Fetch recent tweets
        sendLog("Fetching 30 recent original tweets...");
        const tweets = await getUserTweets(user.id, 30);
        if (tweets.length === 0) {
          sendError("No tweets found for this user");
          controller.close();
          return;
        }
        sendLog(`Loaded ${tweets.length} tweets`, "success");

        // Step 3: Trim top/bottom 3 outliers
        const trimmed = trimOutliers(tweets, 3);
        sendLog(
          `Trimmed top/bottom 3 by impressions → ${trimmed.length} tweets`,
          "success"
        );

        // Step 4: IQR anomaly detection
        const cleaned = removeIQROutliers(trimmed);
        const iqrRemoved = trimmed.length - cleaned.length;
        if (iqrRemoved > 0) {
          sendLog(
            `IQR 1.5x filter removed ${iqrRemoved} anomalous tweets → ${cleaned.length} tweets for scoring`,
            "success"
          );
        } else {
          sendLog(
            `IQR filter: no additional outliers found, using ${cleaned.length} tweets`,
            "success"
          );
        }

        // Step 5: AI analysis (domain + credibility + relevance + tags)
        sendLog("Analyzing with Claude AI (domain, credibility, relevance, tags)...");
        const tweetTexts = tweets.map((t) => t.text);
        const { domain, analysis: claudeAnalysis } = await analyzeAccount(
          user.description || "",
          tweetTexts,
          user.public_metrics.followers_count,
          user.public_metrics.following_count,
          user.public_metrics.tweet_count,
          user.created_at
        );
        sendLog(`Domain: ${domain}`, "success");
        sendLog(
          `Credibility: ${claudeAnalysis.credibilityScore}/100 — ${claudeAnalysis.credibilityReason}`,
          "success"
        );
        sendLog(
          `Relevance: ${claudeAnalysis.relevanceScore}/100 — ${claudeAnalysis.relevanceReason}`,
          "success"
        );
        sendLog(
          `Tags: [${claudeAnalysis.identityTags.join(", ")}] | [${claudeAnalysis.capabilityTags.join(", ")}]`,
          "success"
        );

        // Step 6: Calculate scores (for display, not used in pricing formula)
        const scores = calculateScores(
          user.public_metrics.followers_count,
          cleaned
        );

        // Step 7: Calculate V5.1 pricing
        sendLog("Computing V5.1 pricing...");
        const pricing = calculatePricing(
          cleaned,
          user.public_metrics.followers_count,
          domain,
          claudeAnalysis.credibilityScore,
          claudeAnalysis.relevanceScore,
          claudeAnalysis.identityTags,
          claudeAnalysis.capabilityTags
        );

        sendLog(
          `FF: ${pricing.followerFactor}x | Dom: ${pricing.domainMultiplier}x | Cred: ${pricing.credibilityMultiplier}x | Relev: ${pricing.relevanceMultiplier}x | Id: ${pricing.identityMultiplier}x | ER: ${pricing.erMultiplier}x | RE: ${pricing.reMultiplier}x`,
          "success"
        );
        sendLog(
          `Combined Modifiers: ${pricing.combinedModifiers}x`,
          "success"
        );
        if (pricing.floorApplied) {
          sendLog(
            `Price Floor applied: $${pricing.floor} (calculated: $${pricing.calculatedPrice})`,
            "success"
          );
        }
        sendLog(
          `Estimated price: $${pricing.price.toLocaleString()} ($${pricing.priceMin.toLocaleString()} ~ $${pricing.priceMax.toLocaleString()})`,
          "success"
        );

        // Send final result
        sendResult({
          user,
          tweets,
          trimmedTweets: cleaned,
          domain,
          scores,
          pricing,
          claudeAnalysis,
          analyzedAt: new Date().toISOString(),
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        sendError(message);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
