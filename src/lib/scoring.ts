import { Tweet, Domain, ScoreBreakdown, PricingResult, IdentityTag } from "./types";
import {
  SCORE_WEIGHTS,
  BASE_CPM,
  MAX_CPM_BONUS,
  FOLLOWER_SCALE_TIERS,
  LISTED_RATIO_TIERS,
  FOLLOWER_QUALITY_TIERS,
  CONTENT_STABILITY_BREAKPOINTS,
  CONTENT_STABILITY_CV_WEIGHTS,
  ENGAGEMENT_QUALITY_TIERS,
  ENGAGEMENT_WEIGHTS,
  TIME_DECAY_WEIGHTS,
  DOMAIN_FACTOR_MAP,
  DOMAIN_DEFAULT_MULTIPLIERS,
  IDENTITY_MULTIPLIERS,
  CREDIBILITY_TIERS,
  RELEVANCE_TIERS,
  SCARCITY_TIERS,
  AD_HASHTAGS,
  TRIM_COUNT,
  IQR_MULTIPLIER,
  PRICE_RANGE_LOW,
  PRICE_RANGE_HIGH,
} from "./constants";

// ── Tier lookup helpers ────────────────────────────────────────────────────

/** Higher-is-better: returns score for first threshold ≤ value */
function lookupTierDesc(tiers: [number, number][], value: number): number {
  for (const [threshold, score] of tiers) {
    if (value >= threshold) return score;
  }
  return tiers[tiers.length - 1][1];
}

// ── Utility ────────────────────────────────────────────────────────────────

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

// ── Outlier removal ────────────────────────────────────────────────────────

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
  const q1 = impressions[Math.floor(impressions.length * 0.25)];
  const q3 = impressions[Math.floor(impressions.length * 0.75)];
  const iqr = q3 - q1;
  const lower = q1 - IQR_MULTIPLIER * iqr;
  const upper = q3 + IQR_MULTIPLIER * iqr;
  return tweets.filter((t) => {
    const imp = t.public_metrics.impression_count;
    return imp >= lower && imp <= upper;
  });
}

// ── V2: Weighted Impressions (time decay) ─────────────────────────────────

