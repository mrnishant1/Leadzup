import Fuse from "fuse.js";
const headphones = [
  "best budget headphones",
  '"headphone boat',
  "best budget headphones india",
  "best budget headphones gaming",
  "best budget headphones reddit",
  "best budget headphones  wired",
  "headphones",
  "best budget headphones for music",
  "best budget over ear headphones",
  "best budget earbuds",
  "best budget gaming headphones",
  "best budget earphones",
  "best budget headphones wireless",
  "best budget headphones under 2000",
  "best budget headphones with mic",
];

const listingQueue = [
  {
    title: "headphone ",
    firstName: "John",
    lastName: "Scalzi",
    refIndex: 0,
  },
  {
    title: "boat headphone",
    firstName: "Rob",
    lastName: "Grant",
    refIndex: 16,
  },
  {
    title: "Fool",
    firstName: "Christopher",
    lastName: "Moore",
    refIndex: 13,
  },
  {
    title: "The DaVinci Code",
    firstName: "Dan",
    lastName: "Brown",
    refIndex: 6,
  },
  {
    title: "The Lost Symbol",
    firstName: "Dan",
    lastName: "Brown",
    refIndex: 10,
  },
  {
    title: "The Code of the Wooster",
    firstName: "P.D",
    lastName: "Woodhouse",
    refIndex: 4,
  },
];

async function keywordsMatcher() {
  const fuse = new Fuse(listingQueue, { keys: ["title"], threshold: 0.5 });
  const matches = new Set();
  for (const kw of headphones) {
    const results = fuse.search(kw);
    results.forEach(r => matches.add(r.item)); // deduplicate
  }
  console.log(...matches);
}

keywordsMatcher();
