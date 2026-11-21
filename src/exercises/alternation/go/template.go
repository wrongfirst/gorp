package main

import (
	"strconv"
	"strings"
	"unicode"
)

type Token struct {
	pattern string
	min     int
	max     int // -1 indicates unbounded (infinity)
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

// parsePattern parses a regex pattern string into a slice of Tokens.
func parsePattern(pattern string) []Token {
	var tokens []Token
	i := 0
	for i < len(pattern) {
		var tokStr string
		if pattern[i] == '\\' && i+1 < len(pattern) {
			tokStr = pattern[i : i+2]
			i += 2
		} else if pattern[i] == '[' {
			closeIdx := strings.IndexByte(pattern[i:], ']')
			if closeIdx != -1 {
				tokStr = pattern[i : i+closeIdx+1]
				i += closeIdx + 1
			} else {
				tokStr = string(pattern[i])
				i++
			}
		} else {
			tokStr = string(pattern[i])
			i++
		}

		min := 1
		max := 1

		if i < len(pattern) {
			if pattern[i] == '+' {
				min = 1
				max = -1
				i++
			} else if pattern[i] == '*' {
				min = 0
				max = -1
				i++
			} else if pattern[i] == '?' {
				min = 0
				max = 1
				i++
			} else if pattern[i] == '{' {
				closeBrace := strings.IndexByte(pattern[i:], '}')
				if closeBrace != -1 {
					braceContent := pattern[i+1 : i+closeBrace]
					if commaIdx := strings.IndexByte(braceContent, ','); commaIdx != -1 {
						nStr := braceContent[:commaIdx]
						mStr := braceContent[commaIdx+1:]
						if mStr == "" {
							if n, err := strconv.Atoi(nStr); err == nil {
								min = n
								max = -1
								i += closeBrace + 1
							}
						} else {
							n, err1 := strconv.Atoi(nStr)
							m, err2 := strconv.Atoi(mStr)
							if err1 == nil && err2 == nil {
								min = n
								max = m
								i += closeBrace + 1
							}
						}
					} else {
						if n, err := strconv.Atoi(braceContent); err == nil {
							min = n
							max = n
							i += closeBrace + 1
						}
					}
				}
			}
		}

		tokens = append(tokens, Token{pattern: tokStr, min: min, max: max})
	}
	return tokens
}

// matchToken checks if a single character matches a single token pattern.
func matchToken(char rune, token string) bool {
	if token == "." {
		return char != '\n'
	}
	if token == `\d` {
		return unicode.IsDigit(char)
	}
	if token == `\w` {
		return isWordChar(char)
	}
	if strings.HasPrefix(token, `\`) && len(token) == 2 {
		return char == rune(token[1])
	}
	if strings.HasPrefix(token, "[^") && strings.HasSuffix(token, "]") {
		return !matchCharGroup(char, token[2:len(token)-1])
	}
	if strings.HasPrefix(token, "[") && strings.HasSuffix(token, "]") {
		return matchCharGroup(char, token[1:len(token)-1])
	}
	if len(token) == 1 {
		return char == rune(token[0])
	}
	return false
}

// matchHere checks if tokens match lineRunes starting at index 0.
func matchHere(lineRunes []rune, tokens []Token, anchoredEnd bool) bool {
	if len(tokens) == 0 {
		if anchoredEnd {
			return len(lineRunes) == 0
		}
		return true
	}

	curr := tokens[0]
	rest := tokens[1:]

	k := 0
	for k < len(lineRunes) && matchToken(lineRunes[k], curr.pattern) {
		if curr.max != -1 && k == curr.max {
			break
		}
		k++
	}

	if k < curr.min {
		return false
	}

	for j := k; j >= curr.min; j-- {
		if matchHere(lineRunes[j:], rest, anchoredEnd) {
			return true
		}
	}
	return false
}

// matchPattern checks if line matches pattern, supporting alternation and grouping.
func matchPattern(line string, pattern string) bool {
	if len(pattern) == 0 {
		return true
	}

	// TODO: Support grouped alternation (opt1|opt2) and top-level alternation opt1|opt2.

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

	tokens := parsePattern(pattern)
	lineRunes := []rune(line)

	if len(tokens) == 0 {
		if anchoredStart && anchoredEnd {
			return len(lineRunes) == 0
		}
		return true
	}

	if anchoredStart {
		return matchHere(lineRunes, tokens, anchoredEnd)
	}

	for i := 0; i <= len(lineRunes); i++ {
		if matchHere(lineRunes[i:], tokens, anchoredEnd) {
			return true
		}
	}
	return false
}
