import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import quizContext from "../../context/quizContext";
import ReviewAnswerBox from "../../components/ReviewAnswerBox/ReviewAnswerBox";
export default function ReviewAnswer() {
  const { attempt } = useContext(quizContext);
  const [filter, setFilter] = useState("all");
  if (attempt.status !== "complete")
    return (
      <section className="empty-state">
        <h1>
          {attempt.status === "playing"
            ? "Your round is still in progress."
            : "Your review starts with a quiz."}
        </h1>
        <p>Finish a round to see every question and its correct answer.</p>
        <Link className="button primary" to="/">
          {attempt.status === "playing" ? "Continue quiz" : "Find a quiz"}
        </Link>
      </section>
    );
  const answers = attempt.answers
    .map((answer, index) => ({
      answer,
      question: attempt.questions[index],
      number: index + 1,
    }))
    .filter(({ answer }) => filter === "all" || answer.result === filter);
  return (
    <section className="review-shell">
      <Link className="text-link" to="/">
        ← Back to results
      </Link>
      <h1>A closer look at your answers.</h1>
      <p className="muted">
        Correct answers are marked. Your choices are labeled separately.
      </p>
      <div className="segmented review-filters" aria-label="Filter answers">
        {["all", "correct", "incorrect", "unanswered"].map((value) => (
          <button
            key={value}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {value}
          </button>
        ))}
      </div>
      {answers.length ? (
        answers.map((item) => (
          <ReviewAnswerBox key={item.question.id} {...item} />
        ))
      ) : (
        <p className="notice" role="status">
          No {filter} answers in this round.
        </p>
      )}
    </section>
  );
}
