
import { prisma } from "@/lib/prisma";



export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return Response.json({
      success: true,
      message: "PostgreSQL connected successfully",
      database: "ai_mock_interview",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    return Response.json(
      {
        success: false,
        message: "Database connection failed",
      },
      { status: 503 }
    );
  }
}
