const keywordsInput = document.getElementById("keywords-input");
const saveKeywordsBtn = document.getElementById("save-keywords");
const keywordStatus = document.getElementById("keyword-status");
const startBtn = document.getElementById("start-btn");
const stopBtn = document.getElementById("stop-btn");
const listenerBadge = document.getElementById("listener-badge");
const listenerStats = document.getElementById("listener-stats");
const healthEl = document.getElementById("health");
const matchesFeed = document.getElementById("matches-feed");
const replyFeed = document.getElementById("reply-feed");

async function api(path, options) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

function formatTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function renderKeywords(keywords) {
  keywordsInput.value = keywords.join("\n");
}

function renderListenerStatus(status) {
  const running = status.running;
  listenerBadge.textContent = running ? "Running" : "Stopped";
  listenerBadge.className = `badge ${running ? "running" : "stopped"}`;
  startBtn.disabled = running;
  stopBtn.disabled = !running;

  listenerStats.innerHTML = `
    Last poll: ${formatTime(status.lastPollAt)} ·
    Last match: ${formatTime(status.lastMatchAt)} ·
    Scanned: ${status.postsScanned} ·
    Matches: ${status.matchesFound}
    ${status.error ? `<div class="error-text">${status.error}</div>` : ""}
  `;
}

function renderMatchCard(match) {
  const div = document.createElement("div");
  div.className = "card";
  div.dataset.postId = match.postId;
  div.innerHTML = `
    <h3>${escapeHtml(match.title)}</h3>
    <div class="meta">r/${escapeHtml(match.subReddit)} · ${formatTime(match.matchedAt)}</div>
    <div class="keywords">${match.matchedKeywords.map((k) => `<span class="tag">${escapeHtml(k)}</span>`).join("")}</div>
    <a href="${match.postLink}" target="_blank" rel="noopener">Open on Reddit</a>
    <div class="actions">
      <button class="btn ghost dismiss-match">Dismiss</button>
    </div>
  `;
  div.querySelector(".dismiss-match").addEventListener("click", async () => {
    await api(`/api/matches/${match.postId}`, { method: "DELETE" });
    div.remove();
    if (!matchesFeed.children.length)
      matchesFeed.innerHTML = '<div class="empty">No matches yet.</div>';
  });
  return div;
}

function renderReplyCard(reply) {
  const div = document.createElement("div");
  div.className = "card";
  div.dataset.postId = reply.postId;
  const statusLabel =
    reply.status === "error"
      ? " (Ollama error)"
      : reply.status === "approved"
        ? " (posted)"
        : "";
  div.innerHTML = `
    <h3>${escapeHtml(reply.title)}${statusLabel}</h3>
    <div class="meta">r/${escapeHtml(reply.subReddit)} · ${formatTime(reply.createdAt)}</div>
    <div class="keywords">${reply.matchedKeywords.map((k) => `<span class="tag">${escapeHtml(k)}</span>`).join("")}</div>
    <a href="${reply.postLink}" target="_blank" rel="noopener">Open on Reddit</a>
    <textarea class="reply-text">${escapeHtml(reply.suggestedReply)}</textarea>
    ${reply.error ? `<div class="error-text">${escapeHtml(reply.error)}</div>` : ""}
    <div class="actions">
      <button class="btn success approve-reply">Post Reply</button>
      <button class="btn ghost dismiss-reply">Dismiss</button>
    </div>
  `;

  const textarea = div.querySelector(".reply-text");

  div.querySelector(".approve-reply").addEventListener("click", async () => {
    try {
      await api(`/api/replies/${reply.postId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textarea.value }),
      });
      div.querySelector("h3").textContent += " (posted)";
      div.querySelector(".actions").innerHTML =
        '<span class="status-text">Reply posted to Reddit</span>';
    } catch (err) {
      alert(err.message);
    }
  });

  div.querySelector(".dismiss-reply").addEventListener("click", async () => {
    await api(`/api/replies/${reply.postId}/dismiss`, { method: "POST" });
    div.remove();
    if (!replyFeed.children.length)
      replyFeed.innerHTML = '<div class="empty">No pending replies.</div>';
  });

  return div;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function prependCard(feed, card, emptyMessage) {
  const empty = feed.querySelector(".empty");
  if (empty) empty.remove();
  feed.prepend(card);
}

async function loadInitial() {
  const [{ keywords }, matches, replies, status, health] = await Promise.all([
    api("/api/keywords"),
    api("/api/matches"),
    api("/api/replies"),
    api("/api/listener/status"),
    api("/api/health"),
  ]);

  renderKeywords(keywords);
  renderListenerStatus(status);

  healthEl.innerHTML = `Ollama: <strong>${health.ollama ? "connected" : "offline"}</strong>`;

  if (matches.length === 0) {
    matchesFeed.innerHTML =
      '<div class="empty">No matches yet. Start the listener after saving keywords.</div>';
  } else {
    matchesFeed.innerHTML = "";
    matches.forEach((m) => matchesFeed.appendChild(renderMatchCard(m)));
  }

  const pending = replies.filter((r) => r.status !== "dismissed");
  if (pending.length === 0) {
    replyFeed.innerHTML = '<div class="empty">No pending replies.</div>';
  } else {
    replyFeed.innerHTML = "";
    pending.forEach((r) => replyFeed.appendChild(renderReplyCard(r)));
  }
}

//SSE ------- Server side Event listener -----------
function connectSSE() {
  const source = new EventSource("/api/events");

  source.addEventListener("status", (e) => {
    renderListenerStatus(JSON.parse(e.data));
  });

  source.addEventListener("match", (e) => {
    const match = JSON.parse(e.data);
    const existing = matchesFeed.querySelector(
      `[data-post-id="${match.postId}"]`,
    );
    if (!existing) prependCard(matchesFeed, renderMatchCard(match));
  });

  source.addEventListener("reply", (e) => {
    const reply = JSON.parse(e.data);
    const existing = replyFeed.querySelector(
      `[data-post-id="${reply.postId}"]`,
    );
    if (existing) existing.remove();
    prependCard(replyFeed, renderReplyCard(reply));
  });

  source.onerror = () => {
    source.close();
    setTimeout(connectSSE, 3000);
  };
}

//=======================Buttons on frontend
saveKeywordsBtn.addEventListener("click", async () => {
  const keywords = keywordsInput.value
    .split("\n")
    .map((k) => k.trim())
    .filter(Boolean);

  try {
    const result = await api("/api/keywords", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keywords }),
    });
    keywordStatus.textContent = `Saved ${result.keywords.length} keyword(s)`;
    setTimeout(() => (keywordStatus.textContent = ""), 3000);
  } catch (err) {
    keywordStatus.textContent = err.message;
  }
});

startBtn.addEventListener("click", async () => {
  try {
    const status = await api("/api/listener/start", { method: "POST" });
    console.log("start button was clicked");
    renderListenerStatus(status);
  } catch (err) {
    alert(err.message);
  }
});

stopBtn.addEventListener("click", async () => {
  const status = await api("/api/listener/stop", { method: "POST" });
  console.log("stop button was clicked");
  renderListenerStatus(status);
});

loadInitial();
connectSSE();
