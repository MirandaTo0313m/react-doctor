// GENERATED FROM OXC — do not edit by hand. Run `pnpm gen:fixtures` to regenerate.
// Source: oxc-project/oxc `crates/oxc_linter/src/rules/no_redundant_roles.rs`
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
  { code: `<div />` },
  { code: `<button />` },
  { code: `<button></button>` },
  { code: `<button>Foo</button>` },
  { code: `<button>role</button>` },
  { code: `<nav />` },
  { code: `<main />` },
  { code: `<button role='main' />` },
  { code: `<MyComponent role='button' />` },
  { code: `<button role={\`\${foo}button\`} />` },
  {
    code: `<Button role={\`\${foo}button\`} />`,
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
  { code: `<select role="menu"><option>1</option><option>2</option></select>` },
];

export const failCases: ReadonlyArray<OxcFixture> = [
  { code: `<button role='button' />` },
  { code: `<button role='button' data-foo='bar' />` },
  { code: `<button role='button' data-role='bar' />` },
  { code: `<button data-role='bar' role='button' />` },
  { code: `<button role='button'></button>` },
  { code: `<button role='button'>Foo</button>` },
  { code: `<button role='button'><p>Test</p></button>` },
  { code: `<button role='button' title='button'></button>` },
  { code: `<nav role='navigation' />` },
  {
    code: `<Button role='button' />`,
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
  { code: `<article role="article" />` },
  { code: `<aside role="complementary" />` },
  { code: `<footer role="contentinfo" />` },
  { code: `<form role="form" />` },
  { code: `<h1 role="heading" />` },
  { code: `<h2 role="heading" />` },
  { code: `<header role="banner" />` },
  { code: `<hr role="separator" />` },
  { code: `<img role="img" />` },
  { code: `<li role="listitem" />` },
  { code: `<main role="main" />` },
  { code: `<ol role="list" />` },
  { code: `<ul role="list" />` },
  { code: `<select role="combobox" />` },
  { code: `<select role="listbox" />` },
  { code: `<table role="table" />` },
  { code: `<tbody role="rowgroup" />` },
  { code: `<td role="cell" />` },
  { code: `<textarea role="textbox" />` },
  { code: `<section role="region" />` },
  { code: `<dialog role="dialog" />` },
  { code: `<fieldset role="group" />` },
  { code: `<figure role="figure" />` },
  { code: `<meter role="meter" />` },
  { code: `<output role="status" />` },
  { code: `<p role="paragraph" />` },
  { code: `<progress role="progressbar" />` },
  { code: `<tr role="row" />` },
];
