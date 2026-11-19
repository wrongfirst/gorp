package main

import (
	"container/heap"
	"fmt"
	"math"
	"reflect"
	"sort"
	"strconv"
	"strings"
)

type ListNode struct {
	Val  int
	Next *ListNode
}

type TreeNode struct {
	Val   int
	Left  *TreeNode
	Right *TreeNode
}

type Node struct {
	Val       int
	Neighbors []*Node
}

type Interval struct {
	Start int
	End   int
}

func MakeInt(v int) *int {
	return &v
}

func ListToLinkedList(arr []int) *ListNode {
	if len(arr) == 0 {
		return nil
	}
	head := &ListNode{Val: arr[0]}
	curr := head
	for i := 1; i < len(arr); i++ {
		curr.Next = &ListNode{Val: arr[i]}
		curr = curr.Next
	}
	return head
}

func LinkedListToList(head *ListNode) []int {
	res := []int{}
	curr := head
	visited := make(map[*ListNode]bool)
	for curr != nil {
		if visited[curr] {
			break
		}
		visited[curr] = true
		res = append(res, curr.Val)
		curr = curr.Next
	}
	return res
}

func MakeCycle(arr []int, pos int) *ListNode {
	head := ListToLinkedList(arr)
	if pos == -1 || head == nil {
		return head
	}
	tail := head
	var target *ListNode
	idx := 0
	for tail != nil {
		if idx == pos {
			target = tail
		}
		if tail.Next == nil {
			break
		}
		tail = tail.Next
		idx++
	}
	if tail != nil && target != nil {
		tail.Next = target
	}
	return head
}

func IntsToTree(vals ...int) *TreeNode {
	if len(vals) == 0 {
		return nil
	}
	root := &TreeNode{Val: vals[0]}
	queue := []*TreeNode{root}
	i := 1
	for len(queue) > 0 && i < len(vals) {
		node := queue[0]
		queue = queue[1:]
		if i < len(vals) {
			node.Left = &TreeNode{Val: vals[i]}
			queue = append(queue, node.Left)
		}
		i++
		if i < len(vals) {
			node.Right = &TreeNode{Val: vals[i]}
			queue = append(queue, node.Right)
		}
		i++
	}
	return root
}

func TreeToInts(root *TreeNode) []int {
	if root == nil {
		return []int{}
	}
	res := []int{}
	queue := []*TreeNode{root}
	for len(queue) > 0 {
		node := queue[0]
		queue = queue[1:]
		if node != nil {
			res = append(res, node.Val)
			queue = append(queue, node.Left)
			queue = append(queue, node.Right)
		}
	}
	return res
}

func ListToTree(arr []*int) *TreeNode {
	if len(arr) == 0 || arr[0] == nil {
		return nil
	}
	root := &TreeNode{Val: *arr[0]}
	queue := []*TreeNode{root}
	i := 1
	for len(queue) > 0 && i < len(arr) {
		node := queue[0]
		queue = queue[1:]
		if i < len(arr) && arr[i] != nil {
			node.Left = &TreeNode{Val: *arr[i]}
			queue = append(queue, node.Left)
		}
		i++
		if i < len(arr) && arr[i] != nil {
			node.Right = &TreeNode{Val: *arr[i]}
			queue = append(queue, node.Right)
		}
		i++
	}
	return root
}

func TreeToList(root *TreeNode) []*int {
	if root == nil {
		return []*int{}
	}
	res := []*int{}
	queue := []*TreeNode{root}
	for len(queue) > 0 {
		node := queue[0]
		queue = queue[1:]
		if node != nil {
			val := node.Val
			res = append(res, &val)
			queue = append(queue, node.Left)
			queue = append(queue, node.Right)
		} else {
			res = append(res, nil)
		}
	}
	for len(res) > 0 && res[len(res)-1] == nil {
		res = res[:len(res)-1]
	}
	return res
}

func BuildGraph(adj [][]int) *Node {
	if len(adj) == 0 {
		return nil
	}
	nodes := make([]*Node, len(adj))
	for i := range adj {
		nodes[i] = &Node{Val: i + 1}
	}
	for i, neighbors := range adj {
		for _, nei := range neighbors {
			nodes[i].Neighbors = append(nodes[i].Neighbors, nodes[nei-1])
		}
	}
	return nodes[0]
}

func GraphToAdj(node *Node) [][]int {
	if node == nil {
		return [][]int{}
	}
	visited := make(map[int]*Node)
	var dfs func(n *Node)
	dfs = func(n *Node) {
		if _, ok := visited[n.Val]; ok {
			return
		}
		visited[n.Val] = n
		for _, nei := range n.Neighbors {
			dfs(nei)
		}
	}
	dfs(node)
	adj := make([][]int, len(visited))
	for i := 1; i <= len(visited); i++ {
		if n, ok := visited[i]; ok {
			row := []int{}
			for _, nei := range n.Neighbors {
				row = append(row, nei.Val)
			}
			adj[i-1] = row
		} else {
			adj[i-1] = []int{}
		}
	}
	return adj
}

