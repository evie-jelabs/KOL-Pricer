import Anthropic from "@anthropic-ai/sdk";
import { Domain, ClaudeAnalysis } from "./types";

const VALID_DOMAINS: Domain[] = [
  "crypto",
  "ai",
  "finance",
  "business",
  "tech",
  "entertainment",
  "other",
];

export interface FullClaudeResult {
  domain: Domain;
  subDomain: string;
  adRatio: number;
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
    system: `你是一个 X/Twitter KOL 分析专家。根据用户的个人资料和近期推文，完成以下六项分析，并以 JSON 格式返回结果。只返回 JSON，不要有其他文字。

1. **Domain（领域大类）**：只能是以下之一（英文小写）：
   crypto / ai / finance / business / tech / entertainment / other

2. **SubDomain（子分类）**：根据大类选择最匹配的子分类（英文），参考：
   - crypto: DeFi | Layer1 | Layer2 | Institutional | NFT | Gaming | Memecoin
   - ai: LLM | Base Model | AI Infra | Application | SaaS | Tools
   - finance: Institutional | TradFi | Macro | Retail | Personal Finance
   - business: Startup | SaaS | B2B
   - tech: General | Developer
   - entertainment: Entertainment | Lifestyle | Culture
   - other: Other

3. **Credibility（可信度，0-100）**：评估账号的真实性和可信度。考虑以下因素：
   - 粉丝数与互动量是否匹配（高粉低互动 = 僵尸粉嫌疑）
   - 关注数与粉丝数的比例（关注 > 粉丝 = 互粉策略）
   - 注册时间与发帖量是否合理
   - 内容是否原创（vs AI生成/模板化）
   - 适量的推广/广告内容是正常的，不应过度扣分

   评分参考：
   - 85-100：活跃的真实账号，互动健康，内容有质量
   - 70-84：正常账号，无明显异常
   - 55-69：有一些疑虑（如互粉痕迹、互动偏低），但不严重
   - 40-54：明显异常（大量刷量、短期暴涨、机器人行为）
   - <40：高概率假号

4. **Relevance（内容相关性，0-100）**：评估近期推文与其所属 domain 的相关程度。
   - 逐条判断每条推文是否与该领域相关
   - **相关内容**包括：领域分析、项目评测、技术讨论、市场观点、行业新闻评论、领域人物讨论
   - **不相关内容**：纯生活日常、完全无关的娱乐八卦、纯表情/水帖
   - 轻度偏题仍可算**部分相关**
   - relevanceScore = 相关推文数 / 总推文数 × 100

5. **AdRatio（商单占比，0-100 的整数）**：逐条审查每条推文，判断是否为商业推广，计算占比。

   **判定为商单（宽松认定，宁多勿少）**：
   - 明确推广某个项目、代币、平台，带有正面评价或行动号召
   - 提供邀请码、优惠码、referral 链接、注册链接
   - 宣传空投、活动、白名单、抽奖（即使只是"参与"）
   - mention 项目方账号，并配有"体验了 XX"、"推荐大家关注 XX"、"XX 不错"等推广语气
   - 以"评测"或"分享"名义发布的项目推广（无 #ad 标签也算）
   - "与 XX 合作"、"感谢 XX 赞助"等任何形式的合作声明
   - 带有 #ad #sponsored #partnership #collab 等标签
   - 明显的投票、转发抽奖活动推广

   **不算商单**：
   - 纯粹的市场行情评论、宏观分析、个人观点
   - 中性提及某项目（仅作参考，无推广意图）
   - 行业新闻转发（无明显倾向性）

   **计算**：广告条数 ÷ 总推文条数 × 100，取整数。
   **关键**：中文 KOL 商单很少打 #ad 标签，请务必根据内容语义判断，不要因为没有明显标记就给 0。

6. **Tags（标签）**：
   - identityTags：从 ["Builder", "KOL", "Content Creator"] 中选择 1-2 个最匹配的
     - Builder = 行业从业者（Founder/CTO/Dev/Researcher），bio或推文中有明确的项目构建证据
     - KOL = 意见领袖/有影响力的评论者/分析师
     - Content Creator = 内容创作者/教程制作者/视频博主
   - capabilityTags：从 ["Branding", "Trading", "Traffic"] 中选择 1 个最匹配的

返回格式（必须包含所有字段，adRatio 不能省略）：
{
  "domain": "crypto",
  "subDomain": "DeFi",
  "credibilityScore": 85,
  "credibilityReason": "简短说明原因",
  "relevanceScore": 70,
  "relevanceReason": "X条推文中Y条与领域直接相关",
  "adRatio": 20,
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

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Claude analysis response");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  const domain: Domain =
    VALID_DOMAINS.find((d) => parsed.domain === d) ?? "other";

  const subDomain: string = parsed.subDomain ?? "Other";
  const adRatio: number = Math.min(100, Math.max(0, parsed.adRatio ?? 0));

  return {
    domain,
    subDomain,
    adRatio,
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

// Backward-compatible helper
export async function detectDomain(
  bio: string,
  tweetTexts: string[]
): Promise<Domain> {
  const result = await analyzeAccount(bio, tweetTexts, 0, 0, 0, "");
  return result.domain;
}
