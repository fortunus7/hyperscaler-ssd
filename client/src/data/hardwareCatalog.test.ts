import { describe, expect, it } from "vitest";
import { catalogStats, serverCatalog, ssdCatalog } from "./hardwareCatalog";

describe("official hardware catalog", () => {
  it("keeps the researched minimum product coverage and official provenance", () => {
    expect(serverCatalog.length).toBeGreaterThanOrEqual(28);
    expect(ssdCatalog.length).toBeGreaterThanOrEqual(30);
    expect(catalogStats.serverVendors).toBeGreaterThanOrEqual(9);
    expect(catalogStats.ssdVendors).toBeGreaterThanOrEqual(10);
    for (const item of [...serverCatalog, ...ssdCatalog]) {
      expect(item.sourceUrl).toMatch(/^https:\/\//);
      expect(item.sourceRetrievedAt).toBe("2026-08-19");
      expect(["A", "B", "C"]).toContain(item.sourceConfidence);
      expect(item.valueScope.length).toBeGreaterThan(0);
    }
  });

  it("keeps model-specific storage options and sources", () => {
    const r660 = serverCatalog.find(({ id }) => id === "dell-poweredge-r660");
    expect(r660).toMatchObject({
      storageOptions: [
        { envelope: "2.5-inch", interfaces: ["U.2"], bayCount: 10, pcieGen: 5 },
        { envelope: "E3.S", interfaces: ["E3.S"], bayCount: 16, pcieGen: 5 },
      ],
    });

    const supermicro121 = serverCatalog.find(
      ({ id }) => id === "supermicro-sys-121h-tnr"
    );
    expect(supermicro121).toMatchObject({
      storageOptions: [
        { envelope: "2.5-inch", interfaces: [], bayCount: 12, pcieGen: 5 },
      ],
      sourceUrl:
        "https://www.supermicro.com/en/products/system/hyper/1u/sys-121h-tnr",
    });

    const supermicro221 = serverCatalog.find(
      ({ id }) => id === "supermicro-sys-221h-tnr"
    );
    expect(supermicro221).toMatchObject({
      storageOptions: [
        { envelope: "2.5-inch", interfaces: [], bayCount: 16, pcieGen: 5 },
      ],
      sourceUrl:
        "https://www.supermicro.com/en/products/system/datasheet/SYS-221H-TNR",
    });

    const rx2530 = serverCatalog.find(
      ({ id }) => id === "fujitsu-primergy-rx2530-m7"
    );
    expect(rx2530).toMatchObject({
      cpu: "4th/5th Gen Intel Xeon Scalable",
      maxMemoryTb: 8,
      storageOptions: [
        {
          envelope: "2.5-inch",
          interfaces: [],
          bayCount: 10,
          pcieGen: null,
        },
      ],
    });

    const rx2540 = serverCatalog.find(
      ({ id }) => id === "fujitsu-primergy-rx2540-m7"
    );
    expect(rx2540).toMatchObject({
      cpu: "4th/5th Gen Intel Xeon Scalable",
      maxMemoryTb: 8,
      storageOptions: [
        {
          envelope: "2.5-inch",
          interfaces: [],
          bayCount: 24,
          pcieGen: null,
        },
      ],
    });
  });

  it("keeps catalog identifiers, provenance, statistics, and storage shapes valid", () => {
    const allItems = [...serverCatalog, ...ssdCatalog];
    const officialDomains = new Set([
      "www.dell.com",
      "www.hpe.com",
      "lenovopress.lenovo.com",
      "www.supermicro.com",
      "www.nvidia.com",
      "www.cisco.com",
      "mkt-europe.global.fujitsu.com",
      "sp.ts.fujitsu.com",
      "download.gigabyte.com",
      "www.gigabyte.com",
      "servers.asus.com",
      "semiconductor.samsung.com",
      "www.solidigm.com",
      "americas.kioxia.com",
      "www.micron.com",
      "www.sandisk.com",
      "product.skhynix.com",
      "en.dapustor.com",
      "www.kingston.com",
      "www.memblaze.com",
      "www.seagate.com",
    ]);
    const envelopes = new Set(["2.5-inch", "E1.S", "E3.S", "M.2"]);
    const interfaces = new Set(["U.2", "U.3", "E1.S", "E3.S", "M.2"]);
    expect(new Set(allItems.map(item => item.id)).size).toBe(allItems.length);
    expect(catalogStats).toMatchObject({
      serverCount: serverCatalog.length,
      ssdCount: ssdCatalog.length,
      serverVendors: new Set(serverCatalog.map(item => item.manufacturer)).size,
      ssdVendors: new Set(ssdCatalog.map(item => item.manufacturer)).size,
    });

    const scopes = ["제품군 공개 최대값", "제품군 대표 최대값", "명시 SKU 값"];
    for (const item of allItems) {
      expect(scopes).toContain(item.valueScope);
      const source = new URL(item.sourceUrl);
      expect(source.protocol).toBe("https:");
      expect(officialDomains.has(source.hostname)).toBe(true);
    }

    for (const item of serverCatalog) {
      expect(item.storageOptions.length).toBeGreaterThan(0);
      for (const option of item.storageOptions) {
        expect(envelopes.has(option.envelope)).toBe(true);
        expect(new Set(option.interfaces).size).toBe(option.interfaces.length);
        expect(option.interfaces.every(value => interfaces.has(value))).toBe(
          true
        );
        expect(option.bayCount === null || option.bayCount > 0).toBe(true);
        expect(option.pcieGen === null || option.pcieGen > 0).toBe(true);
      }
    }
    for (const item of ssdCatalog) {
      expect(item.interfaces.length).toBeGreaterThan(0);
      expect(envelopes.has(item.envelope)).toBe(true);
      expect(item.interfaces.every(value => interfaces.has(value))).toBe(true);
    }
  });

  it("uses stable capacity-bearing IDs and preserves disclosed power basis", () => {
    expect(ssdCatalog.some(item => item.id.endsWith("u2-1tb"))).toBe(false);
    expect(
      ssdCatalog.find(item => item.id === "dapustor-h3100-u2-1-6tb")
    ).toMatchObject({ activePowerW: 7.5, powerBasis: "typical" });
  });

  it("covers current server and SSD vendors, form factors, and PCIe generations", () => {
    const serverVendors = new Set(serverCatalog.map(item => item.manufacturer));
    const ssdVendors = new Set(ssdCatalog.map(item => item.manufacturer));
    for (const vendor of ["Cisco", "FUJITSU", "GIGABYTE", "ASUS"]) {
      expect(serverVendors.has(vendor)).toBe(true);
    }
    for (const vendor of ["Kingston", "Memblaze", "Seagate"]) {
      expect(ssdVendors.has(vendor)).toBe(true);
    }
    expect(new Set(ssdCatalog.map(item => item.envelope))).toEqual(
      new Set(["2.5-inch", "E1.S", "E3.S", "M.2"])
    );
    const pcieGenerations = new Set(ssdCatalog.map(item => item.pcieGen));
    for (const generation of [3, 4, 5]) {
      expect(pcieGenerations.has(generation)).toBe(true);
    }
  });
});
