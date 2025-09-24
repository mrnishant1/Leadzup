import { axiosInstance } from "./retryInstance.js";
import sendMail from "./sendMail.js";

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDDIT_USER = process.env.REDDIT_USER;
const REDDIT_PASS = process.env.REDDIT_PASS;

//In memory storage
let Access_token: string | null = null;
let tokenExpiry: number = 0;

//Getting access token (refresh automatically on expiration) via user pass granted method
export async function getAccessToken() {
  const now = Date.now();
  if (Access_token && now < tokenExpiry) {
    return Access_token;
  }

  const response = await axiosInstance.post(
    "https://www.reddit.com/api/v1/access_token",
    new URLSearchParams({
      grant_type: "password",
      username: REDDIT_USER,
      password: REDDIT_PASS
    }),
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "f5bot-clone/0.1 by u/Tough-Barracuda-8664"
      }
    }
  );

  if (!response || !response.data || response.status !== 200) {
    sendMail("Failed to fetch token", `${response?.status}`,`${response?.statusText}"unknown`)
    throw new Error(
      `Failed to fetch token: ${response?.status ?? "unknown"} ${response?.statusText ?? "unknown"}`
    );
  } 

  const data = response.data
  tokenExpiry = now + data.expires_in * 1000 - 60 *1000 
  return data.access_token;

}
export async function setAccessToken() {
  const access_token = await getAccessToken()
  axiosInstance.defaults.headers.common.Authorization = `bearer ${access_token}`;
}
