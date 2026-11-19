Resolve color formatting for `--color=auto` based on terminal TTY status and the `NO_COLOR` specification.

## Examples

```go
ShouldColor(ColorAuto, true, false)    // true  (interactive terminal, NO_COLOR unset)
ShouldColor(ColorAuto, false, false)   // false (piped stdout)
ShouldColor(ColorAuto, true, true)     // false (NO_COLOR is set)
ShouldColor(ColorAlways, false, false) // true  (forced color)
ShouldColor(ColorNever, true, false)   // false (explicitly disabled)
```

---

## Instructions

Implement `ShouldColor` and `FormatWithColorOption`:

- In `ShouldColor(option, isTTY, noColorSet)`:
  - Return `true` for `ColorAlways` (even when `isTTY` is `false` or `noColorSet` is `true`).
  - Return `isTTY && !noColorSet` for `ColorAuto`.
  - Return `false` for `ColorNever` or any unknown `ColorOption` value.
- In `FormatWithColorOption`:
  - Filter matching lines from `lines`, preserving order.
  - If color is active, wrap all non-overlapping matches of `pattern` with `\033[31m` ... `\033[0m`.
  - If color is disabled, return matching lines as plain text.
  - If `pattern` is `""`, return all `lines` without highlights; if `lines` is empty or no lines match, return a non-nil empty slice `[]string{}`.
