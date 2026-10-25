# Contributing

Start from the current `main` branch and use a short-lived branch named for one change. Keep refactors, behavior changes, and dependency updates in separate commits; do not rewrite published history.

Before opening a PR, review the diff for generated files, credentials, unrelated changes, and storage-format compatibility. Keep lockfiles and intentional fixtures; exclude local data and build output. Explain the reason for the change, the checks actually run, remaining limits, and rollback. Identify self-review honestly; automated checks are not independent review.

## Validation

Use Node.js 24, run `npm ci`, then `npm run check` (format, lint, tests, build). Changes to C teaching examples also need `npm run test:c` with the required C toolchain. Keep the Sandbox entry lazy-loaded and timer cleanup covered by interaction tests.

## Merge and maintenance

Merge only after required checks pass and review conversations are resolved. Prefer squash for a short branch containing work-in-progress commits; retain useful commit history where it explains the change. Delete a merged branch only after checking that no open PR depends on it. Use a revert PR for rollback and update the README when setup or architecture changes.
