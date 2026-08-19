# Task 5 Verification and Acceptance Audit

## Verdict

**PARTIAL** overall.

The requested automated gates all pass, catalog and matcher contracts are directly evidenced, the package-manager current-state checks pass, and the planned accessibility/repair source markers are present. Two written UX requirements are absent from the implementation: the matcher summary does not display the catalog update date, and no explicit `상세 근거 보기` link leads into the preserved evidence/workbench sections. Browser-only layout and interaction claims were intentionally not assessed here per the Task 5 verifier assignment.

## Fresh command evidence

All commands ran from `D:\dev\hyperscaler-ssd` on 2026-08-19.

| Command | Exit | Result |
|---|---:|---|
| `corepack pnpm exec vitest run client/src/data/hardwareCatalog.test.ts shared/hardwareMatch.test.ts shared/profileSelection.test.ts client/src/components/HardwareMatcher.test.ts` | 0 | 4/4 files passed; 13/13 tests passed; 0 failures; duration 499 ms. |
| `corepack pnpm exec vitest run` | 0 | 12/12 files passed; 27/27 tests passed; 0 failures; duration 1.55 s. |
| `corepack pnpm check` | 0 | `tsc --noEmit`; no diagnostics. |
| `corepack pnpm build` | 0 | Vite 7.1.9 transformed 1,720 modules and built in 5.33 s; esbuild emitted `dist/index.js` (38.0 kB) in 5 ms. |
| `rg -n "/manus-storage|maximum-scale=1" client` | 1 | No matches. For `rg`, exit 1 is the expected no-match result. |

### Build output and warnings

The build succeeded but was not warning-free. It emitted four non-fatal warning/advisory messages:

1. `%VITE_ANALYTICS_ENDPOINT%` is not defined.
2. `%VITE_ANALYTICS_WEBSITE_ID%` is not defined.
3. The analytics `<script src="%VITE_ANALYTICS_ENDPOINT%/umami">` cannot be bundled without `type="module"`.
4. The production JavaScript chunk is larger than 500 kB after minification.

Fresh bundle sizes:

- `dist/public/index.html`: 368.70 kB, gzip 106.04 kB.
- `dist/public/assets/index-C1RGgPAR.css`: 136.15 kB, gzip 22.12 kB.
- `dist/public/assets/index-BJx6g9eM.js`: 600.63 kB, gzip 167.12 kB.

## Acceptance evidence

### 1. Catalog integrity and provenance — PASS

The catalog module was loaded through an in-memory TypeScript transpilation and inspected at runtime.

- Exact counts: 16 server records and 14 SSD records.
- Vendor counts: 5 server vendors and 7 SSD vendors.
- Server vendors: Dell Technologies, HPE, Lenovo, Supermicro, NVIDIA.
- SSD vendors: Samsung, Solidigm, KIOXIA, Micron, SanDisk, SK hynix, DapuStor.
- `catalogStats`: `{ serverCount: 16, ssdCount: 14, serverVendors: 5, ssdVendors: 7, updatedAt: "2026-08-19" }`.
- All 30 records have every required contract property; no missing source labels, invalid HTTPS URLs, duplicate IDs, empty workload arrays, or unsupported normalized form factors were found.
- All 30 retrieval dates are exactly `2026-08-19`.
- Observed confidence grades are A or B, both allowed by the A/B/C contract.
- Every server scope is `제품군 공개 최대값`.
- Every SSD scope is either `제품군 대표 최대값` or `명시 SKU 값`.
- Source hosts are vendor domains: KIOXIA, DapuStor, Lenovo, SK hynix, Samsung, Dell, HPE, Micron, NVIDIA, SanDisk, Solidigm, and Supermicro.
- Unknown public values remain represented as `null`; observed examples include 4 server `nvmeBays`, 14 server `maxStorageTb`, 7 SSD `capacityTb`, and 9 SSD `activePowerW` values.
- Focused catalog regression also proves the corrected model-specific Dell R660 and Supermicro 121/221 bay/form-factor/source values.

Evidence vs inference: the audit verifies record shape, current literal values, URL scheme, and vendor-domain provenance. It does not live-fetch or independently re-research all 30 vendor pages.

### 2. Compatibility model — PASS

