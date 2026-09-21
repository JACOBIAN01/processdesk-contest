# Data contracts

## Process
```js
{ pid, parentPid, name, command, user, cpu, memory, memoryRss, state, started, path }
```
`cpu` and `memory` are percentages. `memoryRss` is the resident-memory value supplied by the process provider.

## System summary
```js
{ hostname, platform, release, arch, cpuCount, uptime, memory: {total, used, free, percent}, disk: {size, used, available, percent} }
```
System memory and filesystem size values are represented in bytes after they reach the system-summary contract.

## Termination requests
`processes:kill` and `processes:force-kill` each take **one argument: the PID as a positive integer**. They resolve to `{ ok: true, pid }` or reject with an error whose message is shown to the user.
