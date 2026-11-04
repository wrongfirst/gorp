In this final assembly capstone, you bring together the Thompson NFA engine, comparative metrics, and engine swapping into your CLI tool.

Throughout this stage, we have:
1. Observed the catastrophic exponential cost of recursive backtracking (`O(2^N)`).
2. Abstracted regex execution behind `Matcher` and `RegexEngine` interfaces.
3. Built a tokenizer and Shunting-yard postfix parser.
4. Created an NFA state machine graph.
5. Implemented Ken Thompson's `O(N)` NFA construction algorithm.
6. Implemented lockstep linear-time NFA simulation.

---

## Code Self-Review: Backtracking vs. Linear NFA Simulation

The starter template includes canonical reference implementations of both engines:
- `BacktrackingEngine`: Speculative depth-first recursion exploring match branches.
- `NFAEngine`: Thompson graph construction and lockstep state-set simulation.

> [!NOTE]
> Before implementing the comparative evaluation, inspect both engines in the editor:
> - **State Set Deduping**: In `NFASimulator.step`, notice how duplicate states are pruned using a boolean lookup table `visited`. Why is set deduping the critical mechanism preventing exponential explosion?
> - **Algorithmic Bound**: Why can Thompson's simulation never exceed `O(N * |states|)` operations regardless of pattern structure or repetitions?

---

## Comparative Metrics

```go
type ComparisonResult struct {
    Pattern        string
    Text           string
    BacktrackMatch bool
    NFAMatch       bool
    BacktrackSteps int
    NFASteps       int
}
```

On pathological patterns like `^a?a?a?a?a?a?a?a?aaaaaaaa$`:
- **Backtracking Engine**: Explores `2^8+` recursive branches before finding the match.
- **Thompson NFA Engine**: Steps across the input in linear lockstep (< 100 transitions tested).
- Both return `Matched == true`!

---

## Task

Implement `NFAEngine`, `NFAMatcher`, `CompareEngines`, and `Grep` in the editor:

```go
type NFAEngine struct{}
func NewNFAEngine() *NFAEngine

func CompareEngines(pattern string, text string) (ComparisonResult, error)
func Grep(pattern string, lines []string) ([]string, error)
```

The functions should:
- Implement `RegexEngine` on `*NFAEngine` and `Matcher` on `*NFAMatcher`.
- Support prefix (`^`), suffix (`$`), and unanchored matching.
- Accurately record execution steps and match outcomes in `ComparisonResult`.
- Filter lines in `Grep` using the NFA engine.

---

## Running Locally

In your local `gorp` workspace, copy your Thompson NFA implementation into `pkg/matcher/nfa.go` and run native Go benchmarks:

```bash
# 1. Run local benchmarks comparing Backtracking vs NFA
make bench
# go test -bench=. ./...

# 2. Test pathological ReDoS patterns with NFA engine (completes in < 2ms)
./bin/gorp --engine=nfa "a?{25}a{25}" testdata/pathological.txt

# 3. Verify clean build and test suite
make build && make test
```
