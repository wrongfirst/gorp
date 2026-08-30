package main

import (
	"strings"
	"unicode"
)

func isWordChar(r rune) bool {
	return unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_'
}

// matchPattern checks if line matches pattern (literal, \d, \w, or [chars]).
func matchPattern(line string, pattern string) bool {
	if len(pattern) == 0 {
		return true
	}

	if pattern == `\d` {
		for _, r := range line {
			if unicode.IsDigit(r) {
				return true
			}
		}
		return false
	}

	if pattern == `\w` {
		for _, r := range line {
			if isWordChar(r) {
				return true
			}
		}
		return false
	}

	// Positive character groups: [abc]
	if strings.HasPrefix(pattern, "[") && strings.HasSuffix(pattern, "]") {
		chars := pattern[1 : len(pattern)-1]
		return strings.ContainsAny(line, chars)
	}

	return strings.Contains(line, pattern)
}
