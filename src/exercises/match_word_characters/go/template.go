package main

import (
	"strings"
	"unicode"
)

// matchPattern checks if line matches pattern (literal character, \d, or \w).
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
		// TODO: Return true if line contains
		// any alphanumeric character (a-z, A-Z, 0-9) or underscore (_)
		return false
	}

	return strings.Contains(line, pattern)
}
