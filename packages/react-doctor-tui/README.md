# react-doctor-tui

Interactive React code-health terminal UI for [react-doctor](https://www.npmjs.com/package/react-doctor). Built on [Ink](https://github.com/vadimdemedes/ink).

A live dashboard with a 0-100 score gauge, animated doctor face, progress checklist, and a master/detail diagnostic browser. Watches the filesystem and rescans on save.

## Install / run

```bash
npx react-doctor-tui .
```

Or via the existing `react-doctor` CLI (the `watch` and `review` subcommands lazy-load this package):

```bash
react-doctor watch .
react-doctor review .
```

## Modes

- `react-doctor-tui [dir]` — dashboard with score, doctor mood, categories, and the live progress checklist
- `react-doctor-tui [dir] --review` — open straight into the master/detail diagnostic browser
- `react-doctor-tui [dir] --watch` — rescan automatically when source files change

## Shortcuts

| Key                  | Action                       |
| -------------------- | ---------------------------- |
| `d`                  | switch to diagnostic review  |
| `v`                  | switch back to dashboard     |
| `r`                  | rescan immediately           |
| `w`                  | toggle watch mode            |
| `↑ / ↓` (or `j / k`) | navigate rules               |
| `← / →` (or `h / l`) | navigate sites within a rule |
| `/`                  | filter diagnostics           |
| `?`                  | toggle help overlay          |
| `q` / `ctrl-c`       | quit                         |

The TUI requires an interactive TTY. In CI or when piped, run the standard `react-doctor` CLI instead.

## License

MIT.
