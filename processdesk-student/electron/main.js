const { app, BrowserWindow } = require('electron');
const { registerIpcHandlers } = require('./ipc/registerHandlers');
const { createMainWindow } = require('./window/createMainWindow');
const logger = require('./utils/logger');

app.whenReady().then(() => {
  registerIpcHandlers();
  createMainWindow();
  logger.log('main', 'Application ready');

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
