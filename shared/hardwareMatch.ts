import type {
  ServerCatalogItem,
  ServerStorageOption,
  SsdCatalogItem,
  WorkloadClass,
} from "../client/src/data/hardwareCatalog";

export type HardwareMatchVerdict = "compatible" | "review" | "incompatible";

export type PcieLinkState =
  | "native"
  | "backward-compatible"
  | "host-bottleneck"
  | "unknown";

export type HardwareCheckStatus = "pass" | "review" | "fail" | "unknown";

export type HardwareMatchCheck = {
  key: "form-factor" | "pcie" | "capacity" | "power" | "workload";
  icon: string;
  status: HardwareCheckStatus;
  statusLabel: string;
  label: string;
  detail: string;
};

export type WorkloadFit = {
  sharedWorkloads: string[];
  enduranceClass: WorkloadClass;
  detail: string;
};

export type HardwareMatchResult = {
  verdict: HardwareMatchVerdict;
  physicalEnvelope: boolean;
  interfaceMatch: boolean | null;
  selectedStorageOption: ServerStorageOption | null;
  linkState: PcieLinkState;
  rawCapacityTb: number | null;
  estimatedDrivePowerW: number | null;
  workloadFit: WorkloadFit;
  checks: HardwareMatchCheck[];
};

export function formatTerabytes(value: number | null): string {
  return value === null ? "N/D" : `${value.toFixed(1)} TB`;
}

const checkPresentation: Record<
  HardwareCheckStatus,
  Pick<HardwareMatchCheck, "icon" | "statusLabel">
> = {
  pass: { icon: "✓", statusLabel: "호환" },
  review: { icon: "!", statusLabel: "검토" },
  fail: { icon: "×", statusLabel: "비호환" },
  unknown: { icon: "?", statusLabel: "미공개" },
};

function check(
  key: HardwareMatchCheck["key"],
  label: string,
  status: HardwareCheckStatus,
  detail: string
): HardwareMatchCheck {
  return { key, label, status, detail, ...checkPresentation[status] };
}

function getLinkState(
  serverGeneration: number | null,
  ssdGeneration: number | null
): PcieLinkState {
  if (serverGeneration === null || ssdGeneration === null) return "unknown";
  if (serverGeneration === ssdGeneration) return "native";
  if (serverGeneration > ssdGeneration) return "backward-compatible";
  return "host-bottleneck";
}

function getWorkloadFit(
  server: ServerCatalogItem,
  ssd: SsdCatalogItem
): WorkloadFit {
  const ssdWorkloads = new Set(ssd.workloads);
  const sharedWorkloads = server.workloads.filter(workload =>
    ssdWorkloads.has(workload)
  );
  const overlap =
    sharedWorkloads.length > 0
      ? `공통 워크로드: ${sharedWorkloads.join(", ")}.`
      : "공통 워크로드 태그가 없습니다.";

  return {
    sharedWorkloads,
    enduranceClass: ssd.workloadClass,
    detail: `${overlap} SSD endurance class는 ${ssd.workloadClass}이며 참고 신호로만 사용합니다.`,
  };
}

