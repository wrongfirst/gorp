Capturing groups are numbered sequentially by the order of their opening parentheses (`\1`, `\2`, `\3`, etc.) and can be referenced in any order or multiple times.

## Examples

```go
matchPattern("cat and dog, cat and dog", `(\w+) and (\w+), \1 and \2`) // true
matchPattern("cat and dog, dog and cat", `(\w+) and (\w+), \1 and \2`) // false (pair inverted)
matchPattern("100 test test 100", `^(\d+) (\w+) \2 \1$`)               // true (reverse order)
matchPattern("go-go-go", `^(\w+)-\1-\1$`)                              // true (multiple references)
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Support multiple capturing groups and single-digit backreferences (`\1`–`\9`).
- Allow backreferences to appear in any order and be used multiple times; a backreference to an unmatched/optional group fails to match (`false`).
- Retain existing support for quantifiers, anchors, wildcard, escaped metacharacters (`\.`, `\[`, `\]`, `\\`), alternation, and character classes.
- Return `false` otherwise. If `pattern` is empty, return `true`.
