const { contextBridge, ipcRenderer } = require('electron');

// The only privileged surface the renderer can reach. Channel names must match
// electron/ipc/channels.js (enforced by tests/integration/contracts.test.js).
contextBridge.exposeInMainWorld('processDesk', {
  listProcesses: () => ipcRenderer.invoke('processes:list'),
  killProcess: (pid) => ipcRenderer.invoke('processes:kill', pid),
  forceKillProcess: (pid) => ipcRenderer.invoke('processes:force-kill', pid),
  getSystemSummary: () => ipcRenderer.invoke('system:summary'),
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),
});
