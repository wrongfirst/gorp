Extend the CLI tool to support match-only extraction (`-o` / `--only-matching`), capture groups, and backreferences.

---

## Instructions

Implement `RunCLI`:

- Parse CLI flags from `args`:
  - Support `-o` and `--only-matching` flags.
  - The pattern can be specified before or after flags (e.g., `["-o", "\\w+"]` or `["\\w+", "-o"]`).
  - If the pattern is missing or empty (`""`), an unrecognized flag (starting with `-`) is passed, or extra positional arguments are provided, return exit code `2`.
- When `-o` is enabled:
  - Read lines from `stdin` and extract all non-overlapping substrings matching `pattern`.
  - Print each extracted non-empty match followed by `\n` to `stdout`.
- When `-o` is not enabled:
  - Print each entire matching line followed by `\n` to `stdout`.
- Return `0` if at least one match was emitted, `1` if zero matches were emitted, and `2` on error.

---

## Running Locally

```bash
make build
./bin/gorp -o "\w+@\w+\.com" < testdata/emails.txt
./bin/gorp "([a-zA-Z]+) \1" < testdata/sample.txt
```
