import { describe, expect, it } from "vitest";

import { updateProfileSelection } from "./profileSelection";

describe("updateProfileSelection", () => {
  it("keeps the current profiles and reports a blocked fourth selection", () => {
    const current = ["aws-i4i", "gcp-z3", "alibaba-i5"];

    expect(updateProfileSelection(current, "azure-lsv3", 3)).toEqual({
      ids: current,
      blocked: true,
    });
  });

  it("allows a selected profile to be removed at the limit", () => {
    expect(
      updateProfileSelection(["aws-i4i", "gcp-z3", "alibaba-i5"], "gcp-z3", 3)
    ).toEqual({
      ids: ["aws-i4i", "alibaba-i5"],
      blocked: false,
    });
  });

  it("adds a profile when the selection is below the limit", () => {
    expect(
      updateProfileSelection(["aws-i4i", "gcp-z3"], "alibaba-i5", 3)
    ).toEqual({
      ids: ["aws-i4i", "gcp-z3", "alibaba-i5"],
      blocked: false,
    });
  });
});
