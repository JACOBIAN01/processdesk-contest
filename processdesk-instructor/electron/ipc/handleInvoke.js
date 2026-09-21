const { ipcMain } = require('electron');
const logger = require('../utils/logger');

// Registers an ipcMain.handle channel that logs failures and rethrows them,
// so the renderer's promise still rejects with the original error message.
function handleInvoke(channel, handler) {
  ipcMain.handle(channel, async (_event, ...args) => {
    try {
      return await handler(...args);
    } catch (err) {
      logger.error('ipc', `${channel} failed`, err.message);
      throw err;
    }
  });
}

module.exports = { handleInvoke };
