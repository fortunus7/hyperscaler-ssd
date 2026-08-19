import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createSsdCandidates: vi.fn(),
  deleteSsdCandidate: vi.fn(),
  listSsdCandidates: vi.fn(),
  createServerCandidates: vi.fn(),
  deleteServerCandidate: vi.fn(),
  listServerCandidates: vi.fn(),
}));

vi.mock("./db", () => dbMocks);

import { appRouter } from "./routers";

function createContext(): TrpcContext {
  return {
    user: {
      id: 42,
      openId: "candidate-owner",
      email: null,
      name: "Candidate Owner",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const candidate = {
  manufacturer: "Samsung" as const,
  model: "Qualification sample",
  formFactor: "E3.S",
  capacityGb: 3840,
  pcieGen: "PCIe 5.0",
  nvmeVersion: "NVMe 2.0",
  readIops: 900000,
  writeIops: 500000,
  readMBps: 7000,
  writeMBps: 5000,
  dwpd: 3,
  enduranceTbw: 28000,
  powerActiveW: 18.5,
  powerLossProtection: "verified" as const,
  encryption: "verified" as const,
  sourceFileName: "qualification.csv",
  sourceUrl: "https://example.internal/spec",
  notes: "4K random mixed workload disclosure pending",
};

describe("ssdCandidate router", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes decimal fields and saves a manual candidate under the authenticated user", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(caller.ssdCandidate.create(candidate)).resolves.toEqual({ success: true });

    expect(dbMocks.createSsdCandidates).toHaveBeenCalledWith(42, [expect.objectContaining({
      manufacturer: "Samsung",
      capacityGb: 3840,
      dwpd: "3.00",
      powerActiveW: "18.50",
    })]);
  });

  it("accepts a bounded batch import and scopes deletion to the authenticated user", async () => {
    const caller = appRouter.createCaller(createContext());

    await expect(caller.ssdCandidate.importMany({ candidates: [candidate, { ...candidate, model: "Second sample" }] })).resolves.toEqual({ success: true, imported: 2 });
    await expect(caller.ssdCandidate.delete({ id: 17 })).resolves.toEqual({ success: true });

    expect(dbMocks.createSsdCandidates).toHaveBeenCalledWith(42, expect.arrayContaining([expect.objectContaining({ model: "Qualification sample" })]));
    expect(dbMocks.deleteSsdCandidate).toHaveBeenCalledWith(42, 17);
  });
});
