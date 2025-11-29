declare namespace NodeJS {
  interface ProcessEnv {
    MONGO_URL: string;
    EMAIL: string;
    EMAIL_APP_PASSWORD: string;
    REDDIT_CLIENT_ID: string;
    REDDIT_CLIENT_SECRET: string;
    REDDIT_USER: string;
    REDDIT_PASS: string;
    DATABASE_URL: string;
  }
}
