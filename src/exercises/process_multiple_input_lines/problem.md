In real-world command-line usage, `grep` typically reads from a multiline stream—either piped from standard input (`stdin`) or read from a file on disk:

```bash
cat server.log | grep "ERROR"
```

A multiline stream consists of text separated by newline characters (`\n` or `\r\n`).

When processing an input stream, `grep`:
1. Reads the stream line-by-line using a line scanner or buffer.
2. Trims newline delimiters (`\n` and `\r`).
3. Evaluates each individual line against the regex pattern.
4. Outputs or collects all matching lines in order.

## Line Processing Details

- **Newline Delimiters**: Handles standard Unix newlines (`\n`) and Windows CRLF (`\r\n`).
- **Trailing Newlines**: Trailing newline at the end of the input does not create a spurious empty line.
- **Empty Lines**: An empty line in the middle of input is evaluated as an empty string (and will match patterns like `^$`, `.*`, or `""`).

In this exercise, we implement `processInput(input string, pattern string) []string` and `processReader(r io.Reader, pattern string) ([]string, error)` to handle multiline stream processing.

## How Multiline Input Processing Works

1. **Scanner / Reader**:
   - Use `bufio.NewScanner(r)` to read lines sequentially.
   - For each line scanned, check whether it matches `pattern` using `matchPattern(line, pattern)`.
2. **Collect Matching Lines**:
   - If the line matches, append it to the results slice.
3. **Empty Input**:
   - If the input string is empty, return an empty slice `[]string{}`.

### Examples

| Input Stream | Pattern | Output Lines | Explanation |
| :--- | :--- | :--- | :--- |
| `"INFO: ok\nERROR: fail\nDEBUG: trace\nERROR: crash"` | `"ERROR"` | `["ERROR: fail", "ERROR: crash"]` | Filters lines containing `"ERROR"` |
| `"100\n200\nabc\n300"` | `"^\\d+$"` | `["100", "200", "300"]` | Only lines with digits |
| `"line 1\r\nline 2\r\n"` | `"line"` | `["line 1", "line 2"]` | CRLF newlines stripped |
| `""` | `"test"` | `[]` | Empty stream produces empty slice |

---

## Problem Statement

Implement `processInput(input string, pattern string) []string` and `processReader(r io.Reader, pattern string) ([]string, error)` in the editor on the right.

The functions should:
- Split the input stream into individual lines, stripping `\n` and `\r`.
- Evaluate each line against `pattern`.
- Return all matching lines in the order they appeared.
- Return an empty slice `[]string{}` if no lines match or if the input is empty.
