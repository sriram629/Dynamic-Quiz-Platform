import { useContext, useEffect, useRef, useState } from "react";
import quizContext from "../../context/quizContext";
import AnswerOptions from "./AnswerOptions";
import clickAudio from "../../Assets/select-sound.mp3";

export default function QuestionBox() {
  const { attempt, dispatch, settings, setSettings } = useContext(quizContext);
  const question = attempt.questions[attempt.index];
  const [seconds, setSeconds] = useState(() =>
    attempt.deadline
      ? Math.max(0, Math.ceil((attempt.deadline - Date.now()) / 1000))
      : null,
  );
  const heading = useRef(null);
  const audio = useRef(null);
  useEffect(() => {
    heading.current?.focus();
  }, [question.id]);
  useEffect(() => {
    if (!attempt.deadline) return;
    const tick = () => {
      const remaining = Math.max(
        0,
        Math.ceil((attempt.deadline - Date.now()) / 1000),
      );
      setSeconds(remaining);
      if (remaining === 0)
        dispatch({
          type: "answer",
          index: attempt.index,
          reason: "timeout",
          now: Date.now(),
        });
    };
    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [attempt.deadline, attempt.index, dispatch]);
  const select = (id) => {
    if (attempt.deadline && Date.now() >= attempt.deadline) {
      dispatch({
        type: "answer",
        index: attempt.index,
        reason: "timeout",
        now: Date.now(),
      });
      return;
    }
    dispatch({ type: "select", id });
    if (settings.sound) {
      if (!audio.current) audio.current = new Audio(clickAudio);
      audio.current.currentTime = 0;
      audio.current.play()?.catch(() => {});
    }
  };
  const submit = (skip) => {
    const expired = attempt.deadline && Date.now() >= attempt.deadline;
    dispatch({
      type: "answer",
      index: attempt.index,
      skip: expired ? false : skip,
      reason: expired ? "timeout" : skip ? "skipped" : "submitted",
      now: Date.now(),
    });
  };
  return (
    <section className="quiz-shell" aria-label="Current quiz">
      <div className="quiz-toolbar">
        <span>
          Question <strong>{attempt.index + 1}</strong> of{" "}
          {attempt.questions.length}
        </span>
        <button
          className="text-button"
          type="button"
          aria-pressed={settings.sound}
          onClick={() => setSettings({ ...settings, sound: !settings.sound })}
        >
          Sound {settings.sound ? "on" : "off"}
        </button>
      </div>
      <progress
        value={attempt.index}
        max={attempt.questions.length}
        aria-label="Quiz progress"
      />
      <div className="question-panel">
        <div className="question-meta">
          <div className="tag-row">
            <span>{question.category}</span>
            <span className="difficulty">{question.difficulty}</span>
          </div>
          {attempt.deadline ? (
            <span
              className={`timer ${seconds <= 5 ? "urgent" : ""}`}
              role="timer"
              aria-label={`${seconds} seconds remaining`}
            >
              {seconds}s
            </span>
          ) : (
            <span className="muted">Untimed</span>
          )}
        </div>
        <h1 className="question-heading" ref={heading} tabIndex={-1}>
          {question.question}
        </h1>
        <AnswerOptions
          options={question.options}
          selectedId={attempt.selectedId}
          onSelect={select}
        />
        <div className="question-actions">
          <button className="text-button" onClick={() => submit(true)}>
            Skip question
          </button>
          <button
            className="button primary"
            disabled={attempt.selectedId === null}
            onClick={() => submit(false)}
          >
            {attempt.index === attempt.questions.length - 1
              ? "Finish quiz"
              : "Next question"}{" "}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
      <p className="quiz-hint">
        {attempt.deadline
          ? "Your selected answer is submitted when time runs out."
          : "Take your time. Choose an answer, then continue."}
      </p>
    </section>
  );
}
