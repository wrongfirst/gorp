Assemble the Stage 1 pattern matcher into a standard I/O command-line filter.

## Exit Codes
- **`0`**: Pattern matched at least one input line.
- **`1`**: No input lines matched the pattern.
- **`2`**: Invalid arguments, empty pattern, or I/O error.

---

## Instructions

Implement `RunCLI` (where `args` excludes the program name):

- If `len(args) == 0`, `args[0] == ""`, an unrecognized flag (starting with `-`) is passed, or extra positional arguments are provided (`len(args) > 1`), return exit code `2`.
- Read lines from `stdin`.
- For each line matching `args[0]`, write the line followed by `\n` to `stdout`.
- Return `0` if at least one line matched, `1` if zero lines matched, or `2` on I/O error.

---

## Running Locally

To assemble and run `gorp` on your own machine, download and extract [**`gorp.zip`**](/gorp.zip) (contains the multi-package Go scaffold with `cmd/gorp/main.go`, `pkg/matcher/`, `pkg/display/`, `pkg/search/`, `Makefile`, and `testdata/`), wire your Stage 1 matcher into `pkg/matcher` and `cmd/gorp/main.go`, then build and test:

```bash
unzip gorp.zip && cd gorp
make build
echo -e "apple\nbanana\napricot" | ./bin/gorp "^ap"
echo "hello" | ./bin/gorp "world"; echo "Exit: $?"
```
