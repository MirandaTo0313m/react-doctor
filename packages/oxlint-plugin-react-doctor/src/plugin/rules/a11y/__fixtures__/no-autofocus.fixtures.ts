// GENERATED FROM OXC — do not edit by hand. Run `pnpm gen:fixtures` to regenerate.
// Source: oxc-project/oxc `crates/oxc_linter/src/rules/no_autofocus.rs`
// Each entry is a verbatim port of an OXC `pass`/`fail` vec entry.
// `oxcOptions` (optional) is OXC's first config arg (`Some(json!([…]))`),
// preserved as JS for tests that want to translate it. `oxcSettings`
// (optional) mirrors the third tuple slot used for plugin settings.

export interface OxcFixture {
  code: string;
  oxcOptions?: unknown;
  oxcSettings?: unknown;
  oxcFilename?: string;
}

export const passCases: ReadonlyArray<OxcFixture> = [
  { code: `<div />;` },
  { code: `<div autofocus />;` },
  { code: `<input autofocus="true" />;` },
  { code: `<Foo bar />` },
  { code: `<Button />` },
  {
    code: `<Foo />`,
    oxcOptions: [
      {
        ignoreNonDOM: true,
      },
    ],
  },
  { code: `<Foo />`, oxcOptions: [{ ignoreNonDOM: false }] },
  {
    code: `<Foo autoFocus />`,
    oxcOptions: [
      {
        ignoreNonDOM: true,
      },
    ],
  },
  {
    code: `<Foo autoFocus='true' />`,
    oxcOptions: [
      {
        ignoreNonDOM: true,
      },
    ],
  },
  { code: `<div autoFocus={false} />` },
  { code: `<div autoFocus={(false)} />` },
  { code: `<div autoFocus={("false")} />` },
  { code: `<div autoFocus={(\`false\`)} />` },
  { code: `<div autoFocus="false" />` },
  {
    code: `<Foo autoFocus />`,
    oxcOptions: [
      {
        ignoreNonDOM: true,
      },
    ],
  },
  {
    code: `<div><div autofocus /></div>`,
    oxcOptions: [
      {
        ignoreNonDOM: true,
      },
    ],
  },
  {
    code: `<Button />`,
    oxcSettings: {
      settings: {
        "jsx-a11y": {
          components: {
            Button: "button",
          },
        },
      },
    },
  },
  {
    code: `<Button />`,
    oxcOptions: [
      {
        ignoreNonDOM: true,
      },
    ],
    oxcSettings: {
      settings: {
        "jsx-a11y": {
          components: {
            Button: "button",
          },
        },
      },
    },
  },
];

export const failCases: ReadonlyArray<OxcFixture> = [
  { code: `<div autoFocus />` },
  { code: `<div autoFocus={true} />` },
  {
    code: `<div autoFocus={"true"} />`,
    oxcOptions: [
      {
        ignoreNonDOM: true,
      },
    ],
  },
  {
    code: `<div autoFocus={\`true\`} />`,
    oxcOptions: [
      {
        ignoreNonDOM: true,
      },
    ],
  },
  {
    code: `<div autoFocus={(true)} />`,
    oxcOptions: [
      {
        ignoreNonDOM: true,
      },
    ],
  },
  { code: `<div autoFocus={true} />`, oxcOptions: [{ ignoreNonDOM: false }] },
  { code: `<div autoFocus={undefined} />` },
  { code: `<div autoFocus="true" />` },
  { code: `<input autoFocus />` },
  { code: `<Foo autoFocus />` },
  {
    code: `<Button autoFocus />`,
    oxcSettings: {
      settings: {
        "jsx-a11y": {
          components: {
            Button: "button",
          },
        },
      },
    },
  },
  {
    code: `<Button autoFocus />`,
    oxcOptions: [
      {
        ignoreNonDOM: true,
      },
    ],
    oxcSettings: {
      settings: {
        "jsx-a11y": {
          components: {
            Button: "button",
          },
        },
      },
    },
  },
];
