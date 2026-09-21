import { Pause, Play, RefreshCw, Search } from 'lucide-react';

// Toolbar above the table: search box, live process count, Pause/Resume and Refresh.
export default function ProcessToolbar({ query, setQuery, paused, setPaused, refresh, total }) {
  return (
    <div className="toolbar">
      <div className="search">
        <Search size={16} />
        {/* Search: the table filters as the user types (matches PID, name or user). */}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search PID, process or user…"
        />
      </div>
      <span className="count">{total} processes</span>
      {/* Pause / Resume: switches automatic polling off and on. */}
      <button onClick={() => setPaused(!paused)}>
        {paused ? <Play size={16} /> : <Pause size={16} />} {paused ? 'Resume' : 'Pause'}
      </button>
      {/* Refresh: fetches a new snapshot right away; the pause state stays as it was. */}
      <button onClick={refresh}>
        <RefreshCw size={16} />
        Refresh
      </button>
    </div>
  );
}
