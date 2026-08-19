import { describe, expect, it } from "vitest";
import { profiles } from "@/data/hyperscalers";
import {
  buildSsdRequirementCsv,
  buildSsdRequirementLens,
} from "./ssdRequirementLens";

describe("SSD requirement lens", () => {
  it("turns a published multi-drive profile into actionable per-drive baselines", () => {
    const gcp = profiles.find(profile => profile.id === "gcp-z3");
    expect(gcp).toBeDefined();

    const lens = buildSsdRequirementLens(gcp!);
    const performance = lens.find(item => item.id === "performance");
    expect(lens).toHaveLength(4);
    expect(performance?.status).toBe("baseline");
    expect(performance?.acceptanceCriteria).toContain(
      "산술 평균(장치 합격선 아님)"
    );
    expect(performance?.acceptanceCriteria).toContain("750,000 IOPS/드라이브");
    expect(performance?.acceptanceCriteria).toContain("500,000 IOPS/드라이브");
    expect(performance?.acceptanceCriteria).toContain("VM 제한");
    expect(performance?.publicSignal).toContain("읽기 처리량 36,000 MiB/s");
    expect(performance?.publicSignal).toContain("쓰기 처리량 30,000 MiB/s");
    expect(performance?.acceptanceCriteria).toContain(
      "호스트 합산 IOPS·처리량"
    );
  });

  it("keeps a throughput-only host baseline without claiming no public value", () => {
    const aws = profiles.find(profile => profile.id === "aws-i4i");
    expect(aws).toBeDefined();

    const performance = buildSsdRequirementLens(aws!).find(
      item => item.id === "performance"
    );
    expect(performance?.status).toBe("baseline");
    expect(performance?.acceptanceCriteria).toContain("공개 호스트 상한");
    expect(performance?.acceptanceCriteria).not.toContain(
      "공개 기준이 없으므로"
    );
  });

  it("does not treat NVMe protocol disclosure as physical path disclosure", () => {
    const gcp = profiles.find(profile => profile.id === "gcp-z3");
    const dataPath = buildSsdRequirementLens(gcp!).find(
      item => item.id === "data-path"
    );

    expect(dataPath?.status).toBe("verify");
    expect(dataPath?.acceptanceCriteria).toContain("물리 폼팩터");
  });

  it("requests documents instead of inventing missing public values", () => {
    const baidu = profiles.find(profile => profile.id === "baidu-l7");
    expect(baidu).toBeDefined();

    const lens = buildSsdRequirementLens(baidu!);
    expect(lens.find(item => item.id === "performance")?.status).toBe(
      "request"
    );
    expect(lens.find(item => item.id === "operations")?.publicSignal).toBe(
      baidu!.persistence
    );
  });

  it("exports the same lens fields as an Excel-readable CSV", () => {
    const csv = buildSsdRequirementCsv(profiles[0]);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain(
      '"검증 영역","상태","공개 기준","제안서 요구","확인 기준","출처"'
    );
    expect(csv).toContain('"성능·일관 지연"');
    expect(csv).toContain("https://aws.amazon.com/ec2/instance-types/i4i/");
  });

  it("quotes commas and neutralizes spreadsheet formulas in exported cells", () => {
    const unsafeProfile = {
      ...profiles[0],
      provider: ' =HYPERLINK("https://example.com")',
      profile: 'quote, "test"',
    };
    const csv = buildSsdRequirementCsv(unsafeProfile);

    expect(csv).toContain("' =HYPERLINK");
    expect(csv).toContain('"quote, ""test"""');
  });
});
