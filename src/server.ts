import express from "express";
import path from "path";
import dotenv from "dotenv";
import {
  getKeywords,
  setKeywords,
  getMatches,
  deleteMatch,
  getReplyQueue,
  updateReplyItem,
  deleteReplyItem,
} from "./storage.js";
import {
  startListener,
  stopListener,
  getListenerStatus,
  reloadKeywords,
} from "./redditListener.js";
import { appEvents } from "./events.js";
import { isOllamaAvailable } from "./ollama.js";
import { commentHandler } from "./commentHandler.js";
import { keywordDatabase } from "./keywordloader.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3001;

app.use(express.json());
app.use(express.static(path.join(process.cwd(), "src", "public")));

app.get("/", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "src", "public", "index.html"));
});

app.get("/api/keywords", async (_req, res) => {
  const keywords = await getKeywords();
  res.json({ keywords });
});

app.post("/api/keywords", async (req, res) => {
  const { keywords } = req.body as { keywords?: string[] };
  if (!Array.isArray(keywords)) {
    res.status(400).json({ error: "keywords must be an array of strings" });
    return;
  }
  const saved = await setKeywords(keywords);
  await reloadKeywords();
  res.json({ keywords: saved });
});

app.get("/api/listener/status", (_req, res) => {
  res.json(getListenerStatus());
});

app.post("/api/listener/start", async (_req, res) => {
  try {
    console.log("start api was called");
    const status = await startListener();
    res.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(400).json({ error: message });
  }
});

app.post("/api/listener/stop", (_req, res) => {
  console.log("stop api was called");
  res.json(stopListener());
});

app.get("/api/matches", async (_req, res) => {
  const matches = await getMatches();
  res.json(matches);
});

app.delete("/api/matches/:postId", async (req, res) => {
  const deleted = await deleteMatch(req.params.postId!);
  res.json({ success: deleted });
});

app.get("/api/replies", async (_req, res) => {
  const replies = await getReplyQueue();
  res.json(replies);
});

app.post("/api/replies/:postId/approve", async (req, res) => {
  const { postId } = req.params;
  const { text } = req.body as { text?: string };

  const queue = await getReplyQueue();
  const item = queue.find((q) => q.postId === postId);
  if (!item) {
    res.status(404).json({ error: "Reply not found" });
    return;
  }

  const replyText = text ?? item.suggestedReply;
  if (!replyText?.trim()) {
    res.status(400).json({ error: "No reply text provided" });
    return;
  }

  try {
    await commentHandler(postId!, replyText);
    const updated = await updateReplyItem(postId!, { status: "approved" });
    res.json({ success: true, item: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: message });
  }
});

app.post("/api/replies/:postId/dismiss", async (req, res) => {
  const { postId } = req.params;
  const updated = await updateReplyItem(postId!, { status: "dismissed" });
  if (!updated) {
    res.status(404).json({ error: "Reply not found" });
    return;
  }
  res.json({ success: true, item: updated });
});

app.delete("/api/replies/:postId", async (req, res) => {
  const deleted = await deleteReplyItem(req.params.postId!);
  res.json({ success: deleted });
});

app.get("/api/health", async (_req, res) => {
  const ollama = await isOllamaAvailable();
  res.json({
    ollama,
    listener: getListenerStatus(),
  });
});

app.get("/api/events", (req, res) => {

  res.setHeader("Content-Type", "text/event-stream"); // text/event-stream — tells the browser "this is SSE, parse it as events"
  res.setHeader("Cache-Control", "no-cache");// no-cache — don't buffer this, every chunk should arrive immediately
  res.setHeader("Connection", "keep-alive");// keep-alive — don't close the TCP connection
  res.flushHeaders();// flushHeaders() — sends the headers right now without waiting for a body (starts the stream)

  const send = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  send("status", getListenerStatus());

  const unsubMatch = appEvents.onMatch((match) => send("match", match));
  const unsubReply = appEvents.onReply((reply) => send("reply", reply));
  const unsubStatus = appEvents.onStatus((s) => send("status", s));

  req.on("close", () => {
    unsubMatch();
    unsubReply();
    unsubStatus();
  });
});

async function startServer() {
  await keywordDatabase();//Gets keyword

  const server = app.listen(PORT); //starts server
  server.on("listening", () => {
    console.log(`Redditwrapper running at http://localhost:${PORT}`);
  });
  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Stop the other process or change PORT in .env`
      );
    } else {
      console.error("Failed to start server:", err.message);
    }
    process.exit(1);
  });
}

startServer().catch((err) => {
  console.error("Startup failed:", err);
  process.exit(1);
});
