import type { HyperscalerProfile } from "@/data/hyperscalers";

export type ProfileComparisonAxis = {
  label: string;
  value: (profile: HyperscalerProfile) => string;
};

export const profileComparisonAxes: ProfileComparisonAxis[] = [
  { label: "SERVER PLATFORM", value: profile => profile.cpu },
  { label: "HOST / I-O PATH", value: profile => profile.architecture },
  { label: "LOCAL SSD LAYOUT", value: profile => profile.localStorage },
  {
    label: "READ / WRITE IOPS",
    value: profile =>
      `${profile.readIopsM ? `${profile.readIopsM}M` : "공개 없음"} / ${profile.writeIopsM ? `${profile.writeIopsM}M` : "공개 없음"}`,
  },
  {
    label: "THROUGHPUT",
    value: profile => `${profile.readThroughput} · ${profile.writeThroughput}`,
  },
  { label: "NETWORK CEILING", value: profile => profile.networkLabel },
  { label: "PERSISTENCE MODEL", value: profile => profile.persistence },
];

function csvCell(value: string) {
  const formulaSafeValue = /^[\t\r\n ]*[=+\-@]/.test(value)
    ? `'${value}`
    : value;
  return `"${formulaSafeValue.replaceAll('"', '""')}"`;
}

export function buildProfileComparisonCsv(profiles: HyperscalerProfile[]) {
  const rows = [
    ["COMPARISON AXIS", ...profiles.map(profile => profile.provider)],
    ["PROFILE", ...profiles.map(profile => profile.profile)],
    ...profileComparisonAxes.map(axis => [
      axis.label,
      ...profiles.map(profile => axis.value(profile)),
    ]),
  ];

  return `\uFEFF${rows
    .map(row => row.map(value => csvCell(value)).join(","))
    .join("\r\n")}`;
}

export function downloadProfileComparisonCsv(
  profiles: HyperscalerProfile[],
  documentRef: Document = document,
  urlRef: typeof URL = URL
) {
  if (!profiles.length) return false;

  const blob = new Blob([buildProfileComparisonCsv(profiles)], {
    type: "text/csv;charset=utf-8",
  });
  const objectUrl = urlRef.createObjectURL(blob);
  const anchor = documentRef.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `signal-ledger-profile-comparison-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  anchor.click();
  urlRef.revokeObjectURL(objectUrl);
  return true;
}
