# Hardware Match Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공식 제조사 데이터 기반의 서버·SSD 원클릭 매처를 최상단에 추가하고 기존 장문 대시보드의 핵심 접근성·가독성 결함을 수리한다.

**Architecture:** 검증 가능한 정적 카탈로그와 순수 적합성 함수를 UI에서 분리한다. `HardwareMatcher`는 선택·검색 상태만 소유하고, 모든 판정은 `shared/hardwareMatch.ts`가 반환하며, 기존 하이퍼스케일러·로그인 후보 CRUD는 그대로 유지한다.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Tailwind 4, Vitest 2, Lucide React

**Spec:** `docs/superpowers/specs/2026-08-19-hardware-match-dashboard-design.md`

## Global Constraints

- 새 런타임 의존성을 추가하지 않는다.
- 서버 값은 `제품군 공개 최대값`, SSD 값은 `제품군 대표 최대값` 또는 `명시 SKU 값`으로 표시한다.
- 서로 다른 벤치마크 조건을 합산한 단일 성능 점수를 만들지 않는다.
- 미확인 값은 `null`로 보존하고 추정하지 않는다.
- 기존 tRPC/DB/로그인 후보 CRUD 계약을 변경하지 않는다.
- 모든 신규 데이터 레코드는 공식 원문 URL, 조회일 `2026-08-19`, A/B/C 신뢰도를 가진다.

---

### Task 1: Official hardware catalog contracts and records

**Files:**
- Create: `client/src/data/hardwareCatalog.test.ts`
- Create: `client/src/data/hardwareCatalog.ts`

**Interfaces:**
- Produces: `ServerCatalogItem`, `SsdCatalogItem`, `serverCatalog`, `ssdCatalog`, `catalogStats`
- `serverCatalog` contains exactly 16 official product-family records.
- `ssdCatalog` contains exactly 14 official product-family/SKU records.

- [ ] **Step 1: Write the failing catalog integrity test**

```ts
import { describe, expect, it } from "vitest";
import { catalogStats, serverCatalog, ssdCatalog } from "./hardwareCatalog";

describe("official hardware catalog", () => {
  it("keeps the researched minimum product coverage and official provenance", () => {
    expect(serverCatalog).toHaveLength(16);
    expect(ssdCatalog).toHaveLength(14);
    expect(catalogStats.serverVendors).toBeGreaterThanOrEqual(5);
    expect(catalogStats.ssdVendors).toBeGreaterThanOrEqual(6);
    for (const item of [...serverCatalog, ...ssdCatalog]) {
      expect(item.sourceUrl).toMatch(/^https:\/\//);
      expect(item.sourceRetrievedAt).toBe("2026-08-19");
      expect(["A", "B", "C"]).toContain(item.sourceConfidence);
      expect(item.valueScope.length).toBeGreaterThan(0);
    }
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm exec vitest run client/src/data/hardwareCatalog.test.ts`

Expected: FAIL because `./hardwareCatalog` does not exist.

- [ ] **Step 3: Implement the typed catalog**

Create literal types for source confidence, workload class, and normalized form factors. Add the 16 server and 14 SSD records from Dell, HPE, Lenovo, Supermicro, NVIDIA, Samsung, Solidigm, KIOXIA, Micron, SanDisk/WD, SK hynix, and DapuStor official sources. Use `null` where the official family page does not establish a value.

```ts
export type SourceConfidence = "A" | "B" | "C";
export type DriveFormFactor = "U.2" | "U.3" | "E1.S" | "E3.S" | "M.2" | "2.5-inch";

export type CatalogProvenance = {
  sourceUrl: string;
  sourceLabel: string;
  sourceConfidence: SourceConfidence;
  sourceRetrievedAt: "2026-08-19";
  valueScope: "제품군 공개 최대값" | "제품군 대표 최대값" | "명시 SKU 값";
};
```

- [ ] **Step 4: Run the catalog test and verify GREEN**

Run: `pnpm exec vitest run client/src/data/hardwareCatalog.test.ts`

Expected: PASS with 16 servers and 14 SSDs.

### Task 2: Hardware compatibility engine

