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

func _unusedImports() {
	var _ = strconv.Itoa
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

// parseTokens parses pattern into a slice of Tokens supporting nested groups and backreferences.
func parseTokens(pattern string) []Token {
	// TODO: Support nested capturing groups ((...) (...)) using a group ID stack.
	var tokens []Token
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
	// TODO: Track start and end positions for nested groups and evaluate backreferences.
	return false
}

// matchPattern checks if line matches pattern.
func matchPattern(line string, pattern string) bool {
	if len(pattern) == 0 {
		return true
	}

	return false
}
