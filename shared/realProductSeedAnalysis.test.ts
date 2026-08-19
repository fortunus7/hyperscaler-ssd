import { describe, expect, it } from "vitest";
import { analyzeSsdSuitability } from "./ssdFitAnalysis";

const googleZ3Reference = {
  id: "gcp-z3",
  provider: "Google Cloud",
  profile: "Z3 highmem-176 standardlssd",
  ssdReference: { capacityGb: 3000, readIops: 750000, writeIops: 500000, readMBps: 3000, writeMBps: 2500, pcieGen: null, dwpd: null },
  serverReference: { rackUnits: null, powerCapacityW: null, ssdFormFactor: null, ssdInterface: "NVMe", ssdProtocol: "NVMe" },
};

const hpeE3sReference = { model: "HPE ProLiant DL380 Gen11 · 12 EDSFF NVMe reference configuration", rackUnits: 2, powerCapacityW: 1600, ssdCount: 12, ssdFormFactor: "E3.S", ssdInterface: "PCIe 5.0 x4", ssdProtocol: "NVMe" };

describe("official product seed suitability", () => {
  it("identifies Micron 9550 PRO E3.S as a physical match while preserving its published write-IOPS gap", () => {
    const result = analyzeSsdSuitability({ capacityGb: 15360, readIops: 3000000, writeIops: 400000, readMBps: 14000, writeMBps: 10000, pcieGen: "PCIe Gen5 x4", dwpd: 1, formFactor: "E3.S", nvmeVersion: "NVMe 2.0", powerActiveW: 18 }, googleZ3Reference, hpeE3sReference);
    expect(result.verdict).toBe("성능 갭");
    expect(result.performanceScore).toBe(80);
    expect(result.reviews.some((review) => review.severity === "blocker")).toBe(false);
  });

  it("flags Samsung PM1743's published random-write value as a performance gap without inventing a physical mismatch", () => {
    const result = analyzeSsdSuitability({ capacityGb: 15360, readIops: 2500000, writeIops: 360000, readMBps: 14000, writeMBps: 7100, pcieGen: "PCIe 5.0 x4", dwpd: 1, formFactor: "E3.S", nvmeVersion: null, powerActiveW: null }, googleZ3Reference, hpeE3sReference);
    expect(result.verdict).toBe("성능 갭");
    expect(result.performanceScore).toBe(80);
    expect(result.gapCount).toBe(1);
    expect(result.reviews.some((review) => review.severity === "blocker")).toBe(false);
  });
});
