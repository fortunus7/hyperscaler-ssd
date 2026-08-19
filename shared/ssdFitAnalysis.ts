/**
 * Evidence-first SSD suitability model. It compares against published metrics only;
 * hardware fit signals are separately reported as compatibility review items.
 */
import { compareCandidateToReference, type PublicProfileReference, type SsdCandidateMetrics } from "./ssdComparison";

export type FitServerContext = {
  model: string;
  rackUnits: number | null;
  powerCapacityW: number | null;
  ssdCount: number | null;
  ssdFormFactor: string | null;
  ssdInterface: string | null;
  ssdProtocol: string | null;
};

export type FitProfile = {
  id: string;
  provider: string;
  profile: string;
  ssdReference: PublicProfileReference;
  serverReference: {
    rackUnits: number | null;
    powerCapacityW: number | null;
    ssdFormFactor: string | null;
    ssdInterface: string | null;
    ssdProtocol: string | null;
  };
};

export type FitVerdict = "우선 검토" | "조건부 검토" | "성능 갭" | "물리 호환성 확인" | "자료 부족";
export type FitReview = { label: string; detail: string; severity: "info" | "review" | "blocker" };

function canonical(value: string | null) {
  return value?.trim().toLowerCase().replace(/[\s._-]/g, "") ?? null;
}

function pcieGen(value: string | null) {
  const match = value?.toLowerCase().match(/(?:pcie|gen)\s*([3-6])/);
  return match ? Number(match[1]) : null;
}

export function analyzeSsdSuitability(candidate: SsdCandidateMetrics & { formFactor: string | null; nvmeVersion: string | null; powerActiveW: number | null }, profile: FitProfile, server: FitServerContext | null) {
  const performance = compareCandidateToReference(candidate, profile.ssdReference);
  const performanceGaps = performance.metrics.filter((metric) => metric.status === "gap");
  const reviews: FitReview[] = [];
  let blocker = false;

  if (server) {
    const candidateForm = canonical(candidate.formFactor);
    const serverForm = canonical(server.ssdFormFactor);
    if (serverForm && !candidateForm) reviews.push({ label: "SSD 폼팩터", detail: `${server.model}의 ${server.ssdFormFactor} 베이에 맞는 후보 폼팩터가 입력되지 않았습니다.`, severity: "review" });
    if (serverForm && candidateForm && candidateForm !== serverForm) {
      reviews.push({ label: "SSD 폼팩터", detail: `후보 ${candidate.formFactor}와 서버 ${server.ssdFormFactor} 베이의 물리 규격이 다릅니다.`, severity: "blocker" });
      blocker = true;
    }

    const hostPcie = pcieGen(server.ssdInterface);
    const candidatePcie = pcieGen(candidate.pcieGen);
    if (server.ssdInterface && !candidatePcie) reviews.push({ label: "PCIe 인터페이스", detail: `${server.model}의 ${server.ssdInterface} 링크와 후보 PCIe 세대의 대조가 필요합니다.`, severity: "review" });
    if (hostPcie && candidatePcie && candidatePcie > hostPcie) reviews.push({ label: "PCIe 링크", detail: `후보 PCIe ${candidatePcie}.0은 서버 ${server.ssdInterface} 링크에서 하위 세대로 동작할 수 있습니다.`, severity: "review" });

    const serverProtocol = canonical(server.ssdProtocol);
    const candidateProtocol = canonical(candidate.nvmeVersion);
    if (serverProtocol && !candidateProtocol) reviews.push({ label: "NVMe 프로토콜", detail: `${server.model}의 ${server.ssdProtocol} 지원 범위에 대해 후보 NVMe 버전을 확인해야 합니다.`, severity: "review" });
    if (serverProtocol && candidateProtocol && !candidateProtocol.includes("nvme")) reviews.push({ label: "NVMe 프로토콜", detail: `후보 프로토콜 표기가 ${candidate.nvmeVersion}이므로 서버 ${server.ssdProtocol}와의 호환성 검토가 필요합니다.`, severity: "review" });

    if (server.powerCapacityW && server.ssdCount && candidate.powerActiveW !== null) {
      const estimatedDrivePowerW = server.ssdCount * candidate.powerActiveW;
      const ratio = Math.round((estimatedDrivePowerW / server.powerCapacityW) * 100);
      reviews.push({ label: "SSD 전력 예산", detail: `${server.ssdCount}개 기준 SSD active power 추정치는 ${estimatedDrivePowerW.toFixed(1)} W (${server.powerCapacityW} W PSU 정격의 약 ${ratio}%)입니다. 전체 서버 부하·이중화·피크 전력은 별도 검토가 필요합니다.`, severity: "info" });
    } else if (server.powerCapacityW && server.ssdCount) {
      reviews.push({ label: "SSD 전력 예산", detail: `${server.model}의 전력 용량은 입력되었지만 후보 SSD active power 또는 SSD 수량이 없어 전력 예산을 계산하지 않았습니다.`, severity: "review" });
    }
  } else {
    reviews.push({ label: "내부 서버 컨텍스트", detail: "랙·전력·베이 폼팩터·PCIe 링크·SSD 수량을 포함한 내부 서버 후보를 선택하면 물리 적합성 검토가 추가됩니다.", severity: "info" });
  }

  if (profile.serverReference.rackUnits === null) reviews.push({ label: "랙 크기", detail: `${profile.provider} 공개 VM 카탈로그에는 물리 랙 크기가 공개되지 않아 점수화하지 않았습니다.`, severity: "info" });
  if (profile.serverReference.powerCapacityW === null) reviews.push({ label: "전력 용량", detail: `${profile.provider} 공개 VM 카탈로그에는 서버 PSU·전력 용량이 공개되지 않아 점수화하지 않았습니다.`, severity: "info" });

  const verdict: FitVerdict = blocker ? "물리 호환성 확인" : performance.score === null ? "자료 부족" : performanceGaps.length > 0 ? "성능 갭" : performance.score >= 85 ? "우선 검토" : "조건부 검토";
  return {
    verdict,
    performanceScore: performance.score,
    comparableCount: performance.comparableCount,
    meetsCount: performance.metrics.filter((metric) => metric.status === "meets").length,
    gapCount: performanceGaps.length,
    missingCount: performance.metrics.filter((metric) => metric.status === "candidate_missing").length,
    performanceMetrics: performance.metrics,
    reviews,
  };
}
