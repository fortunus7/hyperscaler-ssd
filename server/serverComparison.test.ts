import { describe, expect, it } from "vitest";
import { compareServerToReference } from "../shared/serverComparison";

describe("compareServerToReference", () => {
  it("scores only numeric, publicly disclosed server metrics and preserves physical data as undisclosed", () => {
    const result = compareServerToReference(
      { rackUnits: 2, powerCapacityW: 1600, cpuCores: 128, memoryGiB: 1406, networkGbps: 100, ssdFormFactor: "E3.S", ssdInterface: "NVMe", ssdProtocol: "NVMe", ssdCount: 12, ssdCapacityPerDriveGb: 3221, ssdAggregateIops: null, ssdReadIops: 9000000, ssdWriteIops: 5000000, ssdAggregateMBps: null, ssdReadMBps: 36000, ssdWriteMBps: 20000 },
      { rackUnits: null, powerCapacityW: null, cpuCores: null, memoryGiB: 1406, networkGbps: 200, ssdFormFactor: null, ssdInterface: "NVMe", ssdProtocol: "NVMe", ssdCount: 12, ssdCapacityPerDriveGb: 3221, ssdAggregateIops: null, ssdReadIops: 9000000, ssdWriteIops: 6000000, ssdAggregateMBps: null, ssdReadMBps: 36000, ssdWriteMBps: 30000 },
    );

    expect(result.comparableCount).toBe(8);
    expect(result.score).toBe(63);
    expect(result.metrics.find((metric) => metric.key === "rackUnits")?.status).toBe("public_undisclosed");
    expect(result.metrics.find((metric) => metric.key === "ssdFormFactor")?.status).toBe("public_undisclosed");
    expect(result.metrics.find((metric) => metric.key === "ssdProtocol")?.status).toBe("meets");
  });
});
