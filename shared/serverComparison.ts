/** Public-profile comparison for server candidates. Physical data absent from VM catalogues is never inferred. */
export type ServerCandidateMetrics = {
  rackUnits: number | null;
  powerCapacityW: number | null;
  cpuCores: number | null;
  memoryGiB: number | null;
  networkGbps: number | null;
  ssdCount: number | null;
  ssdCapacityPerDriveGb: number | null;
  ssdAggregateIops: number | null;
  ssdReadIops: number | null;
  ssdWriteIops: number | null;
  ssdAggregateMBps: number | null;
  ssdReadMBps: number | null;
  ssdWriteMBps: number | null;
  ssdFormFactor: string | null;
  ssdInterface: string | null;
  ssdProtocol: string | null;
};

export type PublicServerReference = ServerCandidateMetrics;
export type ServerMetricKey = keyof PublicServerReference;
export type ServerMetricStatus = "meets" | "gap" | "candidate_missing" | "public_undisclosed" | "review";
export type ServerMetricAssessment = { key: ServerMetricKey; status: ServerMetricStatus; candidate: number | string | null; reference: number | string | null };

const numericKeys: ServerMetricKey[] = ["rackUnits", "powerCapacityW", "cpuCores", "memoryGiB", "networkGbps", "ssdCount", "ssdCapacityPerDriveGb", "ssdAggregateIops", "ssdReadIops", "ssdWriteIops", "ssdAggregateMBps", "ssdReadMBps", "ssdWriteMBps"];
const textKeys: ServerMetricKey[] = ["ssdFormFactor", "ssdInterface", "ssdProtocol"];

export function compareServerToReference(candidate: ServerCandidateMetrics, reference: PublicServerReference) {
  const metrics: ServerMetricAssessment[] = numericKeys.map((key) => {
    const target = reference[key] as number | null;
    const value = candidate[key] as number | null;
    if (target === null) return { key, status: "public_undisclosed", candidate: value, reference: null };
    if (value === null) return { key, status: "candidate_missing", candidate: null, reference: target };
    return { key, status: value >= target ? "meets" : "gap", candidate: value, reference: target };
  });
  const textMetrics: ServerMetricAssessment[] = textKeys.map((key): ServerMetricAssessment => {
    const target = reference[key] as string | null;
    const value = candidate[key] as string | null;
    if (target === null) return { key, status: "public_undisclosed", candidate: value, reference: null };
    if (value === null) return { key, status: "candidate_missing", candidate: null, reference: target };
    return { key, status: value.trim().toLowerCase() === target.trim().toLowerCase() ? "meets" : "review", candidate: value, reference: target };
  });
  metrics.push(...textMetrics);
  const comparable = metrics.filter((metric) => numericKeys.includes(metric.key) && (metric.status === "meets" || metric.status === "gap"));
  const meets = comparable.filter((metric) => metric.status === "meets").length;
  return { metrics, comparableCount: comparable.length, score: comparable.length ? Math.round((meets / comparable.length) * 100) : null };
}
