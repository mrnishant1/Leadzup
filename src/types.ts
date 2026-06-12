export interface subData {
  postId: string;
  subReddit: string;
  title: string;
  postLink: string;
}

export interface MatchedPost {
  id: string;
  postId: string;
  subReddit: string;
  title: string;
  postLink: string;
  matchedKeywords: string[];
  matchedAt: string;
}

export interface ReplyQueueItem {
  id: string;
  postId: string;
  subReddit: string;
  title: string;
  postLink: string;
  matchedKeywords: string[];
  suggestedReply: string;
  status: "pending" | "approved" | "dismissed" | "error";
  createdAt: string;
  error?: string;
}

export type ListenerStatus = {
  running: boolean;
  lastPollAt: string | null;
  lastMatchAt: string | null;
  postsScanned: number;
  matchesFound: number;
  error: string | null;
};
