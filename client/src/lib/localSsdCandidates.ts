import type { SsdCandidateMetrics } from "@shared/ssdComparison";

export const LOCAL_SSD_CANDIDATES_KEY = "hyperscaler-ssd-candidates-v1";

export type CandidateAssurance = "verified" | "not_verified" | "unknown";

export type LocalSsdCandidateInput = SsdCandidateMetrics & {
  manufacturer: string;
  model: string;
  formFactor: string | null;
  nvmeVersion: string | null;
  enduranceTbw: number | null;
  powerActiveW: number | null;
  powerLossProtection: CandidateAssurance;
  encryption: CandidateAssurance;
  sourceFileName: string | null;
  sourceUrl: string | null;
  notes: string | null;
};

export type LocalSsdCandidate = LocalSsdCandidateInput & {
  id: number;
  createdAt: string;
  updatedAt: string;
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function isCandidate(value: unknown): value is LocalSsdCandidate {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LocalSsdCandidate>;
  return Number.isSafeInteger(candidate.id)
    && typeof candidate.manufacturer === "string"
    && typeof candidate.model === "string"
    && candidate.model.trim().length > 0
    && typeof candidate.capacityGb === "number"
    && Number.isFinite(candidate.capacityGb)
    && candidate.capacityGb > 0;
}

export function readLocalSsdCandidates(storage: StorageLike): LocalSsdCandidate[] {
  try {
    const raw = storage.getItem(LOCAL_SSD_CANDIDATES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCandidate) : [];
  } catch {
    return [];
  }
}

export function writeLocalSsdCandidates(storage: StorageLike, candidates: LocalSsdCandidate[]) {
  storage.setItem(LOCAL_SSD_CANDIDATES_KEY, JSON.stringify(candidates));
}

export function addLocalSsdCandidates(
  current: LocalSsdCandidate[],
  inputs: LocalSsdCandidateInput[],
  now = new Date(),
): LocalSsdCandidate[] {
  const timestamp = now.toISOString();
  const firstId = current.reduce((maximum, candidate) => Math.max(maximum, candidate.id), 0) + 1;
  const created = inputs.map((input, index) => ({ ...input, id: firstId + index, createdAt: timestamp, updatedAt: timestamp }));
  return [...created.reverse(), ...current];
}

export function removeLocalSsdCandidate(current: LocalSsdCandidate[], id: number) {
  return current.filter((candidate) => candidate.id !== id);
}
