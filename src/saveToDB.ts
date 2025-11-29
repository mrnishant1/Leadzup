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
    const filePath = "raw.json";
    try {
      let data = [];
      try {
        const file = await fs.readFile(filePath, "utf-8");
        data = JSON.parse(file);
      } catch {
        // file might not exist or be empty
        data = [];
      }
      const content = {
        companyName: companyName,
        PostID: postId,
        Title: PostTitle,
        Link: link,
      };
      data.push(content);

      await fs.writeFile(filePath, JSON.stringify(data, null, 2));
      console.log("Saved cleanly.");
    } catch (err) {
      console.error("Write failed:", err);
    }
  }
  console.log("All attemt of saving to DB has been failed");
  return await sendMail(postId, link, PostTitle);
}
