package main

type TokenType int

const (
	TokLiteral TokenType = iota // Value: literal rune (e.g., 'a', or '.' for escaped `\.`)
	TokDot                      // Value: 0 (matches `.`)
	TokDigit                    // Value: 0 (matches `\d`)
	TokWord                     // Value: 0 (matches `\w`)
	TokConcat                   // Value: '·'
	TokAlter                    // Value: '|'
	TokStar                     // Value: '*'
	TokPlus                     // Value: '+'
	TokQuest                    // Value: '?'
	TokLParen                   // Value: '('
	TokRParen                   // Value: ')'
)

type Token struct {
	Type  TokenType
	Value rune // Literal rune for TokLiteral, operator/paren symbol (e.g. '+', '·'), or 0 for TokDot/TokDigit/TokWord
}

// TODO: Implement Tokenize(pattern string) ([]Token, error)
func Tokenize(pattern string) ([]Token, error) {
	return nil, nil
}

// TODO: Implement InsertExplicitConcat(tokens []Token) []Token
func InsertExplicitConcat(tokens []Token) []Token {
	return nil
}

// TODO: Implement ToPostfix(tokens []Token) ([]Token, error)
func ToPostfix(tokens []Token) ([]Token, error) {
	return nil, nil
}

// TODO: Implement ParseRegexToPostfix(pattern string) ([]Token, error)
func ParseRegexToPostfix(pattern string) ([]Token, error) {
	return nil, nil
}

// TODO: Implement PostfixToString(tokens []Token) string
func PostfixToString(tokens []Token) string {
	return ""
}
