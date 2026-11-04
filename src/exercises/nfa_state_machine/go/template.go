package main

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

// TODO: Implement NewMatchState(id int) *State
func NewMatchState(id int) *State {
	return nil
}

// TODO: Implement NewSplitState(id int, out, out1 *State) *State
func NewSplitState(id int, out, out1 *State) *State {
	return nil
}

// TODO: Implement NewCharState(id int, r rune, out *State) *State
func NewCharState(id int, r rune, out *State) *State {
	return nil
}

// TODO: Implement NewClassState(id int, kind int, out *State) *State
func NewClassState(id int, kind int, out *State) *State {
	return nil
}

// TODO: Implement MatchesRune(s *State, r rune) bool
func MatchesRune(s *State, r rune) bool {
	return false
}

// TODO: Implement CollectStates(start *State) []*State
func CollectStates(start *State) []*State {
	return nil
}

// TODO: Implement IsReachable(start *State, target *State) bool
func IsReachable(start *State, target *State) bool {
	return false
}
