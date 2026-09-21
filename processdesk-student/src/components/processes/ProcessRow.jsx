import { formatBytes } from '../../utils/formatBytes.js';
import { formatPercent } from '../../utils/formatPercent.js';

// One table row. Sizes are shown in human-readable units (KB / MB / GB).
export default function ProcessRow({ process, onSelect, selected }) {
  return (
    <tr className={selected ? 'selected' : ''} onClick={() => onSelect(process)}>
      <td>{process.pid}</td>
      <td>
        <div className="proc-name">
          {process.name}
          <small>{process.command || 'No command available'}</small>
        </div>
      </td>
      <td>{process.user}</td>
      <td className="num">{formatPercent(process.cpu)}</td>
      {/* Memory column: resident memory of the process, formatted for display. */}
      <td className="num">{formatBytes(process.memoryRss)}</td>
      <td>
        <span className={`state ${String(process.state).toLowerCase()}`}>{process.state}</span>
      </td>
    </tr>
  );
}
