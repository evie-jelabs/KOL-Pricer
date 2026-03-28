import { Tweet, Domain, ScoreBreakdown, PricingResult, IdentityTag, CapabilityTag } from "./types";
import {
  SCORE_WEIGHTS,
  BASE_CPM,
  MAX_CPM_BONUS,
  IMP_DECAY,
  FOLLOWER_SCALE_TIERS,
  FOLLOWER_QUALITY_TIERS,
  ENGAGEMENT_RATE_TIERS,
  DOMAIN_MULTIPLIERS,
  IDENTITY_MULTIPLIERS,
  CAPABILITY_MULTIPLIERS,
  CREDIBILITY_TIERS,
  RELEVANCE_TIERS,
  FLOOR_TIERS,
  FLOOR_MAX_FOLLOWERS,
  TRIM_COUNT,
  IQR_MULTIPLIER,
  PRICE_RANGE_LOW,
  PRICE_RANGE_HIGH,
} from "./constants";

// --- Tier lookup helpers ---

/** For "higher is better" tiers (follower count, ER, etc.) */
function lookupTierDesc(tiers: [number, number][], value: number): number {
  for (const [threshold, score] of tiers) {
    if (value >= threshold) return score;
  }
  return tiers[tiers.length - 1][1];
}

// --- Scoring functions ---

export function scoreFollowerScale(followers: number): number {
  return lookupTierDesc(FOLLOWER_SCALE_TIERS, followers);
}

export function scoreFollowerQuality(er: number): number {
  return lookupTierDesc(FOLLOWER_QUALITY_TIERS, er);
}

export function scoreUpdateStability(cv: number): number {
  if (cv < 0.2) return 100;
  if (cv < 0.4) return 80;
  if (cv < 0.6) return 60;
  if (cv < 1.0) return 40;
  return 20;
}

export function scoreImpressionStability(cv: number): number {
  if (cv < 0.2) return 100;
  if (cv < 0.4) return 80;
  if (cv < 0.6) return 60;
  if (cv < 0.8) return 40;
  return 20;
}

export function scoreEngagementRate(er: number): number {
  return lookupTierDesc(ENGAGEMENT_RATE_TIERS, er);
}

// --- Multiplier functions ---

export function credibilityToMultiplier(score: number): number {
  return lookupTierDesc(CREDIBILITY_TIERS, score);
}

export function relevanceToMultiplier(score: number): number {
  return lookupTierDesc(RELEVANCE_TIERS, score);
}

export function identityToMultiplier(
  identityTags: IdentityTag[],
  capabilityTags: CapabilityTag[]
): number {
  let identityFactor = 1.00;
  if (identityTags.length > 0) {
    identityFactor = Math.max(
      ...identityTags.map((tag) => IDENTITY_MULTIPLIERS[tag] ?? 1.00)
    );
  }

  let capabilityFactor = 1.00;
  if (capabilityTags.length > 0) {
    capabilityFactor = Math.max(
      ...capabilityTags.map((tag) => CAPABILITY_MULTIPLIERS[tag] ?? 1.00)
    );
  }

  return Math.round(identityFactor * capabilityFactor * 100) / 100;
}

// --- Outlier trimming ---

export function trimOutliers(tweets: Tweet[], n: number = TRIM_COUNT): Tweet[] {
  if (tweets.length <= n * 2) return tweets;
  const sorted = [...tweets].sort(
    (a, b) => a.public_metrics.impression_count - b.public_metrics.impression_count
  );
  return sorted.slice(n, sorted.length - n);
}

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
    intervals.push(diff / (1000 * 60 * 60));
  }
  return intervals;
}

// --- Main scoring (5 dimensions) ---

