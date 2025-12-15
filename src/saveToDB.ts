import sql from "./db.js";
import sendMail from "./sendMail.js";

//--------------This function saves Post Id
export async function saveToDB(
  companyName: string,
  postId: string,
  link: string,
  PostTitle: string
) {
  let attempt = 1;

  while (attempt <= 3) {
    try {
      await sql`
  INSERT INTO "rawPostsMatched" (gmail, "postId", title, link)
  VALUES (${companyName}, ${postId}, ${PostTitle}, ${link});
`;
      return; // stop after success
    } catch (err) {
      console.error("Write failed:", err);
      attempt++;
    }
  }

  console.log("All attempts of saving to DB have failed");
  return await sendMail(postId, link, PostTitle);
}

