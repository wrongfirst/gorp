A character range `[start-end]` matches any character whose code point falls between `start` and `end` inclusive (for example, `[a-z]`, `[0-9]`, `[A-Z]`).

## Examples

```go
matchPattern("cat", "c[a-e]t")      // true ('a' is within 'a'–'e')
matchPattern("cut", "c[a-e]t")      // false ('u' is outside 'a'–'e')
matchPattern("item 3", "item [0-9]") // true ('3' is within '0'–'9')
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Support character ranges `[start-end]` inside brackets.
- Retain existing support for character groups, `\d`, `\w`, and literal sequences.
- Return `false` otherwise. If `pattern` is empty, return `true`.
