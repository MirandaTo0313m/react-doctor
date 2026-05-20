import { Context, Effect, Layer } from "effect";
import {
  AmbiguousProjectError as LegacyAmbiguousProjectError,
  discoverProject as discoverProjectSync,
  NoReactDependencyError as LegacyNoReactDependencyError,
  PackageJsonNotFoundError as LegacyPackageJsonNotFoundError,
  ProjectNotFoundError as LegacyProjectNotFoundError,
} from "@react-doctor/project-info";
import type { ProjectInfo } from "@react-doctor/types";
import {
  AmbiguousProject,
  NoReactDependency,
  ProjectNotFound,
  ReactDoctorError,
} from "./errors.js";

/**
 * `Project` is the discovery service: "given a directory, what
 * React project lives at it?" Today the only live layer is
 * `layerNode`, which delegates to the existing
 * `@react-doctor/project-info` crawler. A `layerInMemory` (driven
 * by an injected mock filesystem tree) is the natural follow-up
 * for unit tests that don't want to lay out a temp-dir fixture
 * for every assertion.
 *
 * Errors from the underlying crawler are translated into the
 * runtime's tagged-error vocabulary at this boundary, so callers
 * downstream get to match on `ReactDoctorError` reasons instead
 * of importing per-error classes from `@react-doctor/project-info`.
 */
export class Project extends Context.Service<
  Project,
  {
    readonly discover: (directory: string) => Effect.Effect<ProjectInfo, ReactDoctorError>;
  }
>()("@react-doctor/runtime/Project") {
  static readonly layerNode = Layer.succeed(
    Project,
    Project.of({
      discover: (directory: string) =>
        Effect.try({
          try: () => discoverProjectSync(directory),
          catch: (cause) => translateProjectInfoError(cause, directory),
        }),
    }),
  );

  static readonly layerOf = (projectInfo: ProjectInfo): Layer.Layer<Project> =>
    Layer.succeed(
      Project,
      Project.of({
        discover: () => Effect.succeed(projectInfo),
      }),
    );
}

/**
 * Maps the legacy class-based errors thrown by
 * `discoverProject` into the tagged-error facade the runtime
 * speaks. Adding a finer-grained leaf reason
 * (e.g. `PackageJsonMalformed`) becomes one new `TaggedErrorClass`
 * and one new `instanceof` check here.
 */
const translateProjectInfoError = (cause: unknown, directory: string): ReactDoctorError => {
  if (cause instanceof LegacyNoReactDependencyError) {
    return new ReactDoctorError({ reason: new NoReactDependency({ directory: cause.directory }) });
  }
  if (cause instanceof LegacyProjectNotFoundError) {
    return new ReactDoctorError({ reason: new ProjectNotFound({ directory: cause.directory }) });
  }
  if (cause instanceof LegacyPackageJsonNotFoundError) {
    return new ReactDoctorError({ reason: new ProjectNotFound({ directory: cause.directory }) });
  }
  if (cause instanceof LegacyAmbiguousProjectError) {
    return new ReactDoctorError({
      reason: new AmbiguousProject({
        directory: cause.directory,
        candidates: cause.candidates,
      }),
    });
  }
  return new ReactDoctorError({ reason: new ProjectNotFound({ directory }) });
};
