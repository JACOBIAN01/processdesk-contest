import { X, Skull, Square } from 'lucide-react';
import { formatBytes } from '../../utils/formatBytes.js';
import { kbToBytes } from '../../utils/memory.js';

export default function ProcessInspector({ process, onClose, onKill }) {
  if (!process) return null;

  return (
    <aside className="inspector">
      <div className="inspector-head">
        <div>
          <small>Selected process</small>
          <h3>{process.name}</h3>
        </div>
        <button onClick={onClose}>
          <X size={17} />
        </button>
      </div>

      <dl>
        <dt>PID</dt>
        <dd>{process.pid}</dd>
        <dt>User</dt>
        <dd>{process.user}</dd>
        <dt>CPU</dt>
        <dd>{process.cpu.toFixed(1)}%</dd>
        <dt>Memory</dt>
        <dd>{formatBytes(kbToBytes(process.memoryRss))}</dd>
        <dt>State</dt>
        <dd>{process.state}</dd>
        <dt>Parent PID</dt>
        <dd>{process.parentPid}</dd>
        <dt>Path</dt>
        <dd className="path">{process.path || '—'}</dd>
      </dl>

      <div className="danger-actions">
        <button onClick={() => onKill(process.pid, false)}>
          <Square size={15} />
          End process
        </button>
        <button className="danger" onClick={() => onKill(process.pid, true)}>
          <Skull size={15} />
          Force kill
        </button>
      </div>
    </aside>
  );
}
