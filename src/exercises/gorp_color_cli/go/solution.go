package main

import (
	"bufio"
	"fmt"
	"io"
	"strconv"
	"strings"
	"unicode"
)

const (
	ColorRed   = "\033[31m"
	ColorReset = "\033[0m"
)

type ColorOption string

const (
	ColorAlways ColorOption = "always"
	ColorNever  ColorOption = "never"
	ColorAuto   ColorOption = "auto"
)

func ParseColorOption(val string) ColorOption {
	switch strings.ToLower(val) {
	case "always":
		return ColorAlways
	case "never":
		return ColorNever
	case "auto", "":
		return ColorAuto
	default:
		return ColorAuto
	}
}

func ShouldColor(option ColorOption, isTTY bool, noColorSet bool) bool {
	switch option {
	case ColorAlways:
		return true
	case ColorNever:
		return false
	case ColorAuto:
		return isTTY && !noColorSet
	default:
		return false
	}
}

type TokenType int

const (
	TokChar TokenType = iota
	TokGroupStart
	TokGroupEnd
	TokBackref
)

type Token struct {
	typ     TokenType
	pattern string
	groupId int
	min     int
	max     int
}

func isWordChar(r rune) bool {
	return unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_'
}

func matchCharGroup(char rune, group string) bool {
	i := 0
	for i < len(group) {
		if i+2 < len(group) && group[i+1] == '-' {
			start := rune(group[i])
			end := rune(group[i+2])
			if char >= start && char <= end {
				return true
			}
			i += 3
		} else {
			if rune(group[i]) == char {
				return true
			}
			i++
		}
	}
	return false
}

