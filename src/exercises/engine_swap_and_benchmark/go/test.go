engine := NewNFAEngine()
m, err := engine.Compile("^abc$")
Tests.EqualCheck("compile no error", nil, err)
Tests.EqualCheck("match exact", true, m.Match("abc"))
Tests.EqualCheck("match mismatch", false, m.Match("abcd"))

lines := []string{"apple", "banana", "apricot", "cherry"}
res, errGrep := Grep("^ap", lines)
Tests.EqualCheck("grep no error", nil, errGrep)
Tests.EqualCheck("grep matching lines", []string{"apple", "apricot"}, res)

comp1, errC1 := CompareEngines("^a+b$", "aaaaab")
Tests.EqualCheck("compare no error", nil, errC1)
Tests.BoolCheck("both agree true on a+b", comp1.BacktrackMatch && comp1.NFAMatch)

comp2, errC2 := CompareEngines("^a+b$", "aaaaa")
Tests.EqualCheck("compare fail no error", nil, errC2)
Tests.BoolCheck("both agree false on a+b", !(comp2.BacktrackMatch || comp2.NFAMatch))

compPatho, errCP := CompareEngines("^a?a?a?a?a?a?a?a?aaaaaaaa$", "aaaaaaaa")
Tests.EqualCheck("patho no error", nil, errCP)
Tests.BoolCheck("both agree true on patho", compPatho.BacktrackMatch && compPatho.NFAMatch)
Tests.BoolCheck("backtrack steps > 1000", compPatho.BacktrackSteps > 1000)
Tests.BoolCheck("nfa steps < 100", compPatho.NFASteps < 100)
