import { describe, expect, it } from "vitest";
import { profiles } from "@/data/hyperscalers";
import {
  buildProfileComparisonCsv,
  profileComparisonAxes,
} from "./profileComparisonExport";

describe("profile comparison export", () => {
  it("exports the same comparison axes shown in the table", () => {
    const csv = buildProfileComparisonCsv(profiles.slice(0, 2));

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"COMPARISON AXIS","AWS","Google Cloud"');
    expect(csv).toContain('"PROFILE","EC2 I4i.32xlarge"');
    for (const axis of profileComparisonAxes) {
      expect(csv).toContain(`"${axis.label}"`);
    }
  });

  it("escapes values so Excel columns remain intact", () => {
    const csv = buildProfileComparisonCsv([
      { ...profiles[0], provider: 'Vendor, "Quoted"' },
    ]);

    expect(csv).toContain('"Vendor, ""Quoted"""');
  });

  it.each(["  =SUM(1,1)", "\t+1+1", "\r-2+2", "\n@SUM(1,1)"])(
    "neutralizes formula-like value %j",
    provider => {
      const csv = buildProfileComparisonCsv([{ ...profiles[0], provider }]);

      expect(csv).toContain(`"'${provider.replaceAll('"', '""')}"`);
    }
  );
});
