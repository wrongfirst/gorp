package main

import (
	"bufio"
	"fmt"
	"io"
	"strings"
	"unicode"
)

type Token struct {
	pattern    string
	quantifier rune // 0, '+', or '?'
}

func isWordChar(r rune) bool {
	return unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_'
}

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

		if i < len(pattern) && (pattern[i] == '+' || pattern[i] == '?') {
			tokens = append(tokens, Token{pattern: tokStr, quantifier: rune(pattern[i])})
			i++
		} else {
			tokens = append(tokens, Token{pattern: tokStr, quantifier: 0})
		}
	}
	return tokens
}

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
	if strings.HasPrefix(token, "[^") && strings.HasSuffix(token, "]") {
		inner := token[2 : len(token)-1]
		if len(inner) == 3 && inner[1] == '-' {
			return char < rune(inner[0]) || char > rune(inner[2])
		}
		return !strings.ContainsRune(inner, char)
	}
	if strings.HasPrefix(token, "[") && strings.HasSuffix(token, "]") {
		inner := token[1 : len(token)-1]
		if len(inner) == 3 && inner[1] == '-' {
			return char >= rune(inner[0]) && char <= rune(inner[2])
		}
		return strings.ContainsRune(inner, char)
	}
	if len(token) == 1 {
		return char == rune(token[0])
	}
	return false
}

func matchHere(lineRunes []rune, tokens []Token, anchoredEnd bool) bool {
	if len(tokens) == 0 {
		if anchoredEnd {
			return len(lineRunes) == 0
		}
		return true
	}

	curr := tokens[0]
	rest := tokens[1:]

	if curr.quantifier == '+' {
		if len(lineRunes) == 0 || !matchToken(lineRunes[0], curr.pattern) {
			return false
		}
		k := 1
		for k < len(lineRunes) && matchToken(lineRunes[k], curr.pattern) {
			k++
		}
		for j := k; j >= 1; j-- {
			if matchHere(lineRunes[j:], rest, anchoredEnd) {
				return true
			}
		}
		return false
	}

	if curr.quantifier == '?' {
		if len(lineRunes) > 0 && matchToken(lineRunes[0], curr.pattern) {
			if matchHere(lineRunes[1:], rest, anchoredEnd) {
				return true
			}
		}
		return matchHere(lineRunes, rest, anchoredEnd)
	}

	if len(lineRunes) > 0 && matchToken(lineRunes[0], curr.pattern) {
		return matchHere(lineRunes[1:], rest, anchoredEnd)
	}

	return false
}

func matchPattern(line string, pattern string) bool {
	if pattern == "" {
		return true
	}
	anchoredStart := strings.HasPrefix(pattern, "^")
	if anchoredStart {
		pattern = pattern[1:]
	}
	anchoredEnd := strings.HasSuffix(pattern, "$")
	if anchoredEnd {
		pattern = pattern[:len(pattern)-1]
	}

	tokens := parsePattern(pattern)
	lineRunes := []rune(line)

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

// RunCLI executes the basic grep command reading from stdin and writing matching lines to stdout.
func RunCLI(stdin io.Reader, stdout io.Writer, args []string) int {
	if len(args) == 0 || args[0] == "" {
		return 2
	}

	pattern := args[0]
	scanner := bufio.NewScanner(stdin)
	matchCount := 0

	for scanner.Scan() {
		line := scanner.Text()
		if matchPattern(line, pattern) {
			matchCount++
			fmt.Fprintln(stdout, line)
		}
	}

	if err := scanner.Err(); err != nil {
		return 2
	}

	if matchCount > 0 {
		return 0
	}
	return 1
}
