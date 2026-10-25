# First-app verification

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

## Release checks still needed

- GitHub Pages deployment and public URL readback after the approved merge/visibility decision.
- Physical iPad Safari: Add to Home Screen, hold/release cast, rotate tablet, connect TickTick, background beyond fifteen minutes, reopen and verify one completion.
- Longer-term experience: whether the pool feels restful, mode usefulness, personalized examples and credit values. These are product feedback, not passed automated tests.

GitHub Actions runs the unit tests and package check on the PR. The manual Pages workflow repeats those checks before deployment and only runs from master.
