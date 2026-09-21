# Functional requirements

ProcessDesk is a desktop process monitor. It must: list running processes; refresh automatically; search by PID/name/user; sort columns; pause/resume refreshing; manually refresh; show system memory/disk/uptime; select a process; terminate or force-terminate a selected process; keep the UI responsive if a request fails.

## Expected behavior
- Default process sorting: CPU descending.
- Refresh interval: 2 seconds.
- Pausing must stop automatic data replacement.
- Manual refresh must fetch immediately, and must not change the pause state.
- Search is case-insensitive.
- Clicking a sort column toggles direction.
- Ending a process must use its PID.
- Force kill must use the force-termination path.
- The memory card shows used / total memory.
- An older response must never overwrite a newer snapshot.
- The inspector shows the latest values of the selected process, and clears if that process disappears.
- The app must never intentionally terminate itself.
