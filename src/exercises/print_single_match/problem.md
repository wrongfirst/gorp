Extract the first substring in a line matching a pattern.

## Examples

```go
findSingleMatch("user id is 42", `\d+`)
// => "42", true (extracts first match)

findSingleMatch("order [AB-123] confirmed", `\[[A-Z]+-\d+\]`)
// => "[AB-123]", true (matches bracketed ID)

findSingleMatch("apple and banana", "cherry")
// => "", false (pattern not found)
```

---

## Instructions

Implement `findSingleMatch(line string, pattern string) (string, bool)`:
- Find the earliest (leftmost) non-empty substring in `line` that matches `pattern`.
- Return `(matchedSubstring, true)` if a match is found.
- Return `("", false)` if no match is found, or if `pattern` is empty.
- Support anchors (`^`, `$`), quantifiers (`+`, `*`, `?`, `{n,m}`), character classes, escaped metacharacters (`\.`, `\[`, `\]`, `\\`), alternation, and backreferences.
