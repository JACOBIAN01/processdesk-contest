# Renderer state flow

The process feature (`useProcessStore`) owns the raw snapshot, query, sort state, loading/error state, pause state, and request sequencing. Filtering and sorting are derived from the raw snapshot rather than persisted as separate copies.

- `refresh()` fetches a snapshot immediately and is what the Refresh button calls.
- Automatic polling runs on a timer and honours the pause state.
- When requests overlap, only the most recent one may commit its result.

`useSelectedProcess` holds the selected process identity and resolves it against the latest raw snapshot, so the inspector stays consistent as new snapshots arrive.
