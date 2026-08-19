### Task 5: Full verification and analysis handoff

**Files:**
- Modify if needed: only files already in this plan

**Interfaces:**
- Verifies: catalog integrity, match behavior, regressions, bundle, desktop/mobile layout

- [ ] **Step 1: Run focused tests**

Run: `pnpm exec vitest run client/src/data/hardwareCatalog.test.ts shared/hardwareMatch.test.ts`

Expected: all focused tests pass.

- [ ] **Step 2: Run the full automated suite**

Run: `pnpm test`

Expected: all existing and new tests pass with zero failures.

- [ ] **Step 3: Run static and production checks**

Run: `pnpm check`

Run: `pnpm build`

Expected: both exit 0.

- [ ] **Step 4: Run visual smoke checks**

Open the local production/dev page at 1440px and 390px. Verify:

- server and SSD clicks update the verdict in the same viewport
- no missing images or console errors
- no horizontal page overflow at 390px
- focus rings and `aria-pressed` state are visible/updated
- official source links open the selected products' source URLs

- [ ] **Step 5: Re-read the goal and report evidence**

Report the ranked current-state analysis, files changed, exact catalog counts, test/typecheck/build output, and any remaining live-data update limitation.
