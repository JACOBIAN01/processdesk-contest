function log(scope, message, meta) {
  console.log(`[${new Date().toISOString()}] [${scope}] ${message}`, meta ?? '');
}

function error(scope, message, detail) {
  console.error(`[${new Date().toISOString()}] [${scope}] ${message}`, detail ?? '');
}

module.exports = { log, error };
