By default in modern Linux distributions, `grep` is aliased to `grep --color=auto`.

What does `auto` actually do?
- When you run `grep pattern file.txt` directly in your interactive terminal, stdout is connected to a **TTY (terminal device)**. Grep detects this and automatically enables color highlighting!
- When you pipe grep into another command (e.g. `grep pattern file.txt | wc -l`) or redirect to a file (`grep pattern file.txt > output.txt`), stdout is **not** a TTY. Grep detects this and automatically disables color highlighting so binary ANSI escape codes don't corrupt the pipe or destination file.
- Furthermore, modern CLI tools adhere to the standard `NO_COLOR` environment specification ([no-color.org](https://no-color.org/)): if the `NO_COLOR` environment variable is set and non-empty, `--color=auto` disables color formatting.

In this exercise, we implement color resolution for `grep`'s `--color=auto`:
- `ShouldColor(option ColorOption, isTTY bool, noColorSet bool) bool`
- `FormatWithColorOption(lines []string, pattern string, option ColorOption, isTTY bool, noColorSet bool) []string`

## How Color Decision Resolution Works

Given:
- `option ColorOption` (`"always"`, `"never"`, or `"auto"`)
- `isTTY bool` (whether output is an interactive terminal)
- `noColorSet bool` (whether the `NO_COLOR` environment variable is active)

The color decision rules:
1. `ColorAlways`: Always returns `true`.
2. `ColorNever`: Always returns `false`.
3. `ColorAuto`: Returns `true` **if and only if** `isTTY == true` and `noColorSet == false`.
4. Any unrecognized option defaults to `false`.

### Examples

| Option | isTTY | noColorSet | ShouldColor? | Explanation |
| :--- | :--- | :--- | :--- | :--- |
| `ColorAuto` | `true` | `false` | `true` | Interactive terminal with no NO_COLOR |
| `ColorAuto` | `false` | `false` | `false` | Piped to file or command (`| wc -l`) |
| `ColorAuto` | `true` | `true` | `false` | User requested NO_COLOR in terminal |
| `ColorAlways` | `false` | `false` | `true` | Force color even when piped |
| `ColorNever` | `true` | `false` | `false` | Color explicitly disabled |

---

## Problem Statement

Implement `ShouldColor` and `FormatWithColorOption` in the editor on the right:

```go
type ColorOption string

const (
    ColorAlways ColorOption = "always"
    ColorNever  ColorOption = "never"
    ColorAuto   ColorOption = "auto"
)

func ShouldColor(option ColorOption, isTTY bool, noColorSet bool) bool
func FormatWithColorOption(lines []string, pattern string, option ColorOption, isTTY bool, noColorSet bool) []string
```

The functions should:
- Correctly evaluate whether color should be active based on the rules above.
- Filter matching lines from `lines`.
- If color is active, highlight all occurrences of `pattern` with `\033[31m` ... `\033[0m`.
- If color is disabled, return matching lines as plain text.
