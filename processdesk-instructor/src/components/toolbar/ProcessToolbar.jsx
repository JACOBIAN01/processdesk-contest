import { Pause, Play, RefreshCw, Search } from 'lucide-react';

// Toolbar above the table: search box, live process count, Pause/Resume and Refresh.
export default function ProcessToolbar({ query, setQuery, paused, setPaused, refresh, total }) {
  return (
    <div className="toolbar">
      <div className="search">
        <Search size={16} />
        {/* Search: as the user types, the table should filter down to rows whose PID,
            process name, or user contains the typed text, matching case-insensitively
            so "NODE" and "node" return the same rows. */}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search PID, process or user…"
        />
      </div>
      <span className="count">{total} processes</span>
      {/* Pause / Resume: should toggle automatic polling on and off; while paused, the
          process list must stop changing on its own. */}
      <button onClick={() => setPaused(!paused)}>
        {paused ? <Play size={16} /> : <Pause size={16} />} {paused ? 'Resume' : 'Pause'}
      </button>
      {/* Refresh: should fetch a brand-new process snapshot immediately, independent of
          the timer, and must leave the current Pause/Resume state exactly as it was. */}
      <button onClick={refresh}>
        <RefreshCw size={16} />
        Refresh
      </button>
    </div>
  );
}
