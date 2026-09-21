import { Cpu, Database, HardDrive, Clock3 } from 'lucide-react';
import { formatBytes } from '../../utils/formatBytes.js';
import { formatPercent } from '../../utils/formatPercent.js';

export default function SystemCards({ data }) {
  if (!data) return <div className="cards skeleton">Loading system information…</div>;

  return (
    <section className="cards">
      <article>
        <Cpu />
        <span>CPU Cores</span>
        <strong>{data.cpuCount}</strong>
      </article>
      <article>
        <Database />
        <span>Memory</span>
        <strong>{formatPercent(data.memory.percent)}</strong>
        <small>
          {formatBytes(data.memory.used)} / {formatBytes(data.memory.total)}
        </small>
      </article>
      <article>
        <HardDrive />
        <span>Disk</span>
        <strong>{formatPercent(data.disk.percent)}</strong>
        <small>
          {formatBytes(data.disk.used)} / {formatBytes(data.disk.size)}
        </small>
      </article>
      <article>
        <Clock3 />
        <span>Uptime</span>
        <strong>{Math.floor(data.uptime / 3600)}h</strong>
        <small>{data.hostname}</small>
      </article>
    </section>
  );
}
