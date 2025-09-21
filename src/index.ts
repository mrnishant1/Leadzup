import axios from "axios";
import AhoCorasick from "ahocorasick";
import { headphones } from "./tempDB.js";
import type { subData } from "./types.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./lib/mongoDB.js";
import sendMail from "./nodemailer.js";
import Fuse from "fuse.js";

dotenv.config();

//keep track of last Id --------------------------------------------------
const ac = new AhoCorasick(headphones);
let lastSeenId: string | null = null;

let listingQueue: subData[] = [];
const matchedTitles: string[][] = [];
//Connecting to database--------------
try {
  await mongoose.connect(process.env.MongoDB_URL);
} catch (error) {
  console.log("error in connecting to mongoDB" + error);
}

async function getAllposts(attempt = 1) {
  try {
    console.log("hi");
    let newestPostId = await getLatestPostId();
    //store last latest post in last seen id
    if (!lastSeenId) {
      lastSeenId = newestPostId;
    }

    let latestPostId = parseInt(newestPostId, 36);
    if (lastSeenId) {
      console.log(
        "difference -----------" + (latestPostId - parseInt(lastSeenId, 36))
      );
    }
    //Batching the posts -------------------------------------------
    for (let i = 0; i < 20; i++) {
      let batch = [];
      for (let j = 0; j < 100; j++) {
        let id = (latestPostId - 1).toString(36);
        if (id === lastSeenId) return;
        latestPostId = latestPostId - 1;
        batch.push("t3_" + id);
      }
      let listingUrls =
        "https://api.reddit.com/api/info.json?id=" + batch.join(",");
      //Gets Latest listing using IDs--------------------
      const response = await axios.get(listingUrls, {
        headers: { "User-Agent": "f5bot-clone/0.1 by u/Tough-Barracuda-8664" },
      });
      response.data.data.children.forEach((children: any) => {
        if (
          !children.data.over_18 &&
          children.data.whitelist_status !== "promo_adult_nsfw"
        ) {
          let subData = {
            postId: children.data.name,
            subReddit: children.data.subreddit,
            title: children.data.title,
            postLink: "https://reddit.com" + children.data.permalink,
          };

          //I am pushing these things to queue then I have to compare them to keywords
          listingQueue.push(subData);
        }
      });
    }

    lastSeenId = newestPostId;
  } catch (error) {
    console.error(`Fetch failed (attempt ${attempt}):`, error);

    if (attempt < 3) {
      // 🔁 retry max 3 times
      await new Promise((res) => setTimeout(res, 1000 * attempt)); // exponential backoff
      return getAllposts(attempt + 1);
    } else {
      console.log("Skipping this round after 3 failed attempts");
      return;
    }
  }
}

// async function keywordsMatcher() {
//   const tempMatchedDB: subData[] = [];//this is temp in memory database just to log things--------
//   //now keyword matching until queue gets empty---------------
//   while (listingQueue.length) {
//     if (!listingQueue[0]) return;
//     const text = `${listingQueue[0].title}`;
//     const results = ac.search(text.toLowerCase());
//     //if there are------
//     const matches = results.map((r) => r[1]);
//     if (matches.length > 0) {
//       matchedTitles.push(...matches);

//       //1. push into db
//         await saveToDB(listingQueue[0].postId, listingQueue[0].postLink, listingQueue[0].title);
//         tempMatchedDB.push(listingQueue[0]);
//       //2.comment

//     }
//     //3.dequeue
//     listingQueue.shift();
//   }
//   console.log("listingQueue is now empty ");
//   console.log("here is the matched post" + JSON.stringify(tempMatchedDB) + "\n");
//   console.log("Matched titles were ---------------" + matchedTitles);
// }

// This function- gets latest post Id-----------

async function keywordsMatcher() {
  const fuse = new Fuse(listingQueue, { keys: ["title"], threshold: 0.3 });
  const matchedSet = new Set<typeof listingQueue[0]>();
  for (const kw of headphones) {
    const results = fuse.search(kw);
    results.forEach(r => matchedSet.add(r.item)); // deduplicate
  }
  const matches = Array.from(matchedSet);

  if (matches.length > 0) {
    for (const element of matches) {
      //1. save to db
      await saveToDB(element.postId,element.postLink,element.title)
      //2. comment
      
      //3. mail
      await sendMail(element.postId,element.postLink,element.title);
    }
  }

  //3. dequeue
  listingQueue=[];
}

async function getLatestPostId() {
  const response = await axios.get(
    "https://www.reddit.com/r/all/new.json?limit=2",
    { headers: { "User-Agent": "f5bot-clone/0.1 by u/Tough-Barracuda-8664" } }
  );
  const children = response.data?.data?.children;
  if (!children || children.length === 0) {
    throw new Error("No posts returned");
  }
  return response.data.data.children[0].data.id;
}

//This function saves Post Id--------------
async function saveToDB(postId: string, link: string, PostTitle: string) {
  let attempt = 1;
  while (attempt < 4) {
    try {
      return new User({ postId: postId, postLink: link });
    } catch (err) {
      attempt++;
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, etc
      console.error(`Attempt ${attempt} failed:`, err);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  console.log("All attemt of saving to DB has been failed");
  return await sendMail(postId, link, PostTitle);
}

//fetch fresh post every 60 sec -----------------------
setInterval(async () => {
  await getAllposts();
  console.log("then");
  keywordsMatcher();
}, 60_000);
