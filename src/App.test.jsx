import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "./App";
import { loadQuestions } from "./lib/triviaApi";
import { normalizeQuestions } from "./lib/quiz";
import { readStored, writeStored } from "./lib/storage";
jest.mock("./lib/triviaApi", () => ({ loadQuestions: jest.fn() }));
const data = [
  {
    category: "Books",
    difficulty: "easy",
    type: "multiple",
    question: "Who wrote &quot;A &amp; B&quot;?",
    correct_answer: "A &amp; B",
    incorrect_answers: ["Other", "Third", "Fourth"],
  },
  {
    category: "Science",
    difficulty: "medium",
    type: "boolean",
    question: "The sky is blue?",
    correct_answer: "True",
    incorrect_answers: ["False"],
  },
];
function mount(path = "/") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
async function begin() {
  fireEvent.click(screen.getByRole("button", { name: /Quick play/ }));
  await screen.findByRole("heading", { name: 'Who wrote "A & B"?' });
}
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  loadQuestions.mockReset().mockResolvedValue(normalizeQuestions(data));
});
afterEach(() => jest.useRealTimers());
test("homepage does not fetch on mount; nested answer text grades correctly and review marks only the chosen wrong answer", async () => {
  mount();
  expect(loadQuestions).not.toHaveBeenCalled();
  await begin();
  fireEvent.click(screen.getByText("A & B")); // Click the nested span, not the button wrapper.
  expect(
    screen.getByRole("button", { name: /A & B Selected/ }),
  ).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: /Next question/ }));
  fireEvent.click(screen.getByText("False"));
  fireEvent.click(screen.getByRole("button", { name: /Finish quiz/ }));
  expect(screen.getByText("1 of 2 correct")).toBeInTheDocument();
  expect(readStored("history", [])).toHaveLength(1);
  fireEvent.click(screen.getByRole("link", { name: /Review answers/ }));
  expect(screen.getByText("A & B")).toBeInTheDocument();
  expect(document.querySelectorAll(".answer-option.incorrect")).toHaveLength(1);
  expect(screen.getAllByText(/Correct.*answer/i).length).toBeGreaterThan(0);
});
test("timer expiry records a selected answer then an unanswered question exactly once", async () => {
  jest.useFakeTimers();
  mount();
  await begin();
  fireEvent.click(screen.getByText("A & B"));
  act(() => jest.advanceTimersByTime(30000));
  expect(
    screen.getByRole("heading", { name: "The sky is blue?" }),
  ).toBeInTheDocument();
  act(() => jest.advanceTimersByTime(30000));
  expect(screen.getByText("1 of 2 correct")).toBeInTheDocument();
  expect(readStored("attempt", null, true).answers).toHaveLength(2);
  expect(readStored("attempt", null, true).answers[1].result).toBe(
    "unanswered",
  );
});
test("reload restores the round and choice without a new API request", async () => {
  const first = mount();
  await begin();
  fireEvent.click(screen.getByText("A & B"));
  first.unmount();
  mount();
  expect(
    screen.getByRole("button", { name: /A & B Selected/ }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(loadQuestions).toHaveBeenCalledTimes(1);
});
test("retry uses the same questions; new quiz makes a new request", async () => {
  mount();
  await begin();
  fireEvent.click(screen.getByRole("button", { name: "Skip question" }));
  fireEvent.click(screen.getByRole("button", { name: "Skip question" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Retry these questions" }),
  );
  expect(loadQuestions).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Skip question" }));
  fireEvent.click(screen.getByRole("button", { name: "Skip question" }));
  fireEvent.click(
    screen.getByRole("button", { name: "New quiz, same settings" }),
  );
  await screen.findByRole("heading", { name: 'Who wrote "A & B"?' });
  expect(loadQuestions).toHaveBeenCalledTimes(2);
});
test("API error leaves a usable builder and allows retry", async () => {
  loadQuestions.mockRejectedValueOnce(
    new Error("Not enough questions match those settings."),
  );
  mount();
  fireEvent.click(screen.getByRole("button", { name: /Quick play/ }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Not enough questions",
  );
  expect(screen.getByRole("button", { name: /Start my quiz/ })).toBeEnabled();
  await begin();
});
test("empty review and corrupt storage render safely", () => {
  writeStored("attempt", { status: "complete", questions: [{}] }, true);
  mount("/review");
  expect(
    screen.getByRole("heading", { name: "Your review starts with a quiz." }),
  ).toBeInTheDocument();
});
test("untimed setting persists and no timer appears", async () => {
  mount();
  fireEvent.click(screen.getByLabelText("30 seconds per question"));
  fireEvent.click(screen.getByRole("button", { name: /Start my quiz/ }));
  await screen.findByRole("heading", { name: 'Who wrote "A & B"?' });
  expect(screen.queryByRole("timer")).not.toBeInTheDocument();
  expect(readStored("settings", {}).timed).toBe(false);
});
test("home asks before discarding an active round", async () => {
  mount();
  await begin();
  fireEvent.click(screen.getByRole("link", { name: "Home", exact: true }));
  expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Keep playing" }));
  expect(
    screen.getByRole("heading", { name: 'Who wrote "A & B"?' }),
  ).toBeInTheDocument();
});
test("clear recent scores removes stored history", () => {
  writeStored("history", [
    {
      id: "past",
      category: "Mixed topics",
      completedAt: Date.now(),
      total: 10,
      correct: 7,
    },
  ]);
  mount();
  expect(within(screen.getByRole("list")).getByText("70%")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear history" }));
  expect(readStored("history", [])).toEqual([]);
});

test("score sharing copies a summary when native sharing is unavailable", async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText },
    configurable: true,
  });
  mount();
  await begin();
  fireEvent.click(screen.getByRole("button", { name: "Skip question" }));
  fireEvent.click(screen.getByRole("button", { name: "Skip question" }));
  fireEvent.click(screen.getByRole("button", { name: "Share score" }));
  expect(
    await screen.findByText("Score copied. Paste it wherever you like."),
  ).toBeInTheDocument();
  expect(writeText.mock.calls[0][0]).toContain("0/2 (0%)");
});
test("browser storage failure does not prevent a completed round", async () => {
  const spy = jest
    .spyOn(Storage.prototype, "setItem")
    .mockImplementation(() => {
      throw new Error("Blocked");
    });
  try {
    mount();
    expect(screen.getByText(/Browser storage is unavailable/)).toHaveAttribute("role", "status");
    await begin();
    fireEvent.click(screen.getByRole("button", { name: "Skip question" }));
    fireEvent.click(screen.getByRole("button", { name: "Skip question" }));
    expect(screen.getByText("0 of 2 correct")).toBeInTheDocument();
  } finally {
    spy.mockRestore();
  }
});
test("cancel aborts a pending request and prevents a late result starting a round", async () => {
  let resolve;
  loadQuestions.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  mount();
  fireEvent.click(screen.getByRole("button", { name: /Quick play/ }));
  const signal = loadQuestions.mock.calls[0][1].signal;
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(signal.aborted).toBe(true);
  await act(async () => resolve(normalizeQuestions(data)));
  expect(
    screen.getByRole("button", { name: /Quick play/ }),
  ).toBeInTheDocument();
});
