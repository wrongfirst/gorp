m := NewMatchState(100)
Tests.EqualCheck("match state kind", StateMatch, m.Kind)

c1 := NewCharState(1, 'a', m)
Tests.EqualCheck("char state matches 'a'", true, MatchesRune(c1, 'a'))
Tests.EqualCheck("char state does not match 'b'", false, MatchesRune(c1, 'b'))

d1 := NewClassState(2, StateDigit, m)
Tests.EqualCheck("digit state matches '5'", true, MatchesRune(d1, '5'))
Tests.EqualCheck("digit state does not match 'x'", false, MatchesRune(d1, 'x'))

w1 := NewClassState(3, StateWord, m)
Tests.EqualCheck("word state matches '_'", true, MatchesRune(w1, '_'))

dot1 := NewClassState(4, StateDot, m)
Tests.EqualCheck("dot state matches '!'", true, MatchesRune(dot1, '!'))
Tests.EqualCheck("dot state does not match newline", false, MatchesRune(dot1, '\n'))

s1 := NewSplitState(5, c1, d1)
Tests.EqualCheck("split state does not directly match rune", false, MatchesRune(s1, 'a'))

allStates := CollectStates(s1)
Tests.EqualCheck("reachable states count", 4, len(allStates))
actualIDs := make([]int, 0, len(allStates))
for _, s := range allStates {
	actualIDs = append(actualIDs, s.ID)
}
expectedIDs := []int{1, 2, 5, 100}
Tests.EqualCheck("reachable state IDs", SortInts(expectedIDs), SortInts(actualIDs))
Tests.EqualCheck("is reachable match from split", true, IsReachable(s1, m))

unconnected := NewCharState(99, 'z', nil)
Tests.EqualCheck("unconnected not reachable", false, IsReachable(s1, unconnected))
