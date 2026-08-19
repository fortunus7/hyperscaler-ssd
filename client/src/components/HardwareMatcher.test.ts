import { describe, expect, it } from "vitest";
import { formatCatalogDate, pinActiveItem } from "./HardwareMatcher";
import { profileDetailScrollBehavior } from "../pages/Home";

describe("HardwareMatcher list state", () => {
  it("pins the active item only when it belongs to the filtered result", () => {
    const active = { id: "active", label: "Active" };
    const visible = [{ id: "visible", label: "Visible" }];

    expect(pinActiveItem(visible, active)).toEqual(visible);
    expect(pinActiveItem([], active)).toEqual([]);
    expect(pinActiveItem([active, visible[0]], active)).toEqual([
      active,
      visible[0],
    ]);
  });

  it("formats the catalog snapshot date for the Korean summary", () => {
    expect(formatCatalogDate("2026-08-19")).toBe("2026.08.19");
  });

  it("disables smooth profile-detail scrolling when reduced motion is preferred", () => {
    expect(profileDetailScrollBehavior(true)).toBe("auto");
    expect(profileDetailScrollBehavior(false)).toBe("smooth");
  });
});
