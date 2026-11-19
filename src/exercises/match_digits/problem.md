The digit character class `\d` matches any digit character (such as `0`–`9` or any Unicode digit).

## Examples

```go
matchPattern("apple1", `\d`) // true (contains digit '1')
matchPattern("apple", `\d`)  // false (no digits present)
matchPattern("dog", "d")      // true (literal matching continues to work)
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Return `true` if `pattern` is `\d` and `line` contains any Unicode digit.
- Retain existing support for single literal character matching.
- Return `false` otherwise. If `pattern` is empty, return `true`.
