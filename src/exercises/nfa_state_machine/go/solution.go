package main

import (
	"unicode"
)

const (
	StateMatch = -1
	StateSplit = -2
	StateDot   = -3
	StateDigit = -4
	StateWord  = -5
)

type State struct {
	Kind int
	Out  *State
	Out1 *State
	ID   int
}

func isWordChar(r rune) bool {
	return unicode.IsLetter(r) || unicode.IsDigit(r) || r == '_'
}

func NewMatchState(id int) *State {
	return &State{
		Kind: StateMatch,
		ID:   id,
	}
}

func NewSplitState(id int, out, out1 *State) *State {
	return &State{
		Kind: StateSplit,
		Out:  out,
		Out1: out1,
		ID:   id,
	}
}

func NewCharState(id int, r rune, out *State) *State {
	return &State{
		Kind: int(r),
		Out:  out,
		ID:   id,
	}
}

func NewClassState(id int, kind int, out *State) *State {
	return &State{
		Kind: kind,
		Out:  out,
		ID:   id,
	}
}

func MatchesRune(s *State, r rune) bool {
	if s == nil {
		return false
	}
	switch s.Kind {
	case StateDot:
		return r != '\n'
	case StateDigit:
		return unicode.IsDigit(r)
	case StateWord:
		return isWordChar(r)
	default:
		if s.Kind >= 0 {
			return rune(s.Kind) == r
		}
		return false
	}
}

func CollectStates(start *State) []*State {
	if start == nil {
		return nil
	}
	var list []*State
	visited := make(map[*State]bool)

	var dfs func(s *State)
	dfs = func(s *State) {
		if s == nil || visited[s] {
			return
		}
		visited[s] = true
		list = append(list, s)
		dfs(s.Out)
		dfs(s.Out1)
	}

	dfs(start)
	return list
}

func IsReachable(start *State, target *State) bool {
	if start == nil || target == nil {
		return false
	}
	visited := make(map[*State]bool)
	var dfs func(s *State) bool
	dfs = func(s *State) bool {
		if s == nil || visited[s] {
			return false
		}
		if s == target {
			return true
		}
		visited[s] = true
		return dfs(s.Out) || dfs(s.Out1)
	}
	return dfs(start)
}
