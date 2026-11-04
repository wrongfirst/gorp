package main

import "strings"

// matchPattern checks if line matches the pattern (literal character or \d).
func matchPattern(line string, pattern string) bool {
	if len(pattern) == 0 {
		return true
	}

	if pattern == `\d` {
		for _, r := range line {
			if r >= '0' && r <= '9' {
				return true
			}
		}
		return false
	}

	return strings.Contains(line, pattern)
}