export function analyzeHardwareMatch(
  server: ServerCatalogItem,
  ssd: SsdCatalogItem
): HardwareMatchResult {
  const envelopeOptions = server.storageOptions.filter(
    option => option.envelope === ssd.envelope
  );
  const exactOptions = envelopeOptions.filter(option =>
    option.interfaces.some(value => ssd.interfaces.includes(value))
  );
  const uncertainOptions = envelopeOptions.filter(
    option => option.interfaces.length === 0 || ssd.interfaces.length === 0
  );
  const candidateOptions =
    exactOptions.length > 0 ? exactOptions : uncertainOptions;
  const selectedStorageOption =
    [...candidateOptions].sort(
      (a, b) => (b.bayCount ?? -1) - (a.bayCount ?? -1)
    )[0] ??
    envelopeOptions[0] ??
    null;
  const physicalEnvelope = envelopeOptions.length > 0;
  const interfaceMatch = !physicalEnvelope
    ? false
    : exactOptions.length > 0
      ? true
      : uncertainOptions.length > 0
        ? null
        : false;
  const linkState = getLinkState(
    selectedStorageOption?.pcieGen ?? null,
    ssd.pcieGen
  );
  const bayCount = selectedStorageOption?.bayCount ?? null;
  const rawCapacityTb =
    bayCount === null || ssd.capacityTb === null
      ? null
      : bayCount * ssd.capacityTb;
  const estimatedDrivePowerW =
    bayCount === null || ssd.activePowerW === null
      ? null
      : bayCount * ssd.activePowerW;
  const workloadFit = getWorkloadFit(server, ssd);

  const pcieStatus: HardwareCheckStatus =
    linkState === "native" || linkState === "backward-compatible"
      ? "pass"
      : linkState === "unknown"
        ? "unknown"
        : "review";
  const pcieDetail: Record<PcieLinkState, string> = {
    native: `선택된 서버 구성과 SSD가 PCIe Gen${selectedStorageOption?.pcieGen}로 동작합니다.`,
    "backward-compatible": `PCIe Gen${ssd.pcieGen} SSD는 Gen${selectedStorageOption?.pcieGen} 호스트에서 하위 호환으로 동작합니다.`,
    "host-bottleneck": `PCIe Gen${ssd.pcieGen} SSD는 Gen${selectedStorageOption?.pcieGen} 호스트 링크의 제한을 받습니다.`,
    unknown:
      "서버 또는 SSD의 PCIe 세대가 공개되지 않아 링크 상태를 확인할 수 없습니다.",
  };

  const verdict: HardwareMatchVerdict =
    !physicalEnvelope || interfaceMatch === false
      ? "incompatible"
      : interfaceMatch === null ||
          linkState === "host-bottleneck" ||
          linkState === "unknown"
        ? "review"
        : "compatible";

  return {
    verdict,
    physicalEnvelope,
    interfaceMatch,
    selectedStorageOption,
    linkState,
    rawCapacityTb,
    estimatedDrivePowerW,
    workloadFit,
    checks: [
      check(
        "form-factor",
        "물리 규격·인터페이스",
        !physicalEnvelope || interfaceMatch === false
          ? "fail"
          : interfaceMatch === null
            ? "review"
            : "pass",
        !physicalEnvelope
          ? `${ssd.envelope} SSD는 서버의 공개 물리 규격(${server.storageOptions.map(option => option.envelope).join(", ")})과 일치하지 않습니다.`
          : interfaceMatch === null
            ? `${ssd.envelope} 물리 규격은 맞지만 서버 커넥터/인터페이스가 미공개여서 ${ssd.interfaces.join("/")} 연결을 확인해야 합니다.`
            : interfaceMatch
              ? `${ssd.envelope} + ${ssd.interfaces.join("/")} 조합을 서버가 지원합니다.`
              : `${ssd.envelope} 물리 규격은 맞지만 서버 인터페이스(${envelopeOptions.flatMap(option => option.interfaces).join("/")})와 SSD 인터페이스(${ssd.interfaces.join("/")})가 다릅니다.`
      ),
      check("pcie", "PCIe 링크", pcieStatus, pcieDetail[linkState]),
      check(
        "capacity",
        "Raw 용량",
        rawCapacityTb === null ? "unknown" : "pass",
        rawCapacityTb === null
          ? "베이 수 또는 SSD 용량이 공개되지 않아 계산할 수 없습니다."
          : `${bayCount}개 ${selectedStorageOption?.envelope} 베이 기준 raw 용량은 ${formatTerabytes(rawCapacityTb)}입니다.`
      ),
      check(
        "power",
        "SSD 전력",
        estimatedDrivePowerW === null
          ? "unknown"
          : ssd.powerBasis === "unspecified"
            ? "review"
            : "pass",
        estimatedDrivePowerW === null
          ? "베이 수 또는 SSD active power가 공개되지 않아 계산할 수 없습니다."
          : `${bayCount}개 베이 기준 SSD active power ${ssd.powerBasis === "typical" ? "typical" : ssd.powerBasis === "maximum" ? "maximum" : "기준 미명시"} 합산치는 ${estimatedDrivePowerW} W입니다.`
      ),
      check(
        "workload",
        "워크로드",
        workloadFit.sharedWorkloads.length > 0 ? "pass" : "review",
        workloadFit.detail
      ),
    ],
  };
}
