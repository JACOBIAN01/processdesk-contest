// The process provider reports resident memory (`memoryRss`) in kilobytes.
// Convert with this helper before handing the value to formatBytes.
export function kbToBytes(kilobytes = 0) {
  return Number(kilobytes || 0) * 1024;
}
