#include <iostream>
#include <string>
#include <vector>
#include <utility>

std::string fizzbuzz(int n);

int main() {
    std::vector<std::pair<int, std::string>> testCases = {
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

    for (const auto& item : testCases) {
        int input = item.first;
        const std::string& expected = item.second;
        std::string result = fizzbuzz(input);
        Tests.equal_check("fizzbuzz(" + std::to_string(input) + ")", expected, result);
    }

    return 0;
}
