import AhoCorasick from "ahocorasick";
import { getClientCompanies } from "./tempDB.js";

export const All_Companies_search_tree:Record<string, AhoCorasick> = {};

export async function keywordDatabase() {
  const All_Companies = await getClientCompanies();

  if (!All_Companies || Object.keys(All_Companies).length === 0) {
    return false;
  }

  for (const company in All_Companies) {
    const words = All_Companies[company];
    if (Array.isArray(words)) {
      All_Companies_search_tree[company] = new AhoCorasick(words);
    }
  }

  return true;
}
