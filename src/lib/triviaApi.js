import { buildUrl, normalizeQuestions } from "./quiz";
import { readStored, writeStored, removeStored } from "./storage";
let lastRequest = 0;
function abortError() {
  return new DOMException("Request cancelled", "AbortError");
}
function wait(ms, signal) {
  if (signal?.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", cancel);
      resolve();
    }, ms);
    signal?.addEventListener("abort", cancel, { once: true });
  });
}
async function request(url, signal) {
  const controller = new AbortController();
  const cancel = () => controller.abort();
  signal?.addEventListener("abort", cancel, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(cancel, 15000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok)
      throw new Error(
        "The question service is unavailable. Please try again shortly.",
      );
    const data = await response.json();
    if (
      !data ||
      typeof data !== "object" ||
      Array.isArray(data) ||
      !Number.isInteger(data.response_code)
    ) {
      throw new Error(
        "The question service returned an unexpected response. Please try again.",
      );
    }
    return data;
  } catch (error) {
    if (signal?.aborted) throw abortError();
    if (error.name === "AbortError")
      throw new Error("The question service took too long. Please try again.");
    if (error instanceof TypeError || error instanceof SyntaxError)
      throw new Error(
        "Could not load questions. Check your connection and try again.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", cancel);
  }
}
async function getToken(signal) {
  const stored = readStored("token", null, true);
  if (
    stored &&
    typeof stored.value === "string" &&
    Date.now() - stored.usedAt < 6 * 60 * 60 * 1000
  )
    return stored.value;
  const data = await request(
    "https://opentdb.com/api_token.php?command=request",
    signal,
  );
  if (data.response_code !== 0 || typeof data.token !== "string")
    throw new Error("Could not start a question session. Please try again.");
  writeStored("token", { value: data.token, usedAt: Date.now() }, true);
  return data.token;
}
export async function loadQuestions(
  settings,
  { signal, onStatus = () => {} } = {},
) {
  buildUrl(settings); // Validate before issuing any network requests.
  let token = await getToken(signal);
  for (let attempt = 0; attempt < 2; attempt++) {
    const savedTime = readStored("last-request", 0);
    const storedTime =
      typeof savedTime === "number" && savedTime <= Date.now() ? savedTime : 0;
    const delay = Math.max(
      0,
      5100 - (Date.now() - Math.max(lastRequest, storedTime)),
    );
    if (delay) {
      onStatus(
        "Preparing your next round. The question service needs a brief pause.",
      );
      await wait(delay, signal);
    }
    if (signal?.aborted) throw abortError();
    lastRequest = Date.now();
    writeStored("last-request", lastRequest);
    onStatus("Finding your questions…");
    const data = await request(buildUrl(settings, token), signal);
    if (data.response_code === 0) {
      const questions = normalizeQuestions(data.results);
      if (questions.length !== Number(settings.number))
        throw new Error(
          "The service returned fewer questions than requested. Try a smaller quiz.",
        );
      writeStored("token", { value: token, usedAt: Date.now() }, true);
      return questions;
    }
    if ([3, 4].includes(data.response_code) && attempt === 0) {
      removeStored("token", true);
      onStatus("Refreshing your question pool…");
      token = await getToken(signal);
      continue;
    }
    const errors = {
      1: "Not enough questions match those settings. Choose fewer questions, any difficulty, or another format.",
      2: "Those quiz settings are not supported. Please adjust your choices.",
      3: "Your question session expired. Please try again.",
      4: "You have seen all questions in this pool. Try a different topic.",
      5: "The question service is busy. Wait at least five seconds, then try again.",
    };
    throw new Error(
      errors[data.response_code] ||
        "The question service returned an unexpected response. Please try again.",
    );
  }
}
