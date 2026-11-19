Assemble multi-file search and recursive directory traversal into the filesystem grep CLI tool.

---

## Instructions

Implement `RunCLI`:

- Parse flags and arguments from `args` (program name excluded, flags passed as separate elements):
  - `-r`, `-R`, `--recursive`: Recursively search directories.
  - `-n`, `--line-number`: Prefix matches with 1-based line numbers.
  - `-v`, `--invert-match`: Invert match logic to select non-matching lines.
  - Any other unrecognized flag (starting with `-`) returns exit code `2`.
  - First non-flag argument is `pattern`.
  - Subsequent non-flag arguments are target `paths`. If `pattern` is missing/empty (`""`) or no `paths` are provided, return `2`.
- Target evaluation:
  - If any target does not exist, cannot be read, or is a directory when `-r`/`-R`/`--recursive` is not set, return exit code `2` without writing partial output to `stdout`.
  - If more than one target path is passed OR recursive mode is enabled, include the file path prefix `<path>:`.
  - If `-n` / `--line-number` is set, include `<lineNum>:`.
  - Format each emitted line as `[<path>:][<lineNum>:]<line>\n`.
- Return `0` if at least one line was emitted, `1` if zero lines were emitted, and `2` on error.

---

## Running Locally

```bash
make build
./bin/gorp -r -n "func " testdata/codebase
./bin/gorp -n "INFO" testdata/server.log testdata/sample.txt
```
