Simulate an NFA in breadth-first lockstep by maintaining the set of active states, guaranteeing `O(N * S)` match time and eliminating catastrophic backtracking.

- Epsilon (split) transitions follow all reachable branches without consuming input, avoiding infinite loops on cycles.
- Each input rune advances matching states to their next states along with any epsilon-reachable targets.
- Unanchored matching allows a match to start at any position and succeeds as soon as a match state is active; anchored matching requires matching the full input from start to end.

## Examples

```go
nfa, _ := CompileToNFA("ab")
SimulateNFA(nfa, "ab", true)        // true (full-string match)
SimulateNFA(nfa, "abc", true)       // false (trailing character prevents full match)
SimulateNFA(nfa, "xyzab123", false) // true (unanchored substring match)

nfaPatho, _ := CompileToNFA("a?a?a?a?a?a?a?a?aaaaaaaa")
SimulateNFAWithMetrics(nfaPatho, "aaaaaaaa", true)
// => SimulationMetrics{Matched: true, TransitionsTested: <200}
```

---

## Instructions

Implement `addState`, `SimulateNFA`, and `SimulateNFAWithMetrics`:

- Expand epsilon (`StateSplit`) transitions safely without infinite recursion on cycles.
- Maintain active states in lockstep across the runes of `text`.
- When `anchored` is `true`, require a full-string (`^...$`) match from the start of `text` to the end.
- When `anchored` is `false`, allow a match to begin at any rune position and return immediately as soon as a match state becomes active.
- Count each transition check performed per active state per input rune in `SimulationMetrics.TransitionsTested`.
