#include <stdio.h>
#include <stdbool.h>

// Forward declarations for editor LSP static analysis
const char* fizzbuzz(int n);

#ifndef _CODEBOOK_HARNESS_C_
typedef struct {
    void (*bool_check)(const char* msg, bool b);
    void (*equal_check_int)(const char* msg, int exp, int act);
    void (*equal_check_long)(const char* msg, long long exp, long long act);
    void (*equal_check_double)(const char* msg, double exp, double act);
    void (*equal_check_str)(const char* msg, const char* exp, const char* act);
    void (*equal_check_int_arr)(const char* msg, const int* exp, int exp_len, const int* act, int act_len);
} _HarnessTests;
extern const _HarnessTests Tests;
#endif

int main() {
    struct TestCase {
        int input;
        const char* expected;
    } testCases[] = {
        {1, "1"},
        {2, "2"},
        {3, "Fizz"},
        {4, "4"},
        {5, "Buzz"},
        {6, "Fizz"},
        {10, "Buzz"},
        {15, "FizzBuzz"},
        {30, "FizzBuzz"}
    };

    int numTests = sizeof(testCases) / sizeof(testCases[0]);
    for (int i = 0; i < numTests; i++) {
        const char* res = fizzbuzz(testCases[i].input);
        char msg[64];
        snprintf(msg, sizeof(msg), "fizzbuzz(%d)", testCases[i].input);
        Tests.equal_check_str(msg, testCases[i].expected, res);
    }

    return 0;
}
