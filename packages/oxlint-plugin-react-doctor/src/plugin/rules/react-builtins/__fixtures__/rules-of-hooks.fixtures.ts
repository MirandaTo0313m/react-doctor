// GENERATED FROM OXC — do not edit by hand. Run `pnpm gen:fixtures` to regenerate.
// Source: oxc-project/oxc `crates/oxc_linter/src/rules/rules_of_hooks.rs`
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
  {
    code: `
            function Component() {
              use2FAMutation();
            }
        `,
  },
  {
    code: `
            function use3DEngine() {
              useEffect(() => {}, []);
            }
        `,
  },
  {
    code: `
            function App() {
              const text = use(Promise.resolve('A'));
              return <Text text={text} />
            }
        `,
  },
  {
    code: `
            import * as React from 'react';
            function App() {
              if (shouldShowText) {
                const text = use(query);
                const data = React.use(thing);
                const data2 = react.use(thing2);
                return <Text text={text} />
              }
              return <Text text={shouldFetchBackupText ? use(backupQuery) : "Nothing to see here"} />
            }
        `,
  },
  {
    code: `
            function App() {
              let data = [];
              for (const query of queries) {
                const text = use(item);
                data.push(text);
              }
              return <Child data={data} />
            }
        `,
  },
  {
    code: `
            function App() {
              const data = someCallback((x) => use(x));
              return <Child data={data} />
            }
        `,
  },
  {
    code: `
            function useLabeledBlock() {
                label: {
                    useHook();
                    if (a) break label;
                }
            }
        `,
  },
  {
    code: `
            export const FalsePositive = ({ editor, anchorElem, isLink, linkNodeUrl, close }: Props) => {
              // This custom hook invocation seems to trigger false positives below
              const [state, setState] = useCustomHook<State>({
                inputLinkUrl: linkNodeUrl ?? '',
                editable: !isLink,
                lastLinkUrl: '',
                lastSelection: null
              });

              const [someThing, setSomeThing] = useState(true);

              const onEdit = useCallback(() => setSomeThing(false), [inputLinkUrl, setSomeThing]);

              const updateLinkEditor = useCallback(() => {
                const rootElement = editor.getRootElement();

                if (nativeSelection.anchorNode === rootElement) {
                  let inner = rootElement;
                  while (inner.firstElementChild !== null) {
                    inner = inner.firstElementChild as HTMLElement;
                  }
                }
              }, [anchorElem, editor, setSomeThing]);

              return <div>test</div>;
            };
        `,
  },
  {
    code: `
            function useLabeledBlock() {
                let x = () => {
                    if (some) {
                        noop();
                    }
                };
                useHook();
            }
        `,
  },
  {
    code: `

            export const Component = () => {
                return {
                    Target: () => {
                        useEffect(() => {
                            return () => {
                                something.value = true;
                            };
                        }, []);
                        return <div></div>;
                    },
                    useTargetModule: (m) => {
                        useModule(m);
                    },
                };
            };
        `,
  },
  {
    code: `
            test.beforeEach(async () => {
                timer = Sinon.useFakeTimers({
                    toFake: ['setInterval'],
                });
            });
    `,
  },
  {
    code: `export default function App() {
       const [state, setState] = useState(0);

       useEffect(() => {
         console.log('Effect called');
       }, []);

       return <div>{state}</div>;
    }
    // https://github.com/toeverything/AFFiNE/blob/0ec1995addbb09fb5d4af765d84cc914b2905150/packages/frontend/core/src/hooks/use-query.ts#L46
    `,
  },
  {
    code: `const createUseQuery =
    (immutable: boolean): useQueryFn =>
    (options, config) => {
        const configWithSuspense: SWRConfiguration = useMemo(
            () => ({
                suspense: true,
                ...config,
            }),
            [config],
        );

        const useSWRFn = immutable ? useSWRImutable : useSWR;
        return useSWRFn(options ? () => ['cloud', options.query.id, options.variables] : null, options ? () => fetcher(options) : null, configWithSuspense);
    };`,
  },
  { code: `const MyComponent2 = makeComponent(function () { useHook(); });` },
  { code: `const MyComponent4 = makeComponent(function InnerComponent() { useHook(); });` },
  {
    code: `const Foo = hoc((props) => { if (props.cond) { const [_a, _b] = useState(false); } });`,
  },
];

export const failCases: ReadonlyArray<OxcFixture> = [
  {
    code: `
        function Component() {
          if (Math.random()) {
            return null;
          } else if (!useHasPermission()) {
            return <Foo />
          }
          return <Content />;
        }
        `,
  },
  {
    code: `
        function Component() {
          switch (foo) {
            case 1:
              useCaseHook();
              break;
            default:
              break;
          }
        }
        `,
  },
  {
    code: `
        function Component() {
          switch (foo) {
            case 1:
              break;
            default:
              useDefaultHook();
          }
        }
        `,
  },
  {
    code: `
            function ComponentWithHookInsideLoop() {
              do {
                useHookInsideLoop();
              } while (cond);
            }
        `,
  },
  {
    code: `
                const AsyncComponent = async () => {
                    useState();
                }
        `,
  },
  {
    code: `
                async function Page() {
                  useId();
                  React.useId();
                }
        `,
  },
  {
    code: `
                async function notAHook() {
                  useId();
                }
        `,
  },
  {
    code: `
            function Component() {
                return <Foo>{props => { useMemo(() => {}, []); }}</Foo>;
            }
        `,
  },
  {
    code: `
            function Component() {
                return <Foo render={props => { useCallback(() => {}, []); }} />;
            }
        `,
  },
  {
    code: `const Foo3 = hoc(function NamedComp(props) { if (props.cond) { const [_a, _b] = useState(false); } });`,
  },
];
