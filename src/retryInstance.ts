import axios from "axios";
import * as rax from "retry-axios";

export const axiosInstance = axios.create({
  headers: { "User-Agent": "f5bot-clone/0.1 by u/Tough-Barracuda-8664" },
});

// define config first
axiosInstance.defaults.raxConfig = {
  instance: axiosInstance,
  retry: 3, // total retries
  noResponseRetries: 2,
  backoffType: "exponential", // exponential backoff
  retryDelay: 500, // base delay for exponential
  statusCodesToRetry: [[500, 599]], // retry on 5xx
  httpMethodsToRetry: ["GET", "HEAD", "OPTIONS", "PUT", "DELETE", "POST"],
  onRetryAttempt: (err) => {
    const cfg = rax.getConfig(err);
    if (cfg)
      console.log(`Retry attempt #${cfg.currentRetryAttempt}`);
  },
};

// attach after config
rax.attach(axiosInstance);
