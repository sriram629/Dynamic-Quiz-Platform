import quizData from "../components/TriviaQuizData";
export const DEFAULT_SETTINGS = {
  number: 10,
  category: "",
  difficulty: "",
  type: "multiple",
  timed: true,
  sound: false,
};
export const categories = quizData.category.map((item) => ({
  name: Object.keys(item)[0],
  id: String(Object.values(item)[0]),
}));
export const categoryName = (id) =>
  categories.find((c) => c.id === id)?.name || "Mixed topics";
export function cleanSettings(value) {
  const data = value && typeof value === "object" ? value : {};
  const number = Number(data.number);
  return {
    number:
      Number.isInteger(number) && number >= 1 && number <= 50 ? number : 10,
    category: categories.some((c) => c.id === String(data.category))
      ? String(data.category)
      : "",
    difficulty: ["easy", "medium", "hard"].includes(data.difficulty)
      ? data.difficulty
      : "",
    type: ["multiple", "boolean", ""].includes(data.type)
      ? data.type
      : "multiple",
    timed: typeof data.timed === "boolean" ? data.timed : true,
    sound: data.sound === true,
  };
}
export function buildUrl(settings, token) {
  const amount = Number(settings.number);
  if (!Number.isInteger(amount) || amount < 1 || amount > 50)
    throw new Error("Choose a whole number from 1 to 50.");
  const params = new URLSearchParams({ amount: String(amount) });
  for (const key of ["category", "difficulty", "type"]) {
    if (settings[key] && settings[key] !== "any")
      params.set(key, settings[key]);
  }
  if (token) params.set("token", token);
  return `https://opentdb.com/api.php?${params}`;
}
export function decodeText(text) {
  const element = document.createElement("textarea");
  element.innerHTML = text;
  return element.value;
}
export function normalizeQuestions(results, random = Math.random) {
  if (!Array.isArray(results) || !results.length)
    throw new Error(
      "No questions matched. Try fewer questions or broader filters.",
    );
  return results.map((item, index) => {
    if (
      !item ||
      typeof item.question !== "string" ||
      typeof item.correct_answer !== "string" ||
      typeof item.category !== "string" ||
      !["easy", "medium", "hard"].includes(item.difficulty) ||
      !["multiple", "boolean"].includes(item.type) ||
      !Array.isArray(item.incorrect_answers) ||
      item.incorrect_answers.length !== (item.type === "boolean" ? 1 : 3) ||
      item.incorrect_answers.some((answer) => typeof answer !== "string")
    ) {
      throw new Error(
        "The question service returned incomplete data. Please try again.",
      );
    }
    const answers = [item.correct_answer, ...item.incorrect_answers].map(
      decodeText,
    );
    if (new Set(answers).size !== answers.length)
      throw new Error(
        "The question service returned duplicate options. Please try again.",
      );
    const options = answers.map((text, i) => ({ id: `${index}-${i}`, text }));
    if (item.type === "boolean")
      options.sort((a, b) => b.text.localeCompare(a.text));
    else
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
    return {
      id: String(index),
      question: decodeText(item.question),
      category: decodeText(item.category),
      difficulty: item.difficulty,
      options,
      correctId: `${index}-0`,
    };
  });
}
export const emptyAttempt = {
  status: "idle",
  questions: [],
  answers: [],
  index: 0,
  selectedId: null,
  deadline: null,
};
export function quizReducer(state, action) {
  switch (action.type) {
    case "start":
      return {
        ...emptyAttempt,
        status: "playing",
        id: action.id,
        settings: action.settings,
        questions: action.questions,
        deadline: action.settings.timed ? action.now + 30000 : null,
      };
    case "select":
      return state.status === "playing" &&
        state.questions[state.index].options.some((o) => o.id === action.id)
        ? { ...state, selectedId: action.id }
        : state;
    case "answer": {
      if (state.status !== "playing" || action.index !== state.index)
        return state;
      const question = state.questions[state.index];
      const selectedId = action.skip ? null : state.selectedId;
      const answer = {
        questionId: question.id,
        selectedId,
        reason: action.reason || "submitted",
        result:
          selectedId === null
            ? "unanswered"
            : selectedId === question.correctId
              ? "correct"
              : "incorrect",
      };
      const index = state.index + 1;
      return {
        ...state,
        answers: [...state.answers, answer],
        index,
        selectedId: null,
        status: index === state.questions.length ? "complete" : "playing",
        deadline: state.settings.timed ? action.now + 30000 : null,
        completedAt: index === state.questions.length ? action.now : null,
      };
    }
    case "reset":
      return emptyAttempt;
    default:
      return state;
  }
}
export function summarize(attempt) {
  return attempt.answers.reduce(
    (totals, answer) => ({
      ...totals,
      [answer.result]: totals[answer.result] + 1,
    }),
    { correct: 0, incorrect: 0, unanswered: 0 },
  );
}
// Browser storage is untrusted and may contain an older app version.
export function restoreAttempt(value) {
  if (
    !value ||
    !["playing", "complete"].includes(value.status) ||
    typeof value.id !== "string" ||
    !Array.isArray(value.questions) ||
    !value.questions.length ||
    value.questions.length > 50 ||
    !Array.isArray(value.answers) ||
    !Number.isInteger(value.index) ||
    value.index < 0 ||
    value.index > value.questions.length ||
    value.answers.length !== value.index
  )
    return emptyAttempt;
  const validQuestions = value.questions.every(
    (q) =>
      q &&
      typeof q.id === "string" &&
      typeof q.question === "string" &&
      typeof q.category === "string" &&
      typeof q.difficulty === "string" &&
      Array.isArray(q.options) &&
      [2, 4].includes(q.options.length) &&
      q.options.every(
        (o) => o && typeof o.id === "string" && typeof o.text === "string",
      ) &&
      q.options.some((o) => o.id === q.correctId),
  );
  if (
    !validQuestions ||
    !value.settings ||
    typeof value.settings.timed !== "boolean" ||
    (value.settings.timed && !Number.isFinite(value.deadline)) ||
    (value.status === "complete"
      ? value.index !== value.questions.length ||
        !Number.isFinite(value.completedAt)
      : value.index >= value.questions.length)
  )
    return emptyAttempt;
  if (
    !value.answers.every(
      (a, i) =>
        a &&
        a.questionId === value.questions[i].id &&
        ["correct", "incorrect", "unanswered"].includes(a.result) &&
        (a.selectedId === null ||
          value.questions[i].options.some((o) => o.id === a.selectedId)),
    )
  )
    return emptyAttempt;
  if (
    value.selectedId !== null &&
    !value.questions[value.index]?.options.some(
      (o) => o.id === value.selectedId,
    )
  )
    return emptyAttempt;
  return { ...value, settings: cleanSettings(value.settings) };
}
