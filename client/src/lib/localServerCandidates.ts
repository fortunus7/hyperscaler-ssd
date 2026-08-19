import type { ServerCandidateMetrics } from "@shared/serverComparison";

export const LOCAL_SERVER_CANDIDATES_KEY = "hyperscaler-ssd-server-candidates-v1";

export type LocalServerCandidateInput = ServerCandidateMetrics & {
  manufacturer: string;
  model: string;
  powerSupplyCount: number | null;
  cpuModel: string | null;
  cpuSockets: number | null;
  sourceFileName: string | null;
  sourceUrl: string | null;
  notes: string | null;
};

export type LocalServerCandidate = LocalServerCandidateInput & {
  id: number;
  createdAt: string;
  updatedAt: string;
};

type StorageLike = Pick<Storage, "getItem" | "setItem">;

function isCandidate(value: unknown): value is LocalServerCandidate {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<LocalServerCandidate>;
  return Number.isSafeInteger(candidate.id)
    && typeof candidate.manufacturer === "string"
    && candidate.manufacturer.trim().length > 0
    && typeof candidate.model === "string"
    && candidate.model.trim().length > 0;
}

export function readLocalServerCandidates(storage: StorageLike): LocalServerCandidate[] {
  try {
    const raw = storage.getItem(LOCAL_SERVER_CANDIDATES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCandidate) : [];
  } catch {
    return [];
  }
}

export function writeLocalServerCandidates(storage: StorageLike, candidates: LocalServerCandidate[]) {
  storage.setItem(LOCAL_SERVER_CANDIDATES_KEY, JSON.stringify(candidates));
}

export function addLocalServerCandidates(
  current: LocalServerCandidate[],
  inputs: LocalServerCandidateInput[],
  now = new Date(),
): LocalServerCandidate[] {
  const timestamp = now.toISOString();
  const firstId = current.reduce((maximum, candidate) => Math.max(maximum, candidate.id), 0) + 1;
  const created = inputs.map((input, index) => ({
    ...input,
    id: firstId + index,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
  return [...created.reverse(), ...current];
}

export function removeLocalServerCandidate(current: LocalServerCandidate[], id: number) {
  return current.filter((candidate) => candidate.id !== id);
}
