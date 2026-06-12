import type { subData } from "./types.js";
import {
  redditGet,
  redditCredentialsConfigured,
  formatRedditError,
} from "./redditClient.js";
import {
  keywordDatabase,
  All_Companies_search_tree,
  getLocalUserKey,
} from "./keywordloader.js";
import { addMatch, addReplyItem } from "./storage.js";
import { generateReply } from "./ollama.js";
import { appEvents } from "./events.js";
import type { ListenerStatus, MatchedPost, ReplyQueueItem } from "./types.js";
import { randomUUID } from "crypto";

let lastSeenId: string | null = null;
let listingQueue: subData[] = [];
let pollTimer: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

const status: ListenerStatus = {
  running: false,
  lastPollAt: null,
  lastMatchAt: null,
  postsScanned: 0,
  matchesFound: 0,
  error: null,
};

function broadcastStatus() {
  appEvents.emitStatus({ ...status });
}

export function getListenerStatus(): ListenerStatus {
  return { ...status, running: isRunning };
}


//=============Gets all 2000 Max posts from reddit APIs=====================
async function getAllposts() {
  try {
    const newestPostId = await getLatestPostId();
    if (!newestPostId) return;
    if (!lastSeenId) {
      lastSeenId = newestPostId;
    }

    let latestPostId = parseInt(newestPostId, 36);

    outer: for (let i = 0; i < 20; i++) {
      const batch = [];
      for (let j = 0; j < 100; j++) {
        const id = (latestPostId - 1).toString(36);
        if (id === lastSeenId) {
          lastSeenId = newestPostId;
          break outer;
        }
        latestPostId = latestPostId - 1;
        batch.push("t3_" + id);
      }
      //redditGet==> function for getting posts of Batch 
      const response = await redditGet<{
        data: {
          children: {
            data: {
              over_18: boolean;
              whitelist_status: string;
              name: string;
              subreddit: string;
              title: string;
              permalink: string;
            };
          }[];
        };
      }>("/api/info", {
        id: batch.join(","),
      });
      response.data.data.children.forEach((children: {
        data: {
          over_18: boolean;
          whitelist_status: string;
          name: string;
          subreddit: string;
          title: string;
          permalink: string;
        };
      }) => {
        if (
          !children.data.over_18 &&
          children.data.whitelist_status !== "promo_adult_nsfw"
        ) {
          const subData: subData = {
            postId: children.data.name,
            subReddit: children.data.subreddit,
            title: children.data.title,
            postLink: "https://reddit.com" + children.data.permalink,
          };
          listingQueue.push(subData);
        }
      });
    }

    lastSeenId = newestPostId;
    status.error = null;
  } catch (error) {
    const message = formatRedditError(error);
    console.error("Fetch attempts failed:", message);
    status.error = message;
  }
}

async function keywordsMatcher() {
  type Listing = {
    postId: string;
    postLink: string;
    title: string;
    subReddit: string;
  };

  console.log("matching started");
  const companyMatches: Record<string, Listing[]> = {};

  while (listingQueue.length) {
    if (listingQueue.length === 0) return;
    const item = listingQueue[0]!;
    status.postsScanned += 1;

    for (const company in All_Companies_search_tree) {
      const results = All_Companies_search_tree[company]?.search(
        item.title.toLocaleLowerCase()
      );
      if (results && results.length > 0) {
        if (!companyMatches[company]) {
          companyMatches[company] = [];
        }
        companyMatches[company].push({
          postId: item.postId,
          postLink: item.postLink,
          title: item.title,
          subReddit: item.subReddit,
        });
      }
    }

    listingQueue.shift();
  }

  for (const company in companyMatches) {
    if (Array.isArray(companyMatches[company])) {
      const matches = companyMatches[company];
      if (matches.length > 0) {
        const limit = 5;
        for (let i = 0; i < matches.length; i += limit) {
          const chunk = matches.slice(i, i + limit);

          const results = await Promise.allSettled(
            chunk.map((el) => handleMatch(el))
          );
          results.forEach((res, j) => {
            if (res.status === "rejected") {
              console.error("Failed:", chunk[j], res.reason);
            }
          });
        }
      }
    }
  }

  listingQueue = [];
}

