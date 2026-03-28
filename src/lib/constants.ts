import { Domain } from "./types";

// --- V5.1 Pricing Model ---

export const SCORE_WEIGHTS = {
  followerScale: 0.35,
  updateStability: 0.30,
  impressionStability: 0.35,
} as const;

export const BASE_CPM = 60;

// Impression decay exponent: (AvgImp / 1000) ^ IMP_DECAY
export const IMP_DECAY = 0.85;

// Follower Factor tiers
export const FOLLOWER_FACTOR_TIERS: [number, number][] = [
  [200_000, 1.80],
  [80_000, 1.60],
  [30_000, 1.40],
  [15_000, 1.20],
  [8_000, 1.00],
  [3_000, 0.80],
  [1_000, 0.65],
  [500, 0.50],
  [0, 0.30],
];

// Domain multipliers
export const DOMAIN_MULTIPLIERS: Record<Domain, number> = {
  crypto: 1.4,
  tech: 1.3,
  finance: 1.4,
  business: 1.2,
  entertainment: 1.0,
  other: 1.0,
};

export const DOMAIN_LABELS: Record<Domain, string> = {
  crypto: "Crypto / Web3",
  tech: "Technology",
  finance: "Finance",
  business: "Business",
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
  Branding: 1.10,
  Trading: 1.10,
  Traffic: 0.90,
};

// Credibility multiplier tiers (max 1.00, penalty-only)
export const CREDIBILITY_TIERS: [number, number][] = [
  [85, 1.00],
  [70, 0.90],
  [55, 0.70],
  [40, 0.45],
  [0, 0.25],
];

// Relevance multiplier tiers (max 1.00, penalty-only)
export const RELEVANCE_TIERS: [number, number][] = [
  [85, 1.00],
  [70, 0.90],
  [55, 0.70],
  [40, 0.45],
  [0, 0.25],
];

// Engagement Rate multiplier tiers
export const ER_TIERS: [number, number][] = [
  [2.0, 1.10],
  [1.0, 1.00],
  [0.5, 0.90],
  [0.2, 0.80],
  [0, 0.60],
];

// Reach Efficiency multiplier tiers
export const RE_TIERS: [number, number][] = [
  [20, 1.10],
  [10, 1.00],
  [5, 0.90],
  [2, 0.80],
  [0, 0.60],
];

// Price Floor tiers (only for followers ≤ 80K)
export const FLOOR_TIERS: [number, number][] = [
  [30_000, 500],
  [15_000, 500],
  [8_000, 350],
  [3_000, 200],
  [1_000, 100],
  [0, 50],
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
