// Access point for the preload-exposed `window.processDesk` API.
// Renderer code must go through this bridge; it never imports Electron or Node.
export function getBridge() {
  if (!window.processDesk) throw new Error('Electron bridge unavailable');
  return window.processDesk;
}