`shared/hardwareMatch.ts` and its seven focused tests directly cover:

- exact form-factor mismatch producing `incompatible` and a non-color failed check row;
- PCIe `native`, `backward-compatible`, `host-bottleneck`, and `unknown` states;
- `review` for host bottleneck/unknown PCIe and `compatible` for native links when the form factor matches;
- bay-count × SSD-capacity raw capacity;
- bay-count × active-power estimate;
- null propagation when either disclosed operand is unavailable;
- workload intersection and endurance-class explanatory output;
- five check rows with icon, status name, label, and evidence sentence;
- absence of an aggregate `score` property;
- `formatTerabytes(184.32) === "184.3 TB"` and null formatting as `N/D`.

### 3. Hardware matcher source contract — PARTIAL

Present in `client/src/components/HardwareMatcher.tsx`:

- real server/SSD selection buttons with `aria-pressed`;
- server search and manufacturer filtering;
- SSD search and workload-class filtering;
- visible counts, zero-result states, and reset controls;
- filtered-out active selections pinned into the visible list exactly once (covered by a focused test);
- concise `aria-live="polite"` output;
- desktop three-column layout at Tailwind `lg` (1024 px) and single-column below it;
- mobile sticky verdict summary and desktop sticky verdict panel;
- two-column metric blocks;
- form-factor, PCIe, raw-capacity, active-power, and workload evidence;
- selected-record source links using `record.sourceUrl`, confidence badges, retrieval dates, and value scopes;
- no aggregate benchmark score or cross-product performance ranking.

Missing requirements:

- The top summary shows server count, SSD count, and combined manufacturer count but does not render `catalogStats.updatedAt`. A fresh scan for `catalogStats.updatedAt` in `HardwareMatcher.tsx` returned no match.
- No explicit `상세 근거 보기` link exists in either `HardwareMatcher.tsx` or `Home.tsx`; a fresh exact-text scan returned no match. The detailed profile/workbench sections do remain immediately below the matcher, but the specified link affordance is absent.

### 4. Existing dashboard repairs — PASS by source/static evidence

- `HardwareMatcher` is rendered immediately after the compact overview.
- Region, metric, comparison, and selected-comparison controls expose `aria-pressed`/`aria-controls` as applicable.
- The mobile menu exposes `aria-expanded` and `aria-controls`, and its menu targets use 44 px minimum sizing.
- Profile detail content and the visible `프로파일 보기` CTA are inside one real button; the comparison toggle is a separate sibling button.
- The fourth profile comparison is blocked without evicting an existing selection, with a visible polite notice and three focused transition tests.
- Profile result count, zero-result explanation, and reset action are present.
- No fixed bottom navigation dock marker was found in `Home.tsx`; the retained top mobile menu is present.
- `/manus-storage` and `maximum-scale=1` have no matches under `client`.
- CSS-only hero/hardware/thermal patterns replace missing assets.
- `--signal-action: #c94a24` and a global 3 px `:focus-visible` outline/offset are present.
- Fresh compiled-CSS inspection found `.outline-none` at byte index 53,474 and the important global focus rule later at byte index 128,233, so the compiled focus rule wins the cascade.
- Visible section labels 01 through 08 each occur at the expected matcher, profile, comparison, server, candidate, requirements, patterns, and sources locations.

Evidence vs inference: source and compiled CSS establish semantics and rule ordering. Actual visible focus appearance, mobile overflow, viewport position, click updates, console state, missing rendered images, and external-link navigation require the separate browser smoke test.

### 5. Package-manager artifact current state — PASS

- `pnpm-workspace.yaml`: absent.
- `pnpm-lock.yaml`: present; lockfile version `9.0`.
- Current `packageManager`: `pnpm@10.4.1+sha512.c753b6c3ad7afa13af388fa6d808035a008e30ea9993f58c6663e2bc5ff21679aa834db094987129aa4d488b86df57f7b634981b2f827cdcacc698cc0cfb88af`.
- That value exactly matches the repository template baseline in `template.json`.
- Current SHA-256: `package.json` = `2A909B2A2B49F2F63FFD5DCA36435A066C4CCAA79DD9621512F4D0B8F54A174A`; `pnpm-lock.yaml` = `CD5D787B580F6EA28B39DB0DDA4583213FF12D4BF3C71AC0A78DD74A42C9E504`.

