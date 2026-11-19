Assemble the CLI tool with line numbering (`-n`), inverted match (`-v`), and color highlighting (`--color`).

---

## Instructions

Implement `RunCLI`:

- Parse CLI flags from `args`:
  - `-n`, `--line-number`: Prefix output lines with 1-based line number (`1:line`).
  - `-v`, `--invert-match`: Invert match logic to print non-matching lines.
  - `--color=[always|never|auto]` (default: `auto`; bare `--color` without a value enables `always`). Return exit code `2` on any other `--color=<val>` value.
  - Remaining argument is `pattern`. Return exit code `2` if `pattern` is missing or empty (`""`), if an unrecognized flag (starting with `-`) is passed, or if extra positional arguments are provided.
- Resolve color highlighting:
  - `colorOpt == "always"`: `true`
  - `colorOpt == "never"`: `false`
  - `colorOpt == "auto"`: `isTTY && !noColorSet`
- For each line from `stdin`:
  - When `-v` is false: select line if it matches `pattern`. If color is enabled, wrap all non-overlapping matches with ANSI red (`\033[31m` ... `\033[0m`).
  - When `-v` is true: select line if it does not match `pattern`. Never highlight inverted matches.
  - If selected, print `[linenumber:]<line>\n` to `stdout`.
- Return `0` if at least one line was emitted, `1` if zero lines were emitted, and `2` on error.

---

## Running Locally

```bash
make build
./bin/gorp --color=always -n "ERROR" < testdata/server.log
./bin/gorp -v "ERROR" < testdata/server.log
```
