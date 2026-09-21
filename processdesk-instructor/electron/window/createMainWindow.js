const path = require('node:path');
const { app, BrowserWindow } = require('electron');
const { APP_CONFIG } = require('../config/appConfig');

function createMainWindow() {
  const win = new BrowserWindow({
    ...APP_CONFIG.window,
    title: APP_CONFIG.appName,
    webPreferences: {
      ...APP_CONFIG.webPreferences,
      preload: path.join(__dirname, '..', 'preload.js'),
    },
  });

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'));
  } else {
    win.loadURL(process.env.VITE_DEV_SERVER_URL || APP_CONFIG.devServerUrl);
  }

  return win;
}

module.exports = { createMainWindow };
