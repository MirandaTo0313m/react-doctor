import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import { describe, expect, it } from "vite-plus/test";
import { collectRuleHits, createScopedTempRoot, setupReactProject } from "./_helpers.js";

interface UpstreamCase {
  idx: number;
  name: string;
  code: string;
  todo: boolean;
  errors?: number;
}

interface UpstreamFixture {
  valid: UpstreamCase[];
  invalid: UpstreamCase[];
}

const slugify = (input: string): string =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "case";

const fixturesRoot = path.join(path.dirname(url.fileURLToPath(import.meta.url)), "effect-fixtures");

const loadFixture = (ruleId: string): UpstreamFixture =>
  JSON.parse(fs.readFileSync(path.join(fixturesRoot, `${ruleId}.json`), "utf8"));

// Wraps each upstream `code` snippet in a `.tsx` file the synthetic
// React project can lint. Upstream code assumes `useState`, `useEffect`
// etc. as globals — we don't add any prelude / shims because doing so
// would create shadowing collisions (a `declare const Foo` next to the
// upstream `function Foo() {}` confuses eslint-scope's resolution).
// oxlint doesn't type-check, so undeclared references are tolerated.
// The rule recognizes `useState` / `useEffect` by Identifier name,
// not by resolved import, so this works.
const upstreamShimPrelude = "";

export const runUpstreamParity = (ruleId: string): void => {
  const tempRoot = createScopedTempRoot(`effect-${ruleId}-parity`);
  const fixture = loadFixture(ruleId);

  const wrapAsTsx = (code: string): string => {
    return `${upstreamShimPrelude}\n// === upstream snippet ===\n${code}\n`;
  };

  describe(`${ruleId} parity (port of eslint-plugin-react-you-might-not-need-an-effect)`, () => {
    for (const validCase of fixture.valid) {
      const itFn = validCase.todo ? it.skip : it;
      itFn(`valid #${validCase.idx} "${validCase.name}"`, async () => {
        const projectDir = setupReactProject(
          tempRoot,
          `v-${validCase.idx}-${slugify(validCase.name)}`,
          {
            files: { "src/Component.tsx": wrapAsTsx(validCase.code) },
          },
        );
        const hits = await collectRuleHits(projectDir, ruleId);
        if (hits.length !== 0) {
          const fs = await import("node:fs");
          fs.appendFileSync(
            "/tmp/parity-failures.log",
            `[${ruleId}] valid #${validCase.idx} "${validCase.name}" expected=0 got=${hits.length}\n  code:\n${validCase.code
              .split("\n")
              .map((l) => `    ${l}`)
              .join("\n")}\n  hits:\n${JSON.stringify(hits, null, 2)}\n---\n`,
          );
        }
        expect(hits).toHaveLength(0);
      });
    }

    for (const invalidCase of fixture.invalid) {
      const itFn = invalidCase.todo ? it.skip : it;
      itFn(`invalid #${invalidCase.idx} "${invalidCase.name}"`, async () => {
        const projectDir = setupReactProject(
          tempRoot,
          `i-${invalidCase.idx}-${slugify(invalidCase.name)}`,
          {
            files: { "src/Component.tsx": wrapAsTsx(invalidCase.code) },
          },
        );
        const hits = await collectRuleHits(projectDir, ruleId);
        if (hits.length !== (invalidCase.errors ?? 1)) {
          const fs = await import("node:fs");
          fs.appendFileSync(
            "/tmp/parity-failures.log",
            `[${ruleId}] invalid #${invalidCase.idx} "${invalidCase.name}" expected=${invalidCase.errors ?? 1} got=${hits.length}\n  code:\n${invalidCase.code
              .split("\n")
              .map((l) => `    ${l}`)
              .join("\n")}\n  hits:\n${JSON.stringify(hits, null, 2)}\n---\n`,
          );
        }
        expect(hits.length).toBe(invalidCase.errors ?? 1);
      });
    }
  });
};
