import { Tweet, Domain, ScoreBreakdown, PricingResult, IdentityTag, CapabilityTag } from "./types";
import {
  BASE_CPM,
  IMP_DECAY,
  FOLLOWER_FACTOR_TIERS,
  DOMAIN_MULTIPLIERS,
  IDENTITY_MULTIPLIERS,
  CAPABILITY_MULTIPLIERS,
  CREDIBILITY_TIERS,
  RELEVANCE_TIERS,
  ER_TIERS,
  RE_TIERS,
  FLOOR_TIERS,
  FLOOR_MAX_FOLLOWERS,
  TRIM_COUNT,
  IQR_MULTIPLIER,
  PRICE_RANGE_LOW,
  PRICE_RANGE_HIGH,
} from "./constants";

// Re-export SCORE_WEIGHTS for backward compat — define here if not in constants
// (It's used by route.ts for logging)

// --- Tier lookup helper ---

function lookupTier(tiers: [number, number][], value: number): number {
  for (const [threshold, multiplier] of tiers) {
    if (value >= threshold) return multiplier;
  }
  return tiers[tiers.length - 1][1];
}

// --- Follower Factor ---

export function getFollowerFactor(followers: number): number {
  return lookupTier(FOLLOWER_FACTOR_TIERS, followers);
}

// --- Credibility / Relevance / ER / RE multipliers ---

export function credibilityToMultiplier(score: number): number {
  return lookupTier(CREDIBILITY_TIERS, score);
}

export function relevanceToMultiplier(score: number): number {
  return lookupTier(RELEVANCE_TIERS, score);
}

export function erToMultiplier(er: number): number {
  return lookupTier(ER_TIERS, er);
}

export function reToMultiplier(re: number): number {
  return lookupTier(RE_TIERS, re);
}

// --- Identity Multiplier (身份 × 能力) ---

export function identityToMultiplier(
  identityTags: IdentityTag[],
  capabilityTags: CapabilityTag[]
): number {
  // Identity: take the highest multiplier among tags
  let identityFactor = 1.00;
  if (identityTags.length > 0) {
    identityFactor = Math.max(
      ...identityTags.map((tag) => IDENTITY_MULTIPLIERS[tag] ?? 1.00)
    );
  }

  // Capability: take the highest multiplier among tags
  let capabilityFactor = 1.00;
  if (capabilityTags.length > 0) {
    capabilityFactor = Math.max(
      ...capabilityTags.map((tag) => CAPABILITY_MULTIPLIERS[tag] ?? 1.00)
    );
  }

  return Math.round(identityFactor * capabilityFactor * 100) / 100;
}

// --- Outlier trimming ---

/** Remove top N and bottom N tweets by impression count */
export function trimOutliers(tweets: Tweet[], n: number = TRIM_COUNT): Tweet[] {
  if (tweets.length <= n * 2) return tweets;
  const sorted = [...tweets].sort(
    (a, b) => a.public_metrics.impression_count - b.public_metrics.impression_count
  );
  return sorted.slice(n, sorted.length - n);
}

/** Remove IQR outliers from tweets */
export function removeIQROutliers(tweets: Tweet[]): Tweet[] {
  if (tweets.length < 4) return tweets;

  const impressions = tweets
    .map((t) => t.public_metrics.impression_count)
    .sort((a, b) => a - b);

  const q1Index = Math.floor(impressions.length * 0.25);
  const q3Index = Math.floor(impressions.length * 0.75);
  const q1 = impressions[q1Index];
  const q3 = impressions[q3Index];
  const iqr = q3 - q1;

  const lowerBound = q1 - IQR_MULTIPLIER * iqr;
  const upperBound = q3 + IQR_MULTIPLIER * iqr;

  return tweets.filter((t) => {
    const imp = t.public_metrics.impression_count;
    return imp >= lowerBound && imp <= upperBound;
  });
}

// --- Utility ---

function coefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance =
    values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

function calcPostingIntervals(tweets: Tweet[]): number[] {
  if (tweets.length < 2) return [];
  const sorted = [...tweets].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const intervals: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const diff =
      new Date(sorted[i].created_at).getTime() -
      new Date(sorted[i + 1].created_at).getTime();
    intervals.push(diff / (1000 * 60 * 60)); // hours
  }
  return intervals;
}

// --- Score weights re-exported for convenience ---

// --- Main scoring (3 dimensions) ---

