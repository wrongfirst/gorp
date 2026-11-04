package main

import (
	"strings"
	"unicode"
)

type Token struct {
	pattern string
	plus    bool
}

func isWordChar(r rune) bool {
	return unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_'
}

// parsePattern parses a regex pattern string into a slice of Tokens,
// capturing the pattern component and whether it is followed by '+'.
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

		if i < len(pattern) && pattern[i] == '+' {
			tokens = append(tokens, Token{pattern: tokStr, plus: true})
			i++
		} else {
			tokens = append(tokens, Token{pattern: tokStr, plus: false})
		}
	}
	return tokens
}

// matchToken checks if a single character matches a single token pattern.
func matchToken(char rune, token string) bool {
	if token == `\d` {
		return unicode.IsDigit(char)
	}
	if token == `\w` {
		return isWordChar(char)
	}
	if strings.HasPrefix(token, "[^") && strings.HasSuffix(token, "]") {
		return !strings.ContainsRune(token[2:len(token)-1], char)
	}
	if strings.HasPrefix(token, "[") && strings.HasSuffix(token, "]") {
		return strings.ContainsRune(token[1:len(token)-1], char)
	}
	if len(token) == 1 {
		return char == rune(token[0])
	}
	return false
}

// matchHere checks if the tokens match lineRunes starting at index 0.
func matchHere(lineRunes []rune, tokens []Token, anchoredEnd bool) bool {
	if len(tokens) == 0 {
		if anchoredEnd {
			return len(lineRunes) == 0
		}
		return true
	}

	curr := tokens[0]
	rest := tokens[1:]

	if curr.plus {
		// TODO: Implement '+' quantifier matching (1 or more occurrences of curr.pattern).
		// Match at least 1 character, then consume greedily and backtrack if rest does not match.
		_ = rest
		return false
	}

	if len(lineRunes) == 0 || !matchToken(lineRunes[0], curr.pattern) {
		return false
	}
	return matchHere(lineRunes[1:], rest, anchoredEnd)
}

// matchPattern checks if line matches pattern.
func matchPattern(line string, pattern string) bool {
	if len(pattern) == 0 {
		return true
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
