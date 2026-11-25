
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWithRetry } from "@/lib/gemini";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const session = await prisma.interviewSession.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { sequence: "desc" },
          take: 1,
          include: {
            answer: {
              include: {
                evaluation: true,
              },
            },
          },
        },
      },
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

    const latestQuestion = session.questions[0];

    if (latestQuestion && !latestQuestion.answer) {
      return NextResponse.json(
        {
          success: false,
          message: "Please answer the previous question first",
        },
        { status: 409 }
      );
    }

    const previousScore =
      latestQuestion?.answer?.evaluation?.overallScore;

    let nextDifficulty: "EASY" | "MEDIUM" | "HARD" =
      session.difficulty;

    if (previousScore !== undefined) {
      if (previousScore >= 80) {
        nextDifficulty = "HARD";
      } else if (previousScore >= 50) {
        nextDifficulty = "MEDIUM";
      } else {
        nextDifficulty = "EASY";
      }
    }

    const nextSequence = latestQuestion
      ? latestQuestion.sequence + 1
      : 1;

    const prompt = `
You are an experienced interviewer.

Generate exactly ONE interview question.

Target role: ${session.targetRole}
Skills: ${session.skills.join(", ")}
Difficulty: ${nextDifficulty}

Rules:
- Make the question relevant to the role.
- Focus on one skill at a time.
- Keep it clear and understandable.
- Do not include the answer.
- Return only the question.
`;

    const response = await generateWithRetry(prompt);

    const questionText = response.text?.trim();

    if (!questionText) {
      throw new Error("Gemini returned an empty question");
    }

    const question = await prisma.question.create({
      data: {
        sessionId: session.id,
        sequence: nextSequence,
        questionText,
        difficulty: nextDifficulty,
        topic: session.skills[0] ?? null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Adaptive interview question generated successfully",
        previousScore: previousScore ?? null,
        nextDifficulty,
        question,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Generate question error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate interview question",
      },
      { status: 500 }
    );
  }
}