Because the workspace has no usable Git repository, a historical byte-for-byte lockfile diff is unavailable. The specifically requested current-state invariants all pass.

## Changed-product-file audit

There is no Git metadata, so the changed-file set was reconstructed from Tasks 1–4 reports and directly inspected rather than derived from a VCS diff.

| File | Audit result |
|---|---|
| `client/src/data/hardwareCatalog.ts` | PASS: exact runtime counts, complete fields, provenance, scopes, normalized form factors, null preservation, derived stats. |
| `client/src/data/hardwareCatalog.test.ts` | PASS: discovered by the root suite; 2 tests pass. |
| `vitest.config.ts` | PASS: includes client, server, and shared test/spec patterns. |
| `shared/hardwareMatch.ts` | PASS: pure required compatibility model; no score. |
| `shared/hardwareMatch.test.ts` | PASS: 7 behavior tests pass. |
| `client/src/components/HardwareMatcher.tsx` | PARTIAL: core interaction/accessibility/source structure present; update-date summary and explicit detail link absent. |
| `client/src/components/HardwareMatcher.test.ts` | PASS for its declared scope: active-item pinning; does not render-test UI behavior. |
| `shared/profileSelection.ts` | PASS: blocks additions at limit without eviction and permits removal. |
| `shared/profileSelection.test.ts` | PASS: 3 transition tests pass. |
| `client/src/pages/Home.tsx` | PASS for planned static repairs; browser behavior remains for root verification. |
| `client/src/index.css` | PASS: signal token, CSS-only patterns, durable focus rule. |
| `client/index.html` | PASS: viewport allows zoom; no missing favicon/manus asset reference. Build warnings remain for analytics placeholders. |
| `client/src/components/ServerWorkbench.tsx` | PASS for expanded ownership: visible section label is 04. |
| `client/src/components/CandidateWorkbench.tsx` | PASS for expanded ownership: visible section label is 05. |

## Gaps and risks

1. **Acceptance gap:** matcher summary omits the catalog update date.
2. **Acceptance gap:** the required explicit `상세 근거 보기` link is absent.
3. **Browser proof deliberately unavailable in this audit:** 1440 px and 390 px layout, same-viewport click updates, horizontal overflow, rendered missing images, browser console errors, visible focus state, live `aria-pressed` changes, and real external-link navigation remain for the root browser pass.
4. **Build warnings:** analytics placeholders/non-module script and the 600.63 kB JavaScript chunk remain non-fatal but unresolved.
5. **Live-data limitation:** the catalog is a static `2026-08-19` research snapshot. It does not crawl vendor sites, track price/availability, seed user databases, or prove current shipping BOMs; vendor revisions require manual catalog/document updates.
6. **Provenance limitation:** URL/domain and literal provenance were audited locally; the 30 source pages were not fetched in this verification run.
7. **Diff limitation:** absence of Git metadata prevents an authoritative changed-file diff and historical lockfile comparison.

## Stop condition

Automated verification and source acceptance inspection are complete. Overall acceptance remains PARTIAL until the two missing source-level UX requirements are addressed and the separately assigned browser smoke checks establish the visual/interactive criteria.

## Root closure addendum

The two acceptance gaps were addressed after this verifier snapshot:

- `HardwareMatcher.tsx` now displays `catalogStats.updatedAt` as `데이터 기준 2026.08.19` and has a focused date-format regression test.
- `상세 근거 보기` now links to the existing `#profiles` evidence section; the target has mobile sticky-header scroll offset.

Fresh root verification after those changes passed 12/12 files and 28/28 tests, `tsc --noEmit`, and the production build (1,720 modules). A live Chrome CDP smoke at `innerWidth=390` measured both document and body scroll width at 390px; the only elements wider than the viewport belong to the intentionally horizontally scrollable 850px comparison table. Clicking HPE ProLiant DL380 Gen11 and Micron 9550 PRO E3.S 15.36TB updated both selected states and the polite live result to a compatible verdict, 553.0 TB raw capacity, and 648 W active power. The live DOM also confirmed the snapshot text and working `#profiles` target.

Root closure verdict: **PASS**, subject to the documented non-fatal analytics/chunk warnings and static-snapshot limitation.
