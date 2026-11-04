package main

import (
	"errors"
	"strconv"
	"strings"
	"unicode"
)

type Matcher interface {
	Match(text string) bool
	Pattern() string
}

type RegexEngine interface {
	Compile(pattern string) (Matcher, error)
}

// -------------------------------------------------------------
// Backtracking Engine
// -------------------------------------------------------------

type BacktrackTokenType int

const (
	TokBtChar BacktrackTokenType = iota
	TokBtGroupStart
	TokBtGroupEnd
	TokBtBackref
)

type BacktrackToken struct {
	typ     BacktrackTokenType
	pattern string
	groupId int
	min     int
	max     int
}

func isWordChar(r rune) bool {
	return unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_'
}

func matchCharGroup(char rune, group string) bool {
	i := 0
	for i < len(group) {
		if i+2 < len(group) && group[i+1] == '-' {
			start := rune(group[i])
			end := rune(group[i+2])
			if char >= start && char <= end {
				return true
			}
			i += 3
		} else {
			if rune(group[i]) == char {
				return true
			}
			i++
		}
	}
	return false
}

func matchTokenChar(char rune, pattern string) bool {
	if pattern == "." {
		return char != '\n'
	}
	if pattern == `\d` {
		return unicode.IsDigit(char)
	}
	if pattern == `\w` {
		return isWordChar(char)
	}
	if strings.HasPrefix(pattern, `\`) && len(pattern) == 2 {
		return char == rune(pattern[1])
	}
	if strings.HasPrefix(pattern, "[^") && strings.HasSuffix(pattern, "]") {
		return !matchCharGroup(char, pattern[2:len(pattern)-1])
	}
	if strings.HasPrefix(pattern, "[") && strings.HasSuffix(pattern, "]") {
		return matchCharGroup(char, pattern[1:len(pattern)-1])
	}
	if len(pattern) == 1 {
		return char == rune(pattern[0])
	}
	return false
}

func parseBtQuantifier(tokStr string, pattern string, i *int) BacktrackToken {
	min := 1
	max := 1
	if *i < len(pattern) {
		if pattern[*i] == '+' {
			min = 1; max = -1; *i++
		} else if pattern[*i] == '*' {
			min = 0; max = -1; *i++
		} else if pattern[*i] == '?' {
			min = 0; max = 1; *i++
		} else if pattern[*i] == '{' {
			closeBrace := strings.IndexByte(pattern[*i:], '}')
			if closeBrace != -1 {
				braceContent := pattern[*i+1 : *i+closeBrace]
				if commaIdx := strings.IndexByte(braceContent, ','); commaIdx != -1 {
					nStr := braceContent[:commaIdx]
					mStr := braceContent[commaIdx+1:]
					if mStr == "" {
						if n, err := strconv.Atoi(nStr); err == nil {
							min = n; max = -1; *i += closeBrace + 1
						}
					} else {
						n, err1 := strconv.Atoi(nStr)
						m, err2 := strconv.Atoi(mStr)
						if err1 == nil && err2 == nil {
							min = n; max = m; *i += closeBrace + 1
						}
					}
				} else {
					if n, err := strconv.Atoi(braceContent); err == nil {
						min = n; max = n; *i += closeBrace + 1
					}
				}
			}
		}
	}
	return BacktrackToken{typ: TokBtChar, pattern: tokStr, min: min, max: max}
}

func parseBtTokens(pattern string) []BacktrackToken {
	var tokens []BacktrackToken
	groupCounter := 0
	var groupStack []int

	i := 0
	for i < len(pattern) {
		if pattern[i] == '(' {
			groupCounter++
			gid := groupCounter
			groupStack = append(groupStack, gid)
			tokens = append(tokens, BacktrackToken{typ: TokBtGroupStart, groupId: gid, min: 1, max: 1})
			i++
		} else if pattern[i] == ')' {
			if len(groupStack) > 0 {
				gid := groupStack[len(groupStack)-1]
				groupStack = groupStack[:len(groupStack)-1]
				tokens = append(tokens, BacktrackToken{typ: TokBtGroupEnd, groupId: gid, min: 1, max: 1})
			}
			i++
		} else if pattern[i] == '\\' && i+1 < len(pattern) {
			if pattern[i+1] >= '1' && pattern[i+1] <= '9' {
				gid := int(pattern[i+1] - '0')
				tokens = append(tokens, BacktrackToken{typ: TokBtBackref, groupId: gid, min: 1, max: 1})
				i += 2
			} else {
				tokStr := pattern[i : i+2]
				i += 2
				tokens = append(tokens, parseBtQuantifier(tokStr, pattern, &i))
			}
		} else if pattern[i] == '[' {
			closeIdx := strings.IndexByte(pattern[i:], ']')
			if closeIdx != -1 {
				tokStr := pattern[i : i+closeIdx+1]
				i += closeIdx + 1
				tokens = append(tokens, parseBtQuantifier(tokStr, pattern, &i))
			} else {
				tokStr := string(pattern[i])
				i++
				tokens = append(tokens, parseBtQuantifier(tokStr, pattern, &i))
			}
		} else {
			tokStr := string(pattern[i])
			i++
			tokens = append(tokens, parseBtQuantifier(tokStr, pattern, &i))
		}
	}
	return tokens
}

type BtMatchContext struct {
	lineRunes []rune
	tokens    []BacktrackToken
	captured  map[int]string
	groupPos  map[int]int
}

func matchAtBt(ctx *BtMatchContext, pos int, tokIdx int, anchoredEnd bool, steps *int) bool {
	*steps++
	if tokIdx == len(ctx.tokens) {
		if anchoredEnd {
			return pos == len(ctx.lineRunes)
		}
		return true
	}

	tok := ctx.tokens[tokIdx]

	if tok.typ == TokBtGroupStart {
		ctx.groupPos[tok.groupId] = pos
		if matchAtBt(ctx, pos, tokIdx+1, anchoredEnd, steps) {
			return true
		}
		delete(ctx.groupPos, tok.groupId)
		return false
	}

	if tok.typ == TokBtGroupEnd {
		startPos := ctx.groupPos[tok.groupId]
		capturedStr := string(ctx.lineRunes[startPos:pos])
		prev, hadPrev := ctx.captured[tok.groupId]
		ctx.captured[tok.groupId] = capturedStr

		if matchAtBt(ctx, pos, tokIdx+1, anchoredEnd, steps) {
			return true
		}

		if hadPrev {
			ctx.captured[tok.groupId] = prev
		} else {
			delete(ctx.captured, tok.groupId)
		}
		return false
	}

	if tok.typ == TokBtBackref {
		capturedStr, ok := ctx.captured[tok.groupId]
		if !ok {
			return false
		}
		capRunes := []rune(capturedStr)
		if pos+len(capRunes) > len(ctx.lineRunes) {
			return false
		}
		for i, r := range capRunes {
			if ctx.lineRunes[pos+i] != r {
				return false
			}
		}
		return matchAtBt(ctx, pos+len(capRunes), tokIdx+1, anchoredEnd, steps)
	}

	k := 0
	for pos+k < len(ctx.lineRunes) && matchTokenChar(ctx.lineRunes[pos+k], tok.pattern) {
		if tok.max != -1 && k == tok.max {
			break
		}
		k++
	}

	if k < tok.min {
		return false
	}

	for j := k; j >= tok.min; j-- {
		if matchAtBt(ctx, pos+j, tokIdx+1, anchoredEnd, steps) {
			return true
		}
	}
	return false
}

func RunBacktrackingWithMetrics(pattern string, text string) (bool, int) {
	if len(pattern) == 0 {
		return true, 0
	}

	anchoredStart := false
	if strings.HasPrefix(pattern, "^") {
		anchoredStart = true
		pattern = pattern[1:]
	}

	anchoredEnd := false
	if strings.HasSuffix(pattern, "$") {
		anchoredEnd = true
		pattern = pattern[:len(pattern)-1]
	}

	tokens := parseBtTokens(pattern)
	lineRunes := []rune(text)

	ctx := &BtMatchContext{
		lineRunes: lineRunes,
		tokens:    tokens,
		captured:  make(map[int]string),
		groupPos:  make(map[int]int),
	}

	steps := 0
	if anchoredStart {
		matched := matchAtBt(ctx, 0, 0, anchoredEnd, &steps)
		return matched, steps
	}

	for i := 0; i <= len(lineRunes); i++ {
		ctx.captured = make(map[int]string)
		ctx.groupPos = make(map[int]int)
		if matchAtBt(ctx, i, 0, anchoredEnd, &steps) {
			return true, steps
		}
	}
	return false, steps
}

// -------------------------------------------------------------
// Thompson NFA Engine
// -------------------------------------------------------------

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

func NewMatchState(id int) *State {
	return &State{Kind: StateMatch, ID: id}
}

func NewSplitState(id int, out, out1 *State) *State {
	return &State{Kind: StateSplit, Out: out, Out1: out1, ID: id}
}

func NewCharState(id int, r rune, out *State) *State {
	return &State{Kind: int(r), Out: out, ID: id}
}

func NewClassState(id int, kind int, out *State) *State {
	return &State{Kind: kind, Out: out, ID: id}
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
		return nil, errors.New("invalid postfix expression")
	}

	finalFrag := stack[0]
	matchState := NewMatchState(stateID)
	patch(finalFrag.Out, matchState)

	return finalFrag.Start, nil
}

func addState(list []*State, s *State, visited map[*State]bool) []*State {
	if s == nil || visited[s] {
		return list
	}
	visited[s] = true
	if s.Kind == StateSplit {
		list = addState(list, s.Out, visited)
		list = addState(list, s.Out1, visited)
		return list
	}
	return append(list, s)
}

func isMatch(list []*State) bool {
	for _, s := range list {
		if s.Kind == StateMatch {
			return true
		}
	}
	return false
}

func SimulateNFAWithTransitions(start *State, text string, anchoredStart, anchoredEnd bool) (bool, int) {
	if start == nil {
		return false, 0
	}

	visited := make(map[*State]bool)
	var currentList []*State
	currentList = addState(currentList, start, visited)

	transitions := 0
	runes := []rune(text)

	if !anchoredEnd && isMatch(currentList) {
		return true, 0
	}

	for _, r := range runes {
		stepVisited := make(map[*State]bool)
		var nextList []*State
		if !anchoredStart {
			anchorVisited := make(map[*State]bool)
			for _, s := range currentList {
				anchorVisited[s] = true
			}
			currentList = addState(currentList, start, anchorVisited)
		}

		for _, s := range currentList {
			transitions++
			if MatchesRune(s, r) {
				nextList = addState(nextList, s.Out, stepVisited)
			}
		}

		currentList = nextList
		if !anchoredEnd && isMatch(currentList) {
			return true, transitions
		}
	}

	return isMatch(currentList), transitions
}

type NFAMatcher struct {
	rawPattern    string
	startState    *State
	anchoredStart bool
	anchoredEnd   bool
}

func (m *NFAMatcher) Pattern() string {
	if m == nil {
		return ""
	}
	return m.rawPattern
}

func (m *NFAMatcher) Match(text string) bool {
	if m == nil {
		return false
	}
	matched, _ := SimulateNFAWithTransitions(m.startState, text, m.anchoredStart, m.anchoredEnd)
	return matched
}

type NFAEngine struct{}

func NewNFAEngine() *NFAEngine {
	return &NFAEngine{}
}

// TODO: Implement Compile(pattern string) (Matcher, error) on NFAEngine
func (e *NFAEngine) Compile(pattern string) (Matcher, error) {
	return &NFAMatcher{rawPattern: pattern}, nil
}

type ComparisonResult struct {
	Pattern        string
	Text           string
	BacktrackMatch bool
	NFAMatch       bool
	BacktrackSteps int
	NFASteps       int
}

// TODO: Implement CompareEngines(pattern string, text string) (ComparisonResult, error)
func CompareEngines(pattern string, text string) (ComparisonResult, error) {
	return ComparisonResult{}, nil
}

// TODO: Implement Grep(pattern string, lines []string) ([]string, error)
func Grep(pattern string, lines []string) ([]string, error) {
	return []string{}, nil
}
