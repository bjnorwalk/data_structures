import { useState } from "react";
import { groups, lessons } from "./catalog";
import LessonPlayer from "./components/lesson-player";
export default function GuidedLessons() {
  const [lessonId, setLessonId] = useState(lessons[0].id),
    [presetIndex, setPresetIndex] = useState(0);
  const lesson = lessons.find((l) => l.id === lessonId);
  function select(id) {
    setLessonId(id);
    setPresetIndex(0);
  }
  return (
    <div className="guided-layout">
      <aside className="lesson-sidebar">
        <p className="sidebar-caption">CS1 in C</p>
        <nav aria-label="Lesson topics">
          {groups.map((group, index) => (
            <section key={group}>
              <h2>{group}</h2>
              {lessons
                .filter((l) => l.group === index)
                .map((l) => (
                  <button
                    type="button"
                    key={l.id}
                    aria-current={l.id === lessonId ? "page" : undefined}
                    onClick={() => select(l.id)}
                  >
                    {l.title}
                  </button>
                ))}
            </section>
          ))}
        </nav>
        <a
          href="https://www.cs.ucf.edu/registration/exm/"
          target="_blank"
          rel="noreferrer"
        >
          UCF exam archive ↗
        </a>
      </aside>
      <main id="main-content" className="lesson-main">
        <div className="mobile-lesson-picker">
          <label htmlFor="lesson-picker">Lesson</label>
          <select
            id="lesson-picker"
            value={lessonId}
            onChange={(e) => select(e.target.value)}
          >
            {groups.map((group, index) => (
              <optgroup key={group} label={group}>
                {lessons
                  .filter((l) => l.group === index)
                  .map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </div>
        <header className="lesson-heading">
          <p className="eyebrow">{groups[lesson.group]} / guided trace</p>
          <h1>{lesson.title}</h1>
          <label className="preset-picker">
            Example
            <select
              value={presetIndex}
              onChange={(e) => setPresetIndex(Number(e.target.value))}
            >
              {lesson.presets.map((p, i) => (
                <option key={p.label} value={i}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </header>
        <LessonPlayer
          key={`${lessonId}-${presetIndex}`}
          lesson={lesson}
          presetIndex={presetIndex}
        />
        <footer className="lesson-footer">
          Study one trace, then try a question on paper before checking its
          solution. These lessons support practice; they are not an official UCF
          course or an exam-readiness score.{" "}
          <a
            href="https://www.cs.ucf.edu/~dmarino/ucf/fndexam/FE-ExamOutline.pdf"
            target="_blank"
            rel="noreferrer"
          >
            Foundation Exam outline ↗
          </a>
        </footer>
      </main>
    </div>
  );
}
