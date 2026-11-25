
"use client";

import { useState } from "react";

type Question = {
  id: string;
  questionText: string;
  difficulty: string;
  sequence: number;
};

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [targetRole, setTargetRole] = useState("Software Developer");
  const [skills, setSkills] = useState("JavaScript, React, Node.js");
  const [difficulty, setDifficulty] = useState("MEDIUM");

  const [sessionId, setSessionId] = useState("");
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<any>(null);
  const [report, setReport] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function apiRequest(url: string, body?: object) {
    const response = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: { "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    const data = await response.json();

    if (!response.ok || data.success === false) {
      throw new Error(data.message || "Something went wrong.");
    }

    return data;
  }

  async function startInterview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const created = await apiRequest("/api/interviews", {
        name,
        email,
        targetRole,
        skills: skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        difficulty,
      });

      const id = created.session.id;
      setSessionId(id);

      const generated = await apiRequest(
        `/api/interviews/${id}/questions`,
        {}
      );

      setQuestion(generated.question);
      setMessage("Your interview has started! Your first AI question is ready.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start interview.");
    } finally {
      setLoading(false);
    }
  }

  async function submitAnswer(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!question || !answer.trim()) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await apiRequest(
        `/api/interviews/${sessionId}/answers`,
        {
          questionId: question.id,
          answerText: answer,
        }
      );

      const resultEvaluation =
        result.evaluation ?? result.answer?.evaluation ?? result;

      setEvaluation(resultEvaluation);
      setMessage("Your answer has been evaluated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to evaluate answer.");
    } finally {
      setLoading(false);
    }
  }

  async function getNextQuestion() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await apiRequest(
        `/api/interviews/${sessionId}/questions`,
        {}
      );

      setQuestion(result.question);
      setAnswer("");
      setEvaluation(null);
      setMessage("Your next adaptive interview question is ready!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate question.");
    } finally {
      setLoading(false);
    }
  }

  async function generateReport() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const result = await apiRequest(
        `/api/interviews/${sessionId}/report`,
        {}
      );

      setReport(result.report ?? result);
      setMessage("Your final performance report is ready!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate report.");
    } finally {
      setLoading(false);
    }
  }

  function startNewInterview() {
    setSessionId("");
    setQuestion(null);
    setAnswer("");
    setEvaluation(null);
    setReport(null);
    setError("");
    setMessage("");
  }

  const score = evaluation?.overallScore;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-indigo-700">
              InterviewAI
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Practice. Improve. Succeed.
            </p>
          </div>
          <span className="rounded-full bg-indigo-100 px-4 py-2 text-sm font-semibold text-indigo-700">
            AI-Powered Mock Interview
          </span>
        </header>

        <section className="mb-8 rounded-3xl bg-gradient-to-r from-indigo-700 to-violet-600 p-7 text-white shadow-lg sm:p-10">
          <p className="text-sm font-medium text-indigo-100">
            Your personal AI interview coach
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            Prepare for your next opportunity.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100">
            Answer AI-generated questions, receive instant feedback,
            experience adaptive difficulty and review your performance.
          </p>
        </section>

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            {message}
          </div>
        )}

        {!sessionId && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-bold">Start a New Interview</h2>
            <p className="mt-2 text-sm text-slate-500">
              Enter your details to create a personalized interview session.
            </p>

            <form onSubmit={startInterview} className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">Full Name</label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Email Address</label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Target Role</label>
                  <input
                    required
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="Software Developer"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">Initial Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-indigo-500"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Skills (separate with commas)
                </label>
                <input
                  required
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="JavaScript, React, Node.js"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500"
                />
              </div>

              <button
                disabled={loading}
                className="w-full rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? "Starting Interview..." : "Start AI Interview"}
              </button>
            </form>
          </section>
        )}

        {sessionId && !report && (
          <section className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">Interview Session</p>
                  <h2 className="text-xl font-bold">{targetRole}</h2>
                </div>
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  In Progress
                </span>
              </div>

              <p className="mt-3 break-all text-xs text-slate-400">
                Session ID: {sessionId}
              </p>
            </div>

            {question && (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-indigo-600">
                    Question {question.sequence}
                  </span>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                    {question.difficulty} Difficulty
                  </span>
                </div>

                <h2 className="mt-5 text-xl font-bold leading-relaxed">
                  {question.questionText}
                </h2>

                {!evaluation ? (
                  <form onSubmit={submitAnswer} className="mt-6 space-y-4">
                    <label className="block text-sm font-semibold">
                      Your Answer
                    </label>
                    <textarea
                      required
                      minLength={1}
                      rows={7}
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full rounded-xl border border-slate-300 p-4 outline-none focus:border-indigo-500"
                    />
                    <button
                      disabled={loading || !answer.trim()}
                      className="w-full rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {loading ? "Evaluating Answer..." : "Submit Answer for AI Evaluation"}
                    </button>
                  </form>
                ) : (
                  <div className="mt-7 space-y-5">
                    <div className="rounded-xl bg-indigo-50 p-5">
                      <p className="text-sm font-semibold text-indigo-700">
                        Overall Score
                      </p>
                      <p className="mt-1 text-4xl font-bold text-indigo-700">
                        {typeof score === "number" ? `${score.toFixed(1)}%` : "Evaluated"}
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        ["Correctness", evaluation.correctnessScore],
                        ["Depth", evaluation.depthScore],
                        ["Relevance", evaluation.relevanceScore],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="rounded-xl bg-slate-50 p-4">
                          <p className="text-sm text-slate-500">{label}</p>
                          <p className="mt-1 text-2xl font-bold">
                            {typeof value === "number" ? `${value}%` : "—"}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div>
                      <h3 className="font-bold">AI Feedback</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {evaluation.feedback || "Evaluation completed."}
                      </p>
                    </div>

                    {Array.isArray(evaluation.strengths) && (
                      <div>
                        <h3 className="font-bold text-green-700">Strengths</h3>
                        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
                          {evaluation.strengths.map((item: string, index: number) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {Array.isArray(evaluation.improvements) && (
                      <div>
                        <h3 className="font-bold text-amber-700">Areas to Improve</h3>
                        <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
                          {evaluation.improvements.map((item: string, index: number) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        onClick={getNextQuestion}
                        disabled={loading}
                        className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {loading ? "Please wait..." : "Next Adaptive Question"}
                      </button>
                      <button
                        onClick={generateReport}
                        disabled={loading}
                        className="rounded-xl border border-indigo-600 px-5 py-3 font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
                      >
                        Generate Final Report
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">
                      Generate your report after answering all questions in this session.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {report && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-sm font-semibold text-indigo-600">
              Interview Completed
            </p>
            <h2 className="mt-2 text-2xl font-bold">Your Performance Report</h2>

            <div className="mt-6 rounded-2xl bg-indigo-50 p-6 text-center">
              <p className="text-sm font-semibold text-indigo-700">Overall Score</p>
              <p className="mt-2 text-5xl font-bold text-indigo-700">
                {typeof report.overallScore === "number"
                  ? `${report.overallScore.toFixed(1)}%`
                  : "—"}
              </p>
            </div>

            <div className="mt-6">
              <h3 className="font-bold">Summary</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {report.summary}
              </p>
            </div>

            {[
              ["Strengths", report.strengths],
              ["Weak Areas", report.weakAreas],
              ["Suggestions", report.suggestions],
            ].map(([heading, items]) => (
              <div key={String(heading)} className="mt-6">
                <h3 className="font-bold">{heading}</h3>
                {Array.isArray(items) ? (
                  <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-600">
                    {items.map((item: string, index: number) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500">No details available.</p>
                )}
              </div>
            ))}

            <button
              onClick={startNewInterview}
              className="mt-8 w-full rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Start Another Interview
            </button>
          </section>
        )}

        <footer className="mt-10 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          © 2026 InterviewAI. Powered by Gemini AI and PostgreSQL.
        </footer>
      </div>
    </main>
  );
}
