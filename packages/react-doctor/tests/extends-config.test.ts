import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { clearConfigCache, loadConfigWithSource } from "@react-doctor/core";

const writeJson = (filePath: string, contents: unknown): void => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(contents));
};

describe("loadConfigWithSource - extends", () => {
  let rootDirectory: string;

  beforeEach(() => {
    rootDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "rd-extends-"));
    clearConfigCache();
  });

  afterEach(() => {
    fs.rmSync(rootDirectory, { recursive: true, force: true });
    clearConfigCache();
  });

  it("resolves a single string parent and lets the child override", () => {
    const parentPath = path.join(rootDirectory, "react-doctor.base.json");
    const childPath = path.join(rootDirectory, "packages/web/react-doctor.config.json");
    writeJson(parentPath, { failOn: "warning", verbose: true });
    writeJson(childPath, { extends: "../../react-doctor.base.json", failOn: "error" });

    const loaded = loadConfigWithSource(path.dirname(childPath));
    expect(loaded?.config.failOn).toBe("error");
    expect(loaded?.config.verbose).toBe(true);
  });

  it("supports array extends and merges array fields", () => {
    const sharedPath = path.join(rootDirectory, "react-doctor.shared.json");
    const securityPath = path.join(rootDirectory, "react-doctor.security.json");
    const childPath = path.join(rootDirectory, "packages/web/react-doctor.config.json");
    writeJson(sharedPath, { ignore: { files: ["dist/**"] } });
    writeJson(securityPath, { ignore: { files: ["coverage/**"] } });
    writeJson(childPath, {
      extends: ["../../react-doctor.shared.json", "../../react-doctor.security.json"],
      ignore: { files: ["build/**"] },
    });

    const loaded = loadConfigWithSource(path.dirname(childPath));
    expect(loaded?.config.ignore?.files).toEqual(["dist/**", "coverage/**", "build/**"]);
  });

  it("handles deep extends chains", () => {
    const grandparentPath = path.join(rootDirectory, "react-doctor.grandparent.json");
    const parentPath = path.join(rootDirectory, "react-doctor.parent.json");
    const childPath = path.join(rootDirectory, "packages/web/react-doctor.config.json");
    writeJson(grandparentPath, { lint: true, failOn: "warning" });
    writeJson(parentPath, {
      extends: "./react-doctor.grandparent.json",
      verbose: true,
    });
    writeJson(childPath, {
      extends: "../../react-doctor.parent.json",
      failOn: "error",
    });

    const loaded = loadConfigWithSource(path.dirname(childPath));
    expect(loaded?.config.lint).toBe(true);
    expect(loaded?.config.verbose).toBe(true);
    expect(loaded?.config.failOn).toBe("error");
  });

  it("ignores missing parent files but still loads the child", () => {
    const childPath = path.join(rootDirectory, "react-doctor.config.json");
    writeJson(childPath, {
      extends: "./does-not-exist.json",
      failOn: "error",
    });

    const loaded = loadConfigWithSource(rootDirectory);
    expect(loaded?.config.failOn).toBe("error");
  });

  it("lets later entries in `extends` array override earlier ones on scalar conflicts", () => {
    const earlierPath = path.join(rootDirectory, "earlier.json");
    const laterPath = path.join(rootDirectory, "later.json");
    const childPath = path.join(rootDirectory, "react-doctor.config.json");
    writeJson(earlierPath, { failOn: "warning" });
    writeJson(laterPath, { failOn: "none" });
    writeJson(childPath, {
      extends: ["./earlier.json", "./later.json"],
    });

    const loaded = loadConfigWithSource(rootDirectory);
    expect(loaded?.config.failOn).toBe("none");
  });

  it("breaks cycles between parent and child configs", () => {
    const parentPath = path.join(rootDirectory, "parent.json");
    const childPath = path.join(rootDirectory, "react-doctor.config.json");
    writeJson(parentPath, { extends: "./react-doctor.config.json", verbose: true });
    writeJson(childPath, { extends: "./parent.json", failOn: "error" });

    const loaded = loadConfigWithSource(rootDirectory);
    expect(loaded?.config.failOn).toBe("error");
    expect(loaded?.config.verbose).toBe(true);
  });

  it("loads shared parents through diamond inheritance (Root -> [A, B] -> Shared)", () => {
    const sharedPath = path.join(rootDirectory, "shared.json");
    const aPath = path.join(rootDirectory, "a.json");
    const bPath = path.join(rootDirectory, "b.json");
    const childPath = path.join(rootDirectory, "react-doctor.config.json");
    writeJson(sharedPath, { failOn: "warning", lint: true });
    writeJson(aPath, { extends: "./shared.json", verbose: true });
    // B extends shared too; with a per-branch visited set both A and B
    // see Shared without one branch silently skipping it as a cycle.
    writeJson(bPath, { extends: "./shared.json" });
    writeJson(childPath, { extends: ["./a.json", "./b.json"] });

    const loaded = loadConfigWithSource(rootDirectory);
    expect(loaded?.config.failOn).toBe("warning");
    expect(loaded?.config.lint).toBe(true);
    expect(loaded?.config.verbose).toBe(true);
  });

  it("resolves an inherited relative rootDir against the parent's directory, not the child's", () => {
    // Parent at `<root>/shared/base.json` declares `rootDir: "../apps/web"`,
    // which should resolve to `<root>/apps/web` regardless of where the
    // child config lives. Without the fix, the child at
    // `<root>/packages/lib/react-doctor.config.json` would resolve the
    // inherited string against its own dir and point at
    // `<root>/packages/apps/web`.
    const appsWebDir = path.join(rootDirectory, "apps", "web");
    fs.mkdirSync(appsWebDir, { recursive: true });
    const parentPath = path.join(rootDirectory, "shared", "base.json");
    const childPath = path.join(rootDirectory, "packages", "lib", "react-doctor.config.json");
    writeJson(parentPath, { rootDir: "../apps/web", failOn: "error" });
    writeJson(childPath, { extends: "../../shared/base.json" });

    const loaded = loadConfigWithSource(path.dirname(childPath));
    expect(loaded?.config.rootDir).toBe(appsWebDir);
    expect(loaded?.config.failOn).toBe("error");
  });

  it("breaks cycles even when the entry config is loaded through a symlinked directory", () => {
    // The root config self-references; cycle detection should catch
    // it on the first re-entry regardless of whether the entry path
    // came through a symlink or its realpath. The visited set is
    // keyed by realpath so both lenses converge on the same key.
    const realDirectory = path.join(rootDirectory, "real");
    const linkDirectory = path.join(rootDirectory, "link");
    fs.mkdirSync(realDirectory);
    fs.symlinkSync(realDirectory, linkDirectory, "dir");
    const realConfigPath = path.join(realDirectory, "react-doctor.config.json");
    writeJson(realConfigPath, {
      extends: "./react-doctor.config.json",
      failOn: "error",
    });

    const loaded = loadConfigWithSource(linkDirectory);
    expect(loaded?.config.failOn).toBe("error");
  });
});
