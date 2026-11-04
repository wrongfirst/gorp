m1, ok1 := findSingleMatch("user id is 42 in DB", `\d+`)
Tests.EqualCheck("extract digits substring", "42", m1)
Tests.EqualCheck("extract digits found is true", true, ok1)

m2, ok2 := findSingleMatch("apple and orange", "banana")
Tests.EqualCheck("substring not found returns empty", "", m2)
Tests.EqualCheck("substring not found is false", false, ok2)

m3, ok3 := findSingleMatch("order [AB-123] confirmed", `\[[A-Z]+-\d+\]`)
Tests.EqualCheck("extract bracketed token", "[AB-123]", m3)
Tests.EqualCheck("bracketed token found is true", true, ok3)

m4, ok4 := findSingleMatch("the quick brown fox", `[a-z]{5}`)
Tests.EqualCheck("extract first 5-letter word", "quick", m4)
Tests.EqualCheck("5-letter word found is true", true, ok4)

m5, ok5 := findSingleMatch("apple pie", "^apple")
Tests.EqualCheck("extract start-anchored pattern", "apple", m5)
Tests.EqualCheck("start-anchored found is true", true, ok5)

m6, ok6 := findSingleMatch("good apple pie", "^apple")
Tests.EqualCheck("start-anchored non-match returns empty", "", m6)
Tests.EqualCheck("start-anchored non-match is false", false, ok6)

m7, ok7 := findSingleMatch("banana", `a+$`)
Tests.EqualCheck("extract end-anchored pattern", "a", m7)
Tests.EqualCheck("end-anchored found is true", true, ok7)

m8, ok8 := findSingleMatch("hello", "")
Tests.EqualCheck("empty pattern returns empty string", "", m8)
Tests.EqualCheck("empty pattern is false", false, ok8)
