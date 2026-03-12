import Anthropic from "@anthropic-ai/sdk";
import { Domain } from "./types";

const VALID_DOMAINS: Domain[] = [
  "crypto",
  "tech",
  "finance",
  "business",
  "entertainment",
  "other",
];

export async function detectDomain(
  bio: string,
  tweetTexts: string[]
): Promise<Domain> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  const client = new Anthropic({ apiKey });
  const tweetsJoined = tweetTexts.map((t, i) => `${i + 1}. ${t}`).join("\n");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 50,
    system:
      "根据以下 X 用户简介和推文内容，判断其所属领域。只返回以下之一：crypto, tech, finance, business, entertainment, other",
    messages: [
      {
        role: "user",
        content: `用户简介：${bio}\n\n近期推文：\n${tweetsJoined}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text"
      ? response.content[0].text.trim().toLowerCase()
      : "other";

  const domain = VALID_DOMAINS.find((d) => text.includes(d));
  return domain ?? "other";
}
