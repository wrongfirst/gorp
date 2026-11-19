Decouple pattern matching from execution strategy using `Matcher` and `RegexEngine` interfaces.

## Examples

```go
engine := NewBacktrackingEngine()
matcher, _ := engine.Compile("^error:")
matcher.Match("error: not found") // true
matcher.Match("info: ready")       // false

results, _ := GrepWithEngine(engine, "^error:", []string{"error: 1", "warn: 2"})
// results == ["error: 1"]
```

---

## Instructions

Implement `Pattern` and `Match` on `*BacktrackingMatcher`, `Compile` on `*BacktrackingEngine`, and `GrepWithEngine`:

- In `Compile(pattern string) (Matcher, error)`: handle leading `^` and trailing `$` anchors, preserve the original `pattern` for `Pattern()`, and compile `""` as a valid matcher that matches any string (`true`).
- In `Match(text string) bool`: support anchored (`^`, `$`) and unanchored substring matching using the compiled matcher.
- In `GrepWithEngine`: compile `pattern` with `engine` (returning `nil, err` if compilation fails) and return all matching lines in order, or a non-nil empty slice `[]string{}` when no lines match.
