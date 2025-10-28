const matchedSet = {
  headphones: [
    { postId: "abc1", title: "Cool new headphones", postLink: "..." },
    { postId: "def2", title: "Bluetooth audio devices", postLink: "..." },
  ],
  memes: [{ postId: "xyz9", title: "Reddit meme thread", postLink: "..." }],
};

for (const companies in matchedSet) {
  if (Array.isArray(matchedSet[companies])) {
    const matches = matchedSet[companies]
    // console.log(companies);
    matches.forEach((i)=>{
      console.log(companies,i.postId);
    })
  }
}
