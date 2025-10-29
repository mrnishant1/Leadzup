import { User } from "./lib/mongoDB.js";
import sendMail from "./sendMail.js";
import fs from "fs/promises";

//--------------This function saves Post Id
export async function saveToDB(
  companyName: string,
  postId: string,
  link: string,
  PostTitle: string
) {
  let attempt = 1;
  while (attempt < 4) {
    // try {
    //   return User.create({companyName:companyName, postId: postId, postLink: link });
    // } catch (err) {
    //   attempt++;
    //   const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, etc
    //   console.error(`Attempt ${attempt} failed:`, err);
    //   await new Promise((res) => setTimeout(res, delay));
    // }

   try {
      const filePath = "myPromiseFile.txt";
      const content = `companyName: ${companyName} |PostID: ${postId} | Title: ${PostTitle} | Link: ${link}\n`;
      await fs.appendFile(filePath, content);
      console.log("File written successfully!");
      return;
    } catch (err) {
      attempt++;
      const delay = Math.pow(2, attempt) * 1000; // exponential backoff
      console.error(`Attempt ${attempt} failed:`, err);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  console.log("All attemt of saving to DB has been failed");
  return await sendMail(postId, link, PostTitle);
}
