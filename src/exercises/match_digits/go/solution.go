package main

import (
	"strings"
	"unicode"
)

// matchPattern checks if line matches the pattern (literal character or \d).
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

	return strings.Contains(line, pattern)
}
