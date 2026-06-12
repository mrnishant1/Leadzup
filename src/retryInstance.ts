import axios from "axios";
import * as rax from "retry-axios";
import dotenv from "dotenv";

dotenv.config();

function redditUsername(): string {
  const raw = process.env.REDDIT_USER ?? "unknown";
  return raw.replace(/^u\//i, "");
}

export const USER_AGENT =
  process.env.REDDIT_USER_AGENT ??
  `script:${process.env.REDDIT_CLIENT_ID ?? "redditwrapper"}:v1.0.0 (by /u/${redditUsername()})`;

export const axiosInstance = axios.create({
  headers: { "User-Agent": USER_AGENT },
});

axiosInstance.defaults.raxConfig = {
  instance: axiosInstance,
  retry: 3,
  noResponseRetries: 2,
  backoffType: "exponential",
  retryDelay: 500,
  statusCodesToRetry: [[500, 599]],
  httpMethodsToRetry: ["GET", "HEAD", "OPTIONS", "PUT", "DELETE", "POST"],
  onRetryAttempt: (err) => {
    const cfg = rax.getConfig(err);
    if (cfg) console.log(`Retry attempt #${cfg.currentRetryAttempt}`);
  },
};

rax.attach(axiosInstance);
