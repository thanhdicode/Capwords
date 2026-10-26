import test from "node:test";
import assert from "node:assert/strict";
import { RecognitionTask } from "../src/domain/recognitionTask";
import { recognize } from "../src/services/recognition";

test("navigation cancellation aborts and invalidates the active recognition request", () => {
  const task = new RecognitionTask();
  const request = task.start();
  assert.equal(task.isCurrent(request), true);
  assert.equal(task.cancel(), true);
  assert.equal(request.signal.aborted, true);
  assert.equal(task.isCurrent(request), false);
  assert.equal(task.complete(request), false);
  assert.equal(task.cancel(), false);
});

test("only the newest request can deliver a result after retries overlap", () => {
  const task = new RecognitionTask();
  const first = task.start();
  const second = task.start();
  assert.equal(first.signal.aborted, true);
  assert.equal(task.isCurrent(first), false);
  assert.equal(task.isCurrent(second), true);
  assert.equal(task.complete(first), false);
  assert.equal(task.isCurrent(second), true);
  assert.equal(task.complete(second), true);
  assert.equal(task.isCurrent(second), false);
});

test("navigation abort is forwarded to provider fetch and not shown as a recognition error", async () => {
  const previousEndpoint = process.env.EXPO_PUBLIC_RECOGNITION_ENDPOINT;
  const previousFetch = global.fetch;
  process.env.EXPO_PUBLIC_RECOGNITION_ENDPOINT =
    "https://capwords-recognition-worker.capwords-1suen5.workers.dev/recognize";
  let requestSignal: AbortSignal | null | undefined;
  global.fetch = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    requestSignal = init?.signal;
    return await new Promise<Response>((_resolve, reject) => {
      if (init?.signal?.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      init?.signal?.addEventListener(
        "abort",
        () => reject(new DOMException("Aborted", "AbortError")),
        { once: true },
      );
    });
  }) as typeof fetch;
  const task = new RecognitionTask();
  const request = task.start();
  try {
    const pending = recognize(
      { uri: "file:///photo.jpg", base64: "cGhvdG8=", mimeType: "image/jpeg" },
      "fr",
      false,
      request.signal,
    );
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(task.cancel(), true);
    assert.equal(requestSignal?.aborted, true);
    await assert.rejects(pending, { name: "AbortError" });
    assert.equal(task.isCurrent(request), false);
  } finally {
    if (previousEndpoint === undefined)
      delete process.env.EXPO_PUBLIC_RECOGNITION_ENDPOINT;
    else process.env.EXPO_PUBLIC_RECOGNITION_ENDPOINT = previousEndpoint;
    global.fetch = previousFetch;
  }
});
