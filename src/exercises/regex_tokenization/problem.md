Convert infix regular expressions into Postfix Notation (Reverse Polish Notation) with explicit concatenation (`·`).

## Examples

```go
ParseRegexToPostfix("ab")
// => tokens for "ab·" (adjacent literals receive explicit concat)

ParseRegexToPostfix("a|b|c")
// => tokens for "ab|c|" (alternation operator)

ParseRegexToPostfix("a(b|c)*d")
// => tokens for "abc|*·d·" (quantifier precedence over concat)

ParseRegexToPostfix("(a|b")
// => nil, error (syntax error on unmatched parenthesis)
```

---

## Instructions

Implement `Tokenize`, `InsertExplicitConcat`, `ToPostfix`, `ParseRegexToPostfix`, and `PostfixToString`:

- In `Tokenize`: parse literals, escapes (`\d` for digits, `\w` for word characters, and any other `\x` unescaped as literal `x`), operators (`|`, `*`, `+`, `?`), and parentheses `(`, `)`. Return an error on a trailing dangling backslash (e.g., `a\`).
- In `InsertExplicitConcat`: insert `TokConcat` (`·`) between two adjacent tokens whenever the left token is an operand, quantifier (`*`, `+`, `?`), or `)` and the right token is an operand or `(`.
- In `ToPostfix`: convert infix tokens to postfix using operator precedence (quantifiers highest, then concatenation, then alternation) and return an error on unbalanced parentheses.
- In `PostfixToString`: format literals as their rune (so escaped `\.` renders as `.`), `.` as `.`, `\d` as `\d`, `\w` as `\w`, and operators using their symbol (`·`, `|`, `*`, `+`, `?`).
