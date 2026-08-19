import { describe, expect, it } from "vitest";
import type { HyperscalerProfile } from "@/data/hyperscalers";
import { profileDriveSummary } from "./profilePresentation";

function profile(
  overrides: Pick<HyperscalerProfile, "drives" | "driveCapacity">
) {
  return overrides as HyperscalerProfile;
}

describe("profileDriveSummary", () => {
  it("shows the drive count and per-drive capacity together", () => {
    expect(
      profileDriveSummary(profile({ drives: 12, driveCapacity: "3,000 GiB" }))
    ).toBe("12개 × 3,000 GiB");
  });

  it("explains when the public profile does not disclose a drive count", () => {
    expect(
      profileDriveSummary(
        profile({ drives: null, driveCapacity: "공개 SKU별 확인 필요" })
      )
    ).toBe("SKU별 확인 필요");
  });
});
