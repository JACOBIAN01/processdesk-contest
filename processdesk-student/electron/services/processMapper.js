// Maps a raw systeminformation process record onto the renderer-facing contract
// documented in docs/DATA_CONTRACTS.md.
function mapProcess(raw) {
  return {
    pid: Number(raw.pid),
    parentPid: Number(raw.parentPid || 0),
    name: raw.name || 'Unknown',
    command: raw.command || '',
    user: raw.user || '—',
    cpu: Number(raw.cpu || 0),
    memory: Number(raw.mem || 0),
    memoryRss: Number(raw.memRss || 0),
    state: raw.state || 'unknown',
    started: raw.started || '',
    path: raw.path || '',
  };
}

module.exports = { mapProcess };
