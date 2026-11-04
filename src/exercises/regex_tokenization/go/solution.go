package main

import (
	"errors"
	"strings"
)

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

func Tokenize(pattern string) ([]Token, error) {
	var tokens []Token
	runes := []rune(pattern)
	i := 0
	for i < len(runes) {
		r := runes[i]
		switch r {
		case '\\':
			if i+1 >= len(runes) {
				return nil, errors.New("dangling escape")
			}
			next := runes[i+1]
			i += 2
			switch next {
			case 'd':
				tokens = append(tokens, Token{Type: TokDigit})
			case 'w':
				tokens = append(tokens, Token{Type: TokWord})
			default:
				tokens = append(tokens, Token{Type: TokLiteral, Value: next})
			}
		case '.':
			tokens = append(tokens, Token{Type: TokDot})
			i++
		case '|':
			tokens = append(tokens, Token{Type: TokAlter, Value: '|'})
			i++
		case '*':
			tokens = append(tokens, Token{Type: TokStar, Value: '*'})
			i++
		case '+':
			tokens = append(tokens, Token{Type: TokPlus, Value: '+'})
			i++
		case '?':
			tokens = append(tokens, Token{Type: TokQuest, Value: '?'})
			i++
		case '(':
			tokens = append(tokens, Token{Type: TokLParen, Value: '('})
			i++
		case ')':
			tokens = append(tokens, Token{Type: TokRParen, Value: ')'})
			i++
		default:
			tokens = append(tokens, Token{Type: TokLiteral, Value: r})
			i++
		}
	}
	return tokens, nil
}

func isOperand(t Token) bool {
	return t.Type == TokLiteral || t.Type == TokDot || t.Type == TokDigit || t.Type == TokWord
}

func InsertExplicitConcat(tokens []Token) []Token {
	if len(tokens) <= 1 {
		return tokens
	}
	var res []Token
	for i := 0; i < len(tokens); i++ {
		t := tokens[i]
		res = append(res, t)
		if i+1 < len(tokens) {
			next := tokens[i+1]
			canEnd := isOperand(t) || t.Type == TokStar || t.Type == TokPlus || t.Type == TokQuest || t.Type == TokRParen
			canStart := isOperand(next) || next.Type == TokLParen
			if canEnd && canStart {
				res = append(res, Token{Type: TokConcat, Value: '·'})
			}
		}
	}
	return res
}

func precedence(t Token) int {
	switch t.Type {
	case TokStar, TokPlus, TokQuest:
		return 3
	case TokConcat:
		return 2
	case TokAlter:
		return 1
	default:
		return 0
	}
}

func ToPostfix(tokens []Token) ([]Token, error) {
	var output []Token
	var opStack []Token

	for _, t := range tokens {
		switch {
		case isOperand(t):
			output = append(output, t)
		case t.Type == TokStar || t.Type == TokPlus || t.Type == TokQuest:
			output = append(output, t)
		case t.Type == TokLParen:
			opStack = append(opStack, t)
		case t.Type == TokRParen:
			foundLParen := false
			for len(opStack) > 0 {
				top := opStack[len(opStack)-1]
				opStack = opStack[:len(opStack)-1]
				if top.Type == TokLParen {
					foundLParen = true
					break
				}
				output = append(output, top)
			}
			if !foundLParen {
				return nil, errors.New("unmatched right parenthesis")
			}
		case t.Type == TokConcat || t.Type == TokAlter:
			for len(opStack) > 0 {
				top := opStack[len(opStack)-1]
				if top.Type == TokLParen {
					break
				}
				if precedence(top) >= precedence(t) {
					output = append(output, top)
					opStack = opStack[:len(opStack)-1]
				} else {
					break
				}
			}
			opStack = append(opStack, t)
		}
	}

	for len(opStack) > 0 {
		top := opStack[len(opStack)-1]
		opStack = opStack[:len(opStack)-1]
		if top.Type == TokLParen {
			return nil, errors.New("unmatched left parenthesis")
		}
		output = append(output, top)
	}

	return output, nil
}

func ParseRegexToPostfix(pattern string) ([]Token, error) {
	toks, err := Tokenize(pattern)
	if err != nil {
		return nil, err
	}
	withConcat := InsertExplicitConcat(toks)
	return ToPostfix(withConcat)
}

func PostfixToString(tokens []Token) string {
	var sb strings.Builder
	for _, t := range tokens {
		switch t.Type {
		case TokLiteral:
			sb.WriteRune(t.Value)
		case TokDot:
			sb.WriteString(".")
		case TokDigit:
			sb.WriteString(`\d`)
		case TokWord:
			sb.WriteString(`\w`)
		case TokConcat:
			sb.WriteString("·")
		case TokAlter:
			sb.WriteString("|")
		case TokStar:
			sb.WriteString("*")
		case TokPlus:
			sb.WriteString("+")
		case TokQuest:
			sb.WriteString("?")
		}
	}
	return sb.String()
}
