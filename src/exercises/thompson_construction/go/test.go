nfa1, err1 := CompileToNFA("ab")
Tests.EqualCheck("ab compilation no error", nil, err1)
Tests.BoolCheck("ab start state matches 'a'", MatchesRune(nfa1, 'a'))
Tests.BoolCheck("ab second state matches 'b'", MatchesRune(nfa1.Out, 'b'))
Tests.EqualCheck("ab final state is match", StateMatch, nfa1.Out.Out.Kind)

nfa2, err2 := CompileToNFA("a|b")
Tests.EqualCheck("a|b compilation no error", nil, err2)
Tests.EqualCheck("a|b start is split", StateSplit, nfa2.Kind)
branch1 := MatchesRune(nfa2.Out, 'a') || MatchesRune(nfa2.Out1, 'a')
branch2 := MatchesRune(nfa2.Out, 'b') || MatchesRune(nfa2.Out1, 'b')
Tests.BoolCheck("a|b branches to both 'a' and 'b'", branch1 && branch2)

nfa3, err3 := CompileToNFA("a*")
Tests.EqualCheck("a* compilation no error", nil, err3)
Tests.EqualCheck("a* start is split", StateSplit, nfa3.Kind)
allStates3 := CollectStates(nfa3)
hasMatch := false
for _, s := range allStates3 {
	if s.Kind == StateMatch {
		hasMatch = true
		break
	}
}
Tests.BoolCheck("a* has reachable match state", hasMatch)

nfa4, err4 := CompileToNFA("a(b|c)*d")
Tests.EqualCheck("a(b|c)*d compilation no error", nil, err4)
states4 := CollectStates(nfa4)
Tests.BoolCheck("a(b|c)*d state count > 0", len(states4) > 0)

_, errEmpty := Post2NFA([]Token{})
Tests.BoolCheck("empty postfix returns error", errEmpty != nil)

// One-or-more (+) starts at operand state, followed by split looping back
nfaPlus, errPlus := CompileToNFA("a+")
Tests.EqualCheck("a+ compilation no error", nil, errPlus)
Tests.BoolCheck("a+ start matches 'a'", MatchesRune(nfaPlus, 'a'))
Tests.EqualCheck("a+ second state is split", StateSplit, nfaPlus.Out.Kind)
Tests.BoolCheck("a+ loops back to start", nfaPlus.Out.Out == nfaPlus || nfaPlus.Out.Out1 == nfaPlus)

// Zero-or-one (?) starts at split branching to operand and match
nfaQuest, errQuest := CompileToNFA("a?")
Tests.EqualCheck("a? compilation no error", nil, errQuest)
Tests.EqualCheck("a? start is split", StateSplit, nfaQuest.Kind)
Tests.BoolCheck("a? reaches match via bypass", nfaQuest.Out.Kind == StateMatch || nfaQuest.Out1.Kind == StateMatch)

// Character classes and dot
nfaClasses, errClasses := CompileToNFA(`\d\w.`)
Tests.EqualCheck("classes and dot compilation no error", nil, errClasses)
Tests.EqualCheck("first state is StateDigit", StateDigit, nfaClasses.Kind)
Tests.EqualCheck("second state is StateWord", StateWord, nfaClasses.Out.Kind)
Tests.EqualCheck("third state is StateDot", StateDot, nfaClasses.Out.Out.Kind)
Tests.EqualCheck("fourth state is StateMatch", StateMatch, nfaClasses.Out.Out.Out.Kind)

// Error cases: stack underflow, trailing operands, syntax error
_, errUnderflow := Post2NFA([]Token{{Type: TokStar, Value: '*'}})
Tests.BoolCheck("star underflow returns error", errUnderflow != nil)

_, errTrailing := Post2NFA([]Token{{Type: TokLiteral, Value: 'a'}, {Type: TokLiteral, Value: 'b'}})
Tests.BoolCheck("trailing operands returns error", errTrailing != nil)

_, errBadSyntax := CompileToNFA("(a|b")
Tests.BoolCheck("invalid regex syntax returns error", errBadSyntax != nil)
