// HACK: render-prop proliferation (`<Foo renderHeader={…} renderFooter={…}
// renderActions={…} />`) is the smell - a single render-prop is often
// the legitimate library API (MUI Autocomplete's `renderInput`, FlatList's
// `renderItem`, react-hook-form's Controller `render`, etc.) and we
// shouldn't fire on those. Instead we flag the COMPOUND case: when a
// single element receives 3 or more `render*` props, that's the smell
// of "many slots cobbled together where compound components or
// `children` would be cleaner".

export interface UnsafePrefixSplit {
  baseName: string;
  hasUnsafePrefix: boolean;
}
