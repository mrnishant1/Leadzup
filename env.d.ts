declare namespace NodeJS {
  interface ProcessEnv {
    MONGO_URL: string;
    DATABASE_URL: string;
    EMAIL:string;
    PASSWORD:string;
    CLIENT_ID:string;
    CLIENT_SECRET:string;
    REDDIT_USER:string;
    REDDIT_PASS:string;
  }
}
