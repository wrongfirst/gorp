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
		// TODO: Return true if line contains any digit (0-9)
		return false
	}

	return strings.Contains(line, pattern)
}