**Files:**
- Create: `shared/hardwareMatch.test.ts`
- Create: `shared/hardwareMatch.ts`

**Interfaces:**
- Consumes: `ServerCatalogItem`, `SsdCatalogItem`
- Produces: `analyzeHardwareMatch(server, ssd): HardwareMatchResult`
- `HardwareMatchResult.verdict`: `compatible | review | incompatible`
- `HardwareMatchResult.linkState`: `native | backward-compatible | host-bottleneck | unknown`

- [ ] **Step 1: Write failing tests for physical and PCIe behavior**

```ts
import { describe, expect, it } from "vitest";
import { analyzeHardwareMatch } from "./hardwareMatch";

describe("hardware match", () => {
  it("marks an unsupported form factor as incompatible", () => {
    const result = analyzeHardwareMatch(server({ driveFormFactors: ["E3.S"] }), ssd({ formFactor: "U.2" }));
    expect(result.verdict).toBe("incompatible");
  });

  it("reports native, backward-compatible and host-bottleneck PCIe links", () => {
    expect(analyzeHardwareMatch(server({ pcieGen: 5 }), ssd({ pcieGen: 5 })).linkState).toBe("native");
    expect(analyzeHardwareMatch(server({ pcieGen: 5 }), ssd({ pcieGen: 4 })).linkState).toBe("backward-compatible");
    expect(analyzeHardwareMatch(server({ pcieGen: 4 }), ssd({ pcieGen: 5 })).linkState).toBe("host-bottleneck");
  });

  it("calculates bay-level raw capacity and power only from disclosed values", () => {
    const disclosed = analyzeHardwareMatch(server({ nvmeBays: 12 }), ssd({ capacityTb: 15.36, activePowerW: 18 }));
    expect(disclosed.rawCapacityTb).toBeCloseTo(184.32);
    expect(disclosed.estimatedDrivePowerW).toBe(216);
    expect(analyzeHardwareMatch(server({ nvmeBays: 12 }), ssd({ activePowerW: null })).estimatedDrivePowerW).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `pnpm exec vitest run shared/hardwareMatch.test.ts`

Expected: FAIL because `analyzeHardwareMatch` does not exist.

- [ ] **Step 3: Implement the minimal pure matcher**

Implement exact form-factor intersection, PCIe state comparison, capacity/power multiplication, workload tag intersection, and check rows. Do not introduce a percentage score.

- [ ] **Step 4: Run matcher tests and verify GREEN**

Run: `pnpm exec vitest run shared/hardwareMatch.test.ts`

Expected: PASS for incompatible form factor, all PCIe states, and nullable power.

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

### Task 4: Repair primary dashboard affordance and accessibility

**Files:**
- Modify: `client/src/pages/Home.tsx`
- Modify: `client/src/index.css`
- Modify: `client/index.html`

**Interfaces:**
- Preserves: current profile filtering, 3-way comparison, workbench components, source register
- Changes: accessible toggles/menu, compact visual overview, single mobile navigation, empty states

- [ ] **Step 1: Remove broken image dependencies**

Remove all `/manus-storage/*` references from `Home.tsx`; replace the hero/card imagery with CSS gradients/patterns already supported by Tailwind/CSS.

- [ ] **Step 2: Make profile interactions explicit**

Use a real button for the entire profile detail action; keep the compare toggle separate and add `aria-pressed`. When 3 profiles are selected, prevent silent eviction and expose the reason in the button label/title.

- [ ] **Step 3: Complete filter and menu semantics**

Add `aria-pressed` to region/metric controls and `aria-expanded`/`aria-controls` to the mobile menu. Add visible result count and a 0-result reset state.

- [ ] **Step 4: Simplify mobile navigation and zoom**

Remove the fixed bottom dock, retain the sticky top menu, and remove `maximum-scale=1` from `client/index.html`.

- [ ] **Step 5: Raise contrast and focus visibility**

Add semantic `--signal-action: #c94a24`; add a global `focus-visible` ring and use the darker signal for small action text in the new matcher.

- [ ] **Step 6: Run typecheck and build**

Run: `pnpm check && pnpm build`

Expected: both commands exit 0.

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
