import { describe, expect, it } from "vitest";
import { analyzeSsdSuitability } from "./ssdFitAnalysis";

const profile = {
  id: "gcp-z3", provider: "Google Cloud", profile: "Z3 highmem", ssdReference: { capacityGb: 3221, readIops: 750000, writeIops: 500000, readMBps: 3000, writeMBps: 2500, pcieGen: null, dwpd: null },
  serverReference: { rackUnits: null, powerCapacityW: null, ssdFormFactor: null, ssdInterface: "NVMe", ssdProtocol: "NVMe" },
};

describe("analyzeSsdSuitability", () => {
  it("marks a candidate meeting all disclosed performance values as priority review and keeps undisclosed rack/power outside the score", () => {
    const result = analyzeSsdSuitability({ capacityGb: 3840, readIops: 900000, writeIops: 600000, readMBps: 7000, writeMBps: 5000, pcieGen: "PCIe 5.0", dwpd: 3, formFactor: "E3.S", nvmeVersion: "NVMe 2.0", powerActiveW: 20 }, profile, { model: "Internal 2U", rackUnits: 2, powerCapacityW: 1600, ssdCount: 12, ssdFormFactor: "E3.S", ssdInterface: "PCIe 5.0 x4", ssdProtocol: "NVMe" });
    expect(result.verdict).toBe("우선 검토");
    expect(result.performanceScore).toBe(100);
    expect(result.reviews.some((review) => review.label === "랙 크기" && review.severity === "info")).toBe(true);
    expect(result.reviews.some((review) => review.label === "SSD 전력 예산" && review.detail.includes("240.0 W"))).toBe(true);
  });

  it("does not present a physical form-factor mismatch as a performance score", () => {
    const result = analyzeSsdSuitability({ capacityGb: 3840, readIops: 900000, writeIops: 600000, readMBps: 7000, writeMBps: 5000, pcieGen: "PCIe 5.0", dwpd: null, formFactor: "U.2", nvmeVersion: "NVMe 2.0", powerActiveW: null }, profile, { model: "Internal 1U", rackUnits: 1, powerCapacityW: 800, ssdCount: 8, ssdFormFactor: "E3.S", ssdInterface: "PCIe 5.0", ssdProtocol: "NVMe" });
    expect(result.performanceScore).toBe(100);
    expect(result.verdict).toBe("물리 호환성 확인");
    expect(result.reviews.some((review) => review.severity === "blocker")).toBe(true);
  });
});
