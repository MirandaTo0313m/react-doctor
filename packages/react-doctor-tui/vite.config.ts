import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite-plus";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));

const packageJson = JSON.parse(fs.readFileSync(path.join(packageRoot, "package.json"), "utf8")) as {
  version: string;
};

export default defineConfig({
  pack: [
    {
      entry: { cli: "./src/cli.tsx" },
      deps: {
        neverBundle: ["react-doctor", "react-doctor/api", "ink", "react", "chokidar", "@inkjs/ui"],
      },
      dts: true,
      target: "node22",
      platform: "node",
      env: {
        VERSION: process.env.VERSION ?? packageJson.version,
      },
      fixedExtension: false,
    },
  ],
  test: {
    testTimeout: 30_000,
  },
});
