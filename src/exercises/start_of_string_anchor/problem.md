The caret `^` at the start of a pattern anchors matching strictly to the beginning of the line. Without `^`, patterns match anywhere.

## Examples

```go
matchPattern("apple pie", "^apple") // true (matches "apple" at index 0)
matchPattern("an apple", "^apple")  // false ("apple" does not start at index 0)
matchPattern("hello", "^")          // true (lone anchor matches start of line)
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- If `pattern` begins with `^`, match only starting at the beginning of `line`.
- If `pattern` does not begin with `^`, match anywhere in `line`.
- Retain existing support for character classes, ranges, and literal sequences.
- Return `false` otherwise. If `pattern` is empty or only `"^"`, return `true`.
