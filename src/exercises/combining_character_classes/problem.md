Patterns can combine multiple character classes and literals in sequence (for example, `\d \w\w\w` or `[abc]\d_`), matching a contiguous sequence of tokens anywhere in the line.

## Examples

```go
matchPattern("I have 3 dogs", `\d \w\w\w\w`) // true (matches "3 dogs")
matchPattern("I have no dogs", `\d \w\w\w\w`) // false (no digit preceding word characters)
matchPattern("code_z9", `[^abc]\d`)              // true (matches "z9")
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Support patterns combining `\d`, `\w`, `[...]`, `[^...]`, and literal characters in sequence.
- Return `true` if the pattern matches a contiguous sequence of characters anywhere in `line`.
- Return `false` otherwise. If `pattern` is empty, return `true`.
