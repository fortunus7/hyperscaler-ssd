import { sources, type HyperscalerProfile } from "@/data/hyperscalers";

export type SsdRequirementStatus = "baseline" | "verify" | "request";

export const ssdRequirementStatusLabels: Record<SsdRequirementStatus, string> =
  {
    baseline: "공개 기준 있음",
    verify: "구성 검증 필요",
    request: "문서 요청",
  };

export type SsdRequirementItem = {
  id: "performance" | "capacity" | "data-path" | "operations";
  label: string;
  status: SsdRequirementStatus;
  publicSignal: string;
  proposalRequirement: string;
  acceptanceCriteria: string;
  sourceIds: number[];
};

function formatInteger(value: number) {
  return new Intl.NumberFormat("ko-KR", { maximumFractionDigits: 0 }).format(
    value
  );
}

function publishedThroughput(value: string) {
  const normalized = value.trim().toLowerCase();
  return (
    Boolean(normalized) &&
    !normalized.includes("공개 없음") &&
    !normalized.includes("공개 범위 제한") &&
    !normalized.includes("확인 필요") &&
    !normalized.includes("not disclosed") &&
    normalized !== "n/d"
  );
}

function performanceSignal(profile: HyperscalerProfile) {
  const parts: string[] = [];
  if (profile.readIopsM !== null) parts.push(`읽기 ${profile.readIopsM}M IOPS`);
  if (profile.writeIopsM !== null)
    parts.push(`쓰기 ${profile.writeIopsM}M IOPS`);
  if (publishedThroughput(profile.readThroughput))
    parts.push(`읽기 처리량 ${profile.readThroughput}`);
  if (publishedThroughput(profile.writeThroughput))
    parts.push(`쓰기 처리량 ${profile.writeThroughput}`);
  return parts.length ? parts.join(" · ") : "IOPS·처리량 공개값 없음";
}

function arithmeticIopsAverage(profile: HyperscalerProfile) {
  if (!profile.drives) return null;
  const parts: string[] = [];
  if (profile.readIopsM !== null)
    parts.push(
      `읽기 ${formatInteger((profile.readIopsM * 1_000_000) / profile.drives)} IOPS/드라이브`
    );
  if (profile.writeIopsM !== null)
    parts.push(
      `쓰기 ${formatInteger((profile.writeIopsM * 1_000_000) / profile.drives)} IOPS/드라이브`
    );
  return parts.length ? parts.join(" · ") : null;
}

