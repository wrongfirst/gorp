Parentheses `(...)` define a capturing group, and `\1` references the exact substring matched by the first capturing group.

## Examples

```go
matchPattern("cat and cat", `(cat) and \1`) // true (\1 matches captured "cat")
matchPattern("cat and dog", `(cat) and \1`) // false (\1 expects "cat", found "dog")
matchPattern("hello hello", `(\w+) \1`)     // true (matches repeated word)
matchPattern("hello world", `(\w+) \1`)     // false (second word differs)
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Support a single capturing group `(...)` and backreference `\1`.
- Retain existing support for quantifiers, anchors, wildcard, alternation, and character classes.
- Return `false` otherwise. If `pattern` is empty, return `true`.
