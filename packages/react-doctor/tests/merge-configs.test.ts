import { describe, expect, it } from "vite-plus/test";
import { mergeReactDoctorConfigs } from "@react-doctor/core";
import type { ReactDoctorConfig } from "@react-doctor/types";

describe("mergeReactDoctorConfigs", () => {
  it("returns child values when there's no overlap", () => {
    const parent: ReactDoctorConfig = { lint: true, verbose: false };
    const child: ReactDoctorConfig = { failOn: "error" };
    expect(mergeReactDoctorConfigs(parent, child)).toEqual({
      lint: true,
      verbose: false,
      failOn: "error",
    });
  });

  it("lets the child override scalar parent values", () => {
    const parent: ReactDoctorConfig = { failOn: "warning", verbose: true };
    const child: ReactDoctorConfig = { failOn: "error" };
    const merged = mergeReactDoctorConfigs(parent, child);
    expect(merged.failOn).toBe("error");
    expect(merged.verbose).toBe(true);
  });

  it("concatenates and dedupes array fields", () => {
    const parent: ReactDoctorConfig = {
      ignore: { files: ["dist/**", "build/**"], rules: ["react/no-danger"] },
      barrelAllowlist: ["src/index.ts"],
    };
    const child: ReactDoctorConfig = {
      ignore: { files: ["build/**", ".next/**"], rules: ["react-doctor/no-effect-chain"] },
      barrelAllowlist: ["packages/*/src/index.ts"],
    };
    const merged = mergeReactDoctorConfigs(parent, child);
    expect(merged.ignore?.files).toEqual(["dist/**", "build/**", ".next/**"]);
    expect(merged.ignore?.rules).toEqual(["react/no-danger", "react-doctor/no-effect-chain"]);
    expect(merged.barrelAllowlist).toEqual(["src/index.ts", "packages/*/src/index.ts"]);
  });

  it("merges surface controls and dedupes tag lists", () => {
    const parent: ReactDoctorConfig = {
      surfaces: {
        prComment: { excludeTags: ["design"] },
        ciFailure: { excludeRules: ["react-doctor/no-prevent-default"] },
      },
    };
    const child: ReactDoctorConfig = {
      surfaces: {
        prComment: { excludeTags: ["design", "test-noise"] },
        score: { excludeTags: ["design"] },
      },
    };
    const merged = mergeReactDoctorConfigs(parent, child);
    expect(merged.surfaces?.prComment?.excludeTags).toEqual(["design", "test-noise"]);
    expect(merged.surfaces?.score?.excludeTags).toEqual(["design"]);
    expect(merged.surfaces?.ciFailure?.excludeRules).toEqual(["react-doctor/no-prevent-default"]);
  });

  it("merges baseline objects and lets the child override fields", () => {
    const parent: ReactDoctorConfig = {
      baseline: { path: "parent.json", showBaselineMatches: false },
    };
    const child: ReactDoctorConfig = {
      baseline: { path: "child.json" },
    };
    const merged = mergeReactDoctorConfigs(parent, child);
    expect(merged.baseline).toEqual({ path: "child.json", showBaselineMatches: false });
  });

  it("strips the `extends` field from the merged output", () => {
    const parent: ReactDoctorConfig = { extends: "./grandparent.json", lint: true };
    const child: ReactDoctorConfig = { extends: "./parent.json", verbose: true };
    const merged = mergeReactDoctorConfigs(parent, child);
    expect((merged as Record<string, unknown>).extends).toBeUndefined();
  });
});
