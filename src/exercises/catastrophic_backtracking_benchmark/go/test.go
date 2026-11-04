res1 := CountBacktrackSteps("hello", "^hello$")
Tests.EqualCheck("simple match matched", true, res1.Matched)
Tests.BoolCheck("simple match step count within bounds", res1.StepCount >= 5 && res1.StepCount <= 10)

res2 := CountBacktrackSteps("aaaa", "^a+b$")
Tests.EqualCheck("fast fail matched", false, res2.Matched)
Tests.BoolCheck("fast fail step count within bounds", res2.StepCount >= 4 && res2.StepCount <= 10)

res3 := CountBacktrackSteps("aaaa", "^a*a*a*a*b$")
Tests.EqualCheck("backtrack fail matched", false, res3.Matched)
Tests.BoolCheck("backtrack 4 a step count elevated", res3.StepCount >= 100 && res3.StepCount <= 160)

res4 := CountBacktrackSteps("aaaaaaaa", "^a*a*a*a*b$")
Tests.EqualCheck("backtrack 8 a step count highly elevated", false, res4.Matched)
Tests.BoolCheck("backtrack 8 a step count in expected range", res4.StepCount >= 600 && res4.StepCount <= 850)
Tests.BoolCheck("backtrack 8 a steps significantly exceed 4 a", res4.StepCount > res3.StepCount*4)

Tests.EqualCheck("catastrophic threshold 100", true, IsCatastrophic("aaaa", "^a*a*a*a*b$", 100))
Tests.EqualCheck("catastrophic threshold 200", false, IsCatastrophic("aaaa", "^a*a*a*a*b$", 200))
Tests.EqualCheck("catastrophic simple false", false, IsCatastrophic("hello", "^hello$", 20))
