# Lesson implementation

A lesson has a goal, prerequisites, an invariant, cost assumptions, a common
mistake, a reasoning question, and one or more bounded examples. The catalog
keeps this teaching content separate from the player.

Each example builds a deterministic trace. A frame holds an explanation, the
matching C line, and the state needed by the diagram: arrays, symbolic memory,
a tree, a grid, or variables. `traceRecorder` copies that state when the frame is
recorded. Earlier frames cannot change when later operations mutate the model.

The player stores only the current lesson, preset, and step. It derives the
visible state from the selected frame. It does not run timers, persist answers,
or evaluate C. Switching lessons or presets mounts a fresh player. Reset clears
the step and the reasoning answer. The original sandbox stays separate and is
loaded when selected.

## Adding an example

1. Choose an operation where intermediate state explains something that a final
   answer cannot. Keep the input small enough to inspect.
2. Write an original C function with clear preconditions. Avoid dereferencing
   invalid storage or relying on unspecified evaluation order.
3. Model meaningful changes in JavaScript. Record actual C statements, or use an
   overview frame for setup and explanatory aggregation. If a call is shown
   before it returns, say so; not every frame is a completed function call.
4. Give tree nodes stable identities independent of their key. Fixed array/grid
   slots represent storage positions, so their identity stays fixed as values move.
5. Add boundary or contrast cases where they expose a different branch.
6. Test results and relevant invariants. Include a C test body that compiles the
   displayed function and asserts its behavior. Optional test preambles may
   supply controlled failure conditions.
7. Check the lesson in the browser, including backward navigation, reset,
   keyboard focus, and a narrow viewport. Keep overflow inside the source pane.

`npm run check` validates the frontend. `npm run test:c` uses a temporary directory,
C11, `-Wall -Wextra -Werror`, and a timeout for each test executable. It removes
its temporary files even on failure. C assertions complement the model tests;
they are not a proof that every intermediate snapshot or every possible input
is correct. Review those separately.

There is no dependency on UCF pages at runtime. References are reading links,
not scraped application data. Keep downloaded source material and planning
notes outside the repository.
