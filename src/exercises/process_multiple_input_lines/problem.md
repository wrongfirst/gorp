Process multiline streams from strings or `io.Reader`, stripping newline delimiters (`\n` and `\r`).

## Examples

```go
processInput("INFO: ok\nERROR: fail\nERROR: crash", "ERROR")
// => ["ERROR: fail", "ERROR: crash"] (filters lines containing "ERROR")

processInput("100\n200\nabc", `^\d+$`)
// => ["100", "200"] (only lines of digits)

processInput("line 1\r\nline 2\r\n", "line")
// => ["line 1", "line 2"] (CRLF newlines stripped)

processInput("", "test")
// => [] (empty stream produces empty slice)
```

---

## Instructions

Implement `processInput` and `processReader`:

- Split the input stream into individual lines, stripping `\n` and trailing `\r` (CRLF). A trailing newline ends the final line without producing an extra empty line.
- Evaluate each line against `pattern` (an empty `pattern` `""` matches every line in non-empty input).
- Return all matching lines in order, or a non-nil empty slice `[]string{}` if no lines match or the input is empty.
- For `processReader`, return `nil, err` if reading fails.
