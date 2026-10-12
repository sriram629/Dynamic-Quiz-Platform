import { useContext } from "react";
import quizContext from "../../context/quizContext";
import QuestionBox from "../../components/QuestionBox/QuestionBox";
import Scoreboard from "../ScoreBoard/Scoreboard";
export default function QuizArea() {
  const { attempt } = useContext(quizContext);
  return attempt.status === "complete" ? (
    <Scoreboard />
  ) : (
    <QuestionBox key={`${attempt.id}-${attempt.index}`} />
  );
}
