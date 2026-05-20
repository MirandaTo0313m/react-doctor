import { Cache, Context, Effect, Layer } from "effect";
import { loadConfigWithSource, resolveConfigRootDir } from "@react-doctor/core";
import type { ReactDoctorConfig } from "@react-doctor/types";

/**
 * Resolved react-doctor config + the directory it ultimately
 * pointed at (after honoring `rootDir` redirects from monorepo
 * roots). The runtime exposes both because the CLI's `inspect()`
 * and the programmatic `diagnose()` both care about the redirect
 * target as much as about the config itself; future runtime
 * consumers (LSP host, watch mode) would too.
 */
export interface ResolvedConfig {
  readonly config: ReactDoctorConfig | null;
  readonly resolvedDirectory: string;
}

const CONFIG_CACHE_CAPACITY = 16;
const CONFIG_CACHE_TTL_MILLISECONDS = 5 * 60 * 1_000;

/**
 * `Config` is the load-and-redirect service. The
 * `loadConfigWithSource` + `resolveConfigRootDir` dance used to
 * live in both `inspect.ts` and `diagnose()` (and would have to
 * live in every future runtime entry point too). Promoting it to
 * a service collapses the duplication and gives tests a single
 * seam to provide a layer for.
 *
 * `layerNode` wraps both calls behind a `Cache.make` keyed on
 * directory so a long-running process — a future watch mode, an
 * LSP host, or any other runtime that keeps the runtime alive
 * across multiple scans — only re-reads `react-doctor.config.json`
 * when the cache TTL expires or `Cache.invalidate` is called.
 * Capacity 16 covers a typical monorepo's distinct project roots;
 * TTL 5 minutes keeps editing-and-rerunning workflows snappy
 * without holding stale config indefinitely. One-shot CLI scans
 * that build a fresh runtime each time pay nothing for the cache.
 */
export class Config extends Context.Service<
  Config,
  {
    readonly resolve: (directory: string) => Effect.Effect<ResolvedConfig>;
  }
>()("@react-doctor/runtime/Config") {
  static readonly layerNode = Layer.effect(
    Config,
    Effect.gen(function* () {
      const cache = yield* Cache.make<string, ResolvedConfig>({
        capacity: CONFIG_CACHE_CAPACITY,
        timeToLive: CONFIG_CACHE_TTL_MILLISECONDS,
        lookup: (directory: string) =>
          Effect.sync(() => {
            const loaded = loadConfigWithSource(directory);
            const redirected = resolveConfigRootDir(
              loaded?.config ?? null,
              loaded?.sourceDirectory ?? null,
            );
            return {
              config: loaded?.config ?? null,
              resolvedDirectory: redirected ?? directory,
            };
          }),
      });
      return Config.of({
        resolve: (directory: string) => Cache.get(cache, directory),
      });
    }),
  );

  static readonly layerOf = (resolved: ResolvedConfig): Layer.Layer<Config> =>
    Layer.succeed(
      Config,
      Config.of({
        resolve: () => Effect.succeed(resolved),
      }),
    );
}
