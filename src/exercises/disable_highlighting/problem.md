Control ANSI colorization using `ColorOption` (`ColorAlways` vs `ColorNever`).

## Examples

```go
formatLines([]string{"disk error"}, "error", ColorAlways)
// => ["disk \033[31merror\033[0m"] (ANSI codes applied)

formatLines([]string{"disk error"}, "error", ColorNever)
// => ["disk error"] (plain text without ANSI codes)

formatLines([]string{"all good"}, "error", ColorAlways)
// => [] (non-matching line omitted)
```

---

## Instructions

Implement `formatLine` and `formatLines`:

- In `ColorAlways` mode, wrap all non-overlapping matches of `pattern` in matching lines with `\033[31m` ... `\033[0m`.
- In `ColorNever` (or any unrecognized `ColorOption`) mode, return matching lines as plain text without ANSI escape sequences.
- If `pattern` is `""`, every line matches without highlights.
- Return `("", false)` for non-matching lines in `formatLine`.
- In `formatLines`, exclude non-matching lines and return a non-nil empty slice `[]string{}` when `lines` is empty or no lines match.
