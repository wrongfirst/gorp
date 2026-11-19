Assemble the Thompson NFA engine behind `Matcher` / `RegexEngine` interfaces and compare its linear-time performance against the recursive backtracking engine.

On pathological patterns like `^a?a?a?a?a?a?a?a?aaaaaaaa$`:
- **Backtracking Engine**: Explores exponential (`2^8+`) recursive branches.
- **Thompson NFA Engine**: Steps across input in linear lockstep (< 100 transitions).

## Examples

```go
engine := NewNFAEngine()
m, _ := engine.Compile("^abc$")
m.Match("abc")  // true
m.Match("abcd") // false

Grep("^ap", []string{"apple", "banana", "apricot"})
// => ["apple", "apricot"], nil

CompareEngines("^a?a?a?a?a?a?a?a?aaaaaaaa$", "aaaaaaaa")
// => BacktrackMatch: true, NFAMatch: true, BacktrackSteps > 1000, NFASteps < 100
```

---

## Instructions

Implement `Compile` on `*NFAEngine`, `CompareEngines`, and `Grep`:

- In `Compile`: support leading `^`, trailing `$`, unanchored matching, and empty pattern `""` (matching every string); return an error for invalid pattern syntax.
- In `CompareEngines`: populate `ComparisonResult` (`Pattern`, `Text`, `BacktrackMatch`, `NFAMatch`, `BacktrackSteps`, `NFASteps`) using the shared pattern syntax supported by both engines (`^`, `$`, literals, `.`, `\d`, `\w`, `*`, `+`, `?`), returning an error if NFA compilation fails.
- In `Grep`: compile `pattern` with `NewNFAEngine()` (returning `nil, err` on error) and return all matching `lines` in order, or a non-nil empty slice `[]string{}` if none match.

---

## Running Locally

Swap `matcher.DefaultEngine` in `pkg/matcher` to your Thompson NFA engine, add benchmarks in `pkg/matcher`, and test locally against `testdata/pathological.txt`:

```bash
make build && make test && make bench
./bin/gorp "^a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?a?aaaaaaaaaaaaaaaaaaaa$" testdata/pathological.txt
```
