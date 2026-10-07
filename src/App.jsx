import { lazy, Suspense, useState } from "react";
import GuidedLessons from "./features/lessons/guided-lessons";
const Sandbox = lazy(() => import("./Sandbox"));
export default function App() {
  const [mode, setMode] = useState("guided");
  return (
    <div className="study-app">
      <header className="study-header">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <div>
          <strong>Data Structures</strong>
          <span>C / CS1 study lab</span>
        </div>
        <nav aria-label="Study mode">
          <button
            type="button"
            aria-pressed={mode === "guided"}
            onClick={() => setMode("guided")}
          >
            Guided lessons
          </button>
          <button
            type="button"
            aria-pressed={mode === "sandbox"}
            onClick={() => setMode("sandbox")}
          >
            Sandbox
          </button>
        </nav>
      </header>
      {mode === "guided" ? (
        <GuidedLessons />
      ) : (
        <div id="main-content">
          <Suspense fallback={<p className="loading">Loading sandbox…</p>}>
            <Sandbox />
          </Suspense>
        </div>
      )}
    </div>
  );
}
