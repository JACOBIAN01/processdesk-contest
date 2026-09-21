const repo = require('../repositories/systemRepository');

function toPercent(part, total) {
  return total ? (part / total) * 100 : 0;
}

// Memory card data in bytes. `percent` is the share of total memory that is in use.
function buildMemorySummary(mem) {
  return {
    total: mem.total,
    used: mem.used,
    free: mem.available,
    percent: toPercent(mem.available, mem.total),
  };
}

function buildDiskSummary(volumes) {
  const disk = volumes?.[0] ?? {};
  return {
    size: disk.size || 0,
    used: disk.used || 0,
    available: disk.available || 0,
    percent: Number(disk.use || 0),
  };
}

async function getSystemSummary() {
  const [mem, volumes] = await Promise.all([repo.getMemory(), repo.getFs()]);
  return {
    ...repo.getStaticSystemInfo(),
    memory: buildMemorySummary(mem),
    disk: buildDiskSummary(volumes),
  };
}

module.exports = { getSystemSummary, buildMemorySummary, buildDiskSummary };
