const { CHANNELS } = require('./channels');
const { handleInvoke } = require('./handleInvoke');
const systemService = require('../services/systemService');

function registerSystemHandlers() {
  handleInvoke(CHANNELS.SYSTEM_SUMMARY, () => systemService.getSystemSummary());
}

module.exports = { registerSystemHandlers };
