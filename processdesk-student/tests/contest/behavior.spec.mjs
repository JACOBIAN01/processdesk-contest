// ProcessDesk — contest behavior suite (mocha + chai).
//
// This exercises the app's actual observable behavior (rendering components, driving
// real DOM events, calling hooks through a small React harness) rather than checking
// specific lines of source. Run it after making changes to see which described
// behaviors already work and which still need attention:
//
//   npx mocha tests/contest/behavior.spec.mjs --timeout 20000
//
// (or `npm run test:contest`, added alongside the existing `npm test`).
import { expect } from 'chai';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  installDom,
  uninstallDom,
  createModuleServer,
  setupReact,
  typeInto,
  click,
} from './_harness.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(HERE, '../..');

describe('ProcessDesk — described behavior', function () {
  this.timeout(20000);

  let server;
  let container;
  let root;
  let React;
  let ReactDOMClient;

  before(async () => {
    // jsdom's `document` must exist before react-dom is ever imported — it
    // decides once, at import time, whether native "input" events are usable.
    await installDom();
    ({ React, ReactDOMClient } = await setupReact());
    server = await createModuleServer(PACKAGE_ROOT);
  });

  after(async () => {
    await server.close();
    uninstallDom();
  });

  beforeEach(() => {
    document.body.innerHTML = '<div id="root"></div>';
    container = document.getElementById('root');
    root = ReactDOMClient.createRoot(container);
  });

  afterEach(async () => {
    await React.act(async () => {
      root.unmount();
    });
  });

  // ---------------------------------------------------------------------------------
  // Search box
  // ---------------------------------------------------------------------------------
  describe('the toolbar search field', () => {
    it('reports the text that was actually typed, not the previous value', async () => {
      const { default: ProcessToolbar } = await server.ssrLoadModule(
        '/src/components/toolbar/ProcessToolbar.jsx',
      );
      const reported = [];

      function Harness() {
        const [query, setQueryState] = React.useState('');
        const setQuery = (value) => {
          reported.push(value);
          setQueryState(value);
        };
        return React.createElement(ProcessToolbar, {
          query,
          setQuery,
          paused: false,
          setPaused: () => {},
          refresh: () => {},
          total: 0,
        });
      }

      await React.act(async () => {
        root.render(React.createElement(Harness));
      });

      const input = container.querySelector('input');
      await React.act(async () => {
        typeInto(input, 'node');
      });

      expect(reported, 'value(s) passed to setQuery while typing').to.deep.equal(['node']);
      expect(input.value).to.equal('node');
    });
  });

  // ---------------------------------------------------------------------------------
  // Refresh / Pause buttons
  // ---------------------------------------------------------------------------------
  describe('the toolbar refresh and pause controls', () => {
    async function renderToolbar(props = {}) {
      const { default: ProcessToolbar } = await server.ssrLoadModule(
        '/src/components/toolbar/ProcessToolbar.jsx',
      );
      const calls = { setPaused: [], refresh: 0 };
      const element = React.createElement(ProcessToolbar, {
        query: '',
        setQuery: () => {},
        paused: false,
        setPaused: (v) => calls.setPaused.push(v),
        refresh: () => {
          calls.refresh += 1;
        },
        total: 0,
        ...props,
      });
      await React.act(async () => {
        root.render(element);
      });
      return calls;
    }

    it('fetches a fresh snapshot when the refresh control is used, without touching pause', async () => {
      const calls = await renderToolbar();
      const buttons = [...container.querySelectorAll('button')];
      const refreshButton = buttons.find((b) => b.textContent.includes('Refresh'));

      await React.act(async () => {
        click(refreshButton);
      });

      expect(calls.refresh, 'refresh() invocations').to.equal(1);
      expect(calls.setPaused, 'setPaused() invocations').to.deep.equal([]);
    });

    it('toggles pause when the pause control is used, without fetching a new snapshot', async () => {
      const calls = await renderToolbar();
      const buttons = [...container.querySelectorAll('button')];
      const pauseButton = buttons.find((b) => /Pause|Resume/.test(b.textContent));

      await React.act(async () => {
        click(pauseButton);
      });

      expect(calls.setPaused, 'setPaused() invocations').to.deep.equal([true]);
      expect(calls.refresh, 'refresh() invocations').to.equal(0);
    });
  });

  // ---------------------------------------------------------------------------------
  // Sorting
  // ---------------------------------------------------------------------------------
  describe('column sort order', () => {
    it('alternates direction on repeated clicks of the active column', async () => {
      const { nextSort } = await server.ssrLoadModule('/src/utils/sortState.js');
      const first = nextSort({ key: 'cpu', direction: 'desc' }, 'cpu');
      const second = nextSort(first, 'cpu');
      const third = nextSort(second, 'cpu');

      expect(first.direction).to.equal('asc');
      expect(second.direction).to.equal('desc');
      expect(third.direction).to.equal('asc');
    });

    it('starts a newly clicked column in descending order', async () => {
      const { nextSort } = await server.ssrLoadModule('/src/utils/sortState.js');
      expect(nextSort({ key: 'cpu', direction: 'asc' }, 'name')).to.deep.equal({
        key: 'name',
        direction: 'desc',
      });
    });
  });

  // ---------------------------------------------------------------------------------
  // Process table row — memory units
  // ---------------------------------------------------------------------------------
  describe('a process row', () => {
    it("shows memory in the same units the rest of the app uses for the same figure", async () => {
      const { default: ProcessRow } = await server.ssrLoadModule(
        '/src/components/processes/ProcessRow.jsx',
      );
      const { formatBytes } = await server.ssrLoadModule('/src/utils/formatBytes.js');
      const { kbToBytes } = await server.ssrLoadModule('/src/utils/memory.js');

      const process = {
        pid: 4242,
        name: 'sample',
        user: 'root',
        cpu: 12.3,
        memoryRss: 512000, // kilobytes, as reported by the process provider
        state: 'running',
      };
      const expectedText = formatBytes(kbToBytes(process.memoryRss));

      await React.act(async () => {
        root.render(
          React.createElement(
            'table',
            null,
            React.createElement(
              'tbody',
              null,
              React.createElement(ProcessRow, { process, onSelect: () => {}, selected: false }),
            ),
          ),
        );
      });

      const cells = container.querySelectorAll('td');
      const memoryCell = cells[4];
      expect(memoryCell.textContent).to.equal(expectedText);
    });
  });

  // ---------------------------------------------------------------------------------
  // Automatic polling: cadence + pause gating (two independently observable
  // behaviors, kept as separate cases so a fix to one is visible even if the
  // other still needs work).
  // ---------------------------------------------------------------------------------
  describe('automatic list updates', () => {
    // Renders useProcessStore with setInterval/processApi.list spied on, runs
    // `body` against { listCalls, scheduledDelays, latest, act }, then restores
    // the spies. `latest` is the hook's latest return value (updated on every
    // render via the harness component below).
    async function withPollingHarness(body) {
      const processApiMod = await server.ssrLoadModule('/src/services/processApi.js');
      const listCalls = [];
      const originalList = processApiMod.processApi.list;
      processApiMod.processApi.list = async () => {
        listCalls.push(Date.now());
        return [];
      };

      const scheduledDelays = [];
      const originalSetInterval = global.setInterval;
      const originalClearInterval = global.clearInterval;
      let nextHandle = 1;
      global.setInterval = (fn, delay) => {
        scheduledDelays.push(delay);
        return nextHandle++;
      };
      global.clearInterval = () => {};

      try {
        const { useProcessStore } = await server.ssrLoadModule(
          '/src/features/processes/useProcessStore.js',
        );
        const configuredRefreshMs = 4242;
        let latest;
        function Harness() {
          latest = useProcessStore(configuredRefreshMs);
          return null;
        }

        await React.act(async () => {
          root.render(React.createElement(Harness));
        });
        await React.act(async () => {
          await Promise.resolve();
          await Promise.resolve();
        });

        await body({
          listCalls,
          scheduledDelays,
          configuredRefreshMs,
          getLatest: () => latest,
        });
      } finally {
        processApiMod.processApi.list = originalList;
        global.setInterval = originalSetInterval;
        global.clearInterval = originalClearInterval;
      }
    }

    it('polls on the interval the app was configured with', () =>
      withPollingHarness(({ scheduledDelays, configuredRefreshMs }) => {
        expect(scheduledDelays, 'delay(s) passed to setInterval').to.include(configuredRefreshMs);
        expect(scheduledDelays, 'delay(s) passed to setInterval').to.not.include(20000);
      }));

    it('keeps polling while active and stops as soon as it is paused', () =>
      withPollingHarness(async ({ listCalls, getLatest }) => {
        expect(listCalls.length, 'data fetches while running (not paused)').to.equal(1);

        await React.act(async () => {
          getLatest().setPaused(true);
        });
        await React.act(async () => {
          await Promise.resolve();
        });

        expect(listCalls.length, 'data fetches immediately after pausing').to.equal(1);
      }));
  });

  // ---------------------------------------------------------------------------------
  // Inspector selection
  // ---------------------------------------------------------------------------------
  describe('selecting a process row', () => {
    it('resolves to the matching process in the latest snapshot', async () => {
      const { useSelectedProcess } = await server.ssrLoadModule(
        '/src/features/processes/useSelectedProcess.js',
      );

      const snapshot = [
        { pid: 111, name: 'alpha' },
        { pid: 222, name: 'beta' },
      ];

      let latest;
      function Harness({ snap }) {
        latest = useSelectedProcess(snap);
        return null;
      }

      await React.act(async () => {
        root.render(React.createElement(Harness, { snap: snapshot }));
      });

      await React.act(async () => {
        latest.select({ pid: 222, name: 'beta' });
      });

      expect(latest.selected, 'process resolved after selecting pid 222').to.deep.equal({
        pid: 222,
        name: 'beta',
      });

      // The inspector should keep tracking the same process across new snapshots
      // (matched by identity, not a stale copy taken at click time).
      const updatedSnapshot = [
        { pid: 111, name: 'alpha' },
        { pid: 222, name: 'beta', cpu: 9.9 },
      ];
      await React.act(async () => {
        root.render(React.createElement(Harness, { snap: updatedSnapshot }));
      });

      expect(latest.selected, 'process resolved after the snapshot refreshes').to.deep.equal({
        pid: 222,
        name: 'beta',
        cpu: 9.9,
      });
    });
  });

  // ---------------------------------------------------------------------------------
  // Ending / force-stopping a process
  // ---------------------------------------------------------------------------------
  describe('ending a process from the renderer', () => {
    async function withBridge(run) {
      const calls = [];
      global.window.processDesk = {
        listProcesses: async () => [],
        killProcess: (arg) => calls.push(['killProcess', arg]),
        forceKillProcess: (arg) => calls.push(['forceKillProcess', arg]),
      };
      try {
        const { processApi } = await server.ssrLoadModule('/src/services/processApi.js');
        await run(processApi, calls);
      } finally {
        delete global.window.processDesk;
      }
    }

    it('sends the identifier in the shape the backend contract expects', () =>
      withBridge((processApi, calls) => {
        processApi.kill(4242);
        expect(calls).to.deep.equal([['killProcess', 4242]]);
      }));

    it('uses a distinct, harsher path than the graceful stop', () =>
      withBridge((processApi, calls) => {
        processApi.forceKill(4242);
        expect(calls).to.deep.equal([['forceKillProcess', 4242]]);
      }));
  });

  // ---------------------------------------------------------------------------------
  // System summary — memory card
  // ---------------------------------------------------------------------------------
  describe('the memory summary card', () => {
    it('reports the percentage of memory currently in use, matching the used/total figures', async () => {
      const systemServiceUrl = pathToImportUrl(
        path.join(PACKAGE_ROOT, 'electron/services/systemService.js'),
      );
      const { buildMemorySummary } = await import(systemServiceUrl);

      const summary = buildMemorySummary({ total: 1000, used: 250, available: 750 });
      expect(summary.percent, 'percent').to.equal(25);
      expect(summary.used, 'used').to.equal(250);
      expect(summary.free, 'free').to.equal(750);
      expect(summary.total, 'total').to.equal(1000);
    });
  });
});

function pathToImportUrl(absPath) {
  return new URL(`file://${absPath}`).href;
}
