import { describe, expect, it } from "vitest";
import type {
  ServerCatalogItem,
  SsdCatalogItem,
} from "../client/src/data/hardwareCatalog";
import { analyzeHardwareMatch, formatTerabytes } from "./hardwareMatch";

const provenance = {
  sourceUrl: "https://example.com/product",
  sourceLabel: "Official product page",
  sourceConfidence: "A" as const,
  sourceRetrievedAt: "2026-08-19" as const,
  valueScope: "명시 SKU 값" as const,
};

function server(overrides: Partial<ServerCatalogItem> = {}): ServerCatalogItem {
  return {
    ...provenance,
    id: "test-server",
    manufacturer: "Test Server Vendor",
    model: "Test Server",
    generation: "Current",
    rackUnits: 2,
    cpu: "Test CPU",
    cpuSockets: 2,
    maxMemoryTb: 4,
    storageOptions: [
      { envelope: "E3.S", interfaces: ["E3.S"], bayCount: 12, pcieGen: 5 },
    ],
    maxStorageTb: null,
    gpuSummary: null,
    psuSummary: null,
    workloads: ["클라우드", "데이터베이스"],
    summary: "Test server",
    ...overrides,
  };
}

function ssd(overrides: Partial<SsdCatalogItem> = {}): SsdCatalogItem {
  return {
    ...provenance,
    id: "test-ssd",
    manufacturer: "Test SSD Vendor",
    model: "Test SSD",
    marketClass: "Enterprise SSD",
    workloadClass: "mixed-use",
    envelope: "E3.S",
    interfaces: ["E3.S"],
    capacityTb: 15.36,
    pcieGen: 5,
    nvmeVersion: "2.0",
    readMBps: null,
    writeMBps: null,
    readIops: null,
    writeIops: null,
    dwpd: 3,
    activePowerW: 18,
    powerBasis: "maximum",
    workloads: ["데이터베이스", "OLTP"],
    summary: "Test SSD",
    ...overrides,
  };
}

