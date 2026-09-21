const repo = require('../repositories/processRepository');
const { mapProcess } = require('./processMapper');
const { assertPid } = require('../validators/processValidator');
const { AppError } = require('../utils/errors');

const SIGNALS = Object.freeze({
  graceful: 'SIGTERM',
  force: 'SIGKILL',
});

// Busiest processes first, so the row limit never hides the interesting ones.
async function listProcesses({ limit = 200 } = {}) {
  const raw = await repo.getProcessSnapshot();
  return raw
    .map(mapProcess)
    .sort((a, b) => b.cpu - a.cpu)
    .slice(0, limit);
}

function assertNotSelf(pid) {
  if (pid === process.pid) {
    throw new AppError('ProcessDesk cannot terminate its own main process.', 'SELF_TERMINATION', {
      pid,
    });
  }
}

function toTerminationError(err, pid) {
  if (err.code === 'ESRCH')
    return new AppError('Process no longer exists.', 'NO_SUCH_PROCESS', { pid });
  if (err.code === 'EPERM') return new AppError('Permission denied.', 'PERMISSION_DENIED', { pid });
  return err;
}

function terminate(pid, signal) {
  const safePid = assertPid(pid);
  assertNotSelf(safePid);
  try {
    process.kill(safePid, signal);
  } catch (err) {
    throw toTerminationError(err, safePid);
  }
  return { ok: true, pid: safePid };
}

async function killProcess(pid) {
  return terminate(pid, SIGNALS.graceful);
}

async function forceKillProcess(pid) {
  return terminate(pid, SIGNALS.force);
}

module.exports = { listProcesses, killProcess, forceKillProcess };
