A negative character group `[^...]` matches any character that is not listed inside the brackets.

## Examples

```go
matchPattern("dog", "[^abc]")   // true ('d', 'o', 'g' are not in [abc])
matchPattern("cab", "[^abc]")   // false (all characters are inside [abc])
matchPattern("apple", "[abc]")  // true (positive group continues to work)
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Return `true` if `pattern` is `[^...]` and `line` contains any character not inside the brackets.
- Retain existing support for `[...]`, `\w`, `\d`, and literal characters.
- Return `false` otherwise. If `pattern` is empty, return `true`.
