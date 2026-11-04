package main

import (
	"strings"
	"unicode"
)

func isWordChar(r rune) bool {
	return unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_'
}

// matchCharGroup checks if a character matches a character group with multiple ranges/characters.
func matchCharGroup(char rune, group string) bool {
	// TODO: Support multiple ranges (e.g. "a-zA-Z", "0-9a-fA-F")
	// and mixing ranges with individual characters (e.g. "a-z0-9_", "[-a-z]").
	// Loop through group:
	// - If group[i+1] == '-', check range group[i]..group[i+2] and advance i by 3.
	// - Otherwise, check group[i] == char and advance i by 1.

	if len(group) == 3 && group[1] == '-' {
		start := rune(group[0])
		end := rune(group[2])
		return char >= start && char <= end
	}
	return strings.ContainsRune(group, char)
}

// parsePattern parses a regex pattern string into a slice of individual tokens.
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
		return matchCharGroup(char, token[1:len(token)-1])
	}
	if len(token) == 1 {
		return char == rune(token[0])
	}
	return false
}

// matchHere checks if tokens match lineRunes starting at index 0.
func matchHere(lineRunes []rune, tokens []string) bool {
	if len(tokens) > len(lineRunes) {
		return false
	}
	for i, token := range tokens {
		if !matchToken(lineRunes[i], token) {
			return false
		}
	}
	return true
}

// matchPattern checks if line contains a contiguous substring matching the sequence of tokens.
func matchPattern(line string, pattern string) bool {
	if len(pattern) == 0 {
		return true
	}

	tokens := parsePattern(pattern)
	lineRunes := []rune(line)

	if len(tokens) == 0 {
		return true
	}

	for i := 0; i <= len(lineRunes)-len(tokens); i++ {
		if matchHere(lineRunes[i:], tokens) {
			return true
		}
	}
	return false
}
