# Parallel UI work

Chris requested independent Claude Queue tickets before further development on 2026-10-27. The queue is the source of current ownership/status; read it before starting. All four cards were created and read back before implementation began.

Shared starting point: `1a5d5a7992f756608199f80069b68e859285e9d7`, pushed on `claude/visible-stage-guidance`, PR 2. The baseline worktree `C:/Users/Chris/claude/_wt/practical-non-determinism-first-app` and preview port 8897 stay unchanged. Create a separate worktree/branch from that commit for each owner. Open feature PRs against `claude/visible-stage-guidance` to isolate their changes; merge/publication still needs Chris's explicit branch decision.

## Tickets

- [[build] Practical Non-Determinism: remove the Try exit action](https://ticktick.com/webapp/#p/6a5061b78f0822486929571e/tasks/6ae0a09a8f081c311c7bb4e2) — Codex: implemented in commit 92edcd1; review pending.
- [[build] Practical Non-Determinism: make visual time progress clearer](https://ticktick.com/webapp/#p/6a5061b78f0822486929571e/tasks/6ae0a0988f08640fc3d8bfef) — Codex: this branch, timer visualization only.
- [[build] Practical Non-Determinism: replace flat spin with 3D dice](https://ticktick.com/webapp/#p/6a5061b78f0822486929571e/tasks/6ae0a0988f08dc411467df24) — Available for Claude; check current queue claim.
- [[build] Practical Non-Determinism: preview categories on hover and tap](https://ticktick.com/webapp/#p/6a5061b78f0822486929571e/tasks/6ae0a0998f08f3950578d8bb) — Available for Claude; check current queue claim.

## Ownership boundaries

- Codex uses `C:/Users/Chris/claude/_wt/pnd-try-flow`, `claude/pnd-try-flow`, port 8898. Scope: `quietTimer()`, `updateVisualTimer()`, doing-stage `rules()`, timer-specific CSS and tests. The Try exit-removal commit precedes the timer change, so it can be inspected separately.
- Dice: suggested branch/worktree `claude/pnd-3d-dice` / `C:/Users/Chris/claude/_wt/pnd-3d-dice`, port 8899. Own gesture/3D renderer, cast control and result handoff, dice CSS/tests. Leave Try and category preview functions alone.
- Category previews: suggested branch/worktree `claude/pnd-category-previews` / `C:/Users/Chris/claude/_wt/pnd-category-previews`, port 8900. Own Cast tile markup and preview wiring, ideally dedicated module/styles. Leave dice and Try functions alone.

Verify a port is free before starting it. Do not push changes onto another owner's branch or restart their server. Shared files may have independent edits; preserve those edits during integration and coordinate through the cards. A worker claims a ticket in Working only when beginning, and leaves verified results in Needs Review. Never complete the cards or move them to Done. No worker needs to wait for another feature before starting from the shared base.

The public Pages app is still version 0.2.0. PR 2 and these follow-ups are local review work. Keep real history and credentials intact. Preview ports have separate storage; do not clear data to refresh a build.
