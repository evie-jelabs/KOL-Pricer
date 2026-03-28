import { Domain } from "./types";

// --- V2.1 Pricing Model ---

// Overall Score weights (5 dimensions)
export const SCORE_WEIGHTS = {
  followerScale: 0.20,
  followerQuality: 0.25,
  updateStability: 0.15,
  impressionStability: 0.20,
  engagementRate: 0.20,
} as const;

// CPM formula: $5 + (Overall Score / 100) × $75
export const BASE_CPM = 5;
export const MAX_CPM_BONUS = 75;

// Impression decay exponent: (AvgImp / 1000) ^ IMP_DECAY
export const IMP_DECAY = 0.85;

// Follower Scale scoring tiers (8 levels, max > 60K)
export const FOLLOWER_SCALE_TIERS: [number, number][] = [
  [60_000, 100],
  [40_000, 85],
  [20_000, 70],
  [10_000, 55],
  [5_000, 40],
  [3_000, 30],
  [1_000, 20],
  [0, 10],
];

// Follower Quality (ER%) scoring tiers
export const FOLLOWER_QUALITY_TIERS: [number, number][] = [
  [1.5, 100],
  [0.8, 75],
  [0.3, 50],
  [0.08, 25],
  [0, 10],
];

// Update Stability (CV) scoring tiers
export const UPDATE_STABILITY_TIERS: [number, number][] = [
  [0, 100],   // CV < 0.3 → 100
  [0.3, 80],
  [0.5, 60],
  [0.8, 40],
  [1.2, 20],
];

// Impression Stability (CV) scoring tiers
export const IMPRESSION_STABILITY_TIERS: [number, number][] = [
  [0, 100],   // CV < 0.2 → 100
  [0.2, 80],
  [0.4, 60],
  [0.6, 40],
  [0.8, 20],
];

// Engagement Rate scoring tiers
export const ENGAGEMENT_RATE_TIERS: [number, number][] = [
  [2.0, 100],
  [1.5, 80],
  [0.8, 60],
  [0.3, 40],
  [0, 20],
];

// Domain multipliers
export const DOMAIN_MULTIPLIERS: Record<Domain, number> = {
  crypto: 1.40,
  tech: 1.30,
  finance: 1.25,
  business: 1.10,
  entertainment: 1.00,
  other: 0.90,
};

export const DOMAIN_LABELS: Record<Domain, string> = {
  crypto: "Crypto / Web3",
  tech: "AI / Technology",
  finance: "Finance",
  business: "Business / Gaming",
  entertainment: "Entertainment",
  other: "Other",
};

// Identity multipliers
export const IDENTITY_MULTIPLIERS: Record<string, number> = {
  Builder: 1.20,
  KOL: 1.10,
  "Content Creator": 1.00,
};

// Capability multipliers
export const CAPABILITY_MULTIPLIERS: Record<string, number> = {
  Branding: 1.20,
  Trading: 1.00,
  Traffic: 0.80,
};

// Modifier weights for weighted average
export const MODIFIER_WEIGHTS = {
  credibility: 0.35,
  relevance: 0.25,
  domain: 0.20,
  identity: 0.20,
} as const;

// Credibility multiplier tiers (max 1.25x)
export const CREDIBILITY_TIERS: [number, number][] = [
  [85, 1.25],
  [70, 1.00],
  [55, 0.75],
  [40, 0.50],
  [0, 0.25],
];

// Relevance multiplier tiers (max 1.25x)
export const RELEVANCE_TIERS: [number, number][] = [
  [85, 1.25],
  [70, 1.00],
  [55, 0.75],
  [40, 0.55],
  [0, 0.30],
];

// Price Floor tiers (only for followers ≤ 80K)
export const FLOOR_TIERS: [number, number][] = [
  [30_000, 400],
  [15_000, 300],
  [8_000, 200],
  [3_000, 100],
  [1_000, 50],
  [0, 0],
];

export const FLOOR_MAX_FOLLOWERS = 80_000;

// Trim outliers: remove top N and bottom N by impressions
export const TRIM_COUNT = 3;

// IQR multiplier for anomaly detection
export const IQR_MULTIPLIER = 1.5;

// Price range
export const PRICE_RANGE_LOW = 0.8;
export const PRICE_RANGE_HIGH = 1.2;

// Rate limiting
export const RATE_LIMIT_WINDOW_MS = 60_000;
export const RATE_LIMIT_MAX = 5;

export const X_API_TIMEOUT_MS = 30_000;
