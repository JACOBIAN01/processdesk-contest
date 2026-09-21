# Contributing

Keep renderer code unprivileged, keep IPC contracts narrow, keep data transformation pure where possible, and avoid mixing OS access into React components. Small focused changes are easier to review than architectural rewrites — but refactors that respect the layers in `docs/ARCHITECTURE.md` are welcome.

Before submitting: `npm test` and `npm run lint:structure` must pass, and noisy debug logging must be removed.
