// import sql from "./db.js";
import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config();

const sql = postgres(process.env.DATABASE_URL, { ssl: "require" });

//return results as
//{
//   gmail: ["leads", "how to get leads", "freelance", "web design", "web agency"],
//   gmail: ["leads", "how to get leads", "freelance", "web design", "web agency"],
//}
export async function getClientCompanies() {
  const result = await sql`
  SELECT "gmail", "keywords"
  FROM "UserData"
  WHERE "currentCredits">0
`;
  let All_Companies: Record<string, string[]> = result.reduce((acc, item) => {
    acc[item.gmail] = item.keywords;
    return acc;
  }, {} as Record<string, string[]>);

  console.log(All_Companies);

  return All_Companies;
}

await getClientCompanies();

export async function insertGeneratedLead(gmail: string, postlink: string) {
  const result = await sql`
    INSERT INTO "GeneratedLeads" ("post", "userMail")
    VALUES (${postlink}, ${gmail})
    RETURNING *;
  `;

  console.log(result);
  return result;
}

export async function insertDMs(gmail: string, message: string) {
  const result = await sql`
    INSERT INTO "GeneratedLeads" ("message", "userMail")
    VALUES (${message}, ${gmail})
    RETURNING *;
  `;

  console.log(result);
  return result;
}
