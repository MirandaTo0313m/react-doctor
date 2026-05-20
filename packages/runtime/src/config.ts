import { Context, Effect, Layer } from "effect";
import { loadConfigWithSource, resolveConfigRootDir } from "@react-doctor/core";
import type { ReactDoctorConfig } from "@react-doctor/types";

/**
 * Resolved react-doctor config + the directory it ultimately
 * pointed at (after honoring `rootDir` redirects from monorepo
 * roots). The runtime exposes both because most callers — the CLI,
 * the eslint plugin host, the GitHub Action, a future LSP — care
 * about the redirect target as much as about the config itself.
 */
export interface ResolvedConfig {
  readonly config: ReactDoctorConfig | null;
  readonly resolvedDirectory: string;
}

/**
 * `Config` is the load-and-redirect service. The current
 * `loadConfigWithSource` + `resolveConfigRootDir` dance lives at
 * every entry point (`inspect`, `diagnose`, the eslint plugin
 * host, and would have to live at every future entry point too).
 * Promoting it to a service collapses the duplication and gives
 * tests a single seam to provide a layer for.
 */
export class Config extends Context.Service<
  Config,
  {
    readonly resolve: (directory: string) => Effect.Effect<ResolvedConfig>;
  }
>()("@react-doctor/runtime/Config") {
  static readonly layerNode = Layer.succeed(
    Config,
    Config.of({
      resolve: (directory: string) =>
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
