
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateWithRetry } from "@/lib/gemini";
import { z } from "zod";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const reportSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()),
  weakAreas: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export async function POST(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    const session = await prisma.interviewSession.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { sequence: "asc" },
          include: {
            answer: {
              include: {
                evaluation: true,
              },
            },
          },
        },
        report: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Interview session not found" },
        { status: 404 }
      );
    }

    if (session.report) {
      return NextResponse.json({
        success: true,
        message: "Interview report already exists",
        report: session.report,
      });
    }

    if (session.questions.length === 0) {
      return NextResponse.json(
        { success: false, message: "No interview questions found" },
        { status: 400 }
      );
    }

    const incomplete = session.questions.some(
      (question) => !question.answer?.evaluation
    );

    if (incomplete) {
      return NextResponse.json(
        {
          success: false,
          message: "Please answer all questions before generating the report",
        },
        { status: 409 }
      );
    }

    const evaluations = session.questions.map((question) => ({
      question: question.questionText,
      difficulty: question.difficulty,
      answer: question.answer!.answerText,
      correctnessScore: question.answer!.evaluation!.correctnessScore,
      depthScore: question.answer!.evaluation!.depthScore,
      relevanceScore: question.answer!.evaluation!.relevanceScore,
      overallScore: question.answer!.evaluation!.overallScore,
      feedback: question.answer!.evaluation!.feedback,
    }));

    const overallScore =
      evaluations.reduce((total, item) => total + item.overallScore, 0) /
      evaluations.length;

    const prompt = `
You are an expert interview performance analyst.

Prepare a final interview report using the following information.

Target role: ${session.targetRole}
Skills: ${session.skills.join(", ")}

Interview evaluations:
${JSON.stringify(evaluations, null, 2)}

Return ONLY valid JSON with these fields:
{
  "summary": "Overall performance summary",
  "strengths": ["strength 1", "strength 2"],
  "weakAreas": ["weak area 1", "weak area 2"],
  "suggestions": ["suggestion 1", "suggestion 2"]
}

Be specific, constructive and professional.
Do not invent achievements or skills.
`;

    const response = await generateWithRetry(prompt);
    const rawText = response.text?.trim();

    if (!rawText) {
      throw new Error("Gemini returned an empty report");
    }

    const cleanText = rawText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    const parsed = JSON.parse(cleanText);
    const validation = reportSchema.safeParse(parsed);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          message: "AI returned an invalid report format",
        },
        { status: 502 }
      );
    }

    const report = await prisma.$transaction(async (tx) => {
      const createdReport = await tx.interviewReport.create({
        data: {
          sessionId: id,
          overallScore: Number(overallScore.toFixed(2)),
          summary: validation.data.summary,
          strengths: validation.data.strengths,
          weakAreas: validation.data.weakAreas,
          suggestions: validation.data.suggestions,
        },
      });

      await tx.interviewSession.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      return createdReport;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Final interview report generated successfully",
        report,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Generate report error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to generate interview report",
      },
      { status: 500 }
    );
  }
}
