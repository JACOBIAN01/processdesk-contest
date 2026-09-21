# Debugging playbook

1. Reproduce exactly one requirement.
2. Identify the React component that owns the interaction.
3. Trace state into the feature hook.
4. For privileged operations, continue through the renderer service and preload bridge.
5. Verify the IPC channel name and payload shape.
6. Inspect the main-process handler, service, validation, and repository.
7. Fix the smallest responsible layer.
8. Re-test the original behavior and a nearby behavior that could regress.

Do not start by moving code across architectural boundaries.

## Working with Claude in VS Code

- Give Claude one requirement at a time and ask it to *trace* the behavior before editing.
- Ask it to explain the root cause; you will need that sentence for your bug report.
- Refactors are welcome, but run `npm test` and `npm run lint:structure` after every one.
- Never accept a change that touches `contextIsolation`, `nodeIntegration`, or exposes `ipcRenderer`.
