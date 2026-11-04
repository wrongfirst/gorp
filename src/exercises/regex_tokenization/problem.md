When we write regular expressions such as `a(b|c)*d`, concatenation between characters is implicit: `ab` really means `a` concatenated with `b`.

In his seminal 1968 paper, Ken Thompson discovered that regular expression compilation into a finite state machine is vastly simplified if the expression is first converted to **Postfix Notation** (also known as Reverse Polish Notation) with an explicit concatenation operator (`·`).

In postfix notation:
- Operands precede operators.
- `ab` becomes `ab·`
- `a|b` becomes `ab|`
- `a*` becomes `a*`
- `a(b|c)*d` becomes `abc|*·d·`

No parentheses are needed in postfix form because operator associativity and precedence are encoded directly in the token order! A single left-to-right scan can then build an NFA state by state.

In this exercise, we build a regex tokenizer and postfix parser:
1. **Tokenize**: Convert raw pattern string into a stream of tokens (`TokLiteral`, `TokDot`, `TokDigit`, `TokWord`, `TokAlter`, `TokStar`, `TokPlus`, `TokQuest`, `TokLParen`, `TokRParen`).
2. **Insert Explicit Concatenation**: Insert `TokConcat` (`·`) between adjacent atoms where concatenation is implied (e.g. between two literals, or between a quantifier/group and the next literal/group).
3. **ToPostfix**: Use Dijkstra's **Shunting-yard algorithm** to convert infix tokens into postfix order:
   - Unary quantifiers (`*`, `+`, `?`) have highest precedence (3) and apply immediately.
   - Concatenation (`·`) has precedence (2).
   - Alternation (`|`) has precedence (1).
   - Parentheses enforce grouping.

### Examples

| Input Pattern | Tokens with Concat | Postfix Representation |
| :--- | :--- | :--- |
| `\"ab\"` | `a · b` | `\"ab·\"` |
| `\"a\|b\|c\"` | `a \| b \| c` | `\"ab\|c\|\"` |
| `\"a(b\|c)*d\"` | `a · ( b \| c ) * · d` | `\"abc\|*·d·\"` |
| `\"a+b?\"` | `a + · b ?` | `\"a+b?·\"` |
| `\"(a\|b\"` | Unmatched `(` | Error |

---

## Problem Statement

Implement `Tokenize`, `InsertExplicitConcat`, `ToPostfix`, `ParseRegexToPostfix`, and `PostfixToString` in the editor on the right:

```go
type TokenType int

const (
    TokLiteral TokenType = iota
    TokDot
    TokDigit
    TokWord
    TokConcat
    TokAlter
    TokStar
    TokPlus
    TokQuest
    TokLParen
    TokRParen
)

type Token struct {
    Type  TokenType
    Value rune
}

func Tokenize(pattern string) ([]Token, error)
func InsertExplicitConcat(tokens []Token) []Token
func ToPostfix(tokens []Token) ([]Token, error)
func ParseRegexToPostfix(pattern string) ([]Token, error)
func PostfixToString(tokens []Token) string
```

The functions should:
- Tokenize literals, escapes (`\d`, `\w`, `\.`), operators (`|`, `*`, `+`, `?`), and parentheses.
- Insert `TokConcat` where concatenation is implicit.
- Convert infix tokens to postfix tokens using precedence: Quantifiers (3) > Concat (2) > Alternation (1).
- Return an error for unbalanced parentheses or invalid syntax.