export function buildSsdRequirementLens(
  profile: HyperscalerProfile
): SsdRequirementItem[] {
  const hasPublishedPerformance =
    profile.readIopsM !== null ||
    profile.writeIopsM !== null ||
    publishedThroughput(profile.readThroughput) ||
    publishedThroughput(profile.writeThroughput);
  const arithmeticAverage = arithmeticIopsAverage(profile);
  const hasLayout = profile.drives !== null && profile.totalStorageTB !== null;
  const hasPhysicalPath = Boolean(
    profile.serverReference.ssdFormFactor ||
      (profile.serverReference.ssdInterface &&
        profile.serverReference.ssdInterface.toLowerCase() !== "nvme") ||
      profile.candidateReference.pcieGen
  );
  const layoutSignal = hasLayout
    ? `${profile.drives}개 × ${profile.driveCapacity} · 총 ${profile.totalStorageTB} TB`
    : profile.localStorage;

  return [
    {
      id: "performance",
      label: "성능·일관 지연",
      status: hasPublishedPerformance ? "baseline" : "request",
      publicSignal: performanceSignal(profile),
      proposalRequirement:
        "동일 블록 크기·큐 깊이·읽기/쓰기 혼합률에서 정상상태 IOPS, 처리량, p99·p99.9 지연을 함께 제출합니다.",
      acceptanceCriteria: arithmeticAverage
        ? `공개 성능: ${performanceSignal(profile)}. 산술 평균(장치 합격선 아님): ${arithmeticAverage}. 공개 호스트 합산 IOPS를 드라이브 수로 단순 나눈 값이므로 VM 제한·스트라이핑 효율을 포함하지 않습니다. 후보 구성은 호스트 합산 IOPS·처리량과 60분 정상상태 지연으로 검증합니다.`
        : hasPublishedPerformance
          ? `${performanceSignal(profile)}는 공개 호스트 상한입니다. 후보 수량을 적용한 호스트 합산 처리량과 60분 정상상태 지연을 동일 시험 조건에서 검증합니다.`
          : "공개 기준이 없으므로 PoC 전에 목표 IOPS·처리량·지연과 시험 조건을 문서로 확정합니다.",
      sourceIds: profile.sourceIds,
    },
    {
      id: "capacity",
      label: "용량·베이 밀도",
      status: hasLayout ? "baseline" : "request",
      publicSignal: layoutSignal,
      proposalRequirement:
        "필요한 유효 용량을 만족하는 드라이브 수, 단일 용량, 오버프로비저닝과 장애 여유분을 구성표로 제출합니다.",
      acceptanceCriteria: hasLayout
        ? `공개 구성 ${profile.drives}개와 총 ${profile.totalStorageTB} TB를 기준선으로 두고, 후보 구성의 원시·유효 용량과 장애 시 잔여 용량을 각각 확인합니다.`
        : "드라이브 수와 단일 용량이 공개되지 않아 리전·SKU별 구성표를 먼저 확보합니다.",
      sourceIds: profile.sourceIds,
    },
    {
      id: "data-path",
      label: "폼팩터·데이터 경로",
      status: hasPhysicalPath ? "baseline" : "verify",
      publicSignal: `${profile.ioPath} · ${profile.networkLabel}`,
      proposalRequirement:
        "서버 베이 폼팩터, U.2/U.3/E1.S/E3.S 인터페이스, PCIe 세대, NVMe 버전과 호스트 오프로드 경로를 한 장의 연결도로 제출합니다.",
      acceptanceCriteria: hasPhysicalPath
        ? "공개된 물리·프로토콜 값과 후보 사양이 일치하고, 링크 다운시프트나 어댑터가 없는지 확인합니다."
        : "NVMe 프로토콜 또는 호스트 경로가 공개되어도 물리 폼팩터·인터페이스·PCIe 세대는 보장되지 않습니다. 실제 서버 BOM과 백플레인 매뉴얼로 확인합니다.",
      sourceIds: profile.sourceIds,
    },
    {
      id: "operations",
      label: "내구성·장애 운영",
      status: profile.candidateReference.dwpd !== null ? "baseline" : "request",
      publicSignal: profile.persistence,
      proposalRequirement:
        "DWPD/TBW, PLP, 미디어 오류 처리, SMART·Telemetry, 펌웨어 롤백, 암호화와 안전 폐기 절차를 제출합니다.",
      acceptanceCriteria:
        profile.candidateReference.dwpd !== null
          ? `${profile.candidateReference.dwpd} DWPD 이상과 PLP·Telemetry 운영 절차를 제조사 문서로 확인합니다.`
          : "공개 VM 사양에 내구성이 없으므로 예상 쓰기량·보증 기간으로 요구 DWPD를 산정하고 제조사 증빙을 필수로 받습니다.",
      sourceIds: profile.sourceIds,
    },
  ];
}

function csvCell(value: string) {
  const formulaSafeValue = /^[\t\r\n ]*[=+\-@]/.test(value)
    ? `'${value}`
    : value;
  return `"${formulaSafeValue.replaceAll('"', '""')}"`;
}

export function buildSsdRequirementCsv(profile: HyperscalerProfile) {
  const sourceReferences = profile.sourceIds
    .map(sourceId => sources.find(source => source.id === sourceId))
    .filter((source): source is NonNullable<typeof source> => Boolean(source))
    .map(
      source =>
        `[${source.id}] ${source.publisher} · ${source.label} · ${source.url}`
    )
    .join(" | ");
  const rows = [
    ["대상 사업자", profile.provider],
    ["대상 프로파일", profile.profile],
    ["검증 영역", "상태", "공개 기준", "제안서 요구", "확인 기준", "출처"],
    ...buildSsdRequirementLens(profile).map(item => [
      item.label,
      ssdRequirementStatusLabels[item.status],
      item.publicSignal,
      item.proposalRequirement,
      item.acceptanceCriteria,
      sourceReferences,
    ]),
  ];
  return `\uFEFF${rows
    .map(row => row.map(value => csvCell(value)).join(","))
    .join("\r\n")}`;
}

export function downloadSsdRequirementCsv(
  profile: HyperscalerProfile,
  documentRef: Document = document,
  urlRef: typeof URL = URL
) {
  const blob = new Blob([buildSsdRequirementCsv(profile)], {
    type: "text/csv;charset=utf-8",
  });
  const objectUrl = urlRef.createObjectURL(blob);
  const anchor = documentRef.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `signal-ledger-ssd-validation-${profile.id}-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;
  anchor.click();
  urlRef.revokeObjectURL(objectUrl);
}
