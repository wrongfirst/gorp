package main

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