export function calculateScores(
  followers: number,
  tweets: Tweet[]
): ScoreBreakdown {
  const impressions = tweets.map((t) => t.public_metrics.impression_count);
  const impressionCV = coefficientOfVariation(impressions);

  const intervals = calcPostingIntervals(tweets);
  const updateCV = coefficientOfVariation(intervals);

  const followerScale = scoreFollowerScale(followers);
  const updateStability = scoreStability(updateCV);
  const impressionStability = scoreStability(impressionCV);

  const overall =
    followerScale * 0.35 +
    updateStability * 0.30 +
    impressionStability * 0.35;

  return {
    followerScale,
    updateStability,
    impressionStability,
    overall,
  };
}

function scoreFollowerScale(followers: number): number {
  if (followers > 200_000) return 90;
  if (followers >= 80_000) return 85;
  if (followers >= 30_000) return 75;
  if (followers >= 15_000) return 65;
  if (followers >= 8_000) return 55;
  if (followers >= 3_000) return 45;
  if (followers >= 1_000) return 35;
  if (followers >= 500) return 25;
  return 15;
}

function scoreStability(cv: number): number {
  if (cv < 0.3) return 95;
  if (cv <= 0.5) return 85;
  if (cv <= 0.8) return 70;
  if (cv <= 1.2) return 50;
  return 30;
}

// --- Price Floor ---

export function getPriceFloor(followers: number, credibilityScore: number): number {
  // No floor for > 80K followers
  if (followers > FLOOR_MAX_FOLLOWERS) return 0;

  // No floor for low credibility
  if (credibilityScore < 55) return 0;

  const baseFloor = lookupTier(FLOOR_TIERS, followers);

  // Half floor for medium credibility
  if (credibilityScore < 70) return Math.round(baseFloor * 0.5);

  return baseFloor;
}

// --- V5.1 Pricing ---

export function calculatePricing(
  tweets: Tweet[],
  followers: number,
  domain: Domain,
  credibilityScore: number,
  relevanceScore: number,
  identityTags: IdentityTag[],
  capabilityTags: CapabilityTag[]
): PricingResult {
  // Avg impressions
  const impressions = tweets.map((t) => t.public_metrics.impression_count);
  const avgImpressions =
    impressions.length > 0
      ? impressions.reduce((a, b) => a + b, 0) / impressions.length
      : 0;

  // Effective impressions with decay
  const effectiveImpressions = Math.pow(avgImpressions / 1000, IMP_DECAY);

  // Avg engagement & rates
  const totalEngagement = tweets.reduce((sum, t) => {
    const m = t.public_metrics;
    return sum + m.like_count + m.reply_count + m.retweet_count + m.quote_count;
  }, 0);
  const avgEngagement = tweets.length > 0 ? totalEngagement / tweets.length : 0;

  // ER = avg engagement / avg impressions × 100
  const engagementRate = avgImpressions > 0 ? (avgEngagement / avgImpressions) * 100 : 0;

  // RE = avg impressions / followers × 100
  const reachEfficiency = followers > 0 ? (avgImpressions / followers) * 100 : 0;

  // All 7 modifiers
  const followerFactor = getFollowerFactor(followers);
  const domainMultiplier = DOMAIN_MULTIPLIERS[domain];
  const credibilityMultiplier = credibilityToMultiplier(credibilityScore);
  const relevanceMultiplier = relevanceToMultiplier(relevanceScore);
  const identityMultiplier = identityToMultiplier(identityTags, capabilityTags);
  const erMultiplier = erToMultiplier(engagementRate);
  const reMultiplier = reToMultiplier(reachEfficiency);

  const combinedModifiers =
    followerFactor *
    domainMultiplier *
    credibilityMultiplier *
    relevanceMultiplier *
    identityMultiplier *
    erMultiplier *
    reMultiplier;

  const calculatedPrice = BASE_CPM * effectiveImpressions * combinedModifiers;

  // Floor
  const floor = getPriceFloor(followers, credibilityScore);
  const floorApplied = floor > 0 && calculatedPrice < floor;
  const price = Math.max(calculatedPrice, floor);

  return {
    baseCpm: BASE_CPM,
    avgImpressions: Math.round(avgImpressions),
    effectiveImpressions: Math.round(effectiveImpressions * 100) / 100,
    followerFactor,
    domainMultiplier,
    credibilityMultiplier,
    relevanceMultiplier,
    identityMultiplier,
    erMultiplier,
    reMultiplier,
    combinedModifiers: Math.round(combinedModifiers * 100) / 100,
    calculatedPrice: Math.round(calculatedPrice),
    floor,
    floorApplied,
    price: Math.round(price),
    priceMin: Math.round(price * PRICE_RANGE_LOW),
    priceMax: Math.round(price * PRICE_RANGE_HIGH),
    avgEngagement: Math.round(avgEngagement),
    engagementRate: Math.round(engagementRate * 1000) / 1000,
    reachEfficiency: Math.round(reachEfficiency * 100) / 100,
  };
}
