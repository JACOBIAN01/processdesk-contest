# Electron security boundary

ProcessDesk keeps `contextIsolation` enabled and `nodeIntegration` disabled (see `webPreferences` in `electron/config/appConfig.js`). React must not receive unrestricted `ipcRenderer`, `fs`, `child_process`, or other Node/Electron primitives. `preload.js` exposes a deliberately narrow API, while the main process validates privileged actions such as terminating a PID.

`npm run lint:structure` and `tests/integration/contracts.test.js` both enforce this boundary.

For the contest, a workaround that disables this boundary is not considered a valid fix — no matter who (or what) wrote the code.
