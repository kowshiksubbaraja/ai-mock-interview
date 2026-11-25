
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
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
        {
          success: false,
          message: "Interview session not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Interview session retrieved successfully",
      session,
    });
  } catch (error) {
    console.error("Get interview session error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve interview session",
      },
      { status: 500 }
    );
  }
}
