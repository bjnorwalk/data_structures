# Data Structures Visualizer

A React and JavaScript study tool for tracing C code one step at a time. Follow
pointer changes, watch recursive calls return, or compare what sorting algorithms
do to the same array. Each guided lesson shows the code beside its current state,
then asks a question about the reasoning behind it.

The lessons follow the main CS1 topics in UCF's published Foundation Exam outline.
They are original examples, not copies of released exam questions. The app runs
in the browser, with no accounts, API keys, or server. Refreshing resets the lesson.

## Study modes

**Guided lessons** let you move forward, go back, and reset a trace. Highlighted C
lines connect each explanation to the code. Diagrams show array slots, symbolic
allocations, tree links, recursive frames, and grid cells. Each lesson includes a
prerequisite, an invariant, cost assumptions, and a common mistake.

Topics include:

- C pointers, aliases, struct ownership, 2D/ragged allocations, and safe `realloc`
- linked lists, expression stacks, and circular/linked queues
- tree traversals, subtree results, BST deletion, and postorder cleanup
- heaps, linear/quadratic probing, chaining, AVL rotations, and tries
- recursive returns, Hanoi, permutations, and flood fill
- binary search, insertion/selection/bubble/merge sort, and quicksort partitioning
- loop counts, recurrence work, timing ratios, base conversion, and bitsets

**Sandbox** preserves the original six interactive demos: linked lists, stacks,
queues, BST insertion/search, bubble sort, and factorial call growth. Use it to
try small inputs after working through a guided example.

See [coverage and study references](docs/study-guide.md) for the topic map and
limitations. These examples support practice; they do not replace the course or
prove readiness for an exam.

## Run locally

Use Node.js 24 and npm.

```sh
git clone https://github.com/bjnorwalk/data_structures.git
cd data_structures
npm ci
npm run dev
```

Open [localhost:5173](http://127.0.0.1:5173). The first install needs an internet
connection; the app itself does not fetch external data.

## Check the project

```sh
npm run check
npm run test:c
```

`check` runs formatting, lint, tests, and the production build. `test:c` also
compiles the guided C examples with C11 warnings treated as errors and runs their
assertions. It requires clang or GCC (`CC` can select the compiler). A C compiler
is not needed to run the website. Both checks run in GitHub Actions.

Tests cover trace replay, boundary cases, tree/heap ordering, recursive results,
sorting, lesson controls, and the original sandbox operations. The C checks test
actual example functions separately from the JavaScript models. The failure path
for `realloc` uses a controlled failing allocator; successful relocation is a
visual scenario, not a promise about the allocator's address choice.

Individual commands are `npm run lint`, `npm test`, `npm run format:check`, and
`npm run build`. To serve the production build locally:

```sh
npm run build
npm run preview
```

Open [localhost:4173](http://127.0.0.1:4173). The `dist/` directory can be served by
a static host. It is build output and is not committed.

## Source

- `src/App.jsx` selects guided lessons or the lazily loaded sandbox.
- `src/features/lessons/catalog.js` defines lesson goals, examples, and questions.
- `src/features/lessons/traces/` contains deterministic models and C examples.
- `src/features/lessons/components/` renders diagrams and the step player.
- `src/Sandbox.jsx` contains the original interactive topic views.
- `src/algorithms.js` and `src/hooks/use-animation-timer.js` support the sandbox.
- `scripts/check-c-examples.js` compiles and exercises the guided C examples.

Trace snapshots are independent copies. Going backward selects an earlier frame;
it does not try to undo a mutation. The browser is not a C interpreter, and memory
labels are symbolic addresses. Examples have small, fixed inputs and stated
preconditions. Some functions are intentionally restricted to keep a particular
operation visible. See [implementation notes](docs/implementation.md) before
adding a lesson.

## License

[MIT](LICENSE).
