import { describe, expect, it } from "vitest";
import { compareCandidateToReference } from "../shared/ssdComparison";

describe("compareCandidateToReference", () => {
  it("scores only public, comparable reference metrics and leaves undisclosed fields out", () => {
    const result = compareCandidateToReference(
      { capacityGb: 3840, readIops: 900000, writeIops: 500000, readMBps: 7000, writeMBps: null, pcieGen: "PCIe 5.0", dwpd: 3 },
      { capacityGb: 3750, readIops: 750000, writeIops: 600000, readMBps: null, writeMBps: null, pcieGen: null, dwpd: null },
    );

    expect(result.score).toBe(67);
    expect(result.comparableCount).toBe(3);
    expect(result.metrics.find((metric) => metric.key === "writeIops")?.status).toBe("gap");
    expect(result.metrics.find((metric) => metric.key === "dwpd")?.status).toBe("public_undisclosed");
  });
});
