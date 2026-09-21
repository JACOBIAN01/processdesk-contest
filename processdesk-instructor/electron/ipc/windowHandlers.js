const { ipcMain, BrowserWindow } = require('electron');
const { CHANNELS } = require('./channels');

function senderWindow(event) {
  return BrowserWindow.fromWebContents(event.sender);
}

function registerWindowHandlers() {
  ipcMain.on(CHANNELS.WINDOW_MINIMIZE, (event) => senderWindow(event)?.minimize());
  ipcMain.on(CHANNELS.WINDOW_CLOSE, (event) => senderWindow(event)?.close());
}

module.exports = { registerWindowHandlers };
