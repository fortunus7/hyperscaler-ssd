# Final review fix report

Date: 2026-08-19

## Outcome

- Replaced the matcher-facing flat server bay/form-factor fields with configuration-specific `storageOptions`.
- Split SSD physical envelope from connector/interface and made the matcher select the best matching server option.
- Prevented bay-count leakage between R660 configurations: 10×2.5-inch/U.2 and 16×E3.S.
- Added connector-uncertainty review states, power measurement basis, stronger catalog invariants, confidence legend, profile-detail focus/scroll behavior, sticky-header offsets, and 44px region/metric controls.

## TDD evidence

- RED: focused catalog/matcher tests failed 13 cases against the flattened model, including R660 2.5-inch capacity incorrectly calculating 245.76TB.
- RED: profile-detail reduced-motion helper test failed before implementation.
- RED: unspecified power basis incorrectly passed before the status rule was added.
- GREEN: focused suite passed — 3 files, 19 tests.

## Verification

- Full tests: `node node_modules\\vitest\\vitest.mjs run` — 12 files, 36 tests passed.
- TypeScript: `node node_modules\\typescript\\bin\\tsc --noEmit` — passed.
- Client build: `node node_modules\\vite\\bin\\vite.js build` — 1,720 modules transformed, passed.
- Server bundle: `.\\node_modules\\.bin\\esbuild.cmd server/_core/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist` — passed, 38.0kB output.
- Static audit: no `nvmeBays`, `driveFormFactors`, or matcher-facing legacy `formFactor` references remain in the catalog/matcher files.

## Residual risks

- Server and candidate workbench hash targets are owned by separate components and were intentionally not edited in this round; their sticky-header scroll offsets remain a minor follow-up. All hash targets controlled by `Home` plus the matcher now use `scroll-mt-16`.
- Multi-form server configurations retain `bayCount: null` wherever the captured official source does not distinguish a per-envelope count. This is intentionally conservative and produces N/D rather than a fabricated capacity.
- Non-fatal existing Vite warnings remain for analytics placeholders and the large client chunk.
