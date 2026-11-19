An NFA graph consists of `State` nodes with at most two outgoing transitions (`Out` and `Out1`).

## Examples

```go
match := NewMatchState(1)
charA := NewCharState(2, 'a', match)
charB := NewCharState(3, 'b', match)
split := NewSplitState(4, charA, charB) // branches to 'a' or 'b'

MatchesRune(charA, 'a')    // true
MatchesRune(split, 'a')    // false (split states do not consume characters)
IsReachable(split, match)  // true
```

---

## Instructions

Implement `NewMatchState`, `NewSplitState`, `NewCharState`, `NewClassState`, `MatchesRune`, `CollectStates`, and `IsReachable`:

- Store literal rune states with `Kind = int(r)` (`Kind >= 0`) and special states (`StateMatch`, `StateSplit`, `StateDot`, `StateDigit`, `StateWord`) using the predefined negative constants.
- In `MatchesRune`, match literal runes (`Kind >= 0`), `.` (`StateDot`: any rune except `\n`), `\d` (`StateDigit`), and `\w` (`StateWord`: letters, digits, and `_`); return `false` for `nil`, `StateMatch`, or `StateSplit`.
- In `CollectStates` and `IsReachable`, traverse `Out` and `Out1` safely, tracking visited states to avoid infinite recursion on cyclic graphs.
