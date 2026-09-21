import AppShell from '../components/layout/AppShell.jsx';
import Header from '../components/layout/Header.jsx';
import Sidebar from '../components/layout/Sidebar.jsx';
import SystemCards from '../components/system/SystemCards.jsx';
import ProcessToolbar from '../components/toolbar/ProcessToolbar.jsx';
import ProcessTable from '../components/processes/ProcessTable.jsx';
import ProcessInspector from '../components/processes/ProcessInspector.jsx';
import { useProcessStore } from '../features/processes/useProcessStore.js';
import { useSelectedProcess } from '../features/processes/useSelectedProcess.js';
import { useSystemSummary } from '../features/system/useSystemSummary.js';
import { useDocumentTitle } from '../hooks/useDocumentTitle.js';

export default function App() {
  const processes = useProcessStore();
  const system = useSystemSummary();
  const { selected, select, clear } = useSelectedProcess(processes.snapshot);

  useDocumentTitle(`ProcessDesk · ${processes.total} processes`);

  // Asks for confirmation, terminates the process, then closes the inspector.
  async function handleKill(pid, force) {
    const message = force ? 'Force kill this process?' : 'End this process?';
    if (!window.confirm(message)) return;
    try {
      await processes.kill(pid, force);
      clear();
    } catch (err) {
      window.alert(`Unable to end process: ${err.message}`);
    }
  }

  return (
    <AppShell header={<Header />} sidebar={<Sidebar />}>
      <div className="page">
        <div className="page-title">
          <div>
            <p className="eyebrow">SYSTEM MONITOR</p>
            <h1>Processes</h1>
          </div>
          <div className="host">
            {system.data?.platform} {system.data?.release}
          </div>
        </div>

        <SystemCards data={system.data} />
        {processes.error && <div className="error-banner">{processes.error}</div>}

        <ProcessToolbar
          query={processes.query}
          setQuery={processes.setQuery}
          paused={processes.paused}
          setPaused={processes.setPaused}
          refresh={processes.refresh}
          total={processes.total}
        />

        <div className="workspace">
          <ProcessTable
            items={processes.items}
            sort={processes.sort}
            toggleSort={processes.toggleSort}
            selected={selected}
            onSelect={select}
          />
          <ProcessInspector process={selected} onClose={clear} onKill={handleKill} />
        </div>
      </div>
    </AppShell>
  );
}
