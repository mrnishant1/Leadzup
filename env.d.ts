declare namespace NodeJS {
  interface ProcessEnv {
    REDDIT_CLIENT_ID: string;
    CLIENT_SECRET: string;
    REDDIT_USER: string;
    REDDIT_PASS: string;
    REDDIT_USER_AGENT?: string;
    OLLAMA_BASE_URL?: string;
    OLLAMA_MODEL?: string;
    PORT?: string;
    Product_Name?: string;
  }
}
