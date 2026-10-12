import AnswerOptions from "../QuestionBox/AnswerOptions";
export default function ReviewAnswerBox({ question, answer, number }) {
  return (
    <article className="review-question">
      <div className="question-meta">
        <span>
          Question {number} · {question.category}
        </span>
        <span className={`review-result ${answer.result}`}>
          {answer.result === "unanswered"
            ? "Unanswered"
            : answer.result === "correct"
              ? "Correct"
              : "Incorrect"}
          {answer.reason === "timeout" ? " (time expired)" : ""}
        </span>
      </div>
      <h2>{question.question}</h2>
      <AnswerOptions
        options={question.options}
        selectedId={answer.selectedId}
        correctId={question.correctId}
        review
      />
    </article>
  );
}
