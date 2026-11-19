Prefix matching lines with 1-based line numbers within their source file (equivalent to `grep -n`).

## Examples

Given an `fsys` containing `config.ini` (`server_port=8080`, `max_connections=500`, `server_timeout=30`):

```go
searchFileWithOptions(fsys, "config.ini", "server_", true)
// => ["1:server_port=8080", "3:server_timeout=30"], nil

searchFileWithOptions(fsys, "config.ini", "server_", false)
// => ["server_port=8080", "server_timeout=30"], nil

searchFileWithOptions(fsys, "config.ini", "database", true)
// => [], nil
```

---

## Instructions

Implement `searchFileWithOptions` (which `searchFileWithLineNumbers` calls with `showLineNumbers` set to `true`):

- Open and read the file at `filePath` within `fsys`, returning `nil, err` if it cannot be opened or read.
- Strip `\n` and trailing `\r` (CRLF) from each line and track 1-based line numbers as lines are read.
- Match each line against `pattern` (if `pattern` is `""`, every line matches).
- When `showLineNumbers` is `true`, format matching lines as `"<line_number>:<line_content>"`; otherwise return `"<line_content>"`.
- Return a non-nil empty slice `[]string{}` and `nil` error if no lines match or if the file is empty.
