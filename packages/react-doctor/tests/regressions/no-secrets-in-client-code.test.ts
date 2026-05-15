import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vite-plus/test";

import { runOxlint } from "@react-doctor/core";
import type { ProjectInfo } from "@react-doctor/types";
import { buildTestProject, setupReactProject } from "./_helpers.js";

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "rd-no-secrets-"));
const RULE_ID = "no-secrets-in-client-code";

interface SecretIssueOptions {
  framework?: ProjectInfo["framework"];
}

const getSecretIssues = async (projectDir: string, options: SecretIssueOptions = {}) => {
  const diagnostics = await runOxlint({
    rootDirectory: projectDir,
    project: buildTestProject({
      rootDirectory: projectDir,
      framework: options.framework,
    }),
  });

  return diagnostics.filter((diagnostic) => diagnostic.rule === RULE_ID);
};

afterAll(() => {
  fs.rmSync(tempRoot, { recursive: true, force: true });
});

describe("no-secrets-in-client-code", () => {
  it("uses Vite env guidance for Vite projects", async () => {
    const projectDir = setupReactProject(tempRoot, "vite-secret-help", {
      packageJsonExtras: {
        dependencies: { react: "^19.0.0", "react-dom": "^19.0.0", vite: "^7.0.0" },
      },
      files: {
        "src/token-display.tsx": `const PUBLIC_BEARER_TOKEN_FALLBACK = "fixture_token_1234567890abcdef";

export const TokenDisplay = () => <div>{PUBLIC_BEARER_TOKEN_FALLBACK}</div>;
`,
      },
    });

    const secretIssues = await getSecretIssues(projectDir, { framework: "vite" });
    expect(secretIssues).toHaveLength(1);
    expect(secretIssues[0].help).toContain("Vite");
    expect(secretIssues[0].help).toContain("VITE_*");
    expect(secretIssues[0].help).not.toContain("NEXT_PUBLIC");
  });

  it("does not run the weak variable-name heuristic in Vite config files", async () => {
    const projectDir = setupReactProject(tempRoot, "vite-config-secret-false-positive", {
      packageJsonExtras: {
        dependencies: { react: "^19.0.0", "react-dom": "^19.0.0", vite: "^7.0.0" },
      },
      files: {
        "vite.config.ts": `const PUBLIC_BEARER_TOKEN_FALLBACK = "fixture_token_1234567890abcdef";

export default {};
`,
      },
    });

    await expect(getSecretIssues(projectDir, { framework: "vite" })).resolves.toEqual([]);
  });

  it("does not run the weak variable-name heuristic in server-only directories", async () => {
    const projectDir = setupReactProject(tempRoot, "server-secret-false-positive", {
      files: {
        "src/server/auth.ts": `const PUBLIC_BEARER_TOKEN_FALLBACK = "fixture_token_1234567890abcdef";

export const token = PUBLIC_BEARER_TOKEN_FALLBACK;
`,
      },
    });

    await expect(getSecretIssues(projectDir)).resolves.toEqual([]);
  });

  it("does not run the weak variable-name heuristic in test-only directories", async () => {
    const projectDir = setupReactProject(tempRoot, "test-secret-false-positive", {
      files: {
        "src/__tests__/token-display.tsx": `const PUBLIC_BEARER_TOKEN_FALLBACK = "fixture_token_1234567890abcdef";

export const TokenDisplay = () => <div>{PUBLIC_BEARER_TOKEN_FALLBACK}</div>;
`,
      },
    });

    await expect(getSecretIssues(projectDir)).resolves.toEqual([]);
  });

  it("still runs the weak variable-name heuristic in client-bundled api helpers", async () => {
    const projectDir = setupReactProject(tempRoot, "client-api-helper-secret", {
      files: {
        "src/api/client.ts": `const PUBLIC_BEARER_TOKEN_FALLBACK = "fixture_token_1234567890abcdef";

export const token = PUBLIC_BEARER_TOKEN_FALLBACK;
`,
      },
    });

    const secretIssues = await getSecretIssues(projectDir);
    expect(secretIssues).toHaveLength(1);
    expect(secretIssues[0].filePath).toContain("src/api/client.ts");
  });

  it("does not run the weak variable-name heuristic in ambiguous TypeScript source files", async () => {
    const projectDir = setupReactProject(tempRoot, "ambiguous-source-secret-false-positive", {
      files: {
        "src/token.ts": `const PUBLIC_BEARER_TOKEN_FALLBACK = "fixture_token_1234567890abcdef";

export const token = PUBLIC_BEARER_TOKEN_FALLBACK;
`,
      },
    });

    await expect(getSecretIssues(projectDir)).resolves.toEqual([]);
  });

  it("runs the weak variable-name heuristic in use-client App Router files", async () => {
    const projectDir = setupReactProject(tempRoot, "next-use-client-secret", {
      packageJsonExtras: {
        dependencies: { next: "^15.0.0", react: "^19.0.0", "react-dom": "^19.0.0" },
      },
      files: {
        "src/app/token-display.tsx": `"use client";

const PUBLIC_BEARER_TOKEN_FALLBACK = "fixture_token_1234567890abcdef";

export const TokenDisplay = () => <div>{PUBLIC_BEARER_TOKEN_FALLBACK}</div>;
`,
      },
    });

    const secretIssues = await getSecretIssues(projectDir, { framework: "nextjs" });
    expect(secretIssues).toHaveLength(1);
    expect(secretIssues[0].filePath).toContain("src/app/token-display.tsx");
  });

  it("does not run the weak variable-name heuristic in Next.js Pages API routes", async () => {
    const projectDir = setupReactProject(tempRoot, "next-pages-api-secret-false-positive", {
      packageJsonExtras: {
        dependencies: { next: "^15.0.0", react: "^19.0.0", "react-dom": "^19.0.0" },
      },
      files: {
        "src/pages/api/token.ts": `const PUBLIC_BEARER_TOKEN_FALLBACK = "fixture_token_1234567890abcdef";

export default function handler() {
  return Response.json({ ok: true });
}
`,
      },
    });

    await expect(getSecretIssues(projectDir, { framework: "nextjs" })).resolves.toEqual([]);
  });

  it("still runs the weak variable-name heuristic in regular files whose basename ends in rc", async () => {
    const projectDir = setupReactProject(tempRoot, "src-basename-secret", {
      files: {
        "src/src.tsx": `const PUBLIC_BEARER_TOKEN_FALLBACK = "fixture_token_1234567890abcdef";

export const TokenDisplay = () => <div>{PUBLIC_BEARER_TOKEN_FALLBACK}</div>;
`,
      },
    });

    const secretIssues = await getSecretIssues(projectDir);
    expect(secretIssues).toHaveLength(1);
    expect(secretIssues[0].filePath).toContain("src/src.tsx");
  });

  it("does not run the weak variable-name heuristic in explicit rc config files", async () => {
    const projectDir = setupReactProject(tempRoot, "rc-config-secret-false-positive", {
      files: {
        ".eslintrc.ts": `const PUBLIC_BEARER_TOKEN_FALLBACK = "fixture_token_1234567890abcdef";

export default {};
`,
        "lint.rc.ts": `const PUBLIC_BEARER_TOKEN_FALLBACK = "fixture_token_1234567890abcdef";

export default {};
`,
      },
    });

    await expect(getSecretIssues(projectDir)).resolves.toEqual([]);
  });

  it("still reports literal values that match known secret shapes in config files", async () => {
    const projectDir = setupReactProject(tempRoot, "config-real-secret-shape", {
      packageJsonExtras: {
        dependencies: { react: "^19.0.0", "react-dom": "^19.0.0", vite: "^7.0.0" },
      },
      files: {
        "vite.config.ts": `const stripeSecret = "sk\\u005ftest_fixture_token_1234567890abcdef";

export default {};
`,
      },
    });

    const secretIssues = await getSecretIssues(projectDir, { framework: "vite" });
    expect(secretIssues).toHaveLength(1);
    expect(secretIssues[0].message).toContain("Hardcoded secret detected");
  });
});
