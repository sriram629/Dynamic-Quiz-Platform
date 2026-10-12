import {
  buildUrl,
  cleanSettings,
  DEFAULT_SETTINGS,
  emptyAttempt,
  normalizeQuestions,
  quizReducer,
  restoreAttempt,
  summarize,
} from "./quiz";
export const fixture = {
  category: "Entertainment: Film",
  difficulty: "easy",
  type: "multiple",
  question: "Who wrote &quot;A &amp; B&quot;?",
  correct_answer: "A &amp; B",
  incorrect_answers: ["Other", "Third", "Fourth"],
};
const questions = () =>
  normalizeQuestions([fixture, { ...fixture, question: "Second?" }], () => 0.4);
const start = (timed = true) =>
  quizReducer(emptyAttempt, {
    type: "start",
    questions: questions(),
    settings: { ...DEFAULT_SETTINGS, timed },
    id: "test",
    now: 1000,
  });
test("validates counts and omits optional filters", () => {
  expect(
    buildUrl({ number: 5, category: "any", difficulty: "", type: "" }),
  ).toBe("https://opentdb.com/api.php?amount=5");
  [0, 51, 1.5, "", "no"].forEach((number) =>
    expect(() => buildUrl({ number })).toThrow(),
  );
  expect(
    buildUrl(
      { number: 10, category: "18", difficulty: "easy", type: "multiple" },
      "token",
    ),
  ).toContain("category=18&difficulty=easy&type=multiple&token=token");
});
test("decodes text once, preserves literal markup as text, and never mutates the payload", () => {
  const original = JSON.stringify(fixture);
  const q = questions()[0];
  expect(q.question).toBe('Who wrote "A & B"?');
  expect(q.options.find((o) => o.id === q.correctId).text).toBe("A & B");
  expect(JSON.stringify(fixture)).toBe(original);
  expect(
    normalizeQuestions([{ ...fixture, question: "&lt;img src=x&gt;" }])[0]
      .question,
  ).toBe("<img src=x>");
});
test("keeps boolean answers in consistent True / False order", () => {
  const q = normalizeQuestions([
    {
      ...fixture,
      type: "boolean",
      correct_answer: "False",
      incorrect_answers: ["True"],
    },
  ])[0];
  expect(q.options.map((o) => o.text)).toEqual(["True", "False"]);
  expect(q.options.find((o) => o.id === q.correctId).text).toBe("False");
});
test("rejects empty, incomplete, and duplicate question payloads", () => {
  expect(() => normalizeQuestions([])).toThrow();
  expect(() => normalizeQuestions([{ question: "Broken" }])).toThrow();
  expect(() =>
    normalizeQuestions([
      { ...fixture, incorrect_answers: ["A &amp; B", "C", "D"] },
    ]),
  ).toThrow();
});
test("expiry grades the selected ID, duplicate submissions are ignored, and skipping records unanswered", () => {
  let state = start();
  state = quizReducer(state, {
    type: "select",
    id: state.questions[0].correctId,
  });
  state = quizReducer(state, {
    type: "answer",
    index: 0,
    reason: "timeout",
    now: 31000,
  });
  expect(state.answers[0].result).toBe("correct");
  expect(state.answers[0].reason).toBe("timeout");
  expect(quizReducer(state, { type: "answer", index: 0, now: 31000 })).toBe(
    state,
  );
  state = quizReducer(state, {
    type: "answer",
    index: 1,
    skip: true,
    now: 32000,
  });
  expect(state.status).toBe("complete");
  expect(summarize(state)).toEqual({ correct: 1, incorrect: 0, unanswered: 1 });
  expect(quizReducer(state, { type: "answer", index: 2, now: 32001 })).toBe(
    state,
  );
});
test("unselected expiry records unanswered and untimed rounds have no deadline", () => {
  const state = quizReducer(start(), {
    type: "answer",
    index: 0,
    reason: "timeout",
    now: 31000,
  });
  expect(state.answers[0].result).toBe("unanswered");
  expect(start(false).deadline).toBeNull();
});
test("restores valid attempts and safely discards malformed storage", () => {
  const state = start();
  expect(restoreAttempt(state)).toEqual(state);
  [
    null,
    {},
    { ...state, index: 99 },
    { ...state, answers: [null] },
    { ...state, questions: [{}] },
    { ...state, deadline: "bad" },
  ].forEach((value) => expect(restoreAttempt(value)).toEqual(emptyAttempt));
  expect(
    cleanSettings({
      number: -1,
      category: "999",
      difficulty: "impossible",
      timed: false,
    }),
  ).toMatchObject({ number: 10, category: "", difficulty: "", timed: false });
});
