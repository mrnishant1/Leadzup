import express from "express";
import fs from "fs/promises";
import path from "path";
import { insertGeneratedLead } from "./tempDB.js";

export type RawItem = {
  companyName: string;
  PostID: string;
  Title: string;
  Link: string;
};

const app = express();
app.use(express.json());
app.use(express.static("src"));

app.get("/", async (req, res) => {
  const html = await fs.readFile(path.join(process.cwd(), "index.html"), "utf8");
  res.send(html);
});

// API to get raw posts
app.get("/api/raw", async (req, res) => {
  try {
    const data = JSON.parse(await fs.readFile("raw.json", "utf8"));
    res.json(data);
  } catch {
    res.json([]);
  }
});

app.post("/api/approve", async (req, res) => {
  const { index } = req.body;
  console.log(index);

  let raw:RawItem[] = JSON.parse(await fs.readFile("raw.json", "utf8"));
  const item = raw[index];

  if (!item) return res.status(404).json({ error: "Invalid index" });

  // move item
  const respose = await insertGeneratedLead(item.companyName,item.Link);
  if(respose){
    raw.splice(index, 1);
    await fs.writeFile("raw.json", JSON.stringify(raw, null, 2));
  }
  res.json({ success: true });
});


app.post("/api/delete", async (req, res) => {
  const { index } = req.body;
  console.log(index);

  let raw=[]
  try {
    raw = JSON.parse(await fs.readFile("raw.json", "utf8"));
  } catch {}

  const item = raw[index];

  if (!item) return res.status(404).json({ error: "Invalid index" });
  raw.splice(index, 1);
  await fs.writeFile("raw.json", JSON.stringify(raw, null, 2));
  res.json({ success: true });
});


app.listen(3000, () => console.log("Server running on port 3000"));

