import { axiosInstance, USER_AGENT } from "./retryInstance.js";

const CLIENT_ID = process.env.REDDIT_CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

function redditUsername(): string {
  const raw = process.env.REDDIT_USER ?? "";
  return raw.replace(/^u\//i, "");
}

let accessToken: string | null = null;
let tokenExpiry = 0;

export async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (accessToken && now < tokenExpiry) {
    return accessToken;
  }

  const username = redditUsername();
  const password = process.env.REDDIT_PASS ?? "";

  const missing = [
    !CLIENT_ID && "REDDIT_CLIENT_ID",
    !CLIENT_SECRET && "CLIENT_SECRET",
    !username && "REDDIT_USER",
    !password && "REDDIT_PASS",
  ].filter(Boolean);

  if (missing.length > 0) {
    throw new Error(
      `Missing Reddit credentials: ${missing.join(", ")}. `
    );
  }

  const response = await axiosInstance.post(
    "https://www.reddit.com/api/v1/access_token",
    new URLSearchParams({
      grant_type: "password",
      username,
      password,
    }),
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },
    }
  );

  if (!response?.data?.access_token || response.status !== 200) {
    throw new Error(
      `Failed to fetch Reddit token: ${response?.status ?? "unknown"} ${response?.statusText ?? ""}`.trim()
    );
  }

  const token = response.data.access_token as string;
  accessToken = token;
  tokenExpiry = now + response.data.expires_in * 1000 - 60 * 1000;
  return token;
}
