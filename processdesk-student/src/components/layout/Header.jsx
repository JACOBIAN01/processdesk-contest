import { Activity, Minus, X } from 'lucide-react';

export default function Header() {
  return (
    <header className="header">
      <div className="brand">
        <Activity size={19} />
        <span>ProcessDesk</span>
        <span className="badge">LIVE</span>
      </div>
      <div className="window-actions">
        <button onClick={() => window.processDesk?.minimize()}>
          <Minus size={16} />
        </button>
        <button onClick={() => window.processDesk?.close()}>
          <X size={16} />
        </button>
      </div>
    </header>
  );
}
