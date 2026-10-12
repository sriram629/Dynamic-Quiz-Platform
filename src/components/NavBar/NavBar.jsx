import { useContext, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FiMoon, FiSun } from "react-icons/fi";
import quizContext from "../../context/quizContext";
import logo from "../../Assets/logo.png";
export default function NavBar({ theme, setTheme }) {
  const { attempt, goHome, loading, cancelLoading } = useContext(quizContext);
  const [destination, setDestination] = useState(null);
  const navigate = useNavigate();
  const home = (e, path = "/") => {
    e.preventDefault();
    if (attempt.status === "playing") {
      setDestination(path);
      return;
    }
    goHome();
    navigate(path);
  };
  const leave = () => {
    goHome();
    navigate(destination);
    setDestination(null);
  };
  return (
    <>
      <header className="site-header">
        <div className="nav-inner">
          <Link to="/" onClick={home} className="brand">
            <img src={logo} width="38" height="38" alt="" />
            <span>
              Dynamic<span className="brand-light">Quiz</span>
            </span>
          </Link>
          <nav aria-label="Main navigation">
            <NavLink to="/" onClick={home}>
              Home
            </NavLink>
            <Link
              className="categories-nav"
              to="/#categories"
              onClick={(e) => home(e, "/#categories")}
            >
              Categories
            </Link>
            <NavLink
              to="/about"
              onClick={() => {
                if (loading) cancelLoading();
              }}
            >
              About
            </NavLink>
          </nav>
          <button
            className="theme-button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? (
              <FiSun aria-hidden="true" />
            ) : (
              <FiMoon aria-hidden="true" />
            )}
          </button>
        </div>
      </header>
      {destination !== null && (
        <div
          className="leave-prompt"
          role="alertdialog"
          aria-modal="false"
          aria-labelledby="leave-title"
        >
          <h2 id="leave-title">Leave this round?</h2>
          <p>This will discard your current round.</p>
          <div className="hero-actions">
            <button
              autoFocus
              className="button secondary"
              onClick={() => setDestination(null)}
            >
              Keep playing
            </button>
            <button className="button primary" onClick={leave}>
              Leave round
            </button>
          </div>
        </div>
      )}
    </>
  );
}
