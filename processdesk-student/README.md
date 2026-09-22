# ProcessDesk — Contest Question Paper

Welcome! This paper explains what the app is supposed to do and what you need to fix.

**Time you have:** 60 minutes.

**Can you use AI ?** Yes . You can also use Google, documentation, or anything else you'd normally use. This is an open-book test.

---

## 1. What is ProcessDesk?

ProcessDesk is a small desktop app — think of it like a simpler version of Task Manager (Windows) or Activity Monitor (Mac). It shows you every program currently running on your computer (each one is called a "process"), and lets you look at, search, sort, and stop them.

It's built with Electron (a way to build desktop apps using web technology) and React (a way to build the on-screen interface). You don't need to know these tools deeply — you just need to read the code, find what's broken, and fix it so the app behaves the way this paper describes.

---

## 2. What Should Happen When Everything Works (walk-through)

Read this section like a story of a normal, correct use of the app. Everything described here is what the app is *supposed* to do. Right now, several parts of this story don't actually happen this way in the running app — it's your job to notice where the app disagrees with this description, and fix it so it matches again.

**When you open the app:**
You see a table listing every running process on the computer. Each row shows: the process's ID number (PID), its name, which user owns it, how much CPU it's using (as a %), how much memory it's using, and its current state (like "running" or "sleeping"). At the top of the screen, four small cards show a quick summary of the whole computer: how many CPU cores it has, how much memory is used out of the total, how much disk space is used out of the total, and how long the computer has been running (uptime).

**The list keeps itself up to date automatically:**
You don't need to do anything — the table quietly refreshes itself every 2 seconds, so the CPU and memory numbers you see are always close to real time. By default, the table is sorted so the process using the most CPU is at the top.

**Searching:**
There's a search box above the table. As soon as you start typing, the table should immediately narrow down to only the rows that match what you typed. You can type a process's ID number, part of its name, or the user who owns it, and it should find matches. It doesn't matter if you type in capital or small letters — searching for "chrome" and "CHROME" should give you the exact same results.

**Sorting:**
Every column header (PID, Process, User, CPU, Memory, State) can be clicked to sort the table by that column. The first time you click a column, it sorts from highest to lowest (descending). If you click the *same* column header again, it should flip the order to lowest-to-highest (ascending). Click it again and it flips back. This should keep alternating every time you click the same header.

**Pause and Resume:**
There's a Pause button. Clicking it should completely freeze the table — nothing updates, nothing changes, so you can calmly read the numbers without them shifting under you. While paused, the button should change to say "Resume". Clicking Resume should immediately bring the table back to life, updating again right away and continuing to refresh every 2 seconds after that.

**Manual Refresh:**
There's also a Refresh button. Clicking it should immediately fetch the very latest data one time — regardless of whether the table is currently paused or not — without changing whether you're paused. In other words, Refresh only fetches data; it should never touch the Pause/Resume setting.

**Looking at one process closely (the Inspector):**
If you click on any row in the table, a detail panel (we call it "the inspector") should open on the side of the screen. It shows everything about that one process: its PID, name, user, CPU %, memory, state, its parent process's ID, and the file path it was started from. While that process is still running, the numbers in the inspector should keep updating live, right along with the table. If the process closes or disappears (for example, someone quits it from outside the app), the inspector should automatically close on its own.

**Stopping a process:**
From the inspector, there are two buttons: **End process** and **Force kill**. Both ask you to confirm ("Are you sure?") before doing anything, so you don't accidentally close something important.
- **End process** should politely ask the process to shut itself down, giving it a chance to save anything it needs to and close cleanly.
- **Force kill** is for stubborn processes that don't respond to a polite request — it should immediately and forcefully stop the process no matter what.

These two buttons are meant to behave differently — Force kill exists specifically for processes that ignore End process.

**The summary cards:**
The Memory card at the top should show what percentage of the computer's total memory is currently being used, along with the actual "used / total" numbers underneath (for example, "25.0%" with "8 GB / 32 GB" written below it). The percentage shown and the "used / total" numbers underneath should always agree with each other — if 8 out of 32 GB is used, the percentage must say 25%, not some other number.

---

## 3. Features in ProcessDesk

Here's the same information as a quick checklist of features the app has:

1. **Live process list** — a table of all running processes that keeps itself updated automatically.
2. **Search box** — filter the table by PID, process name, or user, as you type.
3. **Sortable columns** — click any column header to sort by it; click again to reverse the order.
4. **Pause / Resume** — freeze and unfreeze the automatic updates.
5. **Manual Refresh button** — fetch fresh data on demand, without disturbing the Pause setting.
6. **Process inspector** — click a row to see full details of one process, kept up to date live.
7. **End process / Force kill** — two different ways to stop a selected process, from the inspector.
8. **System summary cards** — CPU core count, memory usage, disk usage, and uptime, shown at the top.

---

## 4. How to Get Started

```bash
npm install
npm run dev
```

Don't change these two commands or how the project is set up — the evaluator will run the app this same way.

The code is organized into layers (on-screen interface → code that talks to the app's backend → the backend itself → the operating system), a bit like a real product would be. A bug might live in any one of these layers. If you're not sure where to start, try this approach:
1. Reproduce the problem — actually click the broken thing and watch what (doesn't) happen.
2. Ask AI to explain the relevant piece of code to you in plain terms.
3. Form a guess about which single layer is responsible, and look there first.
4. Make the smallest change that fixes it, then try the feature again to confirm.
5. Also re-check one or two *other* features nearby, just to make sure your fix didn't quietly break something else.

---

## 5. Rules You Must Follow

You're allowed to use AI to read, explain, rename, reorganize, or rewrite as much of the code as you want — but a few things must always stay true, no matter how much you refactor:

- **Don't weaken the app's security setup.** This app is careful about keeping the on-screen interface separate from the parts of the code that can access your files and system — don't remove or loosen that separation just to make an error go away.
- **Don't delete a feature to "fix" it.** If something is broken, fix the actual problem — don't just remove the button or the feature so the error stops showing.
- **Don't change how the app is launched.** `npm install` and `npm run dev` must keep working exactly as they do now.
- **Clean up after yourself.** If you add temporary debug logs (e.g. `console.log`) while investigating, remove them before you're done.
- **The existing checks must still pass.** Running `npm test` and `npm run lint:structure` should both succeed when you're finished (they already pass on the broken code too, so they won't tell you which bugs to fix — they're just a safety net making sure you haven't broken something else along the way).

---

## 6. What to Submit

Hand in the whole project folder, along with a filled-out copy of `BUG_REPORT_TEMPLATE.md` — one short entry per bug you fixed. For each one, briefly note: what was wrong, what you changed, how you checked it was really fixed, and whether (and how) AI helped you find or fix it.

You'll be marked on whether each behavior described in Section 2 actually works, and whether your fix respects the rules in Section 5 — not on whether your code looks exactly like anyone else's. Good luck!
