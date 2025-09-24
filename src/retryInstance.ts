import axios from "axios";
import * as rax from "retry-axios";


export const axiosInstance = axios.create({
  headers: { "User-Agent": "f5bot-clone/0.1 by u/Tough-Barracuda-8664"} 
});

rax.attach(axiosInstance);

axiosInstance.defaults.raxConfig = {
  instance: axiosInstance,
  retry: 3, // total retries
  noResponseRetries: 2,
  retryDelay: 1000,
  statusCodesToRetry: [[500, 599]], // will retry on 5xx
  backoffType: "exponential",
  httpMethodsToRetry: ["GET", "HEAD", "OPTIONS", "PUT", "DELETE", "POST"], // <-- add POST
  onRetryAttempt: (err) => {
    const cfg = rax.getConfig(err);
    if(cfg)
    console.log(`Retry attempt #${cfg.currentRetryAttempt}`);
  },
};

