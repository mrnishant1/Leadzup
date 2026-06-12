import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";
const Product_Name = process.env.Product_Name || "local";

export async function generateReply(
  title: string,
  subReddit: string,
  matchedKeywords: string[],
): Promise<string> {
  const prompt = `You are writing a Reddit comment as a real user who has used ${Product_Name} and found it genuinely useful.

Subreddit: r/${subReddit}
Post title: ${title}
Matched keywords: ${matchedKeywords.join(", ")}

Write a 2-4 sentence reply that responds to the post's actual content first. If ${Product_Name} is genuinely relevant to what the person is asking or discussing, mention it naturally as something you personally use — like you'd casually recommend something to a friend. If it doesn't fit naturally, write a helpful reply without mentioning it.

Write like a real person typing a quick comment: casual, specific, no marketing language. No hashtags, no "Great post!" openers, no emojis. Output only the comment text, nothing else.`;

  const response = await axios.post(
    `${OLLAMA_BASE_URL}/api/generate`,
    {
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
    },
    { timeout: 120_000 },
  );

  const text = response.data?.response?.trim();
  if (!text) {
    throw new Error("Ollama returned an empty response");
  }
  return text;
}

export async function isOllamaAvailable(): Promise<boolean> {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 3000,
    });
    return response.status === 200;
  } catch {
    return false;
  }
}
