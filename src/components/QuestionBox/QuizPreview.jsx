import { useState } from "react";
import AnswerOptions from "./AnswerOptions";
const options = [
  { id: "venus", text: "Venus" },
  { id: "mars", text: "Mars" },
  { id: "jupiter", text: "Jupiter" },
  { id: "saturn", text: "Saturn" },
];
export default function QuizPreview() {
  const [answer, setAnswer] = useState(null);
  return (
    <div className="quiz-preview">
      <div className="preview-heading">
        <span>Try a sample question</span>
        <span>Science & nature</span>
      </div>
      <h2>Which planet is known as the Red Planet?</h2>
      <AnswerOptions
        options={options}
        selectedId={answer}
        onSelect={setAnswer}
        correctId="mars"
        review={answer !== null}
      />
      <div className="preview-feedback" role="status">
        {answer ? (
          <>
            <span>
              {answer === "mars"
                ? "You got it! Mars is the Red Planet."
                : "It’s Mars. Ready for another challenge?"}
            </span>
            <button className="text-button" onClick={() => setAnswer(null)}>
              Try again
            </button>
          </>
        ) : (
          "Pick an answer to see how it works."
        )}
      </div>
    </div>
  );
}
