import sql from "./db.js";

export async function processLead(postId:string, gmail:string, postLink:string ) {
  await sql.begin(async (tx) => {
    
    // 1. Insert new lead
    await tx`
      INSERT INTO "GeneratedLeads" (post, "userMail")
      VALUES (${postLink}, ${gmail})
    `;

    // 2. Decrement user credit
    await tx`
      UPDATE "UserData"
      SET "currentCredits" = "currentCredits" - 1
      WHERE gmail = ${gmail}
    `;

    // 3. Delete from rawPostsMatched queue
    await tx`
      DELETE FROM "rawPostsMatched"
      WHERE id = ${postId}
    `;

  });
}