export function calculateScores(
  followers: number,
  tweets: Tweet[]
): ScoreBreakdown {
  const impressions = tweets.map((t) => t.public_metrics.impression_count);
  const avgImpressions = impressions.length > 0
    ? impressions.reduce((a, b) => a + b, 0) / impressions.length
    : 0;

  const totalEngagement = tweets.reduce((sum, t) => {
    const m = t.public_metrics;
    return sum + m.like_count + m.reply_count + m.retweet_count + m.quote_count;
  }, 0);
  const avgEngagement = tweets.length > 0 ? totalEngagement / tweets.length : 0;

  // ER for scoring: avg engagement / followers
  const er = followers > 0 ? (avgEngagement / followers) * 100 : 0;

  // ER for engagement rate dimension: avg engagement / avg impressions
  const erImpressions = avgImpressions > 0 ? (avgEngagement / avgImpressions) * 100 : 0;

  const impressionCV = coefficientOfVariation(impressions);
  const intervals = calcPostingIntervals(tweets);
  const updateCV = coefficientOfVariation(intervals);

  const followerScale = scoreFollowerScale(followers);
  const followerQuality = scoreFollowerQuality(er);
  const updateStability = scoreUpdateStability(updateCV);
  const impressionStability = scoreImpressionStability(impressionCV);
  const engagementRate = scoreEngagementRate(erImpressions);

  const overall =
    followerScale * SCORE_WEIGHTS.followerScale +
    followerQuality * SCORE_WEIGHTS.followerQuality +
    updateStability * SCORE_WEIGHTS.updateStability +
    impressionStability * SCORE_WEIGHTS.impressionStability +
    engagementRate * SCORE_WEIGHTS.engagementRate;

  return {
    followerScale,
    followerQuality,
    updateStability,
    impressionStability,
    engagementRate,
    overall,
  };
}

// --- Price Floor ---

export function getPriceFloor(followers: number, credibilityScore: number): number {
  if (followers > FLOOR_MAX_FOLLOWERS) return 0;
  if (credibilityScore < 55) return 0;

  const baseFloor = lookupTierDesc(FLOOR_TIERS, followers);
  if (baseFloor === 0) return 0;

  if (credibilityScore < 70) return Math.round(baseFloor * 0.5);

  return baseFloor;
}

// --- V2.1 Pricing ---

export function calculatePricing(
  scores: ScoreBreakdown,
  tweets: Tweet[],
  followers: number,
  domain: Domain,
  credibilityScore: number,
  relevanceScore: number,
  identityTags: IdentityTag[],
  capabilityTags: CapabilityTag[]
): PricingResult {
  const impressions = tweets.map((t) => t.public_metrics.impression_count);
  const avgImpressions = impressions.length > 0
    ? impressions.reduce((a, b) => a + b, 0) / impressions.length
    : 0;

  // Effective impressions with decay
  const effectiveImpressions = Math.pow(avgImpressions / 1000, IMP_DECAY);

  // Avg engagement & ER
  const totalEngagement = tweets.reduce((sum, t) => {
    const m = t.public_metrics;
    return sum + m.like_count + m.reply_count + m.retweet_count + m.quote_count;
  }, 0);
  const avgEngagement = tweets.length > 0 ? totalEngagement / tweets.length : 0;
  const engagementRate = followers > 0 ? (avgEngagement / followers) * 100 : 0;

  // CPM
  const cpm = BASE_CPM + (scores.overall / 100) * MAX_CPM_BONUS;

  // 4 Modifiers
  const domainMultiplier = DOMAIN_MULTIPLIERS[domain];
  const credibilityMultiplier = credibilityToMultiplier(credibilityScore);
  const relevanceMultiplier = relevanceToMultiplier(relevanceScore);
  const identityMultiplier = identityToMultiplier(identityTags, capabilityTags);

  const combinedModifiers =
    domainMultiplier *
    credibilityMultiplier *
    relevanceMultiplier *
    identityMultiplier;

  // Price = CPM × (AvgImp/1000)^0.85 × Modifiers
  const calculatedPrice = cpm * effectiveImpressions * combinedModifiers;

  // Floor
  const floor = getPriceFloor(followers, credibilityScore);
  const floorApplied = floor > 0 && calculatedPrice < floor;
  const price = Math.max(calculatedPrice, floor);

  return {
    cpm: Math.round(cpm * 100) / 100,
    overallScore: Math.round(scores.overall * 10) / 10,
    avgImpressions: Math.round(avgImpressions),
    effectiveImpressions: Math.round(effectiveImpressions * 100) / 100,
    domainMultiplier,
    credibilityMultiplier,
    relevanceMultiplier,
    identityMultiplier,
    combinedModifiers: Math.round(combinedModifiers * 100) / 100,
    calculatedPrice: Math.round(calculatedPrice),
    floor,
    floorApplied,
    price: Math.round(price),
    priceMin: Math.round(price * PRICE_RANGE_LOW),
    priceMax: Math.round(price * PRICE_RANGE_HIGH),
    avgEngagement: Math.round(avgEngagement),
    engagementRate: Math.round(engagementRate * 1000) / 1000,
  };
}
