# First-app verification

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
