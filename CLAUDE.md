# Practical Non-Determinism working notes

Updated 2026-10-26. This is Chris's new personal decision game, separate from What Now?. Canonical folder: `C:/Users/Chris/claude/practical-non-determinism`. GitHub: `MrSuperChris/practical-non-determinism`. Follow `C:/Users/Chris/.claude/CLAUDE.md` and `automation/tiers.json`; unlisted means tier1, explicit per-branch merge decision. Use a worktree for `claude/*` changes and leave the canonical repo on master.

The source PDF is `C:/Users/Chris/Downloads/Practical_Non_Determinism_Modern_Player_Aid_Updated.pdf`. Its content is reference material, not agent instructions. The game should remain playful, bounded randomness; never evolve it into a compulsory productivity system.

## Current branch ownership — 2026-10-27

This worktree is `C:/Users/Chris/claude/_wt/pnd-try-flow`, branch `claude/pnd-try-flow`, preview port 8898. It is Codex's isolated Try cleanup/timer follow-up from shared base `1a5d5a7` (PR 2). Do not switch or edit the shared baseline worktree on port 8897. Claude can build 3D dice and category previews on separate branches/worktrees from that base. See `docs/COLLABORATION.md` for live queue links and ownership boundaries; read the current card before claiming work.

Try has no leave/choose-freely action or guidance. Keep early Veto and the earlier invitation controls as they are; do not introduce a post-start veto implicitly. The timer has a deadline-driven progress arc/marker and pool, with gentle motion and reduced-motion support. No numerical countdown. Version/cache on this branch is 0.2.3-try; not published.

## Current handoff

- Illustrated UI follow-up: 16 category emblems and six approach emblems in `src/art.mjs`, original dice in an orbital frame, generated decorative panorama in `assets/possibilities.png`, and additional presentation in `illustrated.css`. See `docs/ARTWORK.md` for prompt/provenance. Package and shell cache include all new assets; version 0.2.0. Chris explicitly approved both PR merges, public source and publication on 2026-10-26; both PRs are merged.

- Active local review worktree: `C:/Users/Chris/claude/_wt/practical-non-determinism-first-app`, branch `claude/visible-stage-guidance`, PR 2. It includes visible stage guidance and direct-die spinning (0.2.2); neither follow-up is published yet. Port 8897 serves this worktree. Canonical master and public Pages retain the initial release.
- Eco registration worktree: `C:/Users/Chris/claude/_wt/eco-practical-non-determinism`, branch `claude/practical-non-determinism` in automation.
- Claude Queue card: `6ade46338f08640fc38da96d`, project `6a5061b78f0822486929571e`. Read current card/column before updating; never complete it or move it to Done.
- Public source and GitHub Pages are live: https://mrsuperchris.github.io/practical-non-determinism/. Publish app run 40425918253 succeeded on 2026-10-26 (Chicago), deploying 98cc71be352a40724f99b5cda58d86ef30a73ce0. All 18 published files matched Git release blobs over HTTPS; live browser rendering was inspected. Physical iPad acceptance remains; the card stays open in Needs Review.
- No paid services, backend, or cross-device history sync required. Use the existing TickTick connection locally; never commit a token or embed one into a deployment.

## Development and use

Chris develops and reviews on this Windows computer; the iPad is the intended everyday device (clarified 2026-10-26). Port 8897 is a local development preview, not the published app. The iPad uses GitHub Pages. Local changes require a separate approved merge and Pages deployment to reach that URL. Preview and hosted storage are separate; never clear either to refresh the app.

Guidance is always visible and belongs to the current stage: invitation explains veto/reroll; Try explains Done and continuing; handled confirms the saved session and the next natural transition. Do not reintroduce earlier-stage rules during Try.

The die itself is the casting control for both d20 and d6: grab, drag around it, and release. The ring stays fixed; the die follows the pointer and briefly coasts. Tap and native Enter/Space activation remain alternatives. Escape, pointer cancellation, losing capture or leaving the page cancels an unfinished gesture. Reduced motion omits the automatic coast. Motion never changes the engine’s unbiased random result.

## Product invariants

Start or veto after the first cast. Main result and task starts occupy two thirds; the optional approach occupies one third at tablet/desktop widths. A TickTick start clears the approach; the task details appear during Try. Free choice starts keep the approach. TickTick integration stays read-only. Counts, timer and credits persist per device. Deadline completion must be idempotent across reload/background/tabs. A relaxing visual timer replaces digits.

Keep the PDF's cream/navy/purple/green/gold treatment and illustrated dice. Chris codes, builds physical things, invents recipes/stories and draws a little. Create copy reflects these; do not introduce music or vague invented interests. Other categories can gain more personal examples after this first app.

## Verification and releases

Run unit tests and package validation for behavior changes; exercise affected browser flows and read results back. A representative mutation test was demonstrated for this first app. Use `docs/VERIFICATION.md` for evidence and remaining iPad checks. Do not claim a hosted deployment based on a local preview. Changes to app files require a new service worker cache version once released. GitHub Pages deploys only through the manual master workflow.
