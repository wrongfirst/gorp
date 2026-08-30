The foundational operation of any grep utility is searching through text for matching patterns. The simplest pattern to match is a single literal character (such as `d` or `a`).

Let's implement pattern matching for a single literal character.

You can add the code from this exercise to a new `matcher.go` file in your project directory. We will add in more functions here and then integrate with the `main.go` later on.

## How Literal Matching Works

When given a pattern consisting of a single character and a target input line:
- If the character exists anywhere within the line, the match succeeds (`true`).
- If the character is not present in the line, the match fails (`false`).

### Examples

| Line | Pattern | Match Result | Explanation |
| :--- | :--- | :--- | :--- |
| `"dog"` | `"d"` | `true` | `'d'` is at the beginning of `"dog"` |
| `"apple"` | `"p"` | `true` | `'p'` appears in `"apple"` |
| `"cat"` | `"d"` | `false` | `'d'` does not appear in `"cat"` |

---

## Problem Statement

Implement `matchPattern(line string, pattern string) bool` in the editor on the right. 

The function should return `true` if the literal character in `pattern` appears anywhere in `line`, and `false` otherwise. If `pattern` is empty, return `true`.