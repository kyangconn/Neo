import { afterEach, describe, expect, it } from "vitest";
import { generationTaskRunner } from "./generation-task-runner";

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("generationTaskRunner", () => {
  afterEach(() => {
    generationTaskRunner.abortAll();
  });

  it("keeps a task running after the route-like caller stops awaiting it", async () => {
    const pending = deferred<string>();
    const task = generationTaskRunner.startExclusive("route:survives", async () => pending.promise);

    expect(generationTaskRunner.isRunning("route:survives")).toBe(true);

    pending.resolve("done");
    await expect(task).resolves.toBe("done");
    expect(generationTaskRunner.isRunning("route:survives")).toBe(false);
  });

  it("aborts an active task and clears active state", async () => {
    let signal: AbortSignal | null = null;
    const task = generationTaskRunner.startExclusive("abort:one", async (context) => {
      signal = context.signal;
      await new Promise((_resolve, reject) => {
        context.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), {
          once: true,
        });
      });
      return "unreachable";
    });

    await Promise.resolve();
    generationTaskRunner.abort("abort:one");

    expect((signal as AbortSignal | null)?.aborted).toBe(true);
    await expect(task).rejects.toMatchObject({ name: "AbortError" });
    expect(generationTaskRunner.isRunning("abort:one")).toBe(false);
  });

  it("runs only one task per key", async () => {
    let firstSignal: AbortSignal | null = null;
    const first = generationTaskRunner.startExclusive("exclusive:key", async (context) => {
      firstSignal = context.signal;
      await new Promise((_resolve, reject) => {
        context.signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")), {
          once: true,
        });
      });
      return "first";
    });
    await Promise.resolve();

    const second = generationTaskRunner.startExclusive("exclusive:key", async () => "second");

    expect((firstSignal as AbortSignal | null)?.aborted).toBe(true);
    await expect(first).rejects.toMatchObject({ name: "AbortError" });
    await expect(second).resolves.toBe("second");
    expect(generationTaskRunner.isRunning("exclusive:key")).toBe(false);
  });

  it("allows different keys to run independently", async () => {
    const a = deferred<string>();
    const b = deferred<string>();
    const taskA = generationTaskRunner.startExclusive("parallel:a", async () => a.promise);
    const taskB = generationTaskRunner.startExclusive("parallel:b", async () => b.promise);

    expect(generationTaskRunner.isRunning("parallel:a")).toBe(true);
    expect(generationTaskRunner.isRunning("parallel:b")).toBe(true);

    a.resolve("a");
    await expect(taskA).resolves.toBe("a");
    expect(generationTaskRunner.isRunning("parallel:a")).toBe(false);
    expect(generationTaskRunner.isRunning("parallel:b")).toBe(true);

    b.resolve("b");
    await expect(taskB).resolves.toBe("b");
    expect(generationTaskRunner.isRunning("parallel:b")).toBe(false);
  });
});