func matchTokenChar(char rune, pattern string) bool {
	if pattern == "." {
		return char != '\n'
	}
	if pattern == `\d` {
		return unicode.IsDigit(char)
	}
	if pattern == `\w` {
		return isWordChar(char)
	}
	if strings.HasPrefix(pattern, `\`) && len(pattern) == 2 {
		return char == rune(pattern[1])
	}
	if strings.HasPrefix(pattern, "[^") && strings.HasSuffix(pattern, "]") {
		return !matchCharGroup(char, pattern[2:len(pattern)-1])
	}
	if strings.HasPrefix(pattern, "[") && strings.HasSuffix(pattern, "]") {
		return matchCharGroup(char, pattern[1:len(pattern)-1])
	}
	if len(pattern) == 1 {
		return char == rune(pattern[0])
	}
	return false
}

func parseQuantifier(tokStr string, pattern string, i *int) Token {
	min := 1
	max := 1
	if *i < len(pattern) {
		if pattern[*i] == '+' {
			min = 1
			max = -1
			*i++
		} else if pattern[*i] == '*' {
			min = 0
			max = -1
			*i++
		} else if pattern[*i] == '?' {
			min = 0
			max = 1
			*i++
		} else if pattern[*i] == '{' {
			closeBrace := strings.IndexByte(pattern[*i:], '}')
			if closeBrace != -1 {
				braceContent := pattern[*i+1 : *i+closeBrace]
				if commaIdx := strings.IndexByte(braceContent, ','); commaIdx != -1 {
					nStr := braceContent[:commaIdx]
					mStr := braceContent[commaIdx+1:]
					if mStr == "" {
						if n, err := strconv.Atoi(nStr); err == nil {
							min = n
							max = -1
							*i += closeBrace + 1
						}
					} else {
						n, err1 := strconv.Atoi(nStr)
						m, err2 := strconv.Atoi(mStr)
						if err1 == nil && err2 == nil {
							min = n
							max = m
							*i += closeBrace + 1
						}
					}
				} else {
					if n, err := strconv.Atoi(braceContent); err == nil {
						min = n
						max = n
						*i += closeBrace + 1
					}
				}
			}
		}
	}
	return Token{typ: TokChar, pattern: tokStr, min: min, max: max}
}

func parseTokens(pattern string) []Token {
	var tokens []Token
	groupCounter := 0
	var groupStack []int

	i := 0
	for i < len(pattern) {
		if pattern[i] == '(' {
			groupCounter++
			gid := groupCounter
			groupStack = append(groupStack, gid)
			tokens = append(tokens, Token{typ: TokGroupStart, groupId: gid, min: 1, max: 1})
			i++
		} else if pattern[i] == ')' {
			if len(groupStack) > 0 {
				gid := groupStack[len(groupStack)-1]
				groupStack = groupStack[:len(groupStack)-1]
				tokens = append(tokens, Token{typ: TokGroupEnd, groupId: gid, min: 1, max: 1})
			}
			i++
		} else if pattern[i] == '\\' && i+1 < len(pattern) {
			if pattern[i+1] >= '1' && pattern[i+1] <= '9' {
				gid := int(pattern[i+1] - '0')
				tokens = append(tokens, Token{typ: TokBackref, groupId: gid, min: 1, max: 1})
				i += 2
			} else {
				tokStr := pattern[i : i+2]
				i += 2
				tokens = append(tokens, parseQuantifier(tokStr, pattern, &i))
			}
		} else if pattern[i] == '[' {
			closeIdx := strings.IndexByte(pattern[i:], ']')
			if closeIdx != -1 {
				tokStr := pattern[i : i+closeIdx+1]
				i += closeIdx + 1
				tokens = append(tokens, parseQuantifier(tokStr, pattern, &i))
			} else {
				tokStr := string(pattern[i])
				i++
				tokens = append(tokens, parseQuantifier(tokStr, pattern, &i))
			}
		} else {
			tokStr := string(pattern[i])
			i++
			tokens = append(tokens, parseQuantifier(tokStr, pattern, &i))
		}
	}
	return tokens
}

type MatchContext struct {
	lineRunes []rune
	tokens    []Token
	captured  map[int]string
	groupPos  map[int]int
}

func matchAt(ctx *MatchContext, pos int, tokIdx int, anchoredEnd bool) (int, bool) {
	if tokIdx == len(ctx.tokens) {
		if anchoredEnd {
			if pos == len(ctx.lineRunes) {
				return pos, true
			}
			return pos, false
		}
		return pos, true
	}

	tok := ctx.tokens[tokIdx]

	if tok.typ == TokGroupStart {
		ctx.groupPos[tok.groupId] = pos
		if endPos, ok := matchAt(ctx, pos, tokIdx+1, anchoredEnd); ok {
			return endPos, true
		}
		delete(ctx.groupPos, tok.groupId)
		return pos, false
	}

	if tok.typ == TokGroupEnd {
		startPos := ctx.groupPos[tok.groupId]
		capturedStr := string(ctx.lineRunes[startPos:pos])
		prev, hadPrev := ctx.captured[tok.groupId]
		ctx.captured[tok.groupId] = capturedStr

		if endPos, ok := matchAt(ctx, pos, tokIdx+1, anchoredEnd); ok {
			return endPos, true
		}

		if hadPrev {
			ctx.captured[tok.groupId] = prev
		} else {
			delete(ctx.captured, tok.groupId)
		}
		return pos, false
	}

	if tok.typ == TokBackref {
		capturedStr, ok := ctx.captured[tok.groupId]
		if !ok {
			return pos, false
		}
		capRunes := []rune(capturedStr)
		if pos+len(capRunes) > len(ctx.lineRunes) {
			return pos, false
		}
		for i, r := range capRunes {
			if ctx.lineRunes[pos+i] != r {
				return pos, false
			}
		}
		return matchAt(ctx, pos+len(capRunes), tokIdx+1, anchoredEnd)
	}

	k := 0
	for pos+k < len(ctx.lineRunes) && matchTokenChar(ctx.lineRunes[pos+k], tok.pattern) {
		if tok.max != -1 && k == tok.max {
			break
		}
		k++
	}

	if k < tok.min {
		return pos, false
	}

	for j := k; j >= tok.min; j-- {
		if endPos, ok := matchAt(ctx, pos+j, tokIdx+1, anchoredEnd); ok {
			return endPos, true
		}
	}
	return pos, false
}

type BranchData struct {
	tokens        []Token
	anchoredStart bool
	anchoredEnd   bool
}

func parseBranch(branch string) BranchData {
	anchoredStart := strings.HasPrefix(branch, "^")
	if anchoredStart {
		branch = branch[1:]
	}
	anchoredEnd := strings.HasSuffix(branch, "$")
	if anchoredEnd {
		branch = branch[:len(branch)-1]
	}
	return BranchData{
		tokens:        parseTokens(branch),
		anchoredStart: anchoredStart,
		anchoredEnd:   anchoredEnd,
	}
}

func HighlightMatches(line string, pattern string) (string, bool) {
	if pattern == "" {
		return line, false
	}
	branches := strings.Split(pattern, "|")
	var parsedBranches []BranchData
	for _, b := range branches {
		parsedBranches = append(parsedBranches, parseBranch(b))
	}

	lineRunes := []rune(line)
	var sb strings.Builder
	matchedAny := false
	i := 0

	for i < len(lineRunes) {
		bestEnd := -1
		for _, bd := range parsedBranches {
			if bd.anchoredStart && i != 0 {
				continue
			}
			ctx := &MatchContext{
				lineRunes: lineRunes,
				tokens:    bd.tokens,
				captured:  make(map[int]string),
				groupPos:  make(map[int]int),
			}
			if endPos, ok := matchAt(ctx, i, 0, bd.anchoredEnd); ok && endPos > i {
				if endPos > bestEnd {
					bestEnd = endPos
				}
			}
		}

		if bestEnd > i {
			matchedAny = true
			sb.WriteString(ColorRed)
			sb.WriteString(string(lineRunes[i:bestEnd]))
			sb.WriteString(ColorReset)
			i = bestEnd
		} else {
			sb.WriteRune(lineRunes[i])
			i++
		}
	}

	return sb.String(), matchedAny
}

func matchPattern(line string, pattern string) bool {
	branches := strings.Split(pattern, "|")
	lineRunes := []rune(line)
	for _, branch := range branches {
		bd := parseBranch(branch)
		if bd.anchoredStart {
			ctx := &MatchContext{
				lineRunes: lineRunes,
				tokens:    bd.tokens,
				captured:  make(map[int]string),
				groupPos:  make(map[int]int),
			}
			if _, ok := matchAt(ctx, 0, 0, bd.anchoredEnd); ok {
				return true
			}
		} else {
			for i := 0; i <= len(lineRunes); i++ {
				ctx := &MatchContext{
					lineRunes: lineRunes,
					tokens:    bd.tokens,
					captured:  make(map[int]string),
					groupPos:  make(map[int]int),
				}
				if _, ok := matchAt(ctx, i, 0, bd.anchoredEnd); ok {
					return true
				}
			}
		}
	}
	return false
}

// RunCLI executes gorp with highlighting, line numbers, and inverted match options.
func RunCLI(stdin io.Reader, stdout io.Writer, args []string, isTTY bool, noColorSet bool) int {
	lineNumber := false
	invertMatch := false
	colorOpt := ColorAuto
	var pattern string

	for _, arg := range args {
		if arg == "-n" || arg == "--line-number" {
			lineNumber = true
		} else if arg == "-v" || arg == "--invert-match" {
			invertMatch = true
		} else if strings.HasPrefix(arg, "--color=") {
			colorOpt = ParseColorOption(strings.TrimPrefix(arg, "--color="))
		} else if arg == "--color" {
			colorOpt = ColorAlways
		} else if pattern == "" {
			pattern = arg
		}
	}

	if pattern == "" {
		return 2
	}

	enableColor := ShouldColor(colorOpt, isTTY, noColorSet)
	scanner := bufio.NewScanner(stdin)
	lineCount := 0
	emittedCount := 0

	for scanner.Scan() {
		lineCount++
		line := scanner.Text()
		isMatch := matchPattern(line, pattern)

		if isMatch != invertMatch {
			emittedCount++
			prefix := ""
			if lineNumber {
				prefix = fmt.Sprintf("%d:", lineCount)
			}

			formattedLine := line
			if enableColor && !invertMatch {
				if hl, ok := HighlightMatches(line, pattern); ok {
					formattedLine = hl
				}
			}

			fmt.Fprintf(stdout, "%s%s\n", prefix, formattedLine)
		}
	}

	if err := scanner.Err(); err != nil {
		return 2
	}

	if emittedCount > 0 {
		return 0
	}
	return 1
}
