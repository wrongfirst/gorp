res1 := findAllMatches("cat dog cat", "cat")
Tests.EqualCheck("two literal matches", []string{"cat", "cat"}, res1)

res2 := findAllMatches("order 123 and 456 and 789", `\d+`)
Tests.EqualCheck("three digit matches", []string{"123", "456", "789"}, res2)

res3 := findAllMatches("AB-10 CD-20", `[A-Z]+-\d+`)
Tests.EqualCheck("code pattern matches", []string{"AB-10", "CD-20"}, res3)

res4 := findAllMatches("aaaa", "aa")
Tests.EqualCheck("non-overlapping matches", []string{"aa", "aa"}, res4)

res5 := findAllMatches("cat and dog and bird", "cat|dog")
Tests.EqualCheck("alternation multiple matches", []string{"cat", "dog"}, res5)

res6 := findAllMatches("no numbers here", `\d+`)
Tests.EqualCheck("no match returns empty slice", []string{}, res6)

res7 := findAllMatches("test", "")
Tests.EqualCheck("empty pattern returns empty slice", []string{}, res7)