//================Actual matching function of listings to Keyword============================
async function handleMatch(listing: {
  postId: string;
  postLink: string;
  title: string;
  subReddit: string;
}) {
  const company = getLocalUserKey();
  const tree = All_Companies_search_tree[company];
  const searchResults = tree?.search(listing.title.toLocaleLowerCase()) ?? [];
  const matchedKeywords = [
    ...new Set(
      searchResults.map(([, keywords]) => keywords).flat()
    ),
  ];

  const match: MatchedPost = {
    id: randomUUID(),
    postId: listing.postId,
    subReddit: listing.subReddit,
    title: listing.title,
    postLink: listing.postLink,
    matchedKeywords,
    matchedAt: new Date().toISOString(),
  };

  await addMatch(match);
  status.matchesFound += 1;
  status.lastMatchAt = match.matchedAt;
  appEvents.emitMatch(match);

  let suggestedReply = "";
  let replyStatus: ReplyQueueItem["status"] = "pending";
  let error: string | undefined;

  try {
    suggestedReply = await generateReply(
      listing.title,
      listing.subReddit,
      matchedKeywords
    );
  } catch (err) {
    replyStatus = "error";
    error = err instanceof Error ? err.message : String(err);
    suggestedReply = "";
    console.error("Ollama reply generation failed:", err);
  }

  const replyItem: ReplyQueueItem = {
    id: randomUUID(),
    postId: listing.postId,
    subReddit: listing.subReddit,
    title: listing.title,
    postLink: listing.postLink,
    matchedKeywords,
    suggestedReply,
    status: replyStatus,
    createdAt: new Date().toISOString(),
    ...(error !== undefined ? { error } : {}),
  };

  await addReplyItem(replyItem);
  appEvents.emitReply(replyItem);
}

async function getLatestPostId(retry = 2): Promise<string | undefined> {
  try {
    const response = await redditGet<{ data: { children: { data: { id: string } }[] } }>(
      "/r/all/new",
      { limit: 2 }
    );
    const children = response.data?.data?.children;
    if (!children?.length) throw new Error("Empty response");
    return children[0]!.data.id;
  } catch (error) {
    if (retry > 0) {
      console.warn("Retrying getLatestPostId…", retry);
      return getLatestPostId(retry - 1);
    }
    const message = formatRedditError(error);
    console.error("Failed to fetch latest post:", message);
    status.error = message;
  }
}

async function runPollCycle() {
  if (Object.keys(All_Companies_search_tree).length === 0) {
    status.error = "No keywords configured";
    broadcastStatus();
    return;
  }

  status.lastPollAt = new Date().toISOString();
  broadcastStatus();

  await getAllposts();
  await keywordsMatcher();
  broadcastStatus();
}

export async function startListener(intervalMs = 60_000) {
  if (isRunning) return getListenerStatus();

  if (!redditCredentialsConfigured()) {
    status.error = "Reddit credentials missing in .env";
    broadcastStatus();
    throw new Error(
      "Reddit credentials required. Set REDDIT_CLIENT_ID, CLIENT_SECRET, REDDIT_USER, and REDDIT_PASS in .env"
    );
  }

  await keywordDatabase();
  if (Object.keys(All_Companies_search_tree).length === 0) {
    status.error = "No keywords configured";
    broadcastStatus();
    throw new Error("No keywords configured. Add keywords before starting.");
  }

  isRunning = true;
  status.running = true;
  status.error = null;
  broadcastStatus();

  await runPollCycle();

  pollTimer = setInterval(() => {
    void runPollCycle();
  }, intervalMs);

  return getListenerStatus();
}

export function stopListener() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
  isRunning = false;
  status.running = false;
  broadcastStatus();
  return getListenerStatus();
}

export async function reloadKeywords() {
  return keywordDatabase();
}
