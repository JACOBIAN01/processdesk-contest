const si = require('systeminformation');

async function getProcessSnapshot() {
  const data = await si.processes();
  return data.list || [];
}

module.exports = { getProcessSnapshot };
