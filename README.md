# Data Structures Visualizer

A React and JavaScript study tool for following data structure operations one
step at a time. Insert values into a linked list, push and pop a stack, or follow
a search through a binary search tree. The diagrams change with each operation,
and a short explanation sits beside the corresponding C example.

The app covers linked lists, stacks, queues, binary search trees, bubble sort,
and factorial recursion. It runs entirely in the browser. There are no accounts,
API keys, or server requirements, and refreshing resets the examples.

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
```

This checks formatting, lint, tests, and the production build. The same command
runs in GitHub Actions. Individual commands are `npm run lint`, `npm test`,
`npm run format:check`, and `npm run build`.

Tests cover tree construction, bubble-sort comparisons, insertion/removal,
stack and queue order, tree search, recursion input changes, and timer cleanup.
Animation and layout also need a browser check.

To serve the production build locally:

```sh
npm run build
npm run preview
```

Open [localhost:4173](http://127.0.0.1:4173). The `dist/` directory can be served by
a static host. It is build output and is not committed.

## Source

- `src/App.jsx` contains the topic views and explanations.
- `src/algorithms.js` contains tree construction and the sort comparison step.
- `src/hooks/use-animation-timer.js` cancels animations when a view is reset or closed.
- `src/components/ui.jsx` provides the small button and container components.
- `src/styles.css` and Tailwind supply the styles; Framer Motion animates changes.

The C snippets illustrate the operations; they are not compiled by this app.
The tree is not self-balancing, sorting currently covers only bubble sort, and
recursion shows the call stack growing to the base case rather than return-value
animation. Inputs and examples are intentionally small enough to read on screen.

## License

[MIT](LICENSE).
