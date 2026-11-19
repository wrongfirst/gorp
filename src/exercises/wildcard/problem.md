The dot `.` matches any single character except newline (`\n`).

## Examples

```go
matchPattern("cat", "c.t")         // true ('.' matches 'a')
matchPattern("ct", "c.t")          // false (requires exactly one character)
matchPattern("caat", "c.t")        // false (matches only single character)
matchPattern("hello world", ".+")  // true (combines with '+' quantifier)
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Support `.` matching any character except `\n`.
- Support `.` combined with quantifiers (`+`, `?`) and anchors (`^`, `$`).
- Support backslash escaping (`\.`, `\[`, `\]`, `\\`, `\+`, `\?`) to match punctuation metacharacters literally.
- Retain support for all previous pattern features.
- Return `false` otherwise. If `pattern` is empty, return `true`.
