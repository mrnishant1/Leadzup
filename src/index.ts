import AhoCorasick from "ahocorasick";
import { headphones } from "./tempDB.js";
import type { subData } from "./types.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import sendMail from "./sendMail.js";
import Fuse from "fuse.js";
import { axiosInstance } from "./retryInstance.js";
import { saveToDB } from "./saveToDB.js";
import { commentHandler } from "./commentHandler.js";

dotenv.config();

//------------------------------Saved In memory
let lastSeenId: string | null = null;
let listingQueue: subData[] = [];
// const ac = new AhoCorasick(headphones);

//--------------Connecting to database
try {
  const res = await mongoose.connect(process.env.MONGO_URL);
  if(res.ConnectionStates.connected===1){
    console.log("connection has be done");
  }
} catch (error) {
  console.log("error in connecting to mongoDB" + error);
}

async function getAllposts() {
  try {
    console.log("hi");
    let newestPostId = await getLatestPostId();
    //store last latest post in last seen id
    if (!lastSeenId) {
      lastSeenId = newestPostId;
    }

    let latestPostId = parseInt(newestPostId, 36);
    if (lastSeenId) {
      console.log("difference -----------" + (latestPostId - parseInt(lastSeenId, 36))
      );
    }
    //---------------Batching the posts
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

      //--------------------Gets Latest listing using IDs
      const response = await axiosInstance.get(listingUrls);
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
    console.error(`Fetch attempts failed `, error);
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
  const matchedSet = new Set<(typeof listingQueue)[0]>();
  for (const kw of headphones) {
    const results = fuse.search(kw);
    results.forEach((r) => matchedSet.add(r.item)); // deduplicate
  }
  const matches = Array.from(matchedSet);
  console.log("matches are ------------", matches); //--------------------------All the matches that we found

  //----------------------------------All matched sent once
  try {
    await sendMail("All matches are:", JSON.stringify(matches), ".");
  } catch (error) {
    console.log("there is some error in send Mail", error);
  }

  if (matches.length > 0) {
    for (const element of matches) {
      try {
        //1. save to db
        await saveToDB(element.postId, element.postLink, element.title);
        //2. comment
        await commentHandler(element.postId, "lol :)");
       
      } catch (error) {
        sendMail(
          "there is some error check the server",
          "server stoped I think",
          "check"
        );
        console.log("There's been an error in keyword matcher", error);
      }
    }
  }

  //3. dequeue
  listingQueue = [];
}

async function getLatestPostId() {
  try {
    const response = await axiosInstance.get(
      "https://www.reddit.com/r/all/new.json?limit=2"
    );

    const children = response.data?.data?.children;
    if (!children || children.length === 0) {
      throw new Error("No posts returned");
    }
    return response.data.data.children[0].data.id;
  } catch (error) {
    console.log("some error happened in gettLatestPost", error);
  }
}

//-----------------------fetch fresh post every 60 sec
setInterval(async () => {
  await getAllposts();
  console.log("then");
  keywordsMatcher();
}, 60_000);
