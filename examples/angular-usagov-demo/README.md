# Angular + USWDS reference example — USA.gov homepage demo

**Status: reference example and conformance test harness. Not part of the registry contract.**
The contract of this repo is `agents.json`, `infinite/`, `adapters/`, `compatibility.json`, and the
MCP server at the repo root. This app exists to prove the registry's tiles and recipes produce
correct, accessible Angular output — and to host two verification tools:

- `scripts/check-uswds-classes.mjs` — fails if any template uses a class that is not in the pinned
  USWDS release (stylesheet, Twig, or component JS) or defined in component CSS. Enforces the
  registry rule "do not guess USWDS class names."
- `scripts/a11y-check.mjs` — axe-core scans (WCAG 2.1 A/AA + Section 508) at desktop and mobile
  widths, plus keyboard/focus behavior checks axe cannot see: skip link, banner toggle, mobile-menu
  focus trap and Escape handling, route-change focus, and accessible form validation with error
  summary, `aria-describedby` wiring, and the USWDS character-count announcement pattern.

The page rebuilds the live https://www.usa.gov/ homepage (observed 2026-09-23) plus a contact form,
assembled from the registry recipes `topic-landing-page` and `contact-form`. **Demonstration only —
not affiliated with USAGov or GSA.** Expected to migrate to a companion Angular registry (the
`drupal-uswds-ai-components` pattern).

## Run

```sh
npm install        # Node 22; use `npx npm@11 install` if npm 10 hits the arborist bug
npm start          # http://localhost:4300
node scripts/check-uswds-classes.mjs
node scripts/a11y-check.mjs   # with the dev server running
```

## Stack

Angular 22 (standalone components, signals, zoneless change detection, Reactive Forms) with
USWDS 3.14.0 from `@uswds/uswds` (exact pin matching the registry's `designSystem.version`).
