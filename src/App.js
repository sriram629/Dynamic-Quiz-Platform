import { useEffect, useState } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import NavBar from "./components/NavBar/NavBar";
import QuizState from "./context/QuizState";
import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import ReviewAnswer from "./pages/Review/ReviewAnswer";
import { readStored, writeStored } from "./lib/storage";
function ScrollToPage() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
export default function App() {
  const [theme, setTheme] = useState(() => {
    const saved = readStored("theme", null);
    return ["light", "dark"].includes(saved)
      ? saved
      : window.matchMedia?.("(prefers-color-scheme: light)")?.matches
        ? "light"
        : "dark";
  });
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    writeStored("theme", theme);
  }, [theme]);
  return (
    <QuizState>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <NavBar theme={theme} setTheme={setTheme} />
      <ScrollToPage />
      <main id="main" className="page-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/review" element={<ReviewAnswer />} />
          <Route
            path="*"
            element={
              <section className="empty-state">
                <h1>Page not found</h1>
                <Link to="/" className="button primary">
                  Back to quiz
                </Link>
              </section>
            }
          />
        </Routes>
      </main>
      <footer className="site-footer">
        <span>Stay curious. Keep playing.</span>
        <span>
          Questions by <a href="https://opentdb.com/">Open Trivia DB</a> ·{" "}
          <a href="https://creativecommons.org/licenses/by-sa/4.0/">
            CC BY-SA 4.0
          </a>
        </span>
      </footer>
    </QuizState>
  );
}
