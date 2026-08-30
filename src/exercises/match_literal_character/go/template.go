package main

import (
	"strings"
)

// matchPattern returns true if the literal character in pattern exists anywhere in line.
func matchPattern(line string, pattern string) bool {
	if len(pattern) == 0 {
		return true
	}

	// TODO: Return true if the literal character pattern matches anywhere in line
	return false
}
