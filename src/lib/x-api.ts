import { XUser, Tweet } from "./types";
import { X_API_TIMEOUT_MS } from "./constants";

const X_API_BASE = "https://api.x.com/2";

function getToken(): string {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) throw new Error("X_BEARER_TOKEN environment variable is not set");
  return token;
}

async function xFetch(path: string, params: Record<string, string>) {
  const url = new URL(`${X_API_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), X_API_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${getToken()}` },
      signal: controller.signal,
    });

    if (res.status === 429) {
      throw new Error(
        "X API rate limit exceeded. Please wait a few minutes and try again."
      );
    }

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`X API error (${res.status}): ${body}`);
    }

    return res.json();
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("X API request timed out (30s). Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function getUserByUsername(username: string): Promise<XUser> {
  const data = await xFetch(`/users/by/username/${username}`, {
    "user.fields":
      "public_metrics,description,profile_image_url,created_at",
  });

  if (!data.data) {
    throw new Error(`User @${username} not found`);
  }

  return data.data as XUser;
}

export async function getUserTweets(
  userId: string,
  maxResults: number = 30
): Promise<Tweet[]> {
  const data = await xFetch(`/users/${userId}/tweets`, {
    max_results: String(maxResults),
    "tweet.fields": "public_metrics,created_at,text",
    exclude: "retweets,replies",
  });

  return (data.data ?? []) as Tweet[];
}
