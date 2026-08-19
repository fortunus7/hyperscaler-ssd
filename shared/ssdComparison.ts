/**
 * Pure comparison logic. "Meets" means a candidate reaches a published, normalized
 * reference value; it never represents a supplier qualification or private hyperscaler BOM.
 */
export type SsdCandidateMetrics = {
  capacityGb: number;
  readIops: number | null;
  writeIops: number | null;
  readMBps: number | null;
  writeMBps: number | null;
  pcieGen: string | null;
  dwpd: number | null;
};

export type PublicProfileReference = {
  capacityGb: number | null;
  readIops: number | null;
  writeIops: number | null;
  readMBps: number | null;
  writeMBps: number | null;
  pcieGen: string | null;
  dwpd: number | null;
};

export type MetricStatus = "meets" | "gap" | "candidate_missing" | "public_undisclosed";

export type MetricAssessment = {
  key: keyof PublicProfileReference;
  status: MetricStatus;
  candidate: number | string | null;
  reference: number | string | null;
};

const numericKeys: (keyof PublicProfileReference)[] = ["capacityGb", "readIops", "writeIops", "readMBps", "writeMBps", "dwpd"];

export function compareCandidateToReference(candidate: SsdCandidateMetrics, reference: PublicProfileReference) {
  const metrics: MetricAssessment[] = numericKeys.map((key) => {
    const target = reference[key] as number | null;
    const value = candidate[key] as number | null;
    if (target === null) return { key, status: "public_undisclosed", candidate: value, reference: null };
    if (value === null) return { key, status: "candidate_missing", candidate: null, reference: target };
    return { key, status: value >= target ? "meets" : "gap", candidate: value, reference: target };
  });

  const targetPcie = reference.pcieGen;
  const candidatePcie = candidate.pcieGen;
  metrics.push({
    key: "pcieGen",
    candidate: candidatePcie,
    reference: targetPcie,
    status: targetPcie === null ? "public_undisclosed" : candidatePcie === null ? "candidate_missing" : candidatePcie === targetPcie ? "meets" : "gap",
  });

  const comparable = metrics.filter((metric) => metric.status === "meets" || metric.status === "gap");
  const meets = comparable.filter((metric) => metric.status === "meets").length;
  return {
    metrics,
    comparableCount: comparable.length,
    score: comparable.length > 0 ? Math.round((meets / comparable.length) * 100) : null,
  };
}
