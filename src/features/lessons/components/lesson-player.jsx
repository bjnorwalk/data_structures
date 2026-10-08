import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import StateDiagram from "./state-diagram";
function Checkpoint({ question }) {
  const [choice, setChoice] = useState(null);
  return (
    <section className="checkpoint">
      <h3>Check your reasoning</h3>
      <p>{question.prompt}</p>
      <div>
        {question.choices.map((label, i) => (
          <button
            type="button"
            key={label}
            aria-pressed={choice === i}
            onClick={() => setChoice(i)}
          >
            {label}
          </button>
        ))}
      </div>
      {choice !== null && (
        <p role="status">
          <strong>
            {choice === question.answer ? "Correct." : "Look again."}
          </strong>{" "}
          {question.explanation}
        </p>
      )}
    </section>
  );
}
export default function LessonPlayer({ lesson, presetIndex }) {
  const trace = useMemo(
    () => lesson.presets[presetIndex].build(),
    [lesson, presetIndex],
  );
  const [step, setStep] = useState(0);
  const [resetCount, setResetCount] = useState(0);
  const frame = trace.frames[step];
  const codeRef = useRef(null);
  useEffect(() => {
    const container = codeRef.current,
      current = container?.querySelector('[aria-current="step"]');
    if (container && current) {
      const lineTop = current.offsetTop - container.offsetTop;
      if (
        lineTop < container.scrollTop ||
        lineTop + current.offsetHeight >
          container.scrollTop + container.clientHeight
      )
        container.scrollTop = Math.max(0, lineTop - container.clientHeight / 3);
    }
  }, [step]);
  return (
    <>
      <div className="lesson-intro">
        <p>{lesson.objective}</p>
        <p className="prerequisite">
          <strong>Before this lesson:</strong> {lesson.prerequisite}
        </p>
      </div>
      <section className="trace-player" aria-label="C trace player">
        <div className="step-controls">
          <div>
            <button
              type="button"
              aria-label="Previous step"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              <ChevronLeft aria-hidden="true" size={18} />
              <span>Previous</span>
            </button>
            <button
              type="button"
              aria-label="Next step"
              disabled={step === trace.frames.length - 1}
              onClick={() => setStep((s) => s + 1)}
            >
              <span>Next</span>
              <ChevronRight aria-hidden="true" size={18} />
            </button>
            <button
              type="button"
              onClick={() => {
                setStep(0);
                setResetCount((n) => n + 1);
              }}
            >
              <RotateCcw aria-hidden="true" size={15} />
              Reset
            </button>
          </div>
          <span>
            Step {step + 1} / {trace.frames.length}
          </span>
        </div>
        <progress
          value={step + 1}
          max={trace.frames.length}
          aria-label="Lesson progress"
        />
        <p className="step-explanation" role="status" aria-live="polite">
          {frame.explanation}
        </p>
        <div className="trace-columns">
          <section className="visual-state">
            <h3>Visual state</h3>
            <StateDiagram frame={frame} />
          </section>
          <section className="c-example">
            <h3>
              C example{" "}
              <span>{frame.line ? `line ${frame.line}` : "overview"}</span>
            </h3>
            <p className="code-note">
              Original, bounded example. Steps are a model of this code, not a C
              interpreter.
            </p>
            <pre ref={codeRef} tabIndex={0} aria-label="C source code">
              <code>
                {trace.code
                  .split("\n")
                  .map((line, i) => ({ id: `line-${i + 1}`, line, i }))
                  .map(({ id, line, i }) => (
                    <span
                      key={id}
                      className={frame.line === i + 1 ? "executing" : ""}
                      aria-current={frame.line === i + 1 ? "step" : undefined}
                    >
                      <small aria-hidden="true">{i + 1}</small>
                      {line || " "}
                    </span>
                  ))}
              </code>
            </pre>
          </section>
        </div>
      </section>
      <Checkpoint key={resetCount} question={lesson.checkpoint} />
      <section className="lesson-notes">
        <div>
          <h3>What stays true</h3>
          <p>{lesson.invariant}</p>
        </div>
        <div>
          <h3>Cost & assumptions</h3>
          <p>{lesson.complexity}</p>
        </div>
        <div>
          <h3>Common mistake</h3>
          <p>{lesson.mistake}</p>
        </div>
      </section>
    </>
  );
}
