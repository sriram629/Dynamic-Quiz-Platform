import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import QuizContext from "./quizContext";
import {
  cleanSettings,
  quizReducer,
  restoreAttempt,
  summarize,
  categoryName,
} from "../lib/quiz";
import { loadQuestions } from "../lib/triviaApi";
import { readStored, writeStored, removeStored } from "../lib/storage";

export default function QuizState({ children }) {
  const [settings, setSettings] = useState(() =>
    cleanSettings(readStored("settings", null)),
  );
  const [attempt, dispatch] = useReducer(quizReducer, undefined, () =>
    restoreAttempt(readStored("attempt", null, true)),
  );
  const [history, setHistory] = useState(() => {
    const saved = readStored("history", []);
    return Array.isArray(saved)
      ? saved
          .filter(
            (h) =>
              h &&
              typeof h.id === "string" &&
              typeof h.category === "string" &&
              Number.isFinite(h.completedAt) &&
              Number.isInteger(h.total) &&
              h.total > 0 &&
              Number.isInteger(h.correct) &&
              h.correct >= 0 &&
              h.correct <= h.total,
          )
          .slice(0, 10)
      : [];
  });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(
    "Finding your questions…",
  );
  const [error, setError] = useState("");
  const [storageAvailable, setStorageAvailable] = useState(true);
  const requestRef = useRef(null);

  useEffect(() => {
    setStorageAvailable(writeStored("settings", settings));
  }, [settings]);
  useEffect(() => {
    if (attempt.status === "idle") removeStored("attempt", true);
    else if (!writeStored("attempt", attempt, true)) setStorageAvailable(false);
    if (attempt.status === "complete") {
      setHistory((previous) =>
        previous.some((item) => item.id === attempt.id)
          ? previous
          : [
              {
                id: attempt.id,
                completedAt: attempt.completedAt,
                category: categoryName(attempt.settings.category),
                total: attempt.questions.length,
                ...summarize(attempt),
              },
              ...previous,
            ].slice(0, 10),
      );
    }
  }, [attempt]);
  useEffect(() => {
    if (!writeStored("history", history)) setStorageAvailable(false);
  }, [history]);
  useEffect(() => () => requestRef.current?.abort(), []);

  const startQuiz = useCallback(async (config) => {
    if (requestRef.current) return false;
    const controller = new AbortController();
    requestRef.current = controller;
    setError("");
    setLoading(true);
    setLoadingMessage("Finding your questions…");
    try {
      const questions = await loadQuestions(config, {
        signal: controller.signal,
        onStatus: setLoadingMessage,
      });
      if (controller.signal.aborted) return false;
      const nextSettings = cleanSettings(config);
      setSettings(nextSettings);
      dispatch({
        type: "start",
        questions,
        settings: nextSettings,
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        now: Date.now(),
      });
      window.scrollTo?.(0, 0);
      return true;
    } catch (failure) {
      if (failure.name !== "AbortError") setError(failure.message);
      return false;
    } finally {
      if (requestRef.current === controller) {
        requestRef.current = null;
        setLoading(false);
      }
    }
  }, []);
  const cancelLoading = () => {
    requestRef.current?.abort();
    requestRef.current = null;
    setLoading(false);
    setError("");
  };
  const goHome = () => {
    cancelLoading();
    dispatch({ type: "reset" });
  };
  const retryQuiz = () => {
    setError("");
    dispatch({
      type: "start",
      questions: attempt.questions,
      settings: attempt.settings,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      now: Date.now(),
    });
    window.scrollTo?.(0, 0);
  };
  const clearHistory = () => {
    setHistory([]);
    removeStored("history");
  };
  return (
    <QuizContext.Provider
      value={{
        settings,
        setSettings,
        attempt,
        dispatch,
        startQuiz,
        loading,
        loadingMessage,
        cancelLoading,
        error,
        setError,
        goHome,
        retryQuiz,
        history,
        clearHistory,
        storageAvailable,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}
