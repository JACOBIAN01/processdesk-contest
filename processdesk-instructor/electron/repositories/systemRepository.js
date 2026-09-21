const os = require('node:os');
const si = require('systeminformation');

async function getMemory() {
  return si.mem();
}

async function getFs() {
  return si.fsSize();
}

function getStaticSystemInfo() {
  return {
    hostname: os.hostname(),
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    cpuCount: os.cpus().length,
    uptime: os.uptime(),
  };
}

module.exports = { getMemory, getFs, getStaticSystemInfo };
