const { AppError } = require('../utils/errors');

// A PID crosses the IPC boundary as a bare positive integer. Anything else
// (objects, strings, booleans, negatives) is rejected before touching the OS.
function assertPid(pid) {
  if (!Number.isInteger(pid) || pid <= 0) {
    throw new AppError('Invalid PID', 'INVALID_PID', { received: pid });
  }
  return pid;
}

module.exports = { assertPid };
