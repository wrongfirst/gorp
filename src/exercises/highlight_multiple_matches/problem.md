Highlight all non-overlapping matches across a line using ANSI red escape codes (`\033[31m` and `\033[0m`).

## Examples

```go
highlightAllMatches("cat and dog", "cat|dog")
// => "\033[31mcat\033[0m and \033[31mdog\033[0m" (both branches highlighted)

highlightAllMatches("100 200 300", `\d+`)
// => "\033[31m100\033[0m \033[31m200\033[0m \033[31m300\033[0m" (all numbers highlighted)

highlightAllMatches("aaaa", "aa")
// => "\033[31maa\033[0m\033[31maa\033[0m" (non-overlapping pairs highlighted)
```

---

## Instructions

Implement `highlightAllMatches(line string, pattern string) string`:
- Highlight all non-overlapping non-empty matches of `pattern` in `line` from left to right with `\033[31m` and `\033[0m` (skipping zero-length matches; when multiple alternation branches match at the same starting position, take the longest match).
- Preserve all non-matching characters and spacing.
- Return the original `line` unchanged if no matches are found or if `pattern` is empty.
