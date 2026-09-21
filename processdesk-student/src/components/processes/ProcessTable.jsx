import { ChevronDown, ChevronUp } from 'lucide-react';
import ProcessRow from './ProcessRow.jsx';
import EmptyState from '../common/EmptyState.jsx';

const COLUMNS = [
  ['pid', 'PID'],
  ['name', 'Process'],
  ['user', 'User'],
  ['cpu', 'CPU'],
  ['memoryRss', 'Memory'],
  ['state', 'State'],
];

function SortIndicator({ active, direction }) {
  if (!active) return null;
  return direction === 'asc' ? <ChevronUp /> : <ChevronDown />;
}

export default function ProcessTable({ items, sort, toggleSort, selected, onSelect }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {COLUMNS.map(([key, label]) => (
              <th key={key} onClick={() => toggleSort(key)}>
                {label}
                <SortIndicator active={sort.key === key} direction={sort.direction} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((p) => (
            <ProcessRow
              key={p.pid}
              process={p}
              selected={selected?.pid === p.pid}
              onSelect={onSelect}
            />
          ))}
        </tbody>
      </table>
      {items.length === 0 && <EmptyState />}
    </div>
  );
}
