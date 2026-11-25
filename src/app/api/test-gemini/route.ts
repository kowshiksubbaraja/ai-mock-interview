
import { connection } from "next/server";
import { ai, GEMINI_MODEL } from "@/lib/gemini";

export async function GET() {
  // Ensure Gemini is called only when an actual request arrives.
  await connection();

  try {
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents:
        "Generate one beginner-level interview question for a software developer. Return only the question.",
    });

    return Response.json({
      success: true,
      model: GEMINI_MODEL,
      question: response.text,
    });
  } catch (error) {
    console.error("Gemini API error:", error);

    return Response.json(
      {
        success: false,
        message: "Gemini API request failed. Check the server terminal.",
      },
      { status: 502 }
    );
  }
}
