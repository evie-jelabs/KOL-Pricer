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
  bookmark_count: number;
}

export interface TweetEntities {
  hashtags?: { tag: string }[];
  mentions?: { username: string }[];
}

export interface Tweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics: TweetPublicMetrics;
  entities?: TweetEntities;
}

export type Domain =
  | "crypto"
  | "ai"
  | "finance"
  | "business"
  | "tech"
  | "entertainment"
  | "other";

// V2: 4-dimension score breakdown
export interface ScoreBreakdown {
  // 4 main dimensions
  influenceDepth: number;
  followerQuality: number;
  contentStability: number;
  engagementQuality: number;
  overall: number;
  // Influence depth sub-items
  followerScaleScore: number;
  listedScore: number;
  // Stability detail
  intervalCV: number;
  impressionCV: number;
  combinedCV: number;
  // Engagement quality detail
  highQualityRatio: number;
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

// V2: Pricing result with new fields
export interface PricingResult {
  cpm: number;
  overallScore: number;
  avgImpressions: number;
  weightedImpressions: number;
  effectiveImpressions: number;
  domainMultiplier: number;
  subDomain: string;
  credibilityMultiplier: number;
  relevanceMultiplier: number;
  identityMultiplier: number;
  scarcityFactor: number;
  adRatio: number;
  combinedModifiers: number;
  calculatedPrice: number;
  floor: number;
  floorApplied: boolean;
  price: number;
  priceMin: number;
  priceMax: number;
  avgEngagement: number;
  weightedEngagement: number;
  highQualityRatio: number;
  engagementRate: number;
}

export interface AnalysisResult {
  user: XUser;
  tweets: Tweet[];
  trimmedTweets: Tweet[];
  domain: Domain;
  subDomain: string;
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
