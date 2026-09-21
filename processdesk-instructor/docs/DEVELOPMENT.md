# Development

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

`npm run dev` starts Vite and Electron together. Production renderer assets can be created with `npm run build`; `npm start` is intended for an Electron launch when a renderer URL/build is available.

## Checks

```bash
npm test                  # unit + integration tests (pure Node, no Electron needed)
npm run lint:structure    # required files, security preferences, renderer import rules
```

Useful diagnostics: Electron main-process logs appear in the terminal. Renderer logs appear in DevTools. Follow the architecture from UI → feature hook → renderer service → preload → IPC handler → domain service → repository.
