engine := NewBacktrackingEngine()

matcher, err := engine.Compile("^err")
Tests.EqualCheck("compile no error", nil, err)
Tests.EqualCheck("matcher pattern method", "^err", matcher.Pattern())
Tests.EqualCheck("match true prefix", true, matcher.Match("error occurred"))
Tests.EqualCheck("match false prefix", false, matcher.Match("no err here"))

matcherEnd, errEnd := engine.Compile(`\.go$`)
Tests.EqualCheck("compile end anchor no error", nil, errEnd)
Tests.EqualCheck("match end anchor true", true, matcherEnd.Match("main.go"))
Tests.EqualCheck("match end anchor false", false, matcherEnd.Match("main.go.bak"))

lines := []string{
	"error: disk full",
	"info: ok",
	"error: connection lost",
	"debug: step",
}

filtered, errGrep := GrepWithEngine(engine, "^error:", lines)
Tests.EqualCheck("grep no error", nil, errGrep)
Tests.EqualCheck("grep matches", []string{"error: disk full", "error: connection lost"}, filtered)

noneFiltered, errNone := GrepWithEngine(engine, "^critical", lines)
Tests.EqualCheck("grep empty result no error", nil, errNone)
Tests.EqualCheck("grep empty result", []string{}, noneFiltered)

emptyMatcher, errEmpty := engine.Compile("")
Tests.EqualCheck("compile empty pattern no error", nil, errEmpty)
Tests.EqualCheck("empty pattern matches text", true, emptyMatcher.Match("hello"))
Tests.EqualCheck("empty pattern getter", "", emptyMatcher.Pattern())
