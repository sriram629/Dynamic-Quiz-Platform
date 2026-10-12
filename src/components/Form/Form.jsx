import { useState } from "react";
import { categories, categoryName } from "../../lib/quiz";
export default function Form({ settings, setSettings, onSubmit }) {
  const [search, setSearch] = useState("");
  const [custom, setCustom] = useState(
    ![5, 10, 20].includes(Number(settings.number)),
  );
  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );
  const update = (name, value) =>
    setSettings((previous) => ({ ...previous, [name]: value }));
  return (
    <form
      className="quiz-builder"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(settings);
      }}
    >
      <fieldset>
        <legend>Number of questions</legend>
        <div className="segmented count-picker">
          {[5, 10, 20].map((count) => (
            <button
              type="button"
              key={count}
              aria-pressed={!custom && Number(settings.number) === count}
              onClick={() => {
                update("number", count);
                setCustom(false);
              }}
            >
              {count}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={custom}
            onClick={() => setCustom(true)}
          >
            Custom
          </button>
        </div>
        {custom && (
          <div className="field custom-count">
            <label htmlFor="number">Questions (1-50)</label>
            <input
              type="number"
              id="number"
              name="number"
              required
              min="1"
              max="50"
              step="1"
              value={settings.number}
              onChange={(e) => update("number", e.target.value)}
            />
          </div>
        )}
      </fieldset>
      <div className="field">
        <label htmlFor="category-search">Find a category</label>
        <input
          id="category-search"
          type="search"
          placeholder="Search science, music, history…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          value={settings.category}
          onChange={(e) => update("category", e.target.value)}
        >
          <option value="">Any category</option>
          {settings.category &&
            !filtered.some((c) => c.id === settings.category) && (
              <option value={settings.category}>
                {categoryName(settings.category)} (selected)
              </option>
            )}
          {filtered.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {search && (
          <small role="status">{filtered.length} matching categories</small>
        )}
      </div>
      <fieldset>
        <legend>Difficulty</legend>
        <div className="segmented">
          {[
            ["", "Any"],
            ["easy", "Easy"],
            ["medium", "Medium"],
            ["hard", "Hard"],
          ].map(([value, label]) => (
            <button
              type="button"
              key={label}
              aria-pressed={settings.difficulty === value}
              onClick={() => update("difficulty", value)}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="type">Question format</label>
        <select
          name="type"
          id="type"
          value={settings.type}
          onChange={(e) => update("type", e.target.value)}
        >
          <option value="multiple">Multiple choice</option>
          <option value="boolean">True / False</option>
          <option value="">Any format</option>
        </select>
      </div>
      <div className="preference-row">
        <label>
          <input
            type="checkbox"
            checked={settings.timed}
            onChange={(e) => update("timed", e.target.checked)}
          />
          30 seconds per question
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.sound}
            onChange={(e) => update("sound", e.target.checked)}
          />
          Selection sound
        </label>
      </div>
      <div className="builder-summary">
        <span>
          {settings.number || "Choose"} questions ·{" "}
          {settings.timed ? "Timed" : "Untimed"}
        </span>
        <span>{categoryName(settings.category)}</span>
      </div>
      <button className="button primary full-width" type="submit">
        Start my quiz <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