func NormalizeNested(groups [][]int) [][]int {
	res := make([][]int, len(groups))
	for i, g := range groups {
		cp := append([]int{}, g...)
		sort.Ints(cp)
		res[i] = cp
	}
	sort.Slice(res, func(i, j int) bool {
		if len(res[i]) != len(res[j]) {
			return len(res[i]) < len(res[j])
		}
		for k := 0; k < len(res[i]); k++ {
			if res[i][k] != res[j][k] {
				return res[i][k] < res[j][k]
			}
		}
		return false
	})
	return res
}

func NormalizeNestedStrings(groups [][]string) [][]string {
	res := make([][]string, len(groups))
	for i, g := range groups {
		cp := append([]string{}, g...)
		sort.Strings(cp)
		res[i] = cp
	}
	sort.Slice(res, func(i, j int) bool {
		if len(res[i]) != len(res[j]) {
			return len(res[i]) < len(res[j])
		}
		for k := 0; k < len(res[i]); k++ {
			if res[i][k] != res[j][k] {
				return res[i][k] < res[j][k]
			}
		}
		return false
	})
	return res
}

func SortStrings(words []string) []string {
	cp := append([]string{}, words...)
	sort.Strings(cp)
	return cp
}

func SortInts(arr []int) []int {
	cp := append([]int{}, arr...)
	sort.Ints(cp)
	return cp
}

func min(a int, rest ...int) int {
	m := a
	for _, v := range rest {
		if v < m {
			m = v
		}
	}
	return m
}

func max(a int, rest ...int) int {
	m := a
	for _, v := range rest {
		if v > m {
			m = v
		}
	}
	return m
}

func deepEqual(expected, actual interface{}) bool {
	if reflect.DeepEqual(expected, actual) {
		return true
	}

	v1 := reflect.ValueOf(expected)
	v2 := reflect.ValueOf(actual)

	if !v1.IsValid() && !v2.IsValid() {
		return true
	}
	if !v1.IsValid() || !v2.IsValid() {
		return false
	}

	// Compare slices / arrays (treating nil slice and empty slice as equal)
	if (v1.Kind() == reflect.Slice || v1.Kind() == reflect.Array) &&
		(v2.Kind() == reflect.Slice || v2.Kind() == reflect.Array) {
		if v1.Len() == 0 && v2.Len() == 0 {
			return true
		}
		if v1.Len() != v2.Len() {
			return false
		}
		for i := 0; i < v1.Len(); i++ {
			if !deepEqual(v1.Index(i).Interface(), v2.Index(i).Interface()) {
				return false
			}
		}
		return true
	}

	// Compare maps (treating nil map and empty map as equal)
	if v1.Kind() == reflect.Map && v2.Kind() == reflect.Map {
		if v1.Len() == 0 && v2.Len() == 0 {
			return true
		}
		if v1.Len() != v2.Len() {
			return false
		}
		for _, key := range v1.MapKeys() {
			val1 := v1.MapIndex(key)
			val2 := v2.MapIndex(key)
			if !val2.IsValid() || !deepEqual(val1.Interface(), val2.Interface()) {
				return false
			}
		}
		return true
	}

	// Compare pointers
	if v1.Kind() == reflect.Ptr && v2.Kind() == reflect.Ptr {
		if v1.IsNil() && v2.IsNil() {
			return true
		}
		if v1.IsNil() || v2.IsNil() {
			return false
		}
		return deepEqual(v1.Elem().Interface(), v2.Elem().Interface())
	}

	// Compare structs of matching type
	if v1.Kind() == reflect.Struct && v2.Kind() == reflect.Struct && v1.Type() == v2.Type() {
		for i := 0; i < v1.NumField(); i++ {
			if !deepEqual(v1.Field(i).Interface(), v2.Field(i).Interface()) {
				return false
			}
		}
		return true
	}

	return false
}

type TestHarness struct{}

var Tests TestHarness

func (t TestHarness) BoolCheck(msg string, b bool) {
	if b {
		fmt.Printf("Test passed: %s\n", msg)
	} else {
		fmt.Printf("Test failed: %s\n", msg)
		panic(fmt.Sprintf("Test failed: %s", msg))
	}
}

func (t TestHarness) EqualCheck(msg string, expected, actual interface{}) {
	if deepEqual(expected, actual) {
		fmt.Printf("Test passed: %s\n", msg)
	} else {
		fmt.Printf("Test failed: %s\nExpected: %#v\nActual:   %#v\n", msg, expected, actual)
		panic(fmt.Sprintf("Test failed: %s", msg))
	}
}

func (t TestHarness) UnorderedEqualCheck(msg string, expected, actual interface{}) {
	switch exp := expected.(type) {
	case []int:
		if act, ok := actual.([]int); ok {
			t.EqualCheck(msg, SortInts(exp), SortInts(act))
			return
		}
	case []string:
		if act, ok := actual.([]string); ok {
			t.EqualCheck(msg, SortStrings(exp), SortStrings(act))
			return
		}
	case [][]int:
		if act, ok := actual.([][]int); ok {
			t.EqualCheck(msg, NormalizeNested(exp), NormalizeNested(act))
			return
		}
	case [][]string:
		if act, ok := actual.([][]string); ok {
			t.EqualCheck(msg, NormalizeNestedStrings(exp), NormalizeNestedStrings(act))
			return
		}
	}
	t.EqualCheck(msg, expected, actual)
}


