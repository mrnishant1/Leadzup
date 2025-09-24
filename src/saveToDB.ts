import { User } from "./lib/mongoDB.js";
import sendMail from "./sendMail.js";


//--------------This function saves Post Id
export async function saveToDB(postId: string, link: string, PostTitle: string) {
  let attempt = 1;
  while (attempt < 4) {
    try {
      return User.create({ postId: postId, postLink: link });
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