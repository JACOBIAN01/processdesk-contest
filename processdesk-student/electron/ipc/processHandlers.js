const { CHANNELS } = require('./channels');
const { handleInvoke } = require('./handleInvoke');
const { APP_CONFIG } = require('../config/appConfig');
const processService = require('../services/processService');

function registerProcessHandlers() {
  handleInvoke(CHANNELS.PROCESSES_LIST, () =>
    processService.listProcesses({ limit: APP_CONFIG.processLimit }),
  );
  handleInvoke(CHANNELS.PROCESSES_KILL, (pid) => processService.killProcess(pid));
  handleInvoke(CHANNELS.PROCESSES_FORCE_KILL, (pid) => processService.forceKillProcess(pid));
}

module.exports = { registerProcessHandlers };
