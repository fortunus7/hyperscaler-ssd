# Task 3 Report — Click-to-change HardwareMatcher UI

## Status

Implemented and verified. No commit was created because this workspace has no Git metadata.

## RED / GREEN evidence

### RED

- Added the requested display contract to `shared/hardwareMatch.test.ts` before production code:
  - `formatTerabytes(184.32)` must return `"184.3 TB"`.
  - `formatTerabytes(null)` must return `"N/D"`.
- The package's generated Windows `vitest` command shim was initially absent, so `corepack pnpm exec vitest ...` could not launch the runner. Running the installed Vitest entry point directly produced the required behavioral RED:
  - `shared/hardwareMatch.test.ts`: 1 failed, 6 passed.
  - Expected failure: `TypeError: formatTerabytes is not a function` at the new assertion.

### GREEN

- Added the minimal pure formatter to `shared/hardwareMatch.ts`.
- Re-ran the focused matcher suite against the installed Vitest runner:
  - 1 test file passed.
  - 7 tests passed.
- No production UI code was written until the formatter cycle was green.

## Changed files

- `client/src/components/HardwareMatcher.tsx`
  - Added local server selection, SSD selection, server search/vendor filter, and SSD search/workload filter state.
  - Added real selection buttons with `type="button"` and `aria-pressed`.
  - Added count displays, empty states, and filter reset controls for both catalogs.
  - Added a central `aria-live="polite"` verdict with form-factor, PCIe, raw-capacity, and active-power checks.
  - Added official-source links, confidence badges, retrieval date, and value-scope labels for both selected records.
  - Added responsive server → verdict → SSD flow, with a desktop three-column grid and sticky same-viewport verdict.
- `client/src/pages/Home.tsx`
  - Imported and rendered `<HardwareMatcher />` immediately below the compact overview.
  - Added `#matcher` links to desktop, mobile-menu, and bottom navigation before the public-profile path.
  - Kept all existing detailed sections in place.
- `shared/hardwareMatch.ts`
  - Added `formatTerabytes(value: number | null)` with one-decimal calculated output and explicit `N/D` handling.
- `shared/hardwareMatch.test.ts`
  - Added the requested formatter regression test.
- `.superpowers/sdd/2026-08-19-hardware-match-dashboard/task-3-report.md`
  - Added this implementation and verification record.

## Verification

- Focused matcher test: installed Vitest runner → 7/7 passed.
- Full suite: `corepack pnpm test` → 10/10 files and 23/23 tests passed.
- TypeScript: `corepack pnpm check` → exit 0, zero TypeScript errors.
- Production build: `corepack pnpm build` → exit 0; Vite transformed 1,719 modules and esbuild produced `dist/index.js`.

## Self-review

- Confirmed the default Dell PowerEdge R660 + Samsung PM1743 E3.S selection produces a useful compatible Gen5 result while undisclosed power remains `N/D`.
- Confirmed product cards are buttons rather than clickable articles, and selected state is available to assistive technology.
- Confirmed external source links are separate from selection buttons, avoiding nested interactive controls.
- Confirmed the UI uses the binding ink/paper/surface/signal/info/positive/review palette and 44px-minimum controls without adding CSS files or dependencies.
- Confirmed filters do not replace the active record, so changing or clearing a filter cannot make the live result disappear.
- Mutation check: changing formatter precision, coercing `null` to zero, or removing the formatter export fails the new test.

## Concerns

- Running Prettier on the owned files expanded the previously compact JSX throughout `Home.tsx`, creating broad formatting-only churn beyond the intended import/navigation/render edits. With no Git metadata, automatic restoration was unavailable; manual reconstruction was intentionally avoided because it risked losing concurrent intended edits.
- The successful production build retains existing warnings for undefined analytics placeholders, a non-module analytics script, and a JavaScript chunk above 500 kB. Task 3 did not introduce or modify analytics/build configuration.
- Visual 1440px/390px browser smoke is intentionally left for Task 4, which owns CSS/HTML and visual refinement. This task verified component structure, responsive utility classes, TypeScript, tests, and production compilation.

## Fix round 1/5 — 2026-08-19

### Findings resolved

- Active selection visibility:
  - Added the pure `pinActiveItem` helper and used it for both server and SSD picker display lists.
  - The active record is pinned first and de-duplicated when it already matches the current filters, so the verdict can no longer reference an invisible selection.
  - Matching-result counts and the empty-filter message still reflect the filter result rather than counting the pinned selection as a match.
- Capacity precision:
  - Routed the raw-capacity check detail through `formatTerabytes`, matching the one-decimal summary and preserving `N/D` behavior.
- Live announcements:
  - Removed `aria-live` and `aria-atomic` from the full result/provenance panel.
  - Added a concise screen-reader-only polite live status containing the selected pair, verdict, four required check outcomes, formatted raw capacity, and SSD active power.
  - Official-source cards and long explanatory prose remain outside the live region.
- Mobile same-viewport feedback:
  - Added a compact `lg:hidden` sticky summary below the 64px sticky mobile header.
  - The summary remains visible while scrolling the matcher and shows verdict, active pair, formatted capacity, and power; the desktop three-column result remains unchanged.

### Fix-round RED / GREEN evidence

- RED: focused component/shared run failed 2 tests as intended:
  - `pinActiveItem is not a function`.
  - Capacity detail was `184.32 TB` instead of containing `184.3 TB`.
- GREEN: `corepack pnpm exec vitest run client/src/components/HardwareMatcher.test.ts shared/hardwareMatch.test.ts` → 2/2 files and 8/8 tests passed.
- New component helper test confirms a filtered-out active item is visible and an already-visible active item is not duplicated.
- Extended shared matcher test confirms calculated capacity detail is rounded with the same formatter used by the summary.

### Fix-round verification

- Focused tests: 2/2 files, 8/8 tests passed.
- Full suite: `corepack pnpm test` → 11/11 files, 24/24 tests passed.
- TypeScript: `corepack pnpm check` → exit 0, zero TypeScript errors.
- Production build: `corepack pnpm build` → exit 0; Vite transformed 1,719 modules and esbuild produced `dist/index.js`.

### Fix-round self-review and concerns

- Confirmed the pinned record retains the selected visual style and `aria-pressed="true"`, making the active source of the verdict explicit even under non-matching filters.
- Confirmed only one `aria-live` region remains in `HardwareMatcher`, and the provenance links are outside it.
- Confirmed the temporary local Windows Vitest command shim used to run the package script was removed after verification; no package or generated runner files remain modified.
- Existing build warnings remain unchanged: undefined analytics placeholders, non-module analytics script, and a JavaScript chunk above 500 kB.
- No `Home.tsx`, CSS/HTML, or package files were modified in this fix round.
