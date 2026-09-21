import { Cpu, Info, Settings } from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <nav>
        <button className="active">
          <Cpu />
          Processes
        </button>
        <button>
          <Info />
          System
        </button>
        <button>
          <Settings />
          Settings
        </button>
      </nav>
      <div className="sidebar-foot">ProcessDesk v1.0</div>
    </aside>
  );
}
