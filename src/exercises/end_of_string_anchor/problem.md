The dollar sign `$` at the end of a pattern anchors matching to the end of the line. Combined with `^`, it requires an exact full-string match.

## Examples

```go
matchPattern("big dog", "dog$") // true ("dog" appears at the end of the line)
matchPattern("dog food", "dog$") // false (trailing characters prevent match)
matchPattern("cat", "^cat$")    // true (entire line matches "cat" exactly)
matchPattern("", "^$")          // true (empty line matches ^$)
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Support `^` at the start and `$` at the end.
- Support `^...$` to require an exact full-string match.
- Retain support for unanchored matching, character classes, and ranges.
- Return `false` otherwise. Return `true` if `pattern` is empty (`""`), or for standalone anchors `"^"` or `"$"` on any line, or `"^$"` on an empty line `""`.
