import axios from "axios";
import { getAccessToken } from "./handleOauth.js";
import { axiosInstance } from "./retryInstance.js";

export async function commentHandler(postID:string, text:string) {
    const Access_token = await getAccessToken();
    const res = await axiosInstance.post(
    "https://oauth.reddit.com/api/comment",
    new URLSearchParams({
      api_type: "json",
      thing_id: `${postID}`,
      text,
    }).toString(),
    {
      headers: {
        Authorization: `bearer ${Access_token}`,
        "Content-Type": "application/x-www-form-urlencoded",
         "User-Agent": "f5bot-clone/0.1 by u/Tough-Barracuda-8664"
      },
    }
  );

  return res.data;
}