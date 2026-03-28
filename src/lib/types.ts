export interface XUserPublicMetrics {
  followers_count: number;
  following_count: number;
  tweet_count: number;
  listed_count: number;
}

export interface XUser {
  id: string;
  name: string;
  username: string;
  description: string;
  profile_image_url: string;
  created_at: string;
  public_metrics: XUserPublicMetrics;
}

export interface TweetPublicMetrics {
  like_count: number;
  reply_count: number;
  retweet_count: number;
  quote_count: number;
  impression_count: number;
}

export interface Tweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics: TweetPublicMetrics;
}

export type Domain =
  | "crypto"
  | "tech"
  | "finance"
  | "business"
  | "entertainment"
  | "other";

export interface ScoreBreakdown {
  followerScale: number;
  followerQuality: number;
  updateStability: number;
  impressionStability: number;
  engagementRate: number;
  overall: number;
}

export type IdentityTag = "Builder" | "KOL" | "Content Creator";
export type CapabilityTag = "Branding" | "Traffic" | "Trading";

export interface ClaudeAnalysis {
  credibilityScore: number;
  credibilityReason: string;
  relevanceScore: number;
  relevanceReason: string;
  identityTags: IdentityTag[];
  capabilityTags: CapabilityTag[];
  recommendation: string;
}

export interface PricingResult {
  cpm: number;
  overallScore: number;
  avgImpressions: number;
  effectiveImpressions: number;
  domainMultiplier: number;
  credibilityMultiplier: number;
  relevanceMultiplier: number;
  identityMultiplier: number;
  combinedModifiers: number;
  calculatedPrice: number;
  floor: number;
  floorApplied: boolean;
  price: number;
  priceMin: number;
  priceMax: number;
  avgEngagement: number;
  engagementRate: number;
}

export interface AnalysisResult {
  user: XUser;
  tweets: Tweet[];
  trimmedTweets: Tweet[];
  domain: Domain;
  scores: ScoreBreakdown;
  pricing: PricingResult;
  claudeAnalysis: ClaudeAnalysis;
  analyzedAt: string;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "success" | "error";
}

export interface HistoryItem {
  handle: string;
  result: AnalysisResult;
  timestamp: string;
}
