import { describe, expect, it } from "vitest";
import { addLocalSsdCandidates, readLocalSsdCandidates, removeLocalSsdCandidate, writeLocalSsdCandidates, type LocalSsdCandidateInput } from "./localSsdCandidates";

const input = (model: string): LocalSsdCandidateInput => ({
  manufacturer: "Samsung",
  model,
  formFactor: "U.2",
  capacityGb: 3840,
  pcieGen: "PCIe 5.0",
  nvmeVersion: "NVMe 2.0",
  readIops: 900_000,
  writeIops: 500_000,
  readMBps: 7_000,
  writeMBps: 5_000,
  dwpd: 1,
  enduranceTbw: 7_000,
  powerActiveW: 20,
  powerLossProtection: "verified",
  encryption: "verified",
  sourceFileName: null,
  sourceUrl: null,
  notes: null,
});

function memoryStorage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) };
}

describe("local SSD candidates", () => {
  it("adds, persists, restores, and removes guest candidates", () => {
    const storage = memoryStorage();
    const added = addLocalSsdCandidates([], [input("SSD A"), input("SSD B")], new Date("2026-08-19T10:00:00Z"));
    expect(added.map((candidate) => candidate.model)).toEqual(["SSD B", "SSD A"]);
    writeLocalSsdCandidates(storage, added);
    expect(readLocalSsdCandidates(storage)).toEqual(added);
    expect(removeLocalSsdCandidate(added, added[0].id)).toEqual([added[1]]);
  });

  it("ignores invalid browser data", () => {
    const storage = memoryStorage();
    storage.setItem("hyperscaler-ssd-candidates-v1", JSON.stringify([{ id: 1, model: "missing capacity" }]));
    expect(readLocalSsdCandidates(storage)).toEqual([]);
  });
});
