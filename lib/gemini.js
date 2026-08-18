import { GoogleGenerativeAI } from "@google/generative-ai";

let client = null;

export function getGeminiClient() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!client) {
    client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return client;
}

export const MODEL = "gemini-2.0-flash";

export function getModel() {
  const client = getGeminiClient();
  if (!client) return null;
  return client.getGenerativeModel({ model: MODEL });
}
