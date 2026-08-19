import { describe, expect, it } from "vitest";
import {
  addLocalServerCandidates,
  LOCAL_SERVER_CANDIDATES_KEY,
  readLocalServerCandidates,
  removeLocalServerCandidate,
  writeLocalServerCandidates,
  type LocalServerCandidateInput,
} from "./localServerCandidates";

const input = (model: string): LocalServerCandidateInput => ({
  manufacturer: "Example",
  model,
  rackUnits: 2,
  powerCapacityW: 1600,
  powerSupplyCount: 2,
  cpuModel: "Example CPU",
  cpuSockets: 2,
  cpuCores: 128,
  memoryGiB: 1024,
  networkGbps: 200,
  ssdFormFactor: "U.2",
  ssdInterface: "PCIe 5.0 x4",
  ssdProtocol: "NVMe 2.0",
  ssdCount: 8,
  ssdCapacityPerDriveGb: 3840,
  ssdAggregateIops: 1_200_000,
  ssdReadIops: 900_000,
  ssdWriteIops: 500_000,
  ssdAggregateMBps: 12_000,
  ssdReadMBps: 7_000,
  ssdWriteMBps: 5_000,
  sourceFileName: null,
  sourceUrl: null,
  notes: null,
});

function memoryStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

describe("local server candidates", () => {
  it("adds, persists, restores, and removes guest candidates", () => {
    const storage = memoryStorage();
    const added = addLocalServerCandidates([], [input("Server A"), input("Server B")], new Date("2026-08-19T10:00:00Z"));

    expect(added.map((candidate) => candidate.model)).toEqual(["Server B", "Server A"]);
    expect(new Set(added.map((candidate) => candidate.id)).size).toBe(2);

    writeLocalServerCandidates(storage, added);
    expect(storage.getItem(LOCAL_SERVER_CANDIDATES_KEY)).not.toBeNull();
    expect(readLocalServerCandidates(storage)).toEqual(added);
    expect(removeLocalServerCandidate(added, added[0].id)).toEqual([added[1]]);
  });

  it("treats malformed browser data as an empty library", () => {
    const storage = memoryStorage();
    storage.setItem(LOCAL_SERVER_CANDIDATES_KEY, "not-json");
    expect(readLocalServerCandidates(storage)).toEqual([]);
  });
});
