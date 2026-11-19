A positive character group `[...]` matches any single character listed inside the brackets.

## Examples

```go
matchPattern("apple", "[abc]") // true (matches 'a')
matchPattern("dog", "[abc]")   // false (neither 'a', 'b', nor 'c' present)
matchPattern("cat", "[abc]")   // true (matches 'c')
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Return `true` if `pattern` is a bracketed group `[...]` and `line` contains any character from within the brackets.
- Retain existing support for `\w`, `\d`, and literal characters.
- Return `false` otherwise. If `pattern` is empty, return `true`.
