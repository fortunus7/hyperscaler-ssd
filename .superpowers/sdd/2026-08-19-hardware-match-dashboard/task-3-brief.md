### Task 3: Click-to-change HardwareMatcher UI

**Files:**
- Create: `client/src/components/HardwareMatcher.tsx`
- Modify: `client/src/pages/Home.tsx`

**Interfaces:**
- Consumes: `serverCatalog`, `ssdCatalog`, `catalogStats`, `analyzeHardwareMatch`
- Produces: `<HardwareMatcher />` with local server/SSD/search/vendor state

- [ ] **Step 1: Add a pure display-format test before UI code**

Extend `shared/hardwareMatch.test.ts` with:

```ts
it("formats calculated totals without implying unavailable precision", () => {
  expect(formatTerabytes(184.32)).toBe("184.3 TB");
  expect(formatTerabytes(null)).toBe("N/D");
});
```

- [ ] **Step 2: Run and verify RED**

Run: `pnpm exec vitest run shared/hardwareMatch.test.ts`

Expected: FAIL because `formatTerabytes` is missing.

- [ ] **Step 3: Implement the formatter and verify GREEN**

Add `formatTerabytes(value: number | null)` to `shared/hardwareMatch.ts` and rerun the focused test.

- [ ] **Step 4: Build the component**

Create a responsive three-column layout with:

- server search/vendor filter and selectable buttons using `aria-pressed`
- central `aria-live="polite"` verdict panel with form factor, PCIe, raw capacity, and power checks
- SSD search/workload filter and selectable buttons using `aria-pressed`
- official source links, confidence badges, and value-scope labels for both active records
- count/empty state and reset controls

- [ ] **Step 5: Integrate directly below the compact overview**

Import and render `<HardwareMatcher />` in `Home.tsx`. Add the `#matcher` navigation target before public cloud profiles.

- [ ] **Step 6: Run TypeScript validation**

Run: `pnpm check`

Expected: zero TypeScript errors.

