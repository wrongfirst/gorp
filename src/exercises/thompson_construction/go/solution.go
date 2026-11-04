package main

import (
	"errors"
	"unicode"
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

const (
	StateMatch = -1
	StateSplit = -2
	StateDot   = -3
	StateDigit = -4
	StateWord  = -5
)

type State struct {
	Kind int
	Out  *State
	Out1 *State
	ID   int
}

func isWordChar(r rune) bool {
	return unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_'
}

func NewMatchState(id int) *State {
	return &State{
		Kind: StateMatch,
		ID:   id,
	}
}

func NewSplitState(id int, out, out1 *State) *State {
	return &State{
		Kind: StateSplit,
		Out:  out,
		Out1: out1,
		ID:   id,
	}
}

func NewCharState(id int, r rune, out *State) *State {
	return &State{
		Kind: int(r),
		Out:  out,
		ID:   id,
	}
}

func NewClassState(id int, kind int, out *State) *State {
	return &State{
		Kind: kind,
		Out:  out,
		ID:   id,
	}
}

func MatchesRune(s *State, r rune) bool {
	if s == nil {
		return false
	}
	switch s.Kind {
	case StateDot:
		return r != '\n'
	case StateDigit:
		return unicode.IsDigit(r)
	case StateWord:
		return isWordChar(r)
	default:
		if s.Kind >= 0 {
			return rune(s.Kind) == r
		}
		return false
	}
}

func CollectStates(start *State) []*State {
	if start == nil {
		return nil
	}
	var list []*State
	visited := make(map[*State]bool)

	var dfs func(s *State)
	dfs = func(s *State) {
		if s == nil || visited[s] {
			return
		}
		visited[s] = true
		list = append(list, s)
		dfs(s.Out)
		dfs(s.Out1)
	}

	dfs(start)
	return list
}

func IsReachable(start *State, target *State) bool {
	if start == nil || target == nil {
		return false
	}
	visited := make(map[*State]bool)
	var dfs func(s *State) bool
	dfs = func(s *State) bool {
		if s == nil || visited[s] {
			return false
		}
		if s == target {
			return true
		}
		visited[s] = true
		return dfs(s.Out) || dfs(s.Out1)
	}
	return dfs(start)
}

type Frag struct {
	Start *State
	Out   []**State
}

func patch(arrows []**State, s *State) {
	for _, p := range arrows {
		*p = s
	}
}

func Post2NFA(postfix []Token) (*State, error) {
	if len(postfix) == 0 {
		return nil, errors.New("empty postfix expression")
	}

	var stack []Frag
	stateID := 1

	for _, t := range postfix {
		switch {
		case isOperand(t):
			var s *State
			switch t.Type {
			case TokLiteral:
				s = NewCharState(stateID, t.Value, nil)
			case TokDot:
				s = NewClassState(stateID, StateDot, nil)
			case TokDigit:
				s = NewClassState(stateID, StateDigit, nil)
			case TokWord:
				s = NewClassState(stateID, StateWord, nil)
			}
			stateID++
			stack = append(stack, Frag{Start: s, Out: []**State{&s.Out}})

		case t.Type == TokConcat:
			if len(stack) < 2 {
				return nil, errors.New("stack underflow on concat")
			}
			e2 := stack[len(stack)-1]
			e1 := stack[len(stack)-2]
			stack = stack[:len(stack)-2]
			patch(e1.Out, e2.Start)
			stack = append(stack, Frag{Start: e1.Start, Out: e2.Out})

		case t.Type == TokAlter:
			if len(stack) < 2 {
				return nil, errors.New("stack underflow on alter")
			}
			e2 := stack[len(stack)-1]
			e1 := stack[len(stack)-2]
			stack = stack[:len(stack)-2]
			s := NewSplitState(stateID, e1.Start, e2.Start)
			stateID++
			stack = append(stack, Frag{Start: s, Out: append(e1.Out, e2.Out...)})

		case t.Type == TokStar:
			if len(stack) < 1 {
				return nil, errors.New("stack underflow on star")
			}
			e := stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			s := NewSplitState(stateID, e.Start, nil)
			stateID++
			patch(e.Out, s)
			stack = append(stack, Frag{Start: s, Out: []**State{&s.Out1}})

		case t.Type == TokPlus:
			if len(stack) < 1 {
				return nil, errors.New("stack underflow on plus")
			}
			e := stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			s := NewSplitState(stateID, e.Start, nil)
			stateID++
			patch(e.Out, s)
			stack = append(stack, Frag{Start: e.Start, Out: []**State{&s.Out1}})

		case t.Type == TokQuest:
			if len(stack) < 1 {
				return nil, errors.New("stack underflow on quest")
			}
			e := stack[len(stack)-1]
			stack = stack[:len(stack)-1]
			s := NewSplitState(stateID, e.Start, nil)
			stateID++
			stack = append(stack, Frag{Start: s, Out: append(e.Out, &s.Out1)})
		}
	}

	if len(stack) != 1 {
		return nil, errors.New("invalid postfix expression: trailing operands")
	}

	finalFrag := stack[0]
	matchState := NewMatchState(stateID)
	patch(finalFrag.Out, matchState)

	return finalFrag.Start, nil
}

func CompileToNFA(pattern string) (*State, error) {
	postfix, err := ParseRegexToPostfix(pattern)
	if err != nil {
		return nil, err
	}
	return Post2NFA(postfix)
}
