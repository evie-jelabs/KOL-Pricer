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
   - 内容是否原创（vs AI生成/模板化）
   - 适量的推广/广告内容是正常的，不应过度扣分

   评分参考：
   - 85-100：活跃的真实账号，互动健康，内容有质量
   - 70-84：正常账号，无明显异常
   - 55-69：有一些疑虑（如互粉痕迹、互动偏低），但不严重
   - 40-54：明显异常（大量刷量、短期暴涨、机器人行为）
   - <40：高概率假号

   **注意"数据搬运型"账号**：主要转发链上数据/新闻而缺少原创分析的账号，credibility 给 60-70 分（仍有信息价值，但品牌背书效果较弱）。

3. **Relevance（内容相关性，0-100）**：评估近期推文与其所属 domain 的相关程度。
   - 逐条判断每条推文是否与该领域相关
   - **相关内容**包括：领域分析、项目评测、技术讨论、市场观点、行业新闻评论、领域人物讨论、与领域相关的个人经历分享
   - **不相关内容**：纯生活日常、完全无关的娱乐八卦、纯表情/水帖
   - 轻度偏题（如crypto KOL偶尔聊科技、AI）仍可算**部分相关**
   - relevanceScore = 相关推文数 / 总推文数 × 100
   - 评分标准：
     * 85+ = 几乎每条都与领域相关
     * 70-84 = 大部分是领域内容，少量偏题
     * 55-69 = 约一半是领域内容
     * 40-54 = 领域内容占少数
     * <40 = 严重偏离

4. **Tags（标签）**：
   - identityTags：从 ["Builder", "KOL", "Content Creator"] 中选择 1-2 个最匹配的
     - Builder = 行业从业者（Founder/CTO/Dev/Researcher/BD），bio或推文中有明确的项目构建、技术开发、团队管理等证据
     - KOL = 意见领袖/有影响力的评论者/分析师
     - Content Creator = 内容创作者/教程制作者/视频博主
   - capabilityTags：从 ["Branding", "Trading", "Traffic"] 中选择**1个最匹配的**（只选1个）
     - Branding = 擅长深度分析、行业洞察、品牌建设类长内容
     - Trading = 擅长交易策略、K线分析、链上数据分析、带单
     - Traffic = 擅长高曝光、话题引爆、娱乐化传播、教程引流

返回格式：
{
  "domain": "crypto",
  "credibilityScore": 85,
  "credibilityReason": "简短说明原因",
  "relevanceScore": 70,
  "relevanceReason": "X条推文中Y条与领域直接相关，Z条为生活/娱乐/水帖",
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
