import type { HyperscalerProfile } from "@/data/hyperscalers";

export function profileDriveSummary(profile: HyperscalerProfile) {
  if (profile.drives === null) return "SKU별 확인 필요";
  return `${profile.drives}개 × ${profile.driveCapacity}`;
}
