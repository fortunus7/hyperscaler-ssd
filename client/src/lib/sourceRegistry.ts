import { profiles, sources } from "@/data/hyperscalers";
import { serverCatalog, ssdCatalog } from "@/data/hardwareCatalog";

export type SourceRegistryCategory =
  | "hyperscaler"
  | "server"
  | "ssd"
  | "cross-validation";

export type SourceRegistryRecord = {
  kind: "profile" | "server" | "ssd";
  id: string;
  label: string;
};

export type SourceRegistryDocument = {
  id: string;
  url: string;
  label: string;
  publisher: string;
  categories: SourceRegistryCategory[];
  referenceLabels: string[];
  sourceIds: number[];
  linkedRecords: SourceRegistryRecord[];
};

type RegistryInput = Omit<
  SourceRegistryDocument,
  "id" | "categories" | "referenceLabels" | "sourceIds" | "linkedRecords"
> & {
  category: SourceRegistryCategory;
  referenceLabel?: string;
  sourceId?: number;
  linkedRecords?: SourceRegistryRecord[];
};

export const supplementalSourceUrls = {
  awsI4iAnnouncement:
    "https://aws.amazon.com/blogs/aws/new-storage-optimized-amazon-ec2-instances-i4i-powered-by-intel-xeon-scalable-ice-lake-processors/",
  samsungEnterpriseSsdIndex:
    "https://semiconductor.samsung.com/ssd/enterprise-ssd/",
  kioxiaCm7vBrief:
    "https://www.kioxia.com/content/dam/kioxia/shared/business/ssd/enterprise-ssd/asset/productbrief/eSSD-CM7-V-E3.S-product-brief.pdf",
  sandiskSn861U2Datasheet:
    "https://documents.sandisk.com/content/dam/asset-library/en_us/assets/public/sandisk/product/internal-drives/sn861-nvme-ssd/data-sheet-sandisk-sn861-nvme-ssd-u2.pdf",
  dapustorHaishen3Brief:
    "https://en.dapustor.com/uploads/pdf/DapuStor%20-%20Haishen3(EN)_v1.12.pdf",
} as const;

const record = (
  kind: SourceRegistryRecord["kind"],
  id: string,
  label: string
): SourceRegistryRecord => ({ kind, id, label });

