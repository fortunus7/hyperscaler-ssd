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

