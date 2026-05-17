import { describe, expect, it } from "vite-plus/test";
import { runWithConcurrency } from "../src/cli/utils/run-with-concurrency.js";

const sleep = (durationMs: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, durationMs));

describe("runWithConcurrency", () => {
  it("returns results in input order regardless of completion order", async () => {
    const inputs = [60, 10, 40, 20];
    const outputs = await runWithConcurrency(inputs, 3, async (durationMs) => {
      await sleep(durationMs);
      return durationMs;
    });
    expect(outputs).toEqual(inputs);
  });

  it("processes serially when concurrency <= 1", async () => {
    let activeCount = 0;
    let maxActiveCount = 0;
    await runWithConcurrency([1, 1, 1, 1], 1, async () => {
      activeCount += 1;
      maxActiveCount = Math.max(maxActiveCount, activeCount);
      await sleep(2);
      activeCount -= 1;
    });
    expect(maxActiveCount).toBe(1);
  });

  it("never exceeds the requested concurrency window", async () => {
    let activeCount = 0;
    let maxActiveCount = 0;
    await runWithConcurrency([1, 2, 3, 4, 5, 6, 7, 8], 3, async () => {
      activeCount += 1;
      maxActiveCount = Math.max(maxActiveCount, activeCount);
      await sleep(5);
      activeCount -= 1;
    });
    expect(maxActiveCount).toBeLessThanOrEqual(3);
  });

  it("returns an empty array for an empty input list", async () => {
    const outputs = await runWithConcurrency([], 4, async () => "never called");
    expect(outputs).toEqual([]);
  });
});
