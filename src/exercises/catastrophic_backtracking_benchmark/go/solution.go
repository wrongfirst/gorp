package main

import (
	"strconv"
	"strings"
	"unicode"
)

type TokenType int

const (
	TokChar TokenType = iota
	TokGroupStart
	TokGroupEnd
	TokBackref
)

type Token struct {
	typ     TokenType
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

func parseQuantifier(tokStr string, pattern string, i *int) Token {
	min := 1
	max := 1
	if *i < len(pattern) {
		if pattern[*i] == '+' {
			min = 1
			max = -1
			*i++
		} else if pattern[*i] == '*' {
			min = 0
			max = -1
			*i++
		} else if pattern[*i] == '?' {
			min = 0
			max = 1
			*i++
		} else if pattern[*i] == '{' {
			closeBrace := strings.IndexByte(pattern[*i:], '}')
			if closeBrace != -1 {
				braceContent := pattern[*i+1 : *i+closeBrace]
				if commaIdx := strings.IndexByte(braceContent, ','); commaIdx != -1 {
					nStr := braceContent[:commaIdx]
					mStr := braceContent[commaIdx+1:]
					if mStr == "" {
						if n, err := strconv.Atoi(nStr); err == nil {
							min = n
							max = -1
							*i += closeBrace + 1
						}
					} else {
						n, err1 := strconv.Atoi(nStr)
						m, err2 := strconv.Atoi(mStr)
						if err1 == nil && err2 == nil {
							min = n
							max = m
							*i += closeBrace + 1
						}
					}
				} else {
					if n, err := strconv.Atoi(braceContent); err == nil {
						min = n
						max = n
						*i += closeBrace + 1
					}
				}
			}
		}
	}
	return Token{typ: TokChar, pattern: tokStr, min: min, max: max}
}

func parseTokens(pattern string) []Token {
	var tokens []Token
	groupCounter := 0
	var groupStack []int

	i := 0
	for i < len(pattern) {
		if pattern[i] == '(' {
			groupCounter++
			gid := groupCounter
			groupStack = append(groupStack, gid)
			tokens = append(tokens, Token{typ: TokGroupStart, groupId: gid, min: 1, max: 1})
			i++
		} else if pattern[i] == ')' {
			if len(groupStack) > 0 {
				gid := groupStack[len(groupStack)-1]
				groupStack = groupStack[:len(groupStack)-1]
				tokens = append(tokens, Token{typ: TokGroupEnd, groupId: gid, min: 1, max: 1})
			}
			i++
		} else if pattern[i] == '\\' && i+1 < len(pattern) {
			if pattern[i+1] >= '1' && pattern[i+1] <= '9' {
				gid := int(pattern[i+1] - '0')
				tokens = append(tokens, Token{typ: TokBackref, groupId: gid, min: 1, max: 1})
				i += 2
			} else {
				tokStr := pattern[i : i+2]
				i += 2
				tokens = append(tokens, parseQuantifier(tokStr, pattern, &i))
			}
		} else if pattern[i] == '[' {
			closeIdx := strings.IndexByte(pattern[i:], ']')
			if closeIdx != -1 {
				tokStr := pattern[i : i+closeIdx+1]
				i += closeIdx + 1
				tokens = append(tokens, parseQuantifier(tokStr, pattern, &i))
			} else {
				tokStr := string(pattern[i])
				i++
				tokens = append(tokens, parseQuantifier(tokStr, pattern, &i))
			}
		} else {
			tokStr := string(pattern[i])
			i++
			tokens = append(tokens, parseQuantifier(tokStr, pattern, &i))
		}
	}
	return tokens
}

type MatchContext struct {
	lineRunes []rune
	tokens    []Token
	captured  map[int]string
	groupPos  map[int]int
}

func matchAtCounted(ctx *MatchContext, pos int, tokIdx int, anchoredEnd bool, steps *int) bool {
	*steps++
	if tokIdx == len(ctx.tokens) {
		if anchoredEnd {
			return pos == len(ctx.lineRunes)
		}
		return true
	}

	tok := ctx.tokens[tokIdx]

	if tok.typ == TokGroupStart {
		ctx.groupPos[tok.groupId] = pos
		if matchAtCounted(ctx, pos, tokIdx+1, anchoredEnd, steps) {
			return true
		}
		delete(ctx.groupPos, tok.groupId)
		return false
	}

	if tok.typ == TokGroupEnd {
		startPos := ctx.groupPos[tok.groupId]
		capturedStr := string(ctx.lineRunes[startPos:pos])
		prev, hadPrev := ctx.captured[tok.groupId]
		ctx.captured[tok.groupId] = capturedStr

		if matchAtCounted(ctx, pos, tokIdx+1, anchoredEnd, steps) {
			return true
		}

		if hadPrev {
			ctx.captured[tok.groupId] = prev
		} else {
			delete(ctx.captured, tok.groupId)
		}
		return false
	}

	if tok.typ == TokBackref {
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
		return matchAtCounted(ctx, pos+len(capRunes), tokIdx+1, anchoredEnd, steps)
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
		if matchAtCounted(ctx, pos+j, tokIdx+1, anchoredEnd, steps) {
			return true
		}
	}
	return false
}

type MatchStepResult struct {
	Matched   bool
	StepCount int
}

// CountBacktrackSteps runs the backtracking engine on line with pattern,
// returning whether it matched and the total number of calls to matchAt.
func CountBacktrackSteps(line string, pattern string) MatchStepResult {
	if len(pattern) == 0 {
		return MatchStepResult{Matched: true, StepCount: 0}
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

	tokens := parseTokens(pattern)
	lineRunes := []rune(line)

	ctx := &MatchContext{
		lineRunes: lineRunes,
		tokens:    tokens,
		captured:  make(map[int]string),
		groupPos:  make(map[int]int),
	}

	totalSteps := 0
	if anchoredStart {
		matched := matchAtCounted(ctx, 0, 0, anchoredEnd, &totalSteps)
		return MatchStepResult{Matched: matched, StepCount: totalSteps}
	}

	for i := 0; i <= len(lineRunes); i++ {
		ctx.captured = make(map[int]string)
		ctx.groupPos = make(map[int]int)
		if matchAtCounted(ctx, i, 0, anchoredEnd, &totalSteps) {
			return MatchStepResult{Matched: true, StepCount: totalSteps}
		}
	}
	return MatchStepResult{Matched: false, StepCount: totalSteps}
}

// IsCatastrophic returns true if matching line against pattern triggers >= maxSteps calls.
func IsCatastrophic(line string, pattern string, maxSteps int) bool {
	res := CountBacktrackSteps(line, pattern)
	return res.StepCount >= maxSteps
}
