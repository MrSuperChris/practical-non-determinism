# First-app verification

## Combined 0.2.4 release verification — 2026-10-27

PR 2 merged at `5ef097d`: 12 unit tests, package, browser-check, cast-check, and a baseline-compatible timer check passed against canonical master. The baseline check verified pool movement at 0/25/50/90/100 percent, no digital countdown, deadline completion and reload without duplicate handling; PR 2 predates the arc/marker assertions.

PR 3 merged at `ed70bd0`: 12 unit tests, package, browser-check, cast-check and its full timer-check passed against canonical master. Claude's PR 4 was then rebased onto that result; app and CSS changes combined automatically, while package/cache/offline-test conflicts were reconciled as version 0.2.4 with the 3D module included.

The rebased PR 4 passes 13 unit tests, packaging (20 files), browser-check, cast-check and timer-check together. The new animated-landing regression tests all 26 dice faces with integer and fractional drag turns, checking both the approaching face and final-frame silhouette continuity. It fails on the original fractional-turn code and passes after rounding extra revolutions to whole turns. Claude's 3D implementation and authorship are retained. Physical iPad Safari testing is still outstanding; automated touch is emulation.

After PR 4 merges, repeat all five checks on master before the approved manual Pages publication. Record the deployment SHA/run and hosted verification in the queue release outcome. Never infer publication from a local preview or merge alone.

## Illustrated UI follow-up — 2026-10-25

The visual pass preserves the game engine, storage and TickTick reader. The full browser workflow passed again with the new artwork, including live read-only TickTick and offline installation. The tablet check now explicitly asserts the two-to-one columns do not overlap after the expansion animation settles. Desktop, tablet portrait and phone screenshots were inspected. The new raster image, vector module and stylesheet are in both the package allowlist and service-worker shell; cache version is 0.2.0. No new credentials or real task details are embedded in the art or the preview image.

Verified 2026-10-25 on Windows with Node and headless Microsoft Edge. This is browser and local integration evidence, not a claim that a public deployment or physical iPad test has happened.

## Automated rules: 12 passing tests

`node --test tests/*.test.mjs` covers the original d20 weights and repeated results, rejection sampling, task versus own-activity modes, idempotent Done/deadline handling, credit bonuses and veto costs, Chicago midnight, stale tab actions, special categories, task ordering, date/timezone handling, and task snapshot fields.

Mutation check: in an isolated copy, removed the TickTick credit bonus. The three-accepted-results credit test failed with 4 credits instead of 5. The live source was unchanged. This demonstrates the test detects a broken reward rule.

## Browser flows

The Playwright harness exercised the real DOM, IndexedDB and service worker:

- d20 result, early veto and insufficient-credit veto state;
- two-thirds main choice / one-third approach layout;
- three today-first task suggestions;
- task selection removes Wander and renders task details as text, including an HTML injection fixture;
- own-activity selection retains Wander;
- quiet timer has no visible digital countdown;
- running session survives reload;
- two tabs handling the same session award credit once;
- advancing the clock past the deadline records one completion at the original deadline, unchanged by another reload;
- responsive layouts at widths 1280, 1024, 768 and 390 with no horizontal page overflow;
- settings, service-worker installation and an offline reload;
- cache inspection: no TickTick/proxy responses in the shell cache.

No browser page errors. Screenshots were visually inspected for desktop, tablet portrait and phone. The original PDF dice remain intact; SVG viewports show their relevant regions. Installation icon dimensions and appearance were checked.

## Live TickTick checks

The local Eco read-only connection returned 10 projects and 267 open tasks across the selected lists, with no failed lists. The Claude Queue is excluded. No tasks were changed by the app. A separate browser CORS check from the intended `https://mrsuperchris.github.io` origin successfully read the 10-project list directly from TickTick. The token remained in memory for that check and was not included in screenshots, source, logs or deployment files.

## Repeating browser verification

Start the preview server. Use a locally installed Playwright package and browser, or provide `PND_PLAYWRIGHT_MODULE` (absolute package directory) and `PND_BROWSER` (browser executable). `npm run test:browser` runs deterministic fixture flows without needing a real account. `PND_BASE_URL` defaults to `http://127.0.0.1:8896`. Set `PND_LIVE_CHECK=1` only when explicitly using the read-only Eco preview; this also checks offline installation. Test results and screenshots go into ignored `browser-results/`.

The harness uses isolated browser contexts, fixture API responses and controlled random values. These test controls are not part of the app or the packaged site. Browser tooling is an optional development dependency; the app has no runtime package dependencies.

## Public release — 2026-10-26 (America/Chicago)