describe("hardware match", () => {
  it("formats calculated totals without implying unavailable precision", () => {
    expect(formatTerabytes(184.32)).toBe("184.3 TB");
    expect(formatTerabytes(null)).toBe("N/D");
  });

  it("marks an unsupported physical envelope as incompatible", () => {
    const result = analyzeHardwareMatch(
      server(),
      ssd({ envelope: "2.5-inch", interfaces: ["U.2"] })
    );

    expect(result.physicalEnvelope).toBe(false);
    expect(result.verdict).toBe("incompatible");
    expect(result.checks).toContainEqual(
      expect.objectContaining({ key: "form-factor", status: "fail" })
    );
  });

  it("reports native, backward-compatible and host-bottleneck PCIe links", () => {
    expect(analyzeHardwareMatch(server(), ssd({ pcieGen: 5 })).linkState).toBe(
      "native"
    );
    expect(analyzeHardwareMatch(server(), ssd({ pcieGen: 4 })).linkState).toBe(
      "backward-compatible"
    );
    expect(
      analyzeHardwareMatch(
        server({
          storageOptions: [
            {
              envelope: "E3.S",
              interfaces: ["E3.S"],
              bayCount: 12,
              pcieGen: 4,
            },
          ],
        }),
        ssd({ pcieGen: 5 })
      ).linkState
    ).toBe("host-bottleneck");
  });

  it("reports an unknown PCIe link when either generation is undisclosed", () => {
    const result = analyzeHardwareMatch(
      server({
        storageOptions: [
          {
            envelope: "E3.S",
            interfaces: ["E3.S"],
            bayCount: 12,
            pcieGen: null,
          },
        ],
      }),
      ssd({ pcieGen: 5 })
    );

    expect(result.linkState).toBe("unknown");
    expect(result.verdict).toBe("review");
  });

  it("calculates bay-level raw capacity and power only from disclosed values", () => {
    const disclosed = analyzeHardwareMatch(
      server(),
      ssd({ capacityTb: 15.36, activePowerW: 18 })
    );

    expect(disclosed.rawCapacityTb).toBeCloseTo(184.32);
    expect(disclosed.estimatedDrivePowerW).toBe(216);
    expect(
      disclosed.checks.find(check => check.key === "capacity")?.detail
    ).toContain("184.3 TB");
    expect(
      analyzeHardwareMatch(
        server(),
        ssd({ capacityTb: null, activePowerW: null })
      )
    ).toMatchObject({
      rawCapacityTb: null,
      estimatedDrivePowerW: null,
    });
    expect(
      analyzeHardwareMatch(
        server({
          storageOptions: [
            {
              envelope: "E3.S",
              interfaces: ["E3.S"],
              bayCount: null,
              pcieGen: 5,
            },
          ],
        }),
        ssd({ capacityTb: 15.36, activePowerW: 18 })
      )
    ).toMatchObject({
      rawCapacityTb: null,
      estimatedDrivePowerW: null,
    });
  });

  it("describes shared workloads and SSD endurance without turning them into a score", () => {
    const result = analyzeHardwareMatch(server(), ssd());

    expect(result.workloadFit.sharedWorkloads).toEqual(["데이터베이스"]);
    expect(result.workloadFit.enduranceClass).toBe("mixed-use");
    expect(result.workloadFit.detail).toContain("데이터베이스");
    expect(result.workloadFit.detail).toContain("mixed-use");
    expect(result).not.toHaveProperty("score");
  });

  it("uses review for a disclosed host bottleneck and compatible for native links", () => {
    expect(analyzeHardwareMatch(server(), ssd()).verdict).toBe("compatible");
    expect(
      analyzeHardwareMatch(
        server({
          storageOptions: [
            {
              envelope: "E3.S",
              interfaces: ["E3.S"],
              bayCount: 12,
              pcieGen: 4,
            },
          ],
        }),
        ssd({ pcieGen: 5 })
      ).verdict
    ).toBe("review");
  });

  it("uses the matching R660 option without leaking another configuration's bay count", async () => {
    const { serverCatalog, ssdCatalog } = await import(
      "../client/src/data/hardwareCatalog"
    );
    const r660 = serverCatalog.find(item => item.id === "dell-poweredge-r660")!;
    const u2 = ssdCatalog.find(item => item.id === "samsung-pm1743-u2-15tb")!;
    const e3s = ssdCatalog.find(item => item.id === "samsung-pm1743-e3s-15tb")!;
    const sandisk = ssdCatalog.find(
      item => item.id === "sandisk-dc-sn861-u2-1-6tb"
    )!;

    expect(analyzeHardwareMatch(r660, u2)).toMatchObject({
      verdict: "compatible",
      rawCapacityTb: 153.6,
    });
    expect(analyzeHardwareMatch(r660, e3s)).toMatchObject({
      verdict: "compatible",
      rawCapacityTb: 245.76,
    });
    expect(analyzeHardwareMatch(r660, sandisk).verdict).not.toBe(
      "incompatible"
    );
  });

  it.each([
    ["host bottleneck", 4, 5],
    ["unknown link", null, 5],
  ])("keeps physical mismatch ahead of %s", (_label, hostGen, ssdGen) => {
    const result = analyzeHardwareMatch(
      server({
        storageOptions: [
          {
            envelope: "E3.S",
            interfaces: ["E3.S"],
            bayCount: 12,
            pcieGen: hostGen,
          },
        ],
      }),
      ssd({ envelope: "2.5-inch", interfaces: ["U.2"], pcieGen: ssdGen })
    );
    expect(result.verdict).toBe("incompatible");
  });

  it("reviews an envelope match when the server connector is undisclosed", () => {
    const result = analyzeHardwareMatch(
      server({
        storageOptions: [
          { envelope: "2.5-inch", interfaces: [], bayCount: 12, pcieGen: 5 },
        ],
      }),
      ssd({ envelope: "2.5-inch", interfaces: ["U.2"], pcieGen: 5 })
    );
    expect(result).toMatchObject({ verdict: "review", interfaceMatch: null });
  });

  it("distinguishes typical power from a disclosed value with no measurement basis", () => {
    const typical = analyzeHardwareMatch(
      server(),
      ssd({ powerBasis: "typical" })
    );
    const unspecified = analyzeHardwareMatch(
      server(),
      ssd({ powerBasis: "unspecified" })
    );
    expect(typical.checks.find(check => check.key === "power")).toMatchObject({
      status: "pass",
      detail: expect.stringContaining("typical"),
    });
    expect(
      unspecified.checks.find(check => check.key === "power")
    ).toMatchObject({
      status: "review",
      detail: expect.stringContaining("기준 미명시"),
    });
  });
});
