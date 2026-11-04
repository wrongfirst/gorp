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

// matchCharGroup checks if a character matches a character group.
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

// matchTokenChar checks if a single character matches a single token pattern.
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

// parseTokens parses pattern into a slice of Tokens including groups and backreferences.
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

// MatchContext tracks matching state including captured groups.
type MatchContext struct {
	lineRunes []rune
	tokens    []Token
	captured  map[int]string
	groupPos  map[int]int
}

// matchAt checks if tokens match lineRunes starting at index pos.
func matchAt(ctx *MatchContext, pos int, tokIdx int, anchoredEnd bool) bool {
	if tokIdx == len(ctx.tokens) {
		if anchoredEnd {
			return pos == len(ctx.lineRunes)
		}
		return true
	}

	tok := ctx.tokens[tokIdx]

	if tok.typ == TokGroupStart {
		ctx.groupPos[tok.groupId] = pos
		if matchAt(ctx, pos, tokIdx+1, anchoredEnd) {
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

		if matchAt(ctx, pos, tokIdx+1, anchoredEnd) {
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
		return matchAt(ctx, pos+len(capRunes), tokIdx+1, anchoredEnd)
	}

	// TokChar with quantifiers
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
		if matchAt(ctx, pos+j, tokIdx+1, anchoredEnd) {
			return true
		}
	}
	return false
}

// matchPattern checks if line matches pattern.
func matchPattern(line string, pattern string) bool {
	if len(pattern) == 0 {
		return true
	}

	// Find innermost parenthesized alternation: e.g. (cat|dog)
	for i := 0; i < len(pattern); i++ {
		if pattern[i] == '(' {
			closeIdx := strings.IndexByte(pattern[i+1:], ')')
			if closeIdx != -1 {
				closeIdx += i + 1
				nextOpen := strings.IndexByte(pattern[i+1:closeIdx], '(')
				if nextOpen == -1 {
					inner := pattern[i+1 : closeIdx]
					if strings.Contains(inner, "|") {
						options := strings.Split(inner, "|")
						for _, opt := range options {
							candidate := pattern[:i] + "(" + opt + ")" + pattern[closeIdx+1:]
							if matchPattern(line, candidate) {
								return true
							}
						}
						return false
					}
				}
			}
		}
	}

	// Top level alternation
	if strings.Contains(pattern, "|") {
		var branches []string
		var cur strings.Builder
		d := 0
		for i := 0; i < len(pattern); i++ {
			if pattern[i] == '(' {
				d++
				cur.WriteByte(pattern[i])
			} else if pattern[i] == ')' {
				d--
				cur.WriteByte(pattern[i])
			} else if pattern[i] == '|' && d == 0 {
				branches = append(branches, cur.String())
				cur.Reset()
			} else {
				cur.WriteByte(pattern[i])
			}
		}
		branches = append(branches, cur.String())
		if len(branches) > 1 {
			for _, b := range branches {
				if matchPattern(line, b) {
					return true
				}
			}
			return false
		}
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

	if anchoredStart {
		return matchAt(ctx, 0, 0, anchoredEnd)
	}

	for i := 0; i <= len(lineRunes); i++ {
		ctx.captured = make(map[int]string)
		ctx.groupPos = make(map[int]int)
		if matchAt(ctx, i, 0, anchoredEnd) {
			return true
		}
	}
	return false
}