export function calcWeightedImpressions(tweets: Tweet[]): number {
  if (tweets.length === 0) return 0;
  const now = Date.now();
  let weightedSum = 0;
  let totalWeight = 0;

  for (const tweet of tweets) {
    const ageDays =
      (now - new Date(tweet.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const entry =
      TIME_DECAY_WEIGHTS.find((w) => ageDays <= w.maxDays) ??
      TIME_DECAY_WEIGHTS[TIME_DECAY_WEIGHTS.length - 1];
    const weight = entry.weight;
    weightedSum += tweet.public_metrics.impression_count * weight;
    totalWeight += weight;
  }
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

// ── V2: Weighted Engagement (per tweet) ───────────────────────────────────

export function calcWeightedEngagement(tweet: Tweet): number {
  const m = tweet.public_metrics;
  return (
    (m.like_count ?? 0) * ENGAGEMENT_WEIGHTS.likes +
    (m.reply_count ?? 0) * ENGAGEMENT_WEIGHTS.replies +
    (m.retweet_count ?? 0) * ENGAGEMENT_WEIGHTS.retweets +
    (m.quote_count ?? 0) * ENGAGEMENT_WEIGHTS.quotes +
    (m.bookmark_count ?? 0) * ENGAGEMENT_WEIGHTS.bookmarks
  );
}

// ── V2: Influence Depth (3 sub-items) ────────────────────────────────────

export function calcInfluenceDepth(
  followers: number,
  listedCount: number,
): {
  score: number;
  followerScaleScore: number;
  listedScore: number;
} {
  // Sub-item 1: Follower Scale (60%)
  const followerScaleScore = lookupTierDesc(FOLLOWER_SCALE_TIERS, followers);

  // Sub-item 2: Listed Ratio (40%) — listed_count / followers × 1000
  const listedRatio = followers > 0 ? (listedCount / followers) * 1000 : 0;
  const listedScore = lookupTierDesc(LISTED_RATIO_TIERS, listedRatio);

  const score = followerScaleScore * 0.6 + listedScore * 0.4;

  return { score, followerScaleScore, listedScore };
}

// ── V2: Content Stability (merged CV) ────────────────────────────────────

export function calcContentStability(
  intervalCV: number,
  impressionCV: number
): { score: number; combinedCV: number } {
  const combinedCV =
    CONTENT_STABILITY_CV_WEIGHTS.intervalCV * intervalCV +
    CONTENT_STABILITY_CV_WEIGHTS.impressionCV * impressionCV;

  const entry = CONTENT_STABILITY_BREAKPOINTS.find(
    ({ maxCV }) => combinedCV < maxCV
  );
  const score = entry ? entry.score : 10;
  return { score, combinedCV };
}

// ── V2: Engagement Quality ────────────────────────────────────────────────

export function calcEngagementQuality(highQualityRatio: number): number {
  return lookupTierDesc(ENGAGEMENT_QUALITY_TIERS, highQualityRatio);
}

// ── V2: Follower Quality (weighted ER%) ───────────────────────────────────

export function calcFollowerQuality(
  weightedEngagementAvg: number,
  followers: number
): number {
  const er = followers > 0 ? (weightedEngagementAvg / followers) * 100 : 0;
  return lookupTierDesc(FOLLOWER_QUALITY_TIERS, er);
}

// ── V2: Ad Detection & Scarcity ──────────────────────────────────────────

export function detectAdRatio(tweets: Tweet[]): number {
  if (tweets.length === 0) return 0;
  let adCount = 0;
  for (const tweet of tweets) {
    const hashtags =
      tweet.entities?.hashtags?.map((h) => h.tag.toLowerCase()) ?? [];
    const hasAdHashtag = hashtags.some((tag) => AD_HASHTAGS.includes(tag));
    const hasAdInText = AD_HASHTAGS.some((kw) =>
      new RegExp(`#${kw}\\b`, "i").test(tweet.text)
    );
    const hasDisclosure =
      /\b(sponsored|paid promotion|paid partnership|in partnership with|ad disclosure)\b/i.test(
        tweet.text
      );
    if (hasAdHashtag || hasAdInText || hasDisclosure) adCount++;
  }
  return (adCount / tweets.length) * 100;
}

export function mapAdRatioToScarcity(adRatio: number): number {
  return lookupTierDesc(SCARCITY_TIERS, adRatio);
}

// ── V2: Domain Factor ─────────────────────────────────────────────────────

export function mapDomainToFactor(domain: Domain, subDomain: string): number {
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const key = `${normalize(domain)}:${normalize(subDomain)}`;

  if (DOMAIN_FACTOR_MAP[key] !== undefined) return DOMAIN_FACTOR_MAP[key];

  // Partial match: domain prefix + subDomain keyword overlap
  const domainPrefix = normalize(domain) + ":";
  const normSub = normalize(subDomain);
  for (const [mapKey, value] of Object.entries(DOMAIN_FACTOR_MAP)) {
    if (!mapKey.startsWith(domainPrefix)) continue;
    const suffix = mapKey.slice(domainPrefix.length);
    if (normSub.includes(suffix) || suffix.includes(normSub)) return value;
  }

  return DOMAIN_DEFAULT_MULTIPLIERS[domain] ?? 1.0;
}

// ── V2: Multiplier helpers ────────────────────────────────────────────────

export function credibilityToMultiplier(score: number): number {
  return lookupTierDesc(CREDIBILITY_TIERS, score);
}

export function relevanceToMultiplier(score: number): number {
  return lookupTierDesc(RELEVANCE_TIERS, score);
}

export function identityToMultiplier(identityTags: IdentityTag[]): number {
  if (identityTags.includes("Builder")) return IDENTITY_MULTIPLIERS["Builder"];
  if (identityTags.includes("KOL")) return IDENTITY_MULTIPLIERS["KOL"];
  return IDENTITY_MULTIPLIERS["Content Creator"];
}

// ── V2: Main Scoring (4 dimensions) ──────────────────────────────────────

export function calculateScores(
  followers: number,
  listedCount: number,
  tweets: Tweet[]
): ScoreBreakdown {
  // Weighted engagement per tweet
  const weightedEngagements = tweets.map(calcWeightedEngagement);
  const avgWeightedEngagement =
    weightedEngagements.length > 0
      ? weightedEngagements.reduce((a, b) => a + b, 0) /
        weightedEngagements.length
      : 0;

  // High-quality interaction ratio
  const totalHighQuality = tweets.reduce((sum, t) => {
    const m = t.public_metrics;
    return (
      sum +
      (m.reply_count ?? 0) +
      (m.retweet_count ?? 0) +
      (m.quote_count ?? 0) +
      (m.bookmark_count ?? 0)
    );
  }, 0);
  const totalLikes = tweets.reduce(
    (sum, t) => sum + (t.public_metrics.like_count ?? 0),
    0
  );
  const totalInteractions = totalHighQuality + totalLikes;
  const highQualityRatio =
    totalInteractions > 0 ? (totalHighQuality / totalInteractions) * 100 : 0;

  // CV values
  const impressions = tweets.map((t) => t.public_metrics.impression_count);
  const impressionCV = coefficientOfVariation(impressions);
  const intervals = calcPostingIntervals(tweets);
  const intervalCV = coefficientOfVariation(intervals);

  // 4-dimension scores
  const influenceDepthResult = calcInfluenceDepth(followers, listedCount);
  const followerQuality = calcFollowerQuality(avgWeightedEngagement, followers);
  const contentStabilityResult = calcContentStability(intervalCV, impressionCV);
  const engagementQuality = calcEngagementQuality(highQualityRatio);

  const overall =
    influenceDepthResult.score * SCORE_WEIGHTS.influenceDepth +
    followerQuality * SCORE_WEIGHTS.followerQuality +
    contentStabilityResult.score * SCORE_WEIGHTS.contentStability +
    engagementQuality * SCORE_WEIGHTS.engagementQuality;

  return {
    influenceDepth: Math.round(influenceDepthResult.score * 10) / 10,
    followerQuality: Math.round(followerQuality * 10) / 10,
    contentStability: Math.round(contentStabilityResult.score * 10) / 10,
    engagementQuality: Math.round(engagementQuality * 10) / 10,
    overall: Math.round(overall * 10) / 10,
    followerScaleScore: influenceDepthResult.followerScaleScore,
    listedScore: influenceDepthResult.listedScore,
    intervalCV: Math.round(intervalCV * 1000) / 1000,
    impressionCV: Math.round(impressionCV * 1000) / 1000,
    combinedCV: Math.round(contentStabilityResult.combinedCV * 1000) / 1000,
    highQualityRatio: Math.round(highQualityRatio * 10) / 10,
  };
}

// ── V2: Pricing ───────────────────────────────────────────────────────────

export function calculatePricing(
  scores: ScoreBreakdown,
  tweets: Tweet[],
  followers: number,
  domain: Domain,
  subDomain: string,
  credibilityScore: number,
  relevanceScore: number,
  identityTags: IdentityTag[],
  claudeAdRatio?: number  // Claude AI estimate overrides regex detection
): PricingResult {
  // Simple avg impressions (for display)
  const impressions = tweets.map((t) => t.public_metrics.impression_count);
  const avgImpressions =
    impressions.length > 0
      ? impressions.reduce((a, b) => a + b, 0) / impressions.length
      : 0;

  // Weighted impressions (time decay) — used in pricing
  const weightedImpressions = calcWeightedImpressions(tweets);
  const effectiveImpressions = weightedImpressions / 1000;

  // Weighted engagement avg (for display)
  const weightedEngagements = tweets.map(calcWeightedEngagement);
  const weightedEngagement =
    weightedEngagements.length > 0
      ? weightedEngagements.reduce((a, b) => a + b, 0) /
        weightedEngagements.length
      : 0;

  // Simple avg engagement & ER (for display)
  const totalSimpleEngagement = tweets.reduce((sum, t) => {
    const m = t.public_metrics;
    return (
      sum +
      (m.like_count ?? 0) +
      (m.reply_count ?? 0) +
      (m.retweet_count ?? 0) +
      (m.quote_count ?? 0)
    );
  }, 0);
  const avgEngagement =
    tweets.length > 0 ? totalSimpleEngagement / tweets.length : 0;
  const engagementRate =
    followers > 0 ? (avgEngagement / followers) * 100 : 0;

  // Ad ratio & scarcity — Claude estimate takes priority over regex detection
  const adRatio =
    claudeAdRatio !== undefined ? claudeAdRatio : detectAdRatio(tweets);
  const scarcityFactor = mapAdRatioToScarcity(adRatio);

  // CPM: $10 + (score/100) × $90
  const cpm = BASE_CPM + (scores.overall / 100) * MAX_CPM_BONUS;

  // Multipliers
  const domainMultiplier = mapDomainToFactor(domain, subDomain);
  const credibilityMultiplier = credibilityToMultiplier(credibilityScore);
  const relevanceMultiplier = relevanceToMultiplier(relevanceScore);
  const identityMultiplier = identityToMultiplier(identityTags);

  // All modifiers multiplied (including scarcity)
  const combinedModifiers =
    domainMultiplier *
    credibilityMultiplier *
    relevanceMultiplier *
    identityMultiplier *
    scarcityFactor;

  // Price = CPM × (weightedImpressions / 1000) × combinedModifiers
  const calculatedPrice = cpm * effectiveImpressions * combinedModifiers;
  const price = calculatedPrice;

  return {
    cpm: Math.round(cpm * 100) / 100,
    overallScore: scores.overall,
    avgImpressions: Math.round(avgImpressions),
    weightedImpressions: Math.round(weightedImpressions),
    effectiveImpressions: Math.round(effectiveImpressions * 100) / 100,
    domainMultiplier: Math.round(domainMultiplier * 100) / 100,
    subDomain,
    credibilityMultiplier,
    relevanceMultiplier,
    identityMultiplier,
    scarcityFactor: Math.round(scarcityFactor * 100) / 100,
    adRatio: Math.round(adRatio * 10) / 10,
    combinedModifiers: Math.round(combinedModifiers * 100) / 100,
    calculatedPrice: Math.round(calculatedPrice),
    floor: 0,
    floorApplied: false,
    price: Math.round(price),
    priceMin: Math.round(price * PRICE_RANGE_LOW),
    priceMax: Math.round(price * PRICE_RANGE_HIGH),
    avgEngagement: Math.round(avgEngagement),
    weightedEngagement: Math.round(weightedEngagement),
    highQualityRatio: scores.highQualityRatio,
    engagementRate: Math.round(engagementRate * 1000) / 1000,
  };
}
