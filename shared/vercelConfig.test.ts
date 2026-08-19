import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("Vercel deployment configuration", () => {
  it("publishes the Vite SPA output instead of the server bundle", () => {
    const configPath = path.resolve(process.cwd(), "vercel.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

    expect(config).toMatchObject({
      framework: "vite",
      buildCommand: "pnpm exec vite build",
      outputDirectory: "dist/public",
      rewrites: [{ source: "/(.*)", destination: "/index.html" }],
    });
  });
});
