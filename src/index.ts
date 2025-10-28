import AhoCorasick from "ahocorasick";
import { All_Companies } from "./tempDB.js";
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
  if (res.ConnectionStates.connected === 1) {
    console.log("connection has be done");
  }
} catch (error) {
  console.log("error in connecting to mongoDB" + error);
}

//---------------Fetching all the posts
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
      console.log(
        "difference -----------" + (latestPostId - parseInt(lastSeenId, 36))
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

//------------------Searchalgorithm  using Ahocorasic algorithm
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

//-----------------Fussy search
async function keywordsMatcher() {
  const fuse = new Fuse(listingQueue, { keys: ["title"], threshold: 0.3 });
  type Listing = {
    postId: string;
    postLink: string;
    title: string;
  };

  const companyMatches: Record<string, Listing[]> = {};
//-----------------------Matchingg the results with companies keywords
  for (const company in All_Companies) {
    const matchedSet = new Set<(typeof listingQueue)[0]>();
    if (Object.hasOwn(All_Companies, company)) {
      //@ts-ignore
      const words = All_Companies[company];
      if (Array.isArray(words)) {
        words.forEach((element) => {
          //search element--------using fuse search
          const matched_posts = fuse.search(element);
          // if we got many matched results(posts) ---> then we store all matched into set avoid dupicate results
          matched_posts.forEach((post) => {
            matchedSet.add(post.item);
          });
        });
      }
    }
    // if matches already exist for this company, append; otherwise create new array
    if (!companyMatches[company]) {
      companyMatches[company] = [];
    }
    companyMatches[company].push(...matchedSet);
  }

//-----------------------Saving the results to db 
  for (const company in companyMatches) {
    if (Array.isArray(companyMatches[company])) {
      const matches = companyMatches[company];
      if (matches.length > 0) {
        const limit = 5;
        for (let i = 0; i < matches.length; i += limit) {
          const chunk = matches.slice(i, i + limit);

          //------------Promise.allSettled helps in concurrency setteling all 5 at once in parellel
          const results = await Promise.allSettled(
            chunk.map((el) =>
              saveToDB(company, el.postId, el.postLink, el.title)
            )
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
