
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const TOTAL_REQUESTS = 500;
const BATCH_SIZE = 50;

const timestamp = Date.now();

async function createSession(index) {
  const body = {
    name: `Load Test Student ${index}`,
    email: `loadtest_${timestamp}_${index}@example.com`,
    targetRole: "Software Developer",
    skills: ["JavaScript", "React", "Node.js"],
    difficulty: "MEDIUM",
  };

  const start = Date.now();

  try {
    const response = await fetch(`${BASE_URL}/api/interviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const duration = Date.now() - start;

    return {
      success: response.ok,
      status: response.status,
      duration,
    };
  } catch (error) {
    return {
      success: false,
      status: "NETWORK_ERROR",
      duration: Date.now() - start,
      error: error.message,
    };
  }
}

async function main() {
  console.log("Starting AI Mock Interview API load test");
  console.log(`Target: ${BASE_URL}`);
  console.log(`Total requests: ${TOTAL_REQUESTS}`);
  console.log(`Concurrent requests per batch: ${BATCH_SIZE}`);

  const results = [];
  const overallStart = Date.now();

  for (let start = 0; start < TOTAL_REQUESTS; start += BATCH_SIZE) {
    const end = Math.min(start + BATCH_SIZE, TOTAL_REQUESTS);

    console.log(`Running requests ${start + 1} to ${end}...`);

    const batch = await Promise.all(
      Array.from(
        { length: end - start },
        (_, index) => createSession(start + index + 1)
      )
    );

    results.push(...batch);
  }

  const totalDuration = Date.now() - overallStart;
  const successful = results.filter((item) => item.success);
  const failed = results.filter((item) => !item.success);

  const durations = results
    .map((item) => item.duration)
    .sort((a, b) => a - b);

  const average =
    durations.reduce((sum, value) => sum + value, 0) / durations.length;

  const p95 = durations[Math.ceil(durations.length * 0.95) - 1];

  console.log("\n========== LOAD TEST RESULTS ==========");
  console.log(`Total requests: ${results.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);
  console.log(`Total time: ${(totalDuration / 1000).toFixed(2)} seconds`);
  console.log(`Average response time: ${average.toFixed(2)} ms`);
  console.log(`95th percentile response time: ${p95} ms`);
  console.log(
    `Throughput: ${(results.length / (totalDuration / 1000)).toFixed(2)} requests/second`
  );

  if (failed.length > 0) {
    console.log("\nFailed status codes:");
    console.log(
      failed.reduce((counts, item) => {
        counts[item.status] = (counts[item.status] || 0) + 1;
        return counts;
      }, {})
    );
  }

  console.log("=======================================");
}

main().catch((error) => {
  console.error("Load test failed:", error);
  process.exitCode = 1;
});
