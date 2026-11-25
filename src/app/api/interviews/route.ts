
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Retrieve all interview sessions
export async function GET() {
  try {
    const sessions = await prisma.interviewSession.findMany({
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
      orderBy: {
        startedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Interview sessions retrieved successfully",
      sessions,
    });
  } catch (error) {
    console.error("Get interview sessions error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to retrieve interview sessions",
      },
      { status: 500 }
    );
  }
}

// POST: Create a student and start a new interview
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, email, targetRole, skills, difficulty } = body;

    // Validate required fields
    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      typeof targetRole !== "string" ||
      !targetRole.trim() ||
      !Array.isArray(skills) ||
      skills.length === 0 ||
      !skills.every(
        (skill: unknown) =>
          typeof skill === "string" && skill.trim().length > 0
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide valid name, email, target role and skills.",
        },
        { status: 400 }
      );
    }

    const selectedDifficulty = difficulty ?? "MEDIUM";

    if (
      !["EASY", "MEDIUM", "HARD"].includes(selectedDifficulty)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Difficulty must be EASY, MEDIUM or HARD.",
        },
        { status: 400 }
      );
    }

    // Find existing student or create a new student
    const student = await prisma.student.upsert({
      where: {
        email: email.trim().toLowerCase(),
      },
      update: {
        name: name.trim(),
      },
      create: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
      },
    });

    // Create a separate interview session
    const session = await prisma.interviewSession.create({
      data: {
        studentId: student.id,
        targetRole: targetRole.trim(),
        skills: skills.map((skill: string) => skill.trim()),
        difficulty: selectedDifficulty,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Interview session created successfully",
        student: {
          id: student.id,
          name: student.name,
          email: student.email,
        },
        session,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create interview session error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to create interview session",
      },
      { status: 500 }
    );
  }
}
