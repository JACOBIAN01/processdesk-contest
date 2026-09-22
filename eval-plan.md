# Bulk grading runner for student ProcessDesk submissions

## Context

The organizer repo (`processdesk-contest`, this repo) contains the instructor
reference and the student template; a separate repo distributed to contestants
holds only the student project. After the contest, each student will have
pushed their fixes to their own copy of that repo. The organizer needs an
efficient way to check, across every submission, whether each of the 10
seeded bugs is actually fixed — reusing the `tests/contest/behavior.spec.mjs`
mocha+chai suite already built into both packages (see prior work in this
session) rather than manually running the app for every student.

The chosen approach: a Node-based bulk grading script that clones every
student repo listed in an organizer-provided roster file, runs the grading
suite against each one **in parallel** (plain OS processes, no Docker), and
produces a CSV score sheet, a raw JSON audit trail per student, and an HTML
leaderboard.

A key integrity concern this plan addresses: students have write access to
their own repo, including `tests/contest/` and `package.json`. The runner
must not trust either — it overwrites the test suite with the organizer's
pinned copy and installs its own known-good grading toolchain before scoring,
so a student can't inflate their score by editing the tests.

## Roster file format

The user supplies `grading/roster.csv` (gitignored — not committed, since it
may list real students/repos). A template is committed at
`grading/roster.example.csv`:

```csv
student_id,repo,ref
alice,alice-gh/processdesk-student,main
bob,https://github.com/bob-gh/processdesk-student,main
```

- `repo`: either `owner/repo` or a full GitHub URL (both work with `gh repo clone`).
- `ref`: branch, tag, or commit to grade (defaults to the repo's default branch if blank).

## New files (all under `grading/` in this repo, not shipped to students)

- **`grading/roster.example.csv`** — template shown above, with a comment line explaining the columns.
- **`grading/bug-map.mjs`** — hardcodes the mapping from each graded test's mocha `fullTitle` to a bug number (1–10), mirroring `answer.md`'s numbering. Built from the actual titles in `processdesk-instructor/tests/contest/behavior.spec.mjs`:
  - bug 1 → "the toolbar search field reports the text that was actually typed, not the previous value"
  - bug 2 → "the toolbar refresh and pause controls fetches a fresh snapshot when the refresh control is used, without touching pause"
  - bug 3 → "ending a process from the renderer uses a distinct, harsher path than the graceful stop"
  - bug 4 → "automatic list updates keeps polling while active and stops as soon as it is paused"
  - bug 5 → "column sort order alternates direction on repeated clicks of the active column"
  - bug 6 → "a process row shows memory in the same units the rest of the app uses for the same figure"
  - bug 7 → "the memory summary card reports the percentage of memory currently in use, matching the used/total figures"
  - bug 8 → "ending a process from the renderer sends the identifier in the shape the backend contract expects"
  - bug 9 → "automatic list updates polls on the interval the app was configured with"
  - bug 10 → "selecting a process row resolves to the matching process in the latest snapshot"
  - The suite's other 2 tests (pause-toggle sanity check, "starts a newly clicked column descending" sanity check) are recorded but not scored.
- **`grading/run-grading.mjs`** — the orchestrator (see Flow below).
- **`grading/package.json`** — its own tiny devDependency set for the *tooling* (a CSV writer helper if needed, otherwise none — CSV/HTML generation is simple enough to hand-roll with no extra deps).
- **`grading/README.md`** — usage instructions: fill in the roster, run the command, where results land, how to re-grade a single student.
- **`.gitignore` addition** (repo root) — ignore `grading/roster.csv`, `grading/workdir/`, `grading/results/`.

## Orchestrator flow (`grading/run-grading.mjs`)

CLI: `node grading/run-grading.mjs --roster grading/roster.csv [--concurrency 4] [--only alice,bob]`

1. Parse the roster CSV (hand-rolled parser — the format is simple, fixed columns, no quoting complexity expected).
2. Run `gradeOne(student)` for every row through a small in-process concurrency pool (a manual semaphore over `Promise` — no new dependency needed), default concurrency 4 (network/install-bound, not CPU-bound).
3. `gradeOne(student)`, all steps wrapped so one student's failure doesn't abort the batch:
   1. **Clone**: `gh repo clone <repo> grading/workdir/<student_id> -- --depth 1 --branch <ref>` (falls back to plain `git clone` if `gh` isn't authenticated for that repo). Failure → record `status: "clone_failed"`, skip remaining steps, continue to next student.
   2. **Overwrite the test suite**: copy `processdesk-instructor/tests/contest/_harness.mjs` and `behavior.spec.mjs` into `<workdir>/<student_id>/tests/contest/`, replacing whatever the student has there.
   3. **Install dependencies**: `npm install` with `ELECTRON_SKIP_BINARY_DOWNLOAD=1` set (the grading suite never launches Electron, so skip that ~100MB+ binary download for speed). Then `npm install --no-save mocha@12 chai@6 jsdom@30` to guarantee the grading toolchain is present even if a student removed it from `package.json`.
   4. **Baseline checks** (recorded, not auto-zeroing — see Output below):
      - `node --test tests/unit/*.test.js tests/integration/*.test.js` (mirrors `npm test`)
      - `node scripts/check-structure.js` (mirrors `npm run lint:structure`)
   5. **Contest suite**: `npx mocha tests/contest/behavior.spec.mjs --timeout 20000 --reporter json`, parse the JSON, map each of the 10 graded tests via `bug-map.mjs` to pass/fail, sum to a `/10` score.
   6. Write the full combined raw output to `grading/results/<student_id>.json` (audit trail — what to look at if a student disputes a grade).
4. After all students finish: write
   - `grading/results/scores.csv` — one row per student: `student_id, repo, bug1..bug10, contest_score, baseline_tests_pass, lint_structure_pass, status, notes`
   - `grading/results/leaderboard.html` — a small self-contained static page, sorted by `contest_score` desc, showing the same columns (plain HTML/CSS table, no external dependencies, opens directly in a browser).
5. Console progress line per student as it completes, e.g. `[7/40] bob — 6/10, baseline OK`.

Baseline checks are **recorded, not auto-zeroing**: the CSV shows pass/fail for both, and the contest score stands on its own, so the human grader makes the final call per the "mark by behavior" guidance in `INSTRUCTOR_GUIDE.md`.

## Verification

Before pointing this at real student repos:
1. Create 2–3 local throwaway git repos as stand-ins (e.g. `git clone processdesk-student /tmp/fake-student-1`, leave one fully buggy, apply 3–4 of the 10 fixes to another, apply all 10 to a third).
2. Point `roster.csv` at these local paths (the clone step falls back to plain `git clone <local-path>` for non-`owner/repo` entries) and run the script with `--concurrency 2`.
3. Confirm: `scores.csv` shows the expected bug counts for each stand-in (0/10, ~4/10, 10/10), `leaderboard.html` renders and sorts correctly, and `results/<id>.json` contains the full raw mocha output for spot-checking.
4. Only then point the roster at real GitHub repo entries and confirm `gh repo clone` auth works for at least one private repo before running the full batch.

## Prerequisites / assumptions to confirm with the user

- `gh` CLI (already installed) must be authenticated with read access to every student repo before a real run (org membership or per-repo collaborator access for private repos).
- Rough number of students isn't known yet — default concurrency of 4 is a safe starting point; can be raised once we see how heavy `npm install` is per repo on the grading machine.