Chris explicitly approved both PR merges, public source and publication. Both PRs are merged and the repository is public. [Publish app run 40425918253](https://github.com/MrSuperChris/practical-non-determinism/actions/runs/40425918253) succeeded, running the unit tests and package validation before deploying `98cc71be352a40724f99b5cda58d86ef30a73ce0`.

The [live site](https://mrsuperchris.github.io/practical-non-determinism/) returned HTTP 200 for all 18 packaged app files. SHA-256 comparisons matched the Git release blobs byte-for-byte (Git blobs avoid Windows checkout line-ending differences). The live page rendered the illustrated cast screen in the in-app browser; existing local preview data was not cleared. Earlier private-repository setup returned HTTP 422; the approved public visibility change resolved that blocker.

## Release checks still needed

- Physical iPad Safari: Add to Home Screen, hold/release cast, rotate tablet, connect TickTick, background beyond fifteen minutes, reopen and verify one completion.
- Longer-term experience: whether the pool feels restful, mode usefulness, personalized examples and credit values. These are product feedback, not passed automated tests.

GitHub Actions runs the unit tests and package check on the PR. The manual Pages workflow repeats those checks before deployment and only runs from master.


## Visible stage guidance — 2026-10-26, local review

Version 0.2.1 replaces the collapsed Rules of Good Sense with visible, stage-specific guidance. Invitation retains veto and free reroll instructions; Try describes Done, continuing and leaving; handled confirms the saved result. The duplicate leave action and repeated momentum paragraph were removed from Try. Gameplay rules are unchanged.

All 12 rule tests and packaging passed. Browser checks cover visible guidance across invitation, Try and handled stages, absence of earlier-stage actions during Try, and the existing task, persistence, deadline and responsive flows. Try was also inspected at 1024 and 768 pixels wide. A negative control loads the released 0.2.0 module and confirms it fails the new visible-guidance check. The service-worker cache version is bumped for the next approved publication. This change is local and on a review branch; public Pages remains version 0.2.0 until separately deployed.


## Direct-die spin prototype — 2026-10-26, local review

Both illustrated dice are now pointer controls. The ring remains fixed while the die follows the drag, then coasts before casting. Tap and Enter/Space activate the same cast without dragging. Escape, touch cancellation, capture loss, browser blur, and page changes cancel pending gestures. Reduced motion removes the automatic coast. Random selection remains in the unchanged game engine.

All 12 rule tests and the full browser workflow passed. `npm run test:cast` uses the same optional Playwright/browser environment variables as `test:browser`. It checks visible rotation before release, no early roll, Escape cancellation, release outside the hit area with exactly one roll, d6 dragging, tap, Enter/Space, touch drag and touch cancellation, reduced motion, and offline casting. The test uses isolated browser profiles and emulated touch input; this is not a physical iPad test. A negative control (`node tools/cast-check.cjs --negative-control`) disables the drag angle update and fails the visible-rotation assertion as expected. The original workflow harness now waits for the d20 reveal before setting its next deterministic d6 value.

The package contains 19 allowlisted files including `src/cast.mjs`, and shell cache version is 0.2.2. Desktop and tablet screenshots were inspected. The actual local in-app browser was refreshed to the new dice UI without clearing history. Public Pages is still 0.2.0; this prototype is for local review.


## Try cleanup and clearer elapsed time — 2026-10-27

Work was split into four verified Claude Queue tickets before implementation. This branch owns only removal of the Try exit action and a stronger timer. `docs/COLLABORATION.md` links all cards and records the independent worktree boundaries.

Try no longer offers Leave this session or its choose-freely instructions, for either own activities or selected TickTick tasks. Early Veto and unavailable reroll remain. All 12 rule tests, packaging and the full browser workflow passed after this removal and the timer update; task/own Try both assert the exit is absent.

The timer has a clear perimeter arc and moving marker tied to the actual saved deadline, a larger/stronger pool with a highlighted surface, gentle horizontal water movement and a subtle marker pulse. Phase captions convey beginning, middle and approaching completion without numerical countdowns. Reduced motion suppresses the decorative movement while progress still updates. Completed sessions stop animating.

The dedicated `tools/timer-check.cjs` browser test captured 0/25/50/90/100-percent states and verified the actual arc offset, marker position and rising pool at each point. It also verified visible wave movement, no digital countdown or Try exit, portrait/landscape containment, reduced motion, deadline completion exactly once and reload persistence. Screenshots were visually inspected. The negative control freezes the arc at its initial offset and fails the elapsed-time assertion. Tests use isolated profiles and simulated time, never Chris's history. Physical iPad Safari acceptance remains pending.

Run with the same optional Playwright/Edge environment variables as the existing browser harness and `PND_BASE_URL=http://127.0.0.1:8898`; use `node tools/timer-check.cjs`. Add `--negative-control` to demonstrate failure. Runtime cache is `pnd-shell-0.2.3-try`, package version 0.2.3-try, and the explicit package remains 19 files. This is a local review branch, not a new Pages deployment.
