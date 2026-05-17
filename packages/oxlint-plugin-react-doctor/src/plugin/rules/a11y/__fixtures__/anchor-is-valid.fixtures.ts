// GENERATED FROM OXC — do not edit by hand. Run `pnpm gen:fixtures` to regenerate.
// Source: oxc-project/oxc `crates/oxc_linter/src/rules/anchor_is_valid.rs`
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
  { code: `<Anchor />` },
  { code: `<a {...props} />` },
  { code: `<a href='foo' />`, oxcOptions: [{ validHrefs: ["foo"] }] },
  { code: `<a href={foo} />` },
  { code: `<a href='/foo' />`, oxcOptions: [{ validHrefs: ["/foo"] }] },
  {
    code: `<a href='https://foo.bar.com' />`,
    oxcOptions: [{ validHrefs: ["https://foo.bar.com"] }],
  },
  { code: `<div href='foo' />` },
  { code: `<a href='javascript' />`, oxcOptions: [{ validHrefs: ["javascript"] }] },
  { code: `<a href='javascriptFoo' />`, oxcOptions: [{ validHrefs: ["javascriptFoo"] }] },
  { code: `<a href={\`#foo\`}/>` },
  { code: `<a href={'foo'}/>`, oxcOptions: [{ validHrefs: ["foo"] }] },
  { code: `<a href={'javascript'}/>`, oxcOptions: [{ validHrefs: ["javascript"] }] },
  { code: `<a href={\`#javascript\`}/>` },
  { code: `<a href='#foo' />`, oxcOptions: [{ validHrefs: ["#foo"] }] },
  { code: `<a href='#javascript' />`, oxcOptions: [{ validHrefs: ["#javascript"] }] },
  { code: `<a href='#javascriptFoo' />`, oxcOptions: [{ validHrefs: ["#javascriptFoo"] }] },
  { code: `<UX.Layout>test</UX.Layout>` },
  { code: `<a href={this} />` },
  {
    code: `<Link to={dest} />`,
    oxcSettings: {
      settings: {
        "jsx-a11y": {
          components: { Link: "a" },
          attributes: { href: ["href", "to"] },
        },
      },
    },
  },
  { code: `<a href='foo' onClick={() => void 0} />`, oxcOptions: [{ validHrefs: ["foo"] }] },
  { code: `<a href={foo} onClick={() => void 0} />` },
  { code: `<a href='/foo' onClick={() => void 0} />`, oxcOptions: [{ validHrefs: ["/foo"] }] },
  {
    code: `<a href='https://foo.bar.com' onClick={() => void 0} />`,
    oxcOptions: [{ validHrefs: ["https://foo.bar.com"] }],
  },
  { code: `<div href='foo' onClick={() => void 0} />` },
  { code: `<a href={\`#foo\`} onClick={() => void 0} />` },
  { code: `<a href={'foo'} onClick={() => void 0} />`, oxcOptions: [{ validHrefs: ["foo"] }] },
  { code: `<a href='#foo' onClick={() => void 0} />`, oxcOptions: [{ validHrefs: ["#foo"] }] },
  { code: `<a href={this} onClick={() => void 0} />` },
  { code: `<a href='/some/valid/uri'>valid</a>` },
  { code: `<a href={'/some/valid/uri'}>valid</a>` },
  { code: `<a href={\`/some/valid/uri\`}>valid</a>` },
  { code: `<a href='#top'>Navigate to internal page location</a>` },
  { code: `<a href={'#top'}>Navigate to internal page location</a>` },
  { code: `<a href={\`#top\`}>Navigate to internal page location</a>` },
  { code: `<a href='https://github.com'>github</a>` },
  { code: `<a href={'https://github.com'}>github</a>` },
  { code: `<a href={\`https://github.com\`}>github</a>` },
  { code: `<a href='#section'>section</a>` },
  { code: `<a href={'#section'}>section</a>` },
  { code: `<a href={\`#section\`}>section</a>` },
  { code: `<a href={\`\${foo}\`}>valid</a>` },
  { code: `<a href={\`#\${foo}\`}>valid</a>` },
  { code: `<a href={\`#\${foo}/bar\`}>valid</a>` },
  { code: `<a href={foo + bar}>valid</a>` },
];

export const failCases: ReadonlyArray<OxcFixture> = [
  { code: `<a />` },
  { code: `<a href={undefined} />` },
  { code: `<a href={null} />` },
  { code: `<a href='' />;` },
  { code: `<a href='#' />` },
  { code: `<a href={'#'} />` },
  { code: `<a href={\`#\`} />` },
  { code: `<a href='javascript:void(0)' />` },
  { code: `<a href={'javascript:void(0)'} />` },
  { code: `<a onClick={() => void 0} />` },
  { code: `<a href='#' onClick={() => void 0} />` },
  { code: `<a href='javascript:void(0)' onClick={() => void 0} />` },
  { code: `<a href={'javascript:void(0)'} onClick={() => void 0} />` },
  {
    code: `<Link to='#' />`,
    oxcSettings: {
      settings: {
        "jsx-a11y": {
          components: { Link: "a" },
          attributes: { href: ["href", "to"] },
        },
      },
    },
  },
];
