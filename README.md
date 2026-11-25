
# AI-Powered Adaptive Mock Interview System

An AI-powered mock interview platform that generates technical interview questions, evaluates candidate responses, adapts question difficulty based on performance, and generates personalized interview reports.

## 1. Project Overview

This application simulates a technical interview using Google Gemini AI.

Candidates can participate in an interview based on their target job role and technical skills. The system evaluates each response using three criteria:

- Correctness
- Technical depth
- Relevance

Based on the candidate's previous answer score, the system automatically adjusts the difficulty of the next question.

## 2. Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js 16, React 19 |
| Programming Language | TypeScript |
| AI Integration | Google Gemini API |
| Backend | Next.js API Routes |
| Database | PostgreSQL |
| ORM | Prisma 7 |
| Styling | Tailwind CSS |

## 3. System Architecture

Candidate
    |
    v
Next.js Frontend
    |
    v
Next.js API Routes
    |
    +----------------------+
    |                      |
    v                      v
PostgreSQL Database    Gemini AI
    |                      |
    v                      v
Interview Sessions    Question Generation
Questions             Answer Evaluation
Answers               Adaptive Difficulty
Evaluations           Final Report
Reports
    |
    v
Interview Results

## 4. Core Features

### AI Question Generation

- Generates interview questions using Google Gemini.
- Uses the candidate's target role and skills.
- Supports Easy, Medium and Hard difficulty levels.

### AI Answer Evaluation

Each submitted answer is evaluated using:

- Correctness Score
- Depth Score
- Relevance Score

The overall score is calculated using:

Overall Score =
(Correctness × 0.40) +
(Depth × 0.30) +
(Relevance × 0.30)

### Adaptive Difficulty

The system adjusts the next question based on the previous answer's overall score.

| Previous Score | Next Difficulty |
|---|---|
| 80 or above | HARD |
| 50 to 79.99 | MEDIUM |
| Below 50 | EASY |

### Interview Session Management

- Creates student records.
- Creates individual interview sessions.
- Stores generated questions and answers.
- Tracks interview status.

### AI Performance Report

The final report includes:

- Overall interview score
- Performance summary
- Strengths
- Weak areas
- Improvement suggestions

## 5. Database Design

The application uses PostgreSQL with Prisma ORM.

Main database models:

1. Student
2. InterviewSession
3. Question
4. Answer
5. Evaluation
6. InterviewReport

Relationships:

- One student can have multiple interview sessions.
- One session can contain multiple questions.
- Each question can have one answer.
- Each answer can have one evaluation.
- Each session can have one final report.

## 6. API Documentation

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /api/health/db | Check database connection |
| GET | /api/interviews | Retrieve interview sessions |
| POST | /api/interviews | Create student and interview session |
| GET | /api/interviews/[id] | Retrieve a specific interview |
| POST | /api/interviews/[id]/questions | Generate next question |
| POST | /api/interviews/[id]/answers | Submit and evaluate answer |
| POST | /api/interviews/[id]/report | Generate final report |
| GET | /api/test-gemini | Test Gemini integration |

## 7. Adaptive Question Generation Prompt

The AI receives the following information:

- Candidate's target role
- Technical skills
- Previous interview question
- Previous answer
- Previous evaluation score
- Required difficulty level

The AI generates the next relevant interview question based on the candidate's performance.

## 8. Scalability Considerations

The system is designed with the following considerations for supporting up to 500 concurrent students:

- Stateless API routes to support horizontal scaling.
- PostgreSQL connection pooling.
- Database indexes for frequently queried fields.
- Gemini API retry handling.
- Rate limiting and request throttling.
- Monitoring of API response times and failures.

Actual 500-user capacity must be established through load testing and infrastructure configuration.

## 9. Setup Instructions

### Prerequisites

- Node.js
- PostgreSQL
- Google Gemini API Key

### Installation

Clone the repository:

    git clone YOUR_GITHUB_REPOSITORY_URL

Navigate into the project:

    cd ai-mock-interview

Install dependencies:

    npm install

Configure environment variables in `.env`:

    DATABASE_URL="your_postgresql_connection_string"
    GEMINI_API_KEY="your_gemini_api_key"

Generate Prisma Client:

    npx prisma generate

Run the development server:

    npm run dev

Open:

    http://localhost:3000

## 10. Sample Interview Verification

A sample Software Developer interview was successfully executed.

Verified workflow:

1. Student creation.
2. Interview session creation.
3. Gemini question generation.
4. Answer evaluation.
5. Adaptive difficulty adjustment.
6. Second question generation.
7. Second answer evaluation.
8. Final AI report generation.

Sample session status: COMPLETED

Sample overall score: 76.25 / 100

Adaptive difficulty verification:

MEDIUM → HARD

## 11. Future Enhancements

- Authentication and student dashboards.
- Real-time interview interface.
- Advanced analytics.
- Rate limiting and queue-based AI processing.
- Automated load testing and monitoring.
- Support for additional interview categories.

## 12. Conclusion

The AI-Powered Adaptive Mock Interview System demonstrates how generative AI can be used to simulate technical interviews, evaluate candidate responses, dynamically adjust question difficulty, and provide personalized performance feedback.
