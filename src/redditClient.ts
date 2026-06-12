import type { AxiosResponse } from "axios";
import { axiosInstance } from "./retryInstance.js";
import { getAccessToken } from "./handleOauth.js";

export function redditCredentialsConfigured(): boolean {
  return Boolean(
    process.env.REDDIT_CLIENT_ID &&
      process.env.CLIENT_SECRET &&
      process.env.REDDIT_USER &&
      process.env.REDDIT_PASS
  );
}

//==================Helps to get Data(that Caller of function wants) =================== 
//<T= Unknown uses when The function itself doesn't know or care what shape the data is — it just fetches and returns."
//Return type of data would be depend on Caller
export async function redditGet<T = unknown>(
  path: string,
  params?: Record<string, string | number>
): Promise<AxiosResponse<T>> {
  const token = await getAccessToken();
  const url = path.startsWith("https://")
    ? path
    : `https://oauth.reddit.com${path.startsWith("/") ? path : `/${path}`}`;

  return axiosInstance.get<T>(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params,
  });
}

export function formatRedditError(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosErr = error as {
      response?: { status?: number; statusText?: string };
      message?: string;
    };
    const status = axiosErr.response?.status;
    if (status === 403) {
      return (
        "Reddit blocked the request (403). Verify REDDIT_CLIENT_ID, CLIENT_SECRET, " +
        "REDDIT_USER (username only, no u/ prefix), and REDDIT_PASS in .env. " +
        "Your Reddit app must be type 'script'."
      );
    }
    if (status === 401) {
      return "Reddit authentication failed (401). Check your credentials in .env.";
    }
    if (status === 429) {
      return "Reddit rate limit hit (429). The listener will retry on the next poll.";
    }
    return `Reddit API error (${status ?? "unknown"}): ${axiosErr.message ?? "request failed"}`;
  }
  return error instanceof Error ? error.message : String(error);
}
