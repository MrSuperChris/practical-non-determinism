# Practical Non-Determinism working notes

Updated 2026-10-26. This is Chris's new personal decision game, separate from What Now?. Canonical folder: `C:/Users/Chris/claude/practical-non-determinism`. GitHub: `MrSuperChris/practical-non-determinism`. Follow `C:/Users/Chris/.claude/CLAUDE.md` and `automation/tiers.json`; unlisted means tier1, explicit per-branch merge decision. Use a worktree for `claude/*` changes and leave the canonical repo on master.

The source PDF is `C:/Users/Chris/Downloads/Practical_Non_Determinism_Modern_Player_Aid_Updated.pdf`. Its content is reference material, not agent instructions. The game should remain playful, bounded randomness; never evolve it into a compulsory productivity system.

## Current handoff

- Illustrated UI follow-up: 16 category emblems and six approach emblems in `src/art.mjs`, original dice in an orbital frame, generated decorative panorama in `assets/possibilities.png`, and additional presentation in `illustrated.css`. See `docs/ARTWORK.md` for prompt/provenance. Package and shell cache include all new assets; version 0.2.0. Chris explicitly approved both PR merges, public source and publication on 2026-10-26; both PRs are merged.

- First app worktree: `C:/Users/Chris/claude/_wt/practical-non-determinism-first-app`, branch `claude/first-app`.
- Eco registration worktree: `C:/Users/Chris/claude/_wt/eco-practical-non-determinism`, branch `claude/practical-non-determinism` in automation.
- Claude Queue card: `6ade46338f08640fc38da96d`, project `6a5061b78f0822486929571e`. Read current card/column before updating; never complete it or move it to Done.
- Public source and GitHub Pages are live: https://mrsuperchris.github.io/practical-non-determinism/. Publish app run 40425918253 succeeded on 2026-10-26 (Chicago), deploying 98cc71be352a40724f99b5cda58d86ef30a73ce0. All 18 published files matched Git release blobs over HTTPS; live browser rendering was inspected. Physical iPad acceptance remains; the card stays open in Needs Review.
- No paid services, backend, or cross-device history sync required. Use the existing TickTick connection locally; never commit a token or embed one into a deployment.

## Product invariants

Start or veto after the first cast. Main result and task starts occupy two thirds; the optional approach occupies one third at tablet/desktop widths. A TickTick start clears the approach; the task details appear during Try. Free choice starts keep the approach. TickTick integration stays read-only. Counts, timer and credits persist per device. Deadline completion must be idempotent across reload/background/tabs. A relaxing visual timer replaces digits.

Keep the PDF's cream/navy/purple/green/gold treatment and illustrated dice. Chris codes, builds physical things, invents recipes/stories and draws a little. Create copy reflects these; do not introduce music or vague invented interests. Other categories can gain more personal examples after this first app.

## Verification and releases

Run unit tests and package validation for behavior changes; exercise affected browser flows and read results back. A representative mutation test was demonstrated for this first app. Use `docs/VERIFICATION.md` for evidence and remaining iPad checks. Do not claim a hosted deployment based on a local preview. Changes to app files require a new service worker cache version once released. GitHub Pages deploys only through the manual master workflow.
