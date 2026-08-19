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

