import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const dbMocks = vi.hoisted(() => ({
  createSsdCandidates: vi.fn(), deleteSsdCandidate: vi.fn(), listSsdCandidates: vi.fn(),
  createServerCandidates: vi.fn(), deleteServerCandidate: vi.fn(), listServerCandidates: vi.fn(),
}));
vi.mock("./db", () => dbMocks);
import { appRouter } from "./routers";

function createContext(): TrpcContext {
  return { user: { id: 77, openId: "server-owner", email: null, name: "Server Owner", loginMethod: "manus", role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() }, req: { protocol: "https", headers: {} } as TrpcContext["req"], res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"] };
}

const server = {
  manufacturer: "Example ODM", model: "Reference chassis", rackUnits: 2, powerCapacityW: 1600, powerSupplyCount: 2,
  cpuModel: "Example CPU", cpuSockets: 2, cpuCores: 128, memoryGiB: 1406, networkGbps: 200,
  ssdFormFactor: "E3.S", ssdInterface: "NVMe", ssdProtocol: "NVMe", ssdCount: 12, ssdCapacityPerDriveGb: 3221,
  ssdAggregateIops: null, ssdReadIops: 9000000, ssdWriteIops: 6000000, ssdAggregateMBps: null, ssdReadMBps: 36000, ssdWriteMBps: 30000,
  sourceFileName: "server-candidates.csv", sourceUrl: "https://example.internal/server", notes: "Qualification profile",
};

describe("serverCandidate router", () => {
  beforeEach(() => vi.clearAllMocks());
  it("normalizes rack size and writes server data under the authenticated user", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.serverCandidate.create(server)).resolves.toEqual({ success: true });
    expect(dbMocks.createServerCandidates).toHaveBeenCalledWith(77, [expect.objectContaining({ rackUnits: "2.00", ssdCount: 12, ssdProtocol: "NVMe" })]);
  });
  it("imports a bounded server batch and scopes deletion to the current user", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.serverCandidate.importMany({ candidates: [server, { ...server, model: "Second chassis" }] })).resolves.toEqual({ success: true, imported: 2 });
    await expect(caller.serverCandidate.delete({ id: 13 })).resolves.toEqual({ success: true });
    expect(dbMocks.deleteServerCandidate).toHaveBeenCalledWith(77, 13);
  });
});
