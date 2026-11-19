Highlight the first match in a line by wrapping the matched substring with ANSI red escape codes (`\033[31m` and `\033[0m`).

## Examples

```go
highlightSingleMatch("hello world", "world")
// => "hello \033[31mworld\033[0m" ("world" wrapped in red ANSI codes)

highlightSingleMatch("user 42 logged in", `\d+`)
// => "user \033[31m42\033[0m logged in" (first number highlighted)

highlightSingleMatch("apple pie", "orange")
// => "apple pie" (unchanged on no match)
```

---

## Instructions

Implement `highlightSingleMatch(line string, pattern string) string`:
- Locate the earliest (leftmost) non-empty match of `pattern` in `line`.
- Wrap the matched substring with `\033[31m` and `\033[0m`.
- Return the original `line` unchanged if no match is found or if `pattern` is empty.
