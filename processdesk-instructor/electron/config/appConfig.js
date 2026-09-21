const APP_CONFIG = Object.freeze({
  appName: 'ProcessDesk',
  processLimit: 200,
  devServerUrl: 'http://127.0.0.1:5173',
  window: Object.freeze({
    width: 1280,
    height: 820,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: '#0b1015',
  }),
  // Security boundary (docs/SECURITY_BOUNDARY.md). Never relax these values.
  webPreferences: Object.freeze({
    contextIsolation: true,
    nodeIntegration: false,
  }),
});

module.exports = { APP_CONFIG };
