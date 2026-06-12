import fs from "fs/promises";
import path from "path";
import type { MatchedPost, ReplyQueueItem } from "./types.js";

const DATA_DIR = path.join(process.cwd(), "data");

const KEYWORDS_FILE = path.join(DATA_DIR, "keywords.json");
const MATCHES_FILE = path.join(DATA_DIR, "matches.json");
const REPLY_QUEUE_FILE = path.join(DATA_DIR, "reply-queue.json");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson<T>(filePath: string, data: T): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

//Reads keywords from keyword.json
export async function getKeywords(): Promise<string[]> {
  return readJson<string[]>(KEYWORDS_FILE, []);
}
//Writes keyword
export async function setKeywords(keywords: string[]): Promise<string[]> {
  const cleaned = [
    ...new Set(
      keywords.map((k) => k.trim().toLowerCase()).filter((k) => k.length > 0)
    ),
  ];
  await writeJson(KEYWORDS_FILE, cleaned);
  return cleaned;
}
//Reads already Matched stored in match.json
export async function getMatches(): Promise<MatchedPost[]> {
  return readJson<MatchedPost[]>(MATCHES_FILE, []);
}
//Reads already Matched stored in match.json
export async function addMatch(match: MatchedPost): Promise<MatchedPost> {
  const matches = await getMatches();
  if (matches.some((m) => m.postId === match.postId)) {
    return match;
  }
  matches.unshift(match);
  await writeJson(MATCHES_FILE, matches.slice(0, 500));
  return match;
}

export async function deleteMatch(postId: string): Promise<boolean> {
  const matches = await getMatches();
  const filtered = matches.filter((m) => m.postId !== postId);
  if (filtered.length === matches.length) return false;
  await writeJson(MATCHES_FILE, filtered);
  return true;
}

export async function getReplyQueue(): Promise<ReplyQueueItem[]> {
  return readJson<ReplyQueueItem[]>(REPLY_QUEUE_FILE, []);
}

export async function addReplyItem(item: ReplyQueueItem): Promise<ReplyQueueItem> {
  const queue = await getReplyQueue();
  if (queue.some((q) => q.postId === item.postId)) {
    return item;
  }
  queue.unshift(item);
  await writeJson(REPLY_QUEUE_FILE, queue.slice(0, 200));
  return item;
}

export async function updateReplyItem(
  postId: string,
  updates: Partial<ReplyQueueItem>
): Promise<ReplyQueueItem | null> {
  const queue = await getReplyQueue();
  const idx = queue.findIndex((q) => q.postId === postId);
  if (idx === -1) return null;
  queue[idx] = { ...queue[idx]!, ...updates };
  await writeJson(REPLY_QUEUE_FILE, queue);
  return queue[idx]!;
}

export async function deleteReplyItem(postId: string): Promise<boolean> {
  const queue = await getReplyQueue();
  const filtered = queue.filter((q) => q.postId !== postId);
  if (filtered.length === queue.length) return false;
  await writeJson(REPLY_QUEUE_FILE, filtered);
  return true;
}
