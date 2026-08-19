import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { sources } from "@/data/hyperscalers";
import { serverCatalog, ssdCatalog } from "@/data/hardwareCatalog";
import {
  filterSourceRegistry,
  sourceRegistryDocuments,
  sourceRegistryStats,
  supplementalSourceUrls,
} from "./sourceRegistry";

describe("source registry", () => {
  it("includes every URL recorded in the repository research notes", () => {
    const notePaths = [
      new URL("../../../research_notes.md", import.meta.url),
      new URL("../../../product_seed_research.md", import.meta.url),
    ];
    const documentedUrls = notePaths.flatMap(path =>
      [...readFileSync(path, "utf8").matchAll(/https:\/\/[^\s|·]+/g)].map(
        match => match[0].replace(/[),.]+$/g, "")
      )
    );
    const registeredUrls = new Set(
      sourceRegistryDocuments.map(document => document.url)
    );

    expect(documentedUrls.length).toBeGreaterThan(0);
    for (const url of documentedUrls)
      expect(registeredUrls.has(url)).toBe(true);
  });

  it("contains every data source exactly once by URL", () => {
    const urls = sourceRegistryDocuments.map(document => document.url);
    const expectedUrls = [
      ...sources.map(source => source.url),
      ...serverCatalog.map(item => item.sourceUrl),
      ...ssdCatalog.map(item => item.sourceUrl),
    ];

    expect(new Set(urls).size).toBe(urls.length);
    for (const url of expectedUrls) expect(urls).toContain(url);
  });

  it("includes every supplemental cross-validation document", () => {
    const urls = new Set(sourceRegistryDocuments.map(document => document.url));

    for (const url of Object.values(supplementalSourceUrls)) {
      expect(urls.has(url)).toBe(true);
      expect(
        sourceRegistryDocuments.find(document => document.url === url)
          ?.categories
      ).toContain("cross-validation");
    }
  });

  it("links all product records to their provenance document", () => {
    expect(sourceRegistryStats.coveredProductRecords).toBe(
      sourceRegistryStats.productRecords
    );

    for (const item of serverCatalog) {
      const document = sourceRegistryDocuments.find(
        candidate => candidate.url === item.sourceUrl
      );
      expect(document?.linkedRecords).toContainEqual(
        expect.objectContaining({ kind: "server", id: item.id })
      );
    }

    for (const item of ssdCatalog) {
      const document = sourceRegistryDocuments.find(
        candidate => candidate.url === item.sourceUrl
      );
      expect(document?.linkedRecords).toContainEqual(
        expect.objectContaining({ kind: "ssd", id: item.id })
      );
    }
  });

  it("searches linked products and respects the category filter", () => {
    const result = filterSourceRegistry(
      sourceRegistryDocuments,
      "ssd",
      "PM1743"
    );

    expect(result.length).toBeGreaterThan(0);
    expect(result.every(document => document.categories.includes("ssd"))).toBe(
      true
    );
    expect(
      result.some(document =>
        document.linkedRecords.some(item => item.label.includes("PM1743"))
      )
    ).toBe(true);
  });

  it("keeps stable document IDs when filters change the visible order", () => {
    const awsUrl = sources.find(source => source.publisher === "AWS")!.url;
    const allDocument = sourceRegistryDocuments.find(
      document => document.url === awsUrl
    );
    const filteredDocument = filterSourceRegistry(
      sourceRegistryDocuments,
      "hyperscaler",
      "AWS"
    ).find(document => document.url === awsUrl);

    expect(filteredDocument?.id).toBe(allDocument?.id);
    expect(filteredDocument?.id).toMatch(/^REF-[A-Z0-9]{7}$/);
  });
});
