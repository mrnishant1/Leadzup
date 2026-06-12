import AhoCorasick from "ahocorasick";
import { getKeywords } from "./storage.js";

export const All_Companies_search_tree: Record<string, AhoCorasick> = {};

//Product_Name is the company that is wants to promote
//I've set Product_Name as Product you wants to promote 
const Product_Name = process.env.Product_Name||"local";

//=========================Builds Aho-Corasick trees from local keywords=========================
export async function keywordDatabase() {
  const keywords = await getKeywords();

  if (!keywords || keywords.length === 0) {
    delete All_Companies_search_tree[Product_Name];
    return false;
  }

  All_Companies_search_tree[Product_Name] = new AhoCorasick(keywords);
  return true;
}

export function getLocalUserKey() {
  return Product_Name;
}
