import { writeStored } from "./storage";
const fixture = {
  category: "General Knowledge",
  difficulty: "easy",
  type: "boolean",
  question: "Test?",
  correct_answer: "True",
  incorrect_answers: ["False"],
};
let loadQuestions;
const ok = (data) => Promise.resolve({ ok: true, json: async () => data });
beforeEach(() => {
  jest.useFakeTimers();
  jest.resetModules();
  localStorage.clear();
  sessionStorage.clear();
  loadQuestions = require("./triviaApi").loadQuestions;
  global.fetch = jest.fn();
});
afterEach(() => {
  jest.useRealTimers();
  delete global.fetch;
});
const cachedToken = () =>
  writeStored("token", { value: "cached", usedAt: Date.now() }, true);
test("requests a session then exactly one question batch", async () => {
  fetch
    .mockImplementationOnce(() => ok({ response_code: 0, token: "new" }))
    .mockImplementationOnce(() => ok({ response_code: 0, results: [fixture] }));
  const result = await loadQuestions({ number: 1 });
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls[1][0]).toBe(
    "https://opentdb.com/api.php?amount=1&token=new",
  );
  expect(result).toHaveLength(1);
});
test.each([1, 2, 5, 99])(
  "handles API response code %s without treating it as questions",
  async (code) => {
    cachedToken();
    fetch.mockImplementation(() => ok({ response_code: code, results: [] }));
    await expect(loadQuestions({ number: 1 })).rejects.toThrow();
    expect(fetch).toHaveBeenCalledTimes(1);
  },
);
test.each([3, 4])(
  "renews invalid/exhausted token for response %s with rate spacing",
  async (code) => {
    cachedToken();
    fetch
      .mockImplementationOnce(() => ok({ response_code: code }))
      .mockImplementationOnce(() => ok({ response_code: 0, token: "renewed" }))
      .mockImplementationOnce(() =>
        ok({ response_code: 0, results: [fixture] }),
      );
    const result = loadQuestions({ number: 1 });
    for (let i = 0; i < 15; i++) await Promise.resolve();
    expect(fetch).toHaveBeenCalledTimes(2);
    jest.advanceTimersByTime(5100);
    await expect(result).resolves.toHaveLength(1);
    expect(fetch.mock.calls[2][0]).toContain("token=renewed");
  },
);
test("cancels during the rate-limit wait without issuing a request", async () => {
  cachedToken();
  writeStored("last-request", Date.now());
  const controller = new AbortController();
  const result = loadQuestions({ number: 1 }, { signal: controller.signal });
  controller.abort();
  await expect(result).rejects.toMatchObject({ name: "AbortError" });
  expect(fetch).not.toHaveBeenCalled();
});
test("invalid counts fail before networking", async () => {
  await expect(loadQuestions({ number: 51 })).rejects.toThrow("1 to 50");
  expect(fetch).not.toHaveBeenCalled();
});
test("turns network and malformed JSON failures into actionable errors", async () => {
  cachedToken();
  fetch.mockRejectedValue(new TypeError("Failed to fetch"));
  await expect(loadQuestions({ number: 1 })).rejects.toThrow(
    "Check your connection",
  );
});
test("request timeout rejects instead of leaving loading forever", async () => {
  cachedToken();
  fetch.mockImplementation(
    (url, { signal }) =>
      new Promise((resolve, reject) =>
        signal.addEventListener("abort", () =>
          reject(new DOMException("Aborted", "AbortError")),
        ),
      ),
  );
  const result = loadQuestions({ number: 1 });
  const assertion = expect(result).rejects.toThrow("took too long");
  for (let i = 0; i < 5; i++) await Promise.resolve();
  jest.advanceTimersByTime(15000);
  await assertion;
});

test.each([null, [], { unexpected: true }])(
  "rejects malformed response bodies with a readable message",
  async (body) => {
    cachedToken();
    fetch.mockImplementation(() => ok(body));
    await expect(loadQuestions({ number: 1 })).rejects.toThrow(
      "unexpected response",
    );
  },
);
