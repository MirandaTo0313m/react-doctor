import path from "node:path";
import { describe, expect, it } from "vite-plus/test";
import { matchesBarrelAllowlist } from "../../oxlint-plugin-react-doctor/src/plugin/utils/matches-barrel-allowlist.js";

const projectRoot = "/repo";

describe("matchesBarrelAllowlist", () => {
  it("returns false when the allowlist is empty", () => {
    const barrelPath = path.join(projectRoot, "src/components/ui/index.ts");
    expect(matchesBarrelAllowlist(barrelPath, [], projectRoot)).toBe(false);
  });

  it("matches a relative single-pattern allowlist", () => {
    const barrelPath = path.join(projectRoot, "src/index.ts");
    expect(matchesBarrelAllowlist(barrelPath, ["src/index.ts"], projectRoot)).toBe(true);
  });

  it("supports `**` for arbitrary depth (e.g. monorepo package public barrels)", () => {
    const barrelPath = path.join(projectRoot, "packages/ui/src/index.ts");
    expect(matchesBarrelAllowlist(barrelPath, ["packages/**/src/index.ts"], projectRoot)).toBe(
      true,
    );
  });

  it("rejects barrels that do not match any allowlist pattern", () => {
    const barrelPath = path.join(projectRoot, "src/utils/index.ts");
    expect(matchesBarrelAllowlist(barrelPath, ["src/components/index.ts"], projectRoot)).toBe(
      false,
    );
  });

  it("supports `*` as a single path-segment wildcard", () => {
    const barrelPath = path.join(projectRoot, "src/components/ui/index.ts");
    expect(matchesBarrelAllowlist(barrelPath, ["src/components/*/index.ts"], projectRoot)).toBe(
      true,
    );
    expect(matchesBarrelAllowlist(barrelPath, ["src/components/*.ts"], projectRoot)).toBe(false);
  });

  it("matches absolute-path patterns against the absolute barrel path", () => {
    const barrelPath = path.join(projectRoot, "src/index.ts");
    expect(matchesBarrelAllowlist(barrelPath, [`${projectRoot}/src/index.ts`], projectRoot)).toBe(
      true,
    );
    expect(matchesBarrelAllowlist(barrelPath, [`${projectRoot}/src/other.ts`], projectRoot)).toBe(
      false,
    );
  });

  it("honors the caseInsensitive option override regardless of platform", () => {
    const barrelPath = path.join(projectRoot, "Src/Index.ts");
    expect(
      matchesBarrelAllowlist(barrelPath, ["src/index.ts"], projectRoot, {
        caseInsensitive: true,
      }),
    ).toBe(true);
    expect(
      matchesBarrelAllowlist(barrelPath, ["src/index.ts"], projectRoot, {
        caseInsensitive: false,
      }),
    ).toBe(false);
  });
});
