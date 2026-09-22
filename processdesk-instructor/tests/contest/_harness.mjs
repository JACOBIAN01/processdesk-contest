// Shared test harness for the contest behavior suite (tests/contest/behavior.spec.mjs).
//
// It gives the spec file three things a plain Node process doesn't have on its own:
//   1. A minimal DOM (via jsdom) so React can render into something.
//   2. A Vite SSR module loader so .jsx files can be imported directly, transformed
//      the same way `npm run dev` transforms them.
//   3. A couple of small DOM helpers for driving inputs/buttons like a real user would.
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { JSDOM } from 'jsdom';

// Properties this process's global scope already owns before we touch it (so
// uninstallDom() can restore exactly what was there, nothing more).
const installedKeys = [];
const overriddenDescriptors = new Map();

// React's DOM event system (the ChangeEventPlugin in particular, which is what
// turns a native "input" event into a controlled <input>'s onChange) inspects
// several ambient globals — HTMLInputElement, Node, and friends — not just
// `window`/`document`. Copying every own property of the jsdom window onto the
// Node global scope (the same approach the `global-jsdom` package uses) is what
// makes that recognition work; wiring up only `window`/`document`/`navigator`
// leaves onChange silently not firing even though the DOM node updates.
//
// Node itself now ships a few WHATWG globals too (Event, EventTarget, fetch,
// crypto, URL, ...). Those must stay the jsdom realm's versions — a same-name
// but different-realm `Event` fails `dispatchEvent`'s instanceof check — but
// Vite (created right after installDom() runs) depends on Node's own fetch/
// crypto/URL, so only the DOM-event constructors are force-overridden here;
// everything else is left alone whenever Node already defines it.
const FORCE_OVERRIDE = ['Event', 'EventTarget', 'CustomEvent'];

export async function installDom() {
  const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/',
  });
  const { window } = dom;

  for (const prop of Object.getOwnPropertyNames(window)) {
    const collides = prop in global;
    if (collides && !FORCE_OVERRIDE.includes(prop)) continue;
    try {
      if (collides) {
        overriddenDescriptors.set(prop, Object.getOwnPropertyDescriptor(global, prop));
      }
      Object.defineProperty(global, prop, {
        get: () => window[prop],
        configurable: true,
      });
      installedKeys.push(prop);
    } catch {
      // Some window properties (e.g. a handful of prototype-only symbols) can't
      // be mirrored as accessors; nothing in this suite needs those.
    }
  }

  // window/document/navigator are also already-existing globals in this Node
  // version, so the loop above skips them — set them explicitly instead.
  for (const [key, value] of [
    ['window', window],
    ['document', window.document],
    ['navigator', window.navigator],
  ]) {
    Object.defineProperty(global, key, { value, configurable: true, writable: true });
    installedKeys.push(key);
  }

  global.IS_REACT_ACT_ENVIRONMENT = true;
  installedKeys.push('IS_REACT_ACT_ENVIRONMENT');
  return dom;
}

export function uninstallDom() {
  for (const key of installedKeys) {
    if (overriddenDescriptors.has(key)) {
      Object.defineProperty(global, key, overriddenDescriptors.get(key));
    } else {
      delete global[key];
    }
  }
  installedKeys.length = 0;
  overriddenDescriptors.clear();
}

// react-dom decides once, the first time it's evaluated, whether the "input"
// event exists on this DOM (`canUseDOM && isEventSupported('input')`) — and if
// not, falls back to an IE8-era polyfill that watches focus/keyup instead of
// "input", which then never sees the events this suite dispatches. Because
// that check runs at module-evaluation time, `react`/`react-dom` must be
// imported *after* installDom() has put a real `document` in place — a static
// top-level `import` would run too early and lock in the polyfill for the
// rest of the process. setupReact() does that ordering for the caller.
export async function setupReact() {
  const [{ default: React }, { default: ReactDOMClient }] = await Promise.all([
    import('react'),
    import('react-dom/client'),
  ]);
  return { React, ReactDOMClient };
}

export async function createModuleServer(root) {
  return createServer({
    root,
    configFile: false,
    plugins: [react()],
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
    logLevel: 'warn',
    ssr: { external: true },
  });
}

// Sets a native input value the way a real keystroke would, so React's change
// detection (which compares against the last value it set) actually fires.
export function typeInto(inputEl, value) {
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(inputEl, value);
  inputEl.dispatchEvent(new window.Event('input', { bubbles: true }));
}

export function click(el) {
  el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
}
