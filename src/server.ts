import express from "express";
import fs from "fs/promises";
import path from "path";
// import { insertGeneratedLead } from "./tempDB.js";
import { keywordDatabase } from "./keywordloader.js";
import sql from "./db.js";
import { processLead } from "./apifunctions.js";

export type RawPostID = {
  companyName: string;
  PostID: string;
  Title: string;
  Link: string;
};
export async function insertDMs(gmail: string, message: string) {
  const result = await sql`
    INSERT INTO "GeneratedLeads" ("message", "userMail")
    VALUES (${message}, ${gmail})
    RETURNING *;
  `;
  console.log(result);
  return result;
}

const app = express();
app.use(express.json());
app.use(express.static("src"));

app.get("/", async (req, res) => {
  const html = await fs.readFile(
    path.join(process.cwd(), "PostID.html"),
    "utf8"
  );
  res.send(html);
});

// API to get raw posts
app.get("/api/raw", async (req, res) => {
  try {
    const response =
      await sql`SELECT * FROM "rawPostsMatched" ORDER BY "createdAt" DESC`;
    res.json(response);
  } catch (error) {
    console.error("Error fetching raw posts:", error);
    res.status(500).json({ error: "Failed to fetch raw posts" });
  }
});

//API to approve and delete from raw
app.post("/api/approve", async (req, res) => {
  const { postId, gmail, postLink } = req.body;
  await processLead(postId, gmail, postLink);

  res.json({ success: true });
});

app.post("/api/refreshclient", async (req, res) => {
  const response = await keywordDatabase();
  if (response) {
    res.json({ success: true });
  }
});

app.post("/api/delete", async (req, res) => {
  const { PostID } = req.body;
  try {
    const response =
      await sql`DELETE FROM "rawPostsMatched" WHERE "postId" = ${PostID}`;
    if (response) {
      return res.json({ success: true });
    }
  } catch (e) {
    console.log(e);
  }
  res.json({ success: true });
});

app.listen(3001, () => console.log("Server running on port 3000"));