function stableReferenceId(url: string) {
  let hash = 2166136261;
  for (let index = 0; index < url.length; index += 1) {
    hash ^= url.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `REF-${(hash >>> 0).toString(36).toUpperCase().padStart(7, "0")}`;
}

const supplementalSources: RegistryInput[] = [
  {
    url: supplementalSourceUrls.awsI4iAnnouncement,
    label: "Amazon EC2 I4i 출시 발표",
    publisher: "AWS",
    category: "cross-validation",
    linkedRecords: [record("profile", "aws-i4i", "AWS · EC2 I4i.32xlarge")],
  },
  {
    url: supplementalSourceUrls.samsungEnterpriseSsdIndex,
    label: "Samsung Enterprise SSD 제품 인덱스",
    publisher: "Samsung",
    category: "cross-validation",
    linkedRecords: ssdCatalog
      .filter(item => item.manufacturer === "Samsung")
      .map(item =>
        record("ssd", item.id, `${item.manufacturer} · ${item.model}`)
      ),
  },
  {
    url: supplementalSourceUrls.kioxiaCm7vBrief,
    label: "KIOXIA CM7-V E3.S Product Brief",
    publisher: "KIOXIA",
    category: "cross-validation",
    linkedRecords: ssdCatalog
      .filter(item => item.id === "kioxia-cm7-v-e3s-3tb")
      .map(item =>
        record("ssd", item.id, `${item.manufacturer} · ${item.model}`)
      ),
  },
  {
    url: supplementalSourceUrls.sandiskSn861U2Datasheet,
    label: "SanDisk DC SN861 U.2 Data Sheet",
    publisher: "SanDisk",
    category: "cross-validation",
    linkedRecords: ssdCatalog
      .filter(item => item.id === "sandisk-dc-sn861-u2-1-6tb")
      .map(item =>
        record("ssd", item.id, `${item.manufacturer} · ${item.model}`)
      ),
  },
  {
    url: supplementalSourceUrls.dapustorHaishen3Brief,
    label: "DapuStor Haishen3 Product Brief",
    publisher: "DapuStor",
    category: "cross-validation",
    linkedRecords: ssdCatalog
      .filter(item => item.id === "dapustor-h3100-u2-1-6tb")
      .map(item =>
        record("ssd", item.id, `${item.manufacturer} · ${item.model}`)
      ),
  },
];

function buildSourceRegistry(): SourceRegistryDocument[] {
  const documents = new Map<string, SourceRegistryDocument>();

  const addDocument = (input: RegistryInput) => {
    const existing = documents.get(input.url);
    const document =
      existing ??
      ({
        id: "",
        url: input.url,
        label: input.label,
        publisher: input.publisher,
        categories: [],
        referenceLabels: [],
        sourceIds: [],
        linkedRecords: [],
      } satisfies SourceRegistryDocument);

    if (!document.categories.includes(input.category)) {
      document.categories.push(input.category);
    }

    const referenceLabel = input.referenceLabel ?? input.label;
    if (!document.referenceLabels.includes(referenceLabel)) {
      document.referenceLabels.push(referenceLabel);
    }

    if (input.sourceId && !document.sourceIds.includes(input.sourceId)) {
      document.sourceIds.push(input.sourceId);
    }

    for (const linkedRecord of input.linkedRecords ?? []) {
      const isPresent = document.linkedRecords.some(
        item => item.kind === linkedRecord.kind && item.id === linkedRecord.id
      );
      if (!isPresent) document.linkedRecords.push(linkedRecord);
    }

    documents.set(input.url, document);
  };

  for (const source of sources) {
    addDocument({
      url: source.url,
      label: source.label,
      publisher: source.publisher,
      category: "hyperscaler",
      sourceId: source.id,
      linkedRecords: profiles
        .filter(profile => profile.sourceIds.includes(source.id))
        .map(profile =>
          record(
            "profile",
            profile.id,
            `${profile.provider} · ${profile.profile}`
          )
        ),
    });
  }

  for (const item of serverCatalog) {
    addDocument({
      url: item.sourceUrl,
      label: item.sourceLabel,
      publisher: item.manufacturer,
      category: "server",
      referenceLabel: item.sourceLabel,
      linkedRecords: [
        record("server", item.id, `${item.manufacturer} · ${item.model}`),
      ],
    });
  }

  for (const item of ssdCatalog) {
    addDocument({
      url: item.sourceUrl,
      label: item.sourceLabel,
      publisher: item.manufacturer,
      category: "ssd",
      referenceLabel: item.sourceLabel,
      linkedRecords: [
        record("ssd", item.id, `${item.manufacturer} · ${item.model}`),
      ],
    });
  }

  supplementalSources.forEach(addDocument);

  return Array.from(documents.values())
    .sort(
      (a, b) =>
        a.publisher.localeCompare(b.publisher, "ko") ||
        a.label.localeCompare(b.label, "ko")
    )
    .map(document => ({
      ...document,
      id: stableReferenceId(document.url),
    }));
}

export const sourceRegistryDocuments = buildSourceRegistry();

const coveredProductRecords = new Set(
  sourceRegistryDocuments.flatMap(document =>
    document.linkedRecords
      .filter(item => item.kind === "server" || item.kind === "ssd")
      .map(item => `${item.kind}:${item.id}`)
  )
).size;

export const sourceRegistryStats = {
  uniqueDocuments: sourceRegistryDocuments.length,
  productRecords: serverCatalog.length + ssdCatalog.length,
  coveredProductRecords,
  profileRecords: profiles.length,
  coveredProfileRecords: new Set(
    sourceRegistryDocuments.flatMap(document =>
      document.linkedRecords
        .filter(item => item.kind === "profile")
        .map(item => item.id)
    )
  ).size,
} as const;

export function filterSourceRegistry(
  documents: SourceRegistryDocument[],
  category: "all" | SourceRegistryCategory,
  query: string
) {
  const normalizedQuery = query.trim().toLocaleLowerCase("ko");

  return documents.filter(document => {
    if (category !== "all" && !document.categories.includes(category))
      return false;
    if (!normalizedQuery) return true;

    return [
      document.label,
      document.publisher,
      document.url,
      ...document.referenceLabels,
      ...document.linkedRecords.map(item => item.label),
    ].some(value => value.toLocaleLowerCase("ko").includes(normalizedQuery));
  });
}
