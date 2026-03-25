import Anthropic from "@anthropic-ai/sdk";
import { Domain, ClaudeAnalysis } from "./types";

const VALID_DOMAINS: Domain[] = [
  "crypto",
  "tech",
  "finance",
  "business",
  "entertainment",
  "other",
];

export interface FullClaudeResult {
  domain: Domain;
  analysis: ClaudeAnalysis;
}

export async function analyzeAccount(
  bio: string,
  tweetTexts: string[],
  followers: number,
  following: number,
  tweetCount: number,
  createdAt: string
): Promise<FullClaudeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  const client = new Anthropic({ apiKey });
  const tweetsJoined = tweetTexts.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    system: `你是一个 X/Twitter KOL 分析专家。根据用户的个人资料和近期推文，完成以下四项分析，并以 JSON 格式返回结果。只返回 JSON，不要有其他文字。

1. **Domain（领域）**：判断该账号的主要领域，只能是以下之一：crypto, tech, finance, business, entertainment, other

2. **Credibility（可信度，0-100）**：评估账号的真实性和可信度。考虑以下因素：
   - 粉丝数与互动量是否匹配（高粉低互动 = 僵尸粉嫌疑）
   - 关注数与粉丝数的比例（关注 > 粉丝 = 互粉策略）
   - 注册时间与发帖量是否合理（短时间内大量发帖 = 可疑）
   - 互动数据是否自然（likes/replies/retweets 比例）
   - 是否有大量推广/广告内容
   - 内容是否原创（vs AI生成/模板化）

3. **Relevance（内容相关性，0-100）**：严格评估近期推文与其所属 domain 的相关程度。
   - 逐条判断每条推文是否与该领域**直接相关**（泛泛提及不算，必须是实质性内容）
   - relevanceScore = 相关推文数 / 总推文数 × 100（直接用百分比作为分数）
   - 生活日常、娱乐八卦、跨领域闲聊等内容一律算作"不相关"
   - 评分标准要严格：一个 crypto 领域的账号如果一半推文在聊娱乐话题，relevance 应该只有 50 分左右
   - 80分以上 = 绝大多数推文都围绕该领域；60分 = 仅一半多相关；40分以下 = 严重偏离

4. **Tags（标签）**：
   - identityTags：从 ["Builder", "KOL", "Content Creator"] 中选择 1-2 个最匹配的
     - Builder = 行业从业者/创业者/开发者
     - KOL = 意见领袖/有影响力的评论者
     - Content Creator = 内容创作者/教程制作者
   - capabilityTags：从 ["Branding", "Traffic", "Trading"] 中选择 1-2 个最匹配的
     - Branding = 擅长品牌建设/深度内容
     - Traffic = 擅长引流/高曝光
     - Trading = 擅长交易分析/带单

返回格式：
{
  "domain": "crypto",
  "credibilityScore": 85,
  "credibilityReason": "简短说明原因",
  "relevanceScore": 70,
  "relevanceReason": "简短说明原因",
  "identityTags": ["Builder", "KOL"],
  "capabilityTags": ["Branding"],
  "recommendation": "一句话总结该账号适合什么类型的合作"
}`,
    messages: [
      {
        role: "user",
        content: `用户资料：
- 简介：${bio}
- 粉丝数：${followers.toLocaleString()}
- 关注数：${following.toLocaleString()}
- 总推文数：${tweetCount.toLocaleString()}
- 注册时间：${createdAt}

近期推文（${tweetTexts.length}条）：
${tweetsJoined}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text"
      ? response.content[0].text.trim()
      : "{}";

  // Extract JSON from response (handle possible markdown code blocks)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Claude analysis response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const domain: Domain =
    VALID_DOMAINS.find((d) => parsed.domain === d) ?? "other";

  return {
    domain,
    analysis: {
      credibilityScore: Math.min(100, Math.max(0, parsed.credibilityScore ?? 50)),
      credibilityReason: parsed.credibilityReason ?? "",
      relevanceScore: Math.min(100, Math.max(0, parsed.relevanceScore ?? 50)),
      relevanceReason: parsed.relevanceReason ?? "",
      identityTags: parsed.identityTags ?? [],
      capabilityTags: parsed.capabilityTags ?? [],
      recommendation: parsed.recommendation ?? "",
    },
  };
}

// Keep backward-compatible export for any other usage
export async function detectDomain(
  bio: string,
  tweetTexts: string[]
): Promise<Domain> {
  const result = await analyzeAccount(bio, tweetTexts, 0, 0, 0, "");
  return result.domain;
}
