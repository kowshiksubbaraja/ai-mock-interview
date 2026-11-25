
import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

export const ai = new GoogleGenAI({ apiKey });

export const GEMINI_MODEL = "gemini-3.5-flash-lite";

export async function generateWithRetry(prompt: string) {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
      });
    } catch (error) {
      console.error(`Gemini attempt ${attempt} failed:`, error);

      if (attempt === maxAttempts) {
        throw error;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 1500 * 2 ** (attempt - 1))
      );
    }
  }

  throw new Error("Gemini generation failed");
}
