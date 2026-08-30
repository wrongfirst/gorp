package main

import (
	"strings"
	"unicode"
)

func isWordChar(r rune) bool {
	return unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_'
}

// parsePattern parses a regex pattern string into a slice of individual tokens
// (e.g. `\d`, `\w`, `[abc]`, `[^abc]`, or a single literal character).
func parsePattern(pattern string) []string {
	var tokens []string
	i := 0
	for i < len(pattern) {
		if pattern[i] == '\\' && i+1 < len(pattern) {
			tokens = append(tokens, pattern[i:i+2])
			i += 2
		} else if pattern[i] == '[' {
			closeIdx := strings.IndexByte(pattern[i:], ']')
			if closeIdx != -1 {
				tokens = append(tokens, pattern[i:i+closeIdx+1])
				i += closeIdx + 1
			} else {
				tokens = append(tokens, string(pattern[i]))
				i++
			}
		} else {
			tokens = append(tokens, string(pattern[i]))
			i++
		}
	}
	return tokens
}

// matchToken checks if a single character matches a single token.
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

// matchPattern checks if line contains a contiguous substring matching the sequence of tokens.
func matchPattern(line string, pattern string) bool {
	if len(pattern) == 0 {
		return true
	}

	tokens := parsePattern(pattern)
	lineRunes := []rune(line)

	// TODO: Check if the token sequence matches starting at any position in lineRunes
	_ = tokens
	_ = lineRunes
	return false
}
