import { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import quizContext from "../../context/quizContext";
import { summarize, categoryName } from "../../lib/quiz";
export default function Scoreboard() {
  const { attempt, goHome, retryQuiz, startQuiz } = useContext(quizContext);
  const [shareMessage, setShareMessage] = useState("");
  const [copyText, setCopyText] = useState("");
  const heading = useRef(null);
  const stats = summarize(attempt);
  const percentage = Math.round(
    (stats.correct / attempt.questions.length) * 100,
  );
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const share = async () => {
    const text = `I scored ${stats.correct}/${attempt.questions.length} (${percentage}%) on ${categoryName(attempt.settings.category)} in Dynamic Quiz. Try a round: ${window.location.origin}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My Dynamic Quiz score", text });
        setShareMessage("Score shared.");
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setShareMessage("Score copied. Paste it wherever you like.");
      } else {
        setCopyText(text);
        setShareMessage("Select and copy your score below.");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        setCopyText(text);
        setShareMessage("Select and copy your score below.");
      }
    }
  };
  return (
    <section className="results-shell">
      <p className="eyebrow">Round complete</p>
      <h1 ref={heading} tabIndex={-1}>
        {percentage >= 80
          ? "Nicely done."
          : percentage >= 50
            ? "Keep that curiosity going."
            : "Every round is a fresh start."}
      </h1>
      <p className="muted">
        {categoryName(attempt.settings.category)} ·{" "}
        {attempt.settings.difficulty || "Mixed difficulty"}
      </p>
      <div className="result-score">
        <strong>
          {percentage}
          <span>%</span>
        </strong>
        <p>
          {stats.correct} of {attempt.questions.length} correct
        </p>
      </div>
      <dl className="score-breakdown">
        <div>
          <dt>Correct</dt>
          <dd>{stats.correct}</dd>
        </div>
        <div>
          <dt>Incorrect</dt>
          <dd>{stats.incorrect}</dd>
        </div>
        <div>
          <dt>Unanswered</dt>
          <dd>{stats.unanswered}</dd>
        </div>
      </dl>
      <div className="results-actions">
        <Link className="button primary" to="/review">
          Review answers <span aria-hidden="true">→</span>
        </Link>
        <button
          className="button secondary"
          onClick={() => startQuiz(attempt.settings)}
        >
          New quiz, same settings
        </button>
        <button className="text-button" onClick={retryQuiz}>
          Retry these questions
        </button>
        <button className="text-button" onClick={share}>
          Share score
        </button>
        <button className="text-button" onClick={goHome}>
          Back to home
        </button>
      </div>
      <p className="share-status" role="status">
        {shareMessage}
      </p>
      {copyText && (
        <textarea
          className="share-copy"
          aria-label="Score to copy"
          readOnly
          value={copyText}
          onFocus={(e) => e.target.select()}
        />
      )}
    </section>
  );
}
