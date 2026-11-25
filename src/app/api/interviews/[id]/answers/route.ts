
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWithRetry } from "@/lib/gemini";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// Validate the student's submitted answer
const answerSchema = z.object({
  questionId: z.string().uuid(),
  answerText: z.string().min(1, "Answer cannot be empty").max(10000),
});

// Validate the evaluation returned by Gemini
const evaluationSchema = z.object({
  correctnessScore: z.number().min(0).max(100),
  depthScore: z.number().min(0).max(100),
  relevanceScore: z.number().min(0).max(100),
  feedback: z.string(),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
});

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // 1. Validate submitted data
    const validation = answerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid answer details",
          errors: validation.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { questionId, answerText } = validation.data;

    // 2. Find the interview session
    const session = await prisma.interviewSession.findUnique({
      where: { id },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Interview session not found" },
        { status: 404 }
      );
    }

    if (session.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { success: false, message: "Interview session is not active" },
        { status: 409 }
      );
    }

    // 3. Find the question belonging to this session
    const question = await prisma.question.findFirst({
      where: {
        id: questionId,
        sessionId: id,
      },
      include: {
        answer: true,
      },
    });

    if (!question) {
      return NextResponse.json(
        { success: false, message: "Question not found in this session" },
        { status: 404 }
      );
    }

    if (question.answer) {
      return NextResponse.json(
        { success: false, message: "This question has already been answered" },
        { status: 409 }
      );
    }

    // 4. Ask Gemini to evaluate the answer
    const prompt = `
You are an expert interviewer evaluating a student's answer.

Interview role: ${session.targetRole}
Skills: ${session.skills.join(", ")}
Question difficulty: ${question.difficulty}

Interview question:
${question.questionText}

Student's answer:
${answerText}

Evaluate the answer using these criteria:
1. correctnessScore: factual accuracy from 0 to 100.
2. depthScore: depth and completeness from 0 to 100.
3. relevanceScore: relevance to the question from 0 to 100.
4. feedback: clear and constructive feedback.
5. strengths: list of things the student did well.
6. improvements: list of areas to improve.

Be fair. Do not give a high score to an incorrect or irrelevant answer.

Return ONLY valid JSON in this exact structure:
{
  "correctnessScore": 75,
  "depthScore": 70,
  "relevanceScore": 85,
  "feedback": "Your feedback here",
  "strengths": ["Strength 1"],
  "improvements": ["Improvement 1"]
}

Use actual scores based on the student's answer.
`;

    const response = await generateWithRetry(prompt);

    const rawText = response.text?.trim();

    if (!rawText) {
      throw new Error("Gemini returned an empty evaluation");
    }

    // Remove optional Markdown code fences
    const cleanedText = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    // 5. Parse and validate Gemini's JSON
    const parsedEvaluation = evaluationSchema.safeParse(
      JSON.parse(cleanedText)
    );

    if (!parsedEvaluation.success) {
      console.error(
        "Invalid Gemini evaluation:",
        parsedEvaluation.error.flatten()
      );

      return NextResponse.json(
        {
          success: false,
          message: "AI returned an invalid evaluation. Please retry.",
        },
        { status: 502 }
      );
    }

    const evaluationData = parsedEvaluation.data;

    // Calculate overall score using fixed weights
    const overallScore =
      evaluationData.correctnessScore * 0.4 +
      evaluationData.depthScore * 0.3 +
      evaluationData.relevanceScore * 0.3;

    // 6. Save answer and evaluation together
    const savedAnswer = await prisma.answer.create({
      data: {
        questionId,
        answerText,
        evaluation: {
          create: {
            correctnessScore: evaluationData.correctnessScore,
            depthScore: evaluationData.depthScore,
            relevanceScore: evaluationData.relevanceScore,
            overallScore,
            feedback: evaluationData.feedback,
            strengths: evaluationData.strengths,
            improvements: evaluationData.improvements,
          },
        },
      },
      include: {
        evaluation: true,
      },
    });

    // 7. Return the evaluation
    return NextResponse.json(
      {
        success: true,
        message: "Answer evaluated successfully",
        answer: savedAnswer,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Answer evaluation error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to evaluate answer",
      },
      { status: 500 }
    );
  }
}
