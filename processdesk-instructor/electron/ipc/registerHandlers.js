const { registerProcessHandlers } = require('./processHandlers');
const { registerSystemHandlers } = require('./systemHandlers');
const { registerWindowHandlers } = require('./windowHandlers');

function registerIpcHandlers() {
  registerProcessHandlers();
  registerSystemHandlers();
  registerWindowHandlers();
}

module.exports = { registerIpcHandlers };
