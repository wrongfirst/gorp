p1, err1 := ParseRegexToPostfix("ab")
Tests.EqualCheck("ab no error", nil, err1)
Tests.EqualCheck("ab postfix", "ab·", PostfixToString(p1))

p2, err2 := ParseRegexToPostfix("a(b|c)*d")
Tests.EqualCheck("a(b|c)*d no error", nil, err2)
Tests.EqualCheck("a(b|c)*d postfix", "abc|*·d·", PostfixToString(p2))

p3, err3 := ParseRegexToPostfix("a|b|c")
Tests.EqualCheck("a|b|c no error", nil, err3)
Tests.EqualCheck("a|b|c postfix", "ab|c|", PostfixToString(p3))

p4, err4 := ParseRegexToPostfix("a+b?")
Tests.EqualCheck("a+b? no error", nil, err4)
Tests.EqualCheck("a+b? postfix", "a+b?·", PostfixToString(p4))

p5, err5 := ParseRegexToPostfix(`\d+\.\w*`)
Tests.EqualCheck("escapes and dot no error", nil, err5)
Tests.EqualCheck("escapes and dot postfix", `\d+.·\w*·`, PostfixToString(p5))

_, errUnmatchedRight := ParseRegexToPostfix("a(b|c")
Tests.BoolCheck("unmatched left paren returns error", errUnmatchedRight != nil)

_, errUnmatchedLeft := ParseRegexToPostfix("a)b")
Tests.BoolCheck("unmatched right paren returns error", errUnmatchedLeft != nil)

unitToks, unitErr := Tokenize("a+b")
Tests.EqualCheck("tokenize simple no error", nil, unitErr)
expectedToks := []Token{
	{Type: TokLiteral, Value: 'a'},
	{Type: TokPlus, Value: '+'},
	{Type: TokLiteral, Value: 'b'},
}
Tests.EqualCheck("tokenize 'a+b' tokens", expectedToks, unitToks)

_, errDangling := Tokenize(`a\`)
Tests.BoolCheck("tokenize dangling escape error", errDangling != nil)

concatToks := InsertExplicitConcat(unitToks)
expectedConcat := []Token{
	{Type: TokLiteral, Value: 'a'},
	{Type: TokPlus, Value: '+'},
	{Type: TokConcat, Value: '·'},
	{Type: TokLiteral, Value: 'b'},
}
Tests.EqualCheck("insert explicit concat tokens", expectedConcat, concatToks)

postToks, errPost := ToPostfix(concatToks)
Tests.EqualCheck("to postfix no error", nil, errPost)
Tests.EqualCheck("to postfix string", "a+b·", PostfixToString(postToks))
