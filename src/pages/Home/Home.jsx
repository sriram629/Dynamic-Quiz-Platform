import { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  FiArrowUpRight,
  FiBookOpen,
  FiCpu,
  FiFilm,
  FiGlobe,
  FiMusic,
  FiAward,
} from "react-icons/fi";
import quizContext from "../../context/quizContext";
import { DEFAULT_SETTINGS } from "../../lib/quiz";
import Form from "../../components/Form/Form";
import QuizPreview from "../../components/QuestionBox/QuizPreview";
import QuizArea from "../QuizArea/QuizArea";
const featured = [
  {
    id: "9",
    name: "General knowledge",
    description: "A little bit of everything",
    icon: FiBookOpen,
  },
  {
    id: "18",
    name: "Computers",
    description: "Think outside the motherboard",
    icon: FiCpu,
  },
  {
    id: "11",
    name: "Film",
    description: "From classics to cult favorites",
    icon: FiFilm,
  },
  {
    id: "22",
    name: "Geography",
    description: "How well do you know the world?",
    icon: FiGlobe,
  },
  {
    id: "12",
    name: "Music",
    description: "Put your music knowledge on repeat",
    icon: FiMusic,
  },
  {
    id: "21",
    name: "Sports",
    description: "Give your knowledge a workout",
    icon: FiAward,
  },
];
export default function Home() {
  const {
    attempt,
    settings,
    setSettings,
    startQuiz,
    loading,
    loadingMessage,
    cancelLoading,
    error,
    setError,
    history,
    clearHistory,
    storageAvailable,
  } = useContext(quizContext);
  const { hash } = useLocation();
  useEffect(() => {
    if (hash && attempt.status === "idle")
      document.getElementById(hash.slice(1))?.scrollIntoView();
  }, [hash, attempt.status]);
  if (loading)
    return (
      <section className="loading-state" aria-busy="true">
        <div className="loading-bars" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <h1>Getting your quiz ready</h1>
        <p role="status">{loadingMessage}</p>
        <button className="button secondary" onClick={cancelLoading}>
          Cancel
        </button>
      </section>
    );
  if (attempt.status !== "idle")
    return (
      <>
        {error && (
          <div className="notice error" role="alert">
            {error}
            <button className="text-button" onClick={() => setError("")}>
              Dismiss
            </button>
          </div>
        )}
        <QuizArea />
      </>
    );
  const chooseCategory = (id) => {
    setSettings((previous) => ({ ...previous, category: id }));
    document.getElementById("build-quiz")?.scrollIntoView();
  };
  return (
    <>
      {error && (
        <div className="notice error" role="alert">
          {error}
          <button className="text-button" onClick={() => setError("")}>
            Dismiss
          </button>
        </div>
      )}
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">A little curiosity goes a long way</p>
          <h1>
            Put your curiosity
            <br className="desktop-break" /> to the test<span>.</span>
          </h1>
          <p className="hero-description">
            Pick a topic, choose your challenge, and find out what you know.
          </p>
          <div className="hero-actions">
            <button
              className="button primary"
              onClick={() =>
                startQuiz({ ...DEFAULT_SETTINGS, sound: settings.sound })
              }
            >
              Quick play · 10 questions <span aria-hidden="true">→</span>
            </button>
            <a className="text-link" href="#build-quiz">
              Build your quiz
            </a>
          </div>
        </div>
        <QuizPreview />
      </section>
      <section className="categories-section" id="categories">
        <div className="section-heading">
          <h2>Follow your interests.</h2>
          <p>Start with a favorite, or surprise yourself with something new.</p>
        </div>
        <div className="category-grid">
          {featured.map(({ id, name, description, icon: Icon }) => (
            <button
              className="category-tile"
              key={id}
              onClick={() => chooseCategory(id)}
            >
              <Icon aria-hidden="true" />
              <span>
                <strong>{name}</strong>
                <small>{description}</small>
              </span>
              <FiArrowUpRight aria-hidden="true" />
            </button>
          ))}
        </div>
        <a className="text-link category-all" href="#build-quiz">
          Explore all 24 categories <span aria-hidden="true">→</span>
        </a>
      </section>
      <section className="builder-section" id="build-quiz">
        <div className="builder-copy">
          <h2>
            Your quiz.
            <br />
            Your kind of challenge.
          </h2>
          <p>
            Five quick questions or a longer round. An easy warm-up or a proper
            head-scratcher. You decide.
          </p>
          <dl className="how-it-works">
            <div>
              <dt>Make it yours</dt>
              <dd>Choose your topic, difficulty, and format.</dd>
            </div>
            <div>
              <dt>Take your shot</dt>
              <dd>Race the clock or switch to untimed practice.</dd>
            </div>
            <div>
              <dt>Learn something new</dt>
              <dd>Review every answer and give it another go.</dd>
            </div>
          </dl>
          <p className="storage-note">
            No account needed. Settings and your last 10 scores stay in this
            browser. Your current round stays in this tab.
          </p>
          {!storageAvailable && (
            <p className="notice" role="status">
              Browser storage is unavailable. You can still play, but progress
              may not be saved.
            </p>
          )}
        </div>
        <Form
          settings={settings}
          setSettings={setSettings}
          onSubmit={startQuiz}
        />
      </section>
      {history.length > 0 && (
        <section className="history-section">
          <div className="history-heading">
            <h2>Your recent rounds</h2>
            <button className="text-button" onClick={clearHistory}>
              Clear history
            </button>
          </div>
          <ul className="history-list">
            {history.map((round) => (
              <li key={round.id}>
                <div>
                  <strong>{round.category}</strong>
                  <small>
                    {new Date(round.completedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </small>
                </div>
                <span>
                  {round.correct} / {round.total} correct
                </span>
                <strong>
                  {Math.round((round.correct / round.total) * 100)}%
                </strong>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
