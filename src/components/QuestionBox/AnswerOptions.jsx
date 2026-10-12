export default function AnswerOptions({
  options,
  selectedId,
  onSelect,
  correctId,
  review = false,
}) {
  return (
    <div
      className="answer-options"
      role={review ? undefined : "group"}
      aria-label={review ? undefined : "Answer options"}
    >
      {options.map((option, index) => {
        const selected = selectedId === option.id;
        const correct = review && correctId === option.id;
        const wrong = review && selected && !correct;
        const className = `answer-option ${selected ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "incorrect" : ""}`;
        const content = (
          <>
            <span className="answer-letter" aria-hidden="true">
              {String.fromCharCode(65 + index)}
            </span>
            <span className="answer-text">{option.text}</span>
            {review && (
              <span className="answer-status">
                {correct
                  ? selected
                    ? "Correct · Your answer"
                    : "Correct answer"
                  : wrong
                    ? "Your answer"
                    : ""}
              </span>
            )}
            {!review && selected && (
              <span className="answer-status">Selected</span>
            )}
          </>
        );
        return review ? (
          <div className={className} key={option.id}>
            {content}
          </div>
        ) : (
          <button
            type="button"
            className={className}
            key={option.id}
            aria-pressed={selected}
            onClick={() => onSelect(option.id)}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}
