import { Tweet, Domain, ScoreBreakdown, PricingResult } from "./types";
import {
  SCORE_WEIGHTS,
  DOMAIN_MULTIPLIERS,
  BASE_CPM,
  MAX_CPM_BONUS,
} from "./constants";

// --- Individual scoring functions ---

export function scoreFollowerScale(followers: number): number {
  if (followers > 100_000) return 100;
  if (followers >= 50_000) return 80;
  if (followers >= 20_000) return 60;
  if (followers >= 10_000) return 40;
  return 20;
}

export function scoreFollowerQuality(engagementRate: number): number {
  // engagementRate as percentage (e.g. 1.5 means 1.5%)
  if (engagementRate > 2) return 100;
  if (engagementRate >= 1) return 75;
  if (engagementRate >= 0.5) return 50;
  if (engagementRate >= 0.1) return 25;
  return 10;
}

export function scoreUpdateStability(cv: number): number {
  if (cv < 0.2) return 100;
  if (cv <= 0.4) return 80;
  if (cv <= 0.6) return 60;
  if (cv <= 1.0) return 40;
  return 20;
}

export function scoreImpressionStability(cv: number): number {
  if (cv < 0.2) return 100;
  if (cv <= 0.4) return 80;
  if (cv <= 0.6) return 60;
  if (cv <= 0.8) return 40;
  return 20;
}

export function scoreEngagement(engagementRate: number): number {
  if (engagementRate > 3) return 100;
  if (engagementRate >= 2) return 80;
  if (engagementRate >= 1) return 60;
  if (engagementRate >= 0.5) return 40;
  return 20;
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

// --- Main scoring ---

export function calculateScores(
  followers: number,
  tweets: Tweet[]
): ScoreBreakdown {
  const totalEngagement = tweets.reduce((sum, t) => {
    const m = t.public_metrics;
    return sum + m.like_count + m.reply_count + m.retweet_count + m.quote_count;
  }, 0);
  const avgEngagement = tweets.length > 0 ? totalEngagement / tweets.length : 0;
  const engagementRate = followers > 0 ? (avgEngagement / followers) * 100 : 0;

  const impressions = tweets.map((t) => t.public_metrics.impression_count);
  const impressionCV = coefficientOfVariation(impressions);

  const intervals = calcPostingIntervals(tweets);
  const updateCV = coefficientOfVariation(intervals);

  const followerScale = scoreFollowerScale(followers);
  const followerQuality = scoreFollowerQuality(engagementRate);
  const updateStability = scoreUpdateStability(updateCV);
  const impressionStability = scoreImpressionStability(impressionCV);
  const engagementScore = scoreEngagement(engagementRate);

  const overall =
    followerScale * SCORE_WEIGHTS.followerScale +
    followerQuality * SCORE_WEIGHTS.followerQuality +
    updateStability * SCORE_WEIGHTS.updateStability +
    impressionStability * SCORE_WEIGHTS.impressionStability +
    engagementScore * SCORE_WEIGHTS.engagementRate;

  return {
    followerScale,
    followerQuality,
    updateStability,
    impressionStability,
    engagementRate: engagementScore,
    overall,
  };
}

export function calculatePricing(
  scores: ScoreBreakdown,
  tweets: Tweet[],
  followers: number,
  domain: Domain
): PricingResult {
  const impressions = tweets.map((t) => t.public_metrics.impression_count);
  const avgImpressions =
    impressions.length > 0
      ? impressions.reduce((a, b) => a + b, 0) / impressions.length
      : 0;

  const totalEngagement = tweets.reduce((sum, t) => {
    const m = t.public_metrics;
    return sum + m.like_count + m.reply_count + m.retweet_count + m.quote_count;
  }, 0);
  const avgEngagement = tweets.length > 0 ? totalEngagement / tweets.length : 0;
  const engagementRate = followers > 0 ? (avgEngagement / followers) * 100 : 0;

  const cpm = BASE_CPM + (scores.overall / 100) * MAX_CPM_BONUS;
  const domainMultiplier = DOMAIN_MULTIPLIERS[domain];
  const price = (cpm * avgImpressions * domainMultiplier) / 1000;

  return {
    cpm: Math.round(cpm * 100) / 100,
    price: Math.round(price * 100) / 100,
    priceMin: Math.round(price * 0.8 * 100) / 100,
    priceMax: Math.round(price * 1.2 * 100) / 100,
    avgImpressions: Math.round(avgImpressions),
    avgEngagement: Math.round(avgEngagement),
    engagementRate: Math.round(engagementRate * 1000) / 1000,
    domainMultiplier,
  };
}
