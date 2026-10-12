import profilephoto from "../../Assets/profilephoto.jpg";
export default function About() {
  return (
    <section className="about-page">
      <p className="eyebrow">For the endlessly curious</p>
      <h1>
        A small challenge.
        <br />
        Something new to learn.
      </h1>
      <p>
        Dynamic Quiz brings together trivia across 24 categories. Choose a quick
        round, practice without a timer, or challenge yourself with harder
        questions.
      </p>
      <h2>Where the questions come from</h2>
      <p>
        Questions are supplied by{" "}
        <a href="https://opentdb.com/">Open Trivia Database</a>, a
        community-contributed question bank. They are fetched for each new round
        and are not AI-generated. Question data is available under{" "}
        <a href="https://creativecommons.org/licenses/by-sa/4.0/">
          CC BY-SA 4.0
        </a>
        .
      </p>
      <h2>Your progress stays with you</h2>
      <p>
        No account or login is required. This browser remembers your quiz
        preferences, theme, and ten recent scores. Your active round and answer
        review are saved for this tab’s session. You can clear recent scores
        from the homepage or remove all saved data using your browser’s
        site-data controls.
      </p>
      <p>
        Your quiz settings are sent to Open Trivia DB to request questions.
        Scores and answers are not sent to an application server. Session tokens
        help avoid repeated questions until the selected pool is exhausted or
        the session expires.
      </p>
      <div className="creator">
        <img src={profilephoto} alt="Sri Rama Krishna" width="64" height="64" />
        <div>
          <strong>Built by Sri Rama Krishna</strong>
          <span>Frontend Web Developer</span>
        </div>
      </div>
    </section>
  );
}
