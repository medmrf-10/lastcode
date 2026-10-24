

# PART 1: DATA STRUCTURES

## Vector 01: 5 Medium Exercises

### Exercise 01: Right rotation

Implement `void right_rotate()` in the Vector class to shift every element one step to the right. The rightmost element should move to the first index.

### Exercise 02: Left rotation

Implement `void left_rotate()` in the Vector class to rotate the whole array one step to the left. The leftmost element should move to the last index.

### Exercise 03: Right rotation with steps

Implement `void right_rotate(int times)` to apply right rotation multiple times. The function should be efficient for large values of `times` (up to 2,000,000,000).

### Exercise 04: Deleting a position

Implement `int pop(int idx)` in the Vector class to remove and return the element at the given index.

### Exercise 05: Improved search

Implement `int find_transposition(int value)` to find a value and move it one step left to improve future search times for frequently accessed elements.

## SLL 01: 6 Easy Exercises

### Exercise 01: Destructor

Implement the destructor `~LinkedList()` to free all created nodes and prevent memory leaks.

### Exercise 02: Insert front

Implement a function to insert a new node at the front of the linked list.

### Exercise 03: Delete front

Implement a function to delete the first node of the linked list.

### Exercise 04: Get nth from back

Implement `Node* get_nth_back(int n)` to find the nth node from the end of the list.

### Exercise 05: Is Same list's data?

Implement `bool is_same(const LinkedList &other)` to check if two lists have the same data. Provide two implementations: one using a maintained length variable and one without.

### Exercise 06: Linked List without tail/length

Implement a linked list with only a head pointer (no tail or length). Implement methods for adding elements (O(1)) and getting the tail.

## SLL 02: 5 Easy to Medium Exercises

### Exercise 01: Delete with key

Implement `void delete_node_with_key(int value)` to delete the first node with the given key value.

### Exercise 02: Swap each pair values

Implement `void swap_pairs()` to swap each two consecutive values in the list.

### Exercise 03: Reverse list nodes

Implement `void reverse()` to reverse all nodes in the list.

### Exercise 04: Delete even positions

Implement `void delete_even_positions()` to delete all nodes at even positions.

### Exercise 05: Insert to be sorted

Implement `void insert_sorted(int value)` to insert a value into the list while maintaining sorted order.

## SLL 01: 6 Medium Exercises

### Exercise 01: Swap Head and Tail

Swap the head node with the tail node in a linked list. Swap the actual nodes, not just their values.

Example:
Before: 1 -> 2 -> 3 -> 4
After:  4 -> 2 -> 3 -> 1

### Exercise 02: Left Rotate

Implement a function `void left_rotate(int k)` that shifts the first k elements to the end of the list. The function should run in O(n) time.

Example:
List: 6 -> 10 -> 8 -> 15
k = 2
Result: 8 -> 15 -> 6 -> 10

### Exercise 03: Remove Duplicates

Remove all occurrences of duplicate elements except for the first one in an unsorted list.

Example:
Input: 1 -> 2 -> 1 -> 3 -> 2 -> 4 -> 3 -> 5 -> 2
Output: 1 -> 2 -> 3 -> 4 -> 5

### Exercise 04: Remove Last Occurrence

Given a key, remove its last occurrence from the list.

Example:
List: 1 -> 2 -> 3 -> 1 -> 4
Key: 1
Result: 1 -> 2 -> 3 -> 4

### Exercise 05: Move to Back

Move all occurrences of a given key to the end of the list.

Example:
List: 1 -> 2 -> 3 -> 2 -> 4 -> 1
Key: 1
Result: 2 -> 3 -> 2 -> 4 -> 1 -> 1

### Exercise 06: Recursive Max

Implement a recursive function `int max()` to find the maximum value in the list. Use only one function and avoid creating additional functions.

## SLL 02: 5 Medium to Hard Exercises

### Exercise 01: Arrange Odd & Even Nodes

Rearrange the nodes so that odd-positioned nodes come first, followed by even-positioned nodes.

Example:
Input: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7
Output: 1 -> 3 -> 5 -> 7 -> 2 -> 4 -> 6

### Exercise 02: Insert Alternating

Implement `void insert_alternate(LinkedList &another)` to insert values from another list alternately into the current list.

Example:
List1: 1 -> 2 -> 3
List2: 4 -> 5 -> 6
Result: 1 -> 4 -> 2 -> 5 -> 3 -> 6

### Exercise 03: Adding 2 HUGE Numbers

Implement `void add_num(LinkedList &another)` to add two huge numbers represented as linked lists.

Example:
List1: 1 -> 2 -> 3 (representing 321)
List2: 4 -> 5 -> 3 (representing 354)
Result: 5 -> 7 -> 6 (representing 675)

### Exercise 04: Remove All Repeated

Remove all nodes that have duplicates in a sorted list, keeping only nodes that never repeated.

Example:
Input: 1 -> 1 -> 2 -> 2 -> 2 -> 3 -> 5
Output: 3 -> 5

### Exercise 05: Reverse Chains

Implement `void reverse_chains(int k)` to reverse every consecutive k nodes in the list.

Example:
List: 1 -> 2 -> 3 -> 4 -> 5 -> 6
k = 3
Result: 3 -> 2 -> 1 -> 6 -> 5 -> 4

## DLL 01: 4 Easy to Medium Exercises

### Exercise 01: Delete All Nodes with Key

Implement `void delete_all_nodes_with_key(int value)` to remove all nodes with the given value.

Example:
List: 1 -> 2 -> 5 -> 4 -> 5 -> 4 -> 4
Key: 5
Result: 1 -> 2 -> 4 -> 4 -> 4

### Exercise 02: Delete Even Positions

Delete all nodes at even positions in the list.

Example:
Input: 1 <-> 2 <-> 3 <-> 4 <-> 5 <-> 6
Output: 1 <-> 3 <-> 5

### Exercise 03: Delete Odd Positions

Delete all nodes at odd positions in the list.

Example:
Input: 1 <-> 2 <-> 3 <-> 4 <-> 5 <-> 7
Output: 2 <-> 4 <-> 7

### Exercise 04: Is Palindrome

Implement `bool is_palindrome()` to check if the list is a palindrome.

Example:
List: 1 <-> 2 <-> 2 <-> 1
Result: true

## DLL 02: 4 Medium to Hard Exercises

### Exercise 01: Find the Middle

Find the middle value of the list. For even-length lists, return the second of the two middle values. Implement this for both doubly linked list and singly linked list (using only the next pointer).

Example:
List: 1 <-> 2 <-> 3 <-> 4 <-> 5 <-> 6
Result: 4

### Exercise 02: Swap Forward with Backward

Given K, swap the Kth node from the start with the Kth node from the end. Implement this both using and not using the length variable.

Example:
List: 1 <-> 2 <-> 3 <-> 4 <-> 5
K = 2
Result: 1 <-> 4 <-> 3 <-> 2 <-> 5

### Exercise 03: Reverse List Nodes

Reverse all nodes in the list.

Example:
Input: 1 <-> 2 <-> 3 <-> 4 <-> 5
Output: 5 <-> 4 <-> 3 <-> 2 <-> 1

### Exercise 04: Merge Lists

Implement `void merge_2sorted_lists(LinkedList &other)` to merge two sorted lists into a single sorted list in O(n+m) time.

Example:
List1: 10 <-> 20 <-> 30 <-> 40 <-> 50
List2: 15 <-> 17 <-> 22 <-> 24 <-> 35
Result: 10 <-> 15 <-> 17 <-> 20 <-> 22 <-> 24 <-> 30 <-> 35 <-> 40 <-> 50

## Projects : Sparse Array and Matrix

### Project 01: Sparse 1D Array

Implement a sparse array using a doubly linked list (ArrayLinkedList) with the following functionalities:

- Set and Get positions
- Print array
- Add arrays
- Suitable for representing large arrays (e.g., 10^8 indices) where most elements are zero
Example application: Polynomial representation (e.g., 2X^60 + 17X^1500)

### Project 02: Sparse Matrix (2D Array)

Implement a SparseMatrix class to represent a 2D sparse array:

- Use a linked list of linked lists (doubly linked for both)
- Each row in the sparse matrix is represented by a 1D sparse array (from Project 01)
- Implement necessary operations (e.g., set, get, print)
Example:
For a 20x20 matrix with only the following non-zero cells:
Arr[5][2] = 6, Arr[5][4] = 10, Arr[5][5] = 8
Arr[8][4] = 3, Arr[8][7] = 5, Arr[8][8] = 1
Arr[9][6] = 7, Arr[9][9] = 11
Create a list of 3 connected rows, each containing a linked list of its non-zero columns.

## Stack 01: 6 Easy Exercises

### Exercise 01: Alternative Stack Array Design

Implement a stack with the following design choices:

- Use `int added_elements` instead of `top` to represent the number of added elements
- `push`, `pop`, and `peek` return a bool to indicate success/failure
- Array content is reversed (e.g., pushing 10, 20, 30 results in {30, 20, 10})
- Discuss time complexity and how design choices affect the data structure

### Exercise 02: Reverse Subwords

Implement `string reverse_subwords(string line)` to reverse each subword in a string.
Example: "abc d efg xy" → "cba d gfe yx"

### Exercise 03: Reverse a Number Using Stack

Implement `int reverse_num(int num)` to reverse the digits of a non-negative number using a stack.
Example: Input: 1234, Output: 4321

### Exercise 04: Valid Parentheses

Implement `bool isValid(string str)` to check if a string of parentheses is valid.
Valid examples: (), ()(), (()()), {}{}, (((()))), ([]), ()[]{}, {[]}
Invalid examples: (], ()), (][), (], ([)]

### Exercise 05: Remove Adjacent Duplicates

Implement `string removeDuplicates(string S)` to remove all adjacent duplicate characters in a string using a stack.

### Exercise 06: Two Stacks in One Array

Modify the stack class to simulate two stacks using a single array:

- Use the same array for both stacks
- Maintain original time/memory complexity
- Each stack can use available array space
- Modify functions like: `void push(int id, int x)` where id is 1 or 2 to refer to the stack

## Stack 02: 5 Medium to Hard Exercises

### Exercise 01: Asteroid Collision

Implement asteroid collision simulation using a stack.

### Exercise 02: Insert at the Bottom

Add `void insert_at_bottom(int x)` to insert an element at the bottom of the stack.
Implement recursively without creating new stacks or arrays.

### Exercise 03: Reverse Stack

Implement `void reverse()` to reverse the stack content recursively without creating new stacks or arrays.

### Exercise 04: Score of Parentheses

Calculate the score of a balanced parentheses string using a stack.
Examples:

- () → 1
- (()) → 2
- ()() → 2
- (()()) → 4
- (()(())) → 6

### Exercise 05: Next Greater Element

Find the next greater element for each element in an array in O(n) time.
Example:
Input: 8 73 74 75 71 69 72 76 73
Output: 74 75 76 72 72 76 -1 -1

## Stack 03: 3 Medium Exercises

### Exercise 01: Postfix Evaluation

Implement `double evaluate_postfix(string postfix)` using a linked-list stack.
Examples:

- 52/ → 2.5
- 12+3+ → 6
- 123*+ → 7
- 23*4+ → 10
- 135*+72/- → 12.5

### Exercise 02: Infix to Postfix with Power Operator

Extend infix to postfix conversion to handle:

- Single lowercase or uppercase letters
- Operators: ^, *, /, +, -
- Parentheses
Examples:
- 4^3^2 → 432^^
- 5+4^3^2-9 → 5432^^+9-
- a+b*(c^d-e)^(f+G*h)-i → abcd^e-fGh*+^*+i-

### Exercise 03: Stack with Middle

Design a linked-list based stack that keeps track of the middle value and modifies the display function to show the middle.

## Queue 01: 2 Easy Exercises

### Exercise 01: Deque

Implement a Deque (Double-ended queue) by modifying the circular queue to include:

1. `void enqueue_rear(int value)` [same as old code]
2. `void enqueue_front(int value)`
3. `int dequeue_front()` [same as old code]
4. `int dequeue_rear()`

Front/Rear meanings should not change. All methods should have O(1) time complexity.

### Exercise 02: Implement a Stack Using a Single Queue

Using a Linked-list queue, implement stack functionalities:

1. You may add extra functionalities to the queue code to make your stack code proper.
2. Determine the time complexity of your push/pop operations.
3. Do not implement display.

## Queue 02: 2 Medium Exercises

### Exercise 01: Queue Using 2 Stacks: O(1) Dequeue

Implement Queue functionalities using 2 stack objects with the following constraint:

- The dequeue() function must remain O(1)

Implement only the requested functionalities.

### Exercise 02: Priority Queue

Implement a priority queue class using a linked-list queue with the following specifications:

1. Queue can hold up to 8 tasks.
2. Priority ranges from 1 to 3 (3 being highest).
3. Display should show 1 row per priority.
4. dequeue() should return tasks of higher priority first.
5. All operations should have O(1) time complexity.

Example:

```
Enqueue (task_id = 1131, priority = 1)
Enqueue (task_id = 3111, priority = 3)
Enqueue (task_id = 2211, priority = 2)
Enqueue (task_id = 3161, priority = 3)
Print order: 3111 3161 2211 1131

```

## Queue 03: 2 Hard Exercises

### Exercise 01: Queue Using 2 Stacks: O(1) Enqueue

Implement Queue functionalities using 2 stack objects with the following constraint:

- The enqueue() function must remain O(1)

### Exercise 02: Sum of Last K Numbers (Stream)

Implement a class that receives an infinite stream of numbers and returns the sum of the last k numbers:

Example (k = 4):

```
Stream: 1 2 3 4 5 6 7 8 9
Returns: 1, 1+2, 1+2+3, 1+2+3+4, 2+3+4+5, 3+4+5+6, ...
For 6 → 18

```

## Binary Tree 01: 6 Easy Exercises

### Exercise 01: Tree Max

Create a class Solution with a recursive function maxValue that returns the maximum value in the whole tree.

### Exercise 02: Maximum Depth of Binary Tree

Given the root of a binary tree, return its maximum depth (number of nodes along the longest path from the root to the farthest leaf node).

Example:

```
     3
    / \\\\
   9  20
      / \\\\
     15  7
Depth: 3 (path 3 - 20 - 7)

```

### Exercise 03: Path Sum

Given the root of a binary tree and an integer targetSum, return true if the tree has a root-to-leaf path such that adding up all the values along the path equals targetSum. A leaf is a node with no children.

### Exercise 04: Sum of Left Leaves

Implement a function to calculate the sum of all left leaves in a binary tree.

### Exercise 05: [Not provided in the source material]

### Exercise 06: Is Perfect Tree

Implement a function bool is_perfect() that returns True if the tree is perfect. Develop it in two ways:

1. Recursive approach
2. Formula-based approach

Ensure proper testing for both implementations.

## BT 02: 3 Medium to Hard Exercises

### Exercise 01: Binary Tree Zigzag Level Order Traversal

Return a zigzag trace of the tree as an array of arrays of integers. Even levels are reversed.

Example output:

- [3]
- [20, 9]
- [15, 7]

Optional: Use a single data structure without using reverse operation.

### Exercise 02: Check Completeness of a Binary Tree

Implement a function to check if a given binary tree is complete.

### Exercise 03: Binary Tree Diameter

Calculate the diameter of a binary tree, which is the length of the longest path between any two nodes.

Example: In a tree where the longest path is from node 8 to node 15 (8 -> 13 -> 2 -> 3 -> 5 -> 8 -> 6 -> 7 -> 15), the diameter would be 9.

Tips:

- Use recursion similar to the tree height function
- Consider paths that may or may not pass through the root

## BT 03: 3 Medium Exercises

### Exercise 01: Symmetric Tree

Determine if a binary tree is symmetric (mirrors precisely around its center).

Implement two methods:

1. Use recursion to compare subtrees
2. Parenthesize the tree, then compare left and right branches directly

### Exercise 02: Flip Equivalent Binary Trees

Implement a function `bool flipEquiv(TreeNode* root1, TreeNode* root2)` to determine if two binary trees are flip equivalent.

Trees are flip equivalent if they can be made identical by flipping left and right children of some nodes. All nodes must remain at their same level.

### Exercise 03: Print All Duplicate Subtrees

Given a binary tree, print all duplicate subtrees containing 2 or more nodes.

Example output format: (2(3()())())

## BST 01: 2 Easy Exercises

### Exercise 01: Search in a Binary Search Tree

Implement an iterative version of the search function for a Binary Search Tree.

Function signature: `TreeNode* searchBST(TreeNode* root, int val)`

Return the subtree rooted with the node whose value equals `val`, or `None` if such a node doesn't exist.

### Exercise 02: Convert Sorted Array to BST

Convert a sorted array to a height-balanced Binary Search Tree.

Input: Sorted array of integers
Output: Root of the balanced BST

Example input: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

## BST 02: 3 Medium Exercises

### Exercise 01: Validate Binary Search Tree

Implement two fundamentally different approaches to determine if a given binary tree is a valid BST.

Note: A binary tree with duplicate values is not a BST.

### Exercise 02: Kth Smallest Element in a BST

Find the kth smallest element in a BST efficiently.

Note: Avoid the trivial solution of computing the full inorder traversal.

### Exercise 03: Lowest Common Ancestor of a Binary Search Tree

Implement a function to find the Lowest Common Ancestor (LCA) of two given nodes in a BST.

LCA is defined as the farthest node from the root that is an ancestor for both given nodes.

Example:

- LCA(16, 45) = 35
- LCA(45, 36) = 45
- LCA(15, 70) = 50

## BT 02: 3 Medium to Hard Exercises

### Exercise 01: Binary Tree Zigzag Level Order Traversal

Return a zigzag trace of the tree in an array of arrays of integers. Even levels are reversed.

Example output:

- [3]
- [20, 9]
- [15, 7]

Optional: Use a single data structure without using the reverse operation.

### Exercise 02: Check Completeness of a Binary Tree

Implement a function to check if a binary tree is complete.

### Exercise 03: Binary Tree Diameter

Find the length of the longest path between any two nodes in a binary tree. This path may or may not pass through the root.

Example:

- Longest path: 8 -> 13 -> 2 -> 3 -> 5 -> 8 -> 6 -> 7 -> 15
- Diameter: 9 (number of edges in the longest path)

## BT 03: 3 Medium Exercises

### Exercise 01: Symmetric Tree

Determine if a binary tree is symmetric (mirrors precisely around its center).

Implement two methods:

1. Use recursion to compare subtrees.
2. Parenthesize the tree, then compare left and right branches directly.

Analyze the time complexity of your solutions.

### Exercise 02: Flip Equivalent Binary Trees

Implement the function:

```
bool flipEquiv(TreeNode* root1, TreeNode* root2)

```

Determine if two binary trees are flip equivalent (can be made identical by flipping left and right children of some nodes).

### Exercise 03: Print All Duplicate Subtrees

Given a binary tree, print all duplicate subtrees of 2 or more nodes. Duplicates have the same structure and values.

Output the subtrees in parenthesized format.

Example output:

- (2(3()())())
- (6(7()())(8()(9()())))
- (8()(9()()))

## BST 01: 2 Easy Exercises

### Exercise 01: Search in a Binary Search Tree

Implement an iterative version of the search function for a Binary Search Tree (BST).

Function signature:

```
TreeNode* searchBST(TreeNode* root, int val)

```

Return the subtree rooted with the node that has the given value. If such a node doesn't exist, return null.

### Exercise 02: Convert Sorted Array to BST

Convert a sorted array to a height-balanced BST.

Function signature:

```
TreeNode* sortedArrayToBST(vector<int>& nums)

```

A height-balanced binary tree is one where the depth of the two subtrees of every node never differs by more than one.

Example:
Input: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
Output: A balanced BST with 5 at the root.

## BST 02: 3 Medium Exercises

### Exercise 01: Validate Binary Search Tree

Implement two fundamentally different approaches to determine if a binary tree is a valid BST.

Note: A binary tree with duplicate values is not a BST.

Function signature:

```
bool isValidBST(TreeNode* root)

```

### Exercise 02: Kth Smallest Element in a BST

Find the kth smallest element in a BST efficiently (without using inorder traversal array).

Function signature:

```
int kthSmallest(TreeNode* root, int k)

```

### Exercise 03: Lowest Common Ancestor of a Binary Search Tree

Find the lowest common ancestor (LCA) of two given nodes in a BST.

Function signature:

```
TreeNode* lowestCommonAncestor(TreeNode* root, TreeNode* p, TreeNode* q)

```

Example:
For the tree:

```
     50
   /    \\\\
  35    70
 /  \\\\   / \\\\
25  45 65 80

```

- LCA(25, 45) = 35
- LCA(65, 80) = 70
- LCA(25, 80) = 50

## BST 01: 2 Leetcode Exercises

### Exercise 01: Convert BST to Sorted Circular Doubly-Linked List

Convert a Binary Search Tree to a sorted Circular Doubly-Linked List in-place.

- Left and right pointers become predecessor and successor pointers.
- The predecessor of the first element is the last element, and the successor of the last element is the first element.
- Return the pointer to the smallest element of the linked list.

### Exercise 02: Recover Binary Search Tree

Given the root of a binary search tree (BST) where two nodes were swapped by mistake, recover the tree without changing its structure.

## Heap 01: 5 Easy to Medium Exercises

### Exercise 01: Implement Max-Heap

Modify the min-heap code to act as a MaxHeap.

### Exercise 02: Create MaxHeap Using MinHeap

Implement a MaxHeap of integers using the available MinHeap without copying the code.

### Exercise 03: Find Smaller Values in Heap

Implement `void print_less_than(int val, int parent_pos = 0)` to print all values less than `val` in the heap efficiently.

Example:

```
Heap: 2, 17, 22, 10, 8, 37, 14, 19, 7, 6, 5, 12, 25, 30
print_less_than(10) → 2, 5, 8, 6, 7

```

### Exercise 04: Verify Heap Property

Implement `bool is_heap_array(int *p, int n)` to check if an array represents a valid heap.

### Exercise 05: Implement Heap Sort

Add `void heap_sort(int *p, int n)` to perform in-place sorting of an array from small to large.

## Heap 02: 4 Medium to Hard Exercises

### Exercise 01: Kth Smallest Number in Stream

Implement a class that receives an infinite stream of numbers and returns the kth smallest number at any time.

Example:

```
Input: 9, 8, 7, 6, 5, 4, 10, 8, 3, 5, 15
k = 5
Output: 9, 9, 9, 9, 8, 7, 7, 7, 6, 5, 5

```

### Exercise 02: Priority Queue Implementation

Implement a priority queue based on max-heap code. Each element has a task_id and a priority. Elements with higher priority are served first.

Example:

```
Enqueue: (1131, 1), (3111, 3), (2211, 2), (3161, 3)
Output: 3111, 3161, 2211, 1131

```

### Exercise 03: Binary Tree Special Traversal

Implement `void level_order_traversal_sorted()` for a binary tree that performs level order traversal with values printed from large to small at each level.

Example:

```
Tree:    25
        /  \\\\
       3    7
      / \\\\    \\\\
     5   6   30

Output:
25
7 3
30 6 5

```

### Exercise 04: Find Min and Max Data Structure (Optional)

Design a data structure that provides `find_min` and `find_max` in O(1) time, with operations: `insert(value)`, `delete_min`, `delete_max`.

## AVL Trees: 3 Medium to Hard Exercises

### Exercise 01: Lower Bound

Implement `pair<bool, int> lower_bound(int target)` for a BST with the following inorder traversal:
2, 5, 10, 13, 15, 20, 40, 50, 70

- Find the first element X where X >= target
- Return {true, X} if found, {false, NA} otherwise

Examples:

- 50 → {true, 50}
- 51 → {true, 70}
- 71 → {false, NA}
- 7 → {true, 10}

### Exercise 02: Upper Bound

Implement `pair<bool, int> upper_bound(int target)` for the same BST.

- Find the first element X where X > target
- Return {true, X} if found, {false, NA} otherwise

Examples:

- 50 → {true, 70}
- 51 → {true, 70}
- 70 → {false, NA}
- 11 → {true, 13}

### Exercise 03: Count Inversions

Given an array of distinct numbers, count the total inversions.

- For each element, count how many elements before it have a bigger value
- Implement an O(nlogn) solution using an AVL tree

Example:
Array: 10, 5, 8, 2, 12, 6
Total inversions: 8

## Trie: 5 Easy to Medium Exercises

### Exercise 01: Iterative Insertion and Search

Implement iterative versions of:

- `void insert(string str)`
- `bool word_exist(string str)`

Assume the trie is based on 26 lowercase letters.

### Exercise 02: Minimal Prefix

Implement `string first_word_prefix(const string &str)`:

- Find the smallest trie word that is a prefix of the given string
- Return the original input if no prefix exists

Example:
Trie words: {xyz, xyzeA, a, bc}

- Input: "x" → Output: "x"
- Input: "xyzabc" → Output: "xyz"

### Exercise 03: Suffix Existence

Implement a trie with two methods:

- `void insert(string str)`
- `bool suffix_exist(string str)`

`suffix_exist` should return true if any inserted word has the given suffix.

### Exercise 04: Memory-Efficient Trie

Modify the trie to use `map<>` instead of an array of pointers:

- Support 256 characters instead of just 26
- Improve memory usage by only storing existing nodes

### Exercise 05: OS Paths

Design a trie for system paths:

- `void insert(const vector<string> &path)`
- `bool subpath_exist(const vector<string> &path)`

Represent paths as vectors of strings, e.g., "/home/software/eclipse/bin" → {"home", "software", "eclipse", "bin"}

## Trie: 3 Medium Exercises

### Exercise 01: Listing Tree Content

Implement `void get_all_strings(vector<string> &res)`:

- Return all current strings in the trie, sorted
- Use recursive search to find leaf nodes

### Exercise 02: Autocomplete

Implement `void auto_complete(const string &str, vector<string> &res)`:

- Given a string, return all full words in the trie that have this prefix

### Exercise 03: Word with Single Letter Change

Implement `bool word_exist_with_1_change(string str)`:

- Return true if changing exactly one character in `str` matches any word in the trie
- Return false otherwise

Example:
Trie words: "hello", "leetcode"

- Input: "hello" → Output: false (0 changes)
- Input: "xello" → Output: true (1 change: x to h)
- Input: "xyllo" → Output: false (2 changes needed)

## Trie: 2 Hard Exercises

### Exercise 01: Find All Substrings

Implement `void list_substrs(const string& str, vector<string> &queries)`:

- Print all query words that are substrings of `str`
- Develop two trie-based solutions:
    1. Trie based on `str`
    2. Trie based on queries
- Compare time complexities

Example:
String: "heyabcdtwxyw"
Queries: "xy", "ab", "t", "yz"
Output: "xy", "ab", "t"

### Exercise 02: Prefix and Suffix Search

Implement `int f(string prefix, string suffix)`:

- Given a dictionary, find the word index that starts with `prefix` and ends with `suffix`
- Return the last index if multiple matches exist
- Return -1 for no match

Example:
Dictionary: ["aae", "apple", "banana"]

- Query: ["a", "e"] → Return: 1 (matches both "aae" and "apple")
- Query: ["a", "x"] → Return: -1
- Query: ["a", "ae"] → Return: 0

## Hashing: First Set of 5 Medium Exercises

### Exercise 01: Extended Character Set Hashing

Modify `int hash_string(string str, int n)` to handle:

- Lowercase letters
- Uppercase letters
- Digits (0-9)

### Exercise 02: Folding Technique for Hashing

Implement a folding technique for string hashing:

- Group every 4 consecutive characters
- Compute hash value for each group
- Sum all group hashes
- Return final hash within range

Example: "aabcdefgAxT334gfg"
Groups: aabc, defg, AxT3, 34gf, g

### Exercise 03: Multi-Attribute Key Hashing

Create a hash function for a class with 3 attributes:

- Return a hash value based on all 3 attributes combined
- Utilize the previous two hashing functions

### Exercise 04: Rehashing

Modify the `PhoneHashTable` constructor:

- `PhoneHashTable(int table_size = 10, double limit_load_factor = 0.75)`
- Implement `void rehashing()`:
    - Create a new table of double size
    - Re-insert elements into the new table
    - Update hash codes and remove old data

### Exercise 05: Array of Linked Lists

Implement a subset of chaining using an array of linked lists:

- Use a custom singly-linked list
- Implement:
    - `void put(PhoneEntry phone)` (update if exists, add if not)
    - `void print_all()`
- Use `vector<LinkedHashEntry*> table { }` if needed

## Hashing: Second Set of 5 Medium Exercises

### Exercise 06: Polynomial Rolling Hash Function

Implement a polynomial rolling hash function for strings:

- Use a prime base (e.g., 31) and a large prime modulus (e.g., 1e9+7)
- Formula: hash(s) = (s[0] * p^0 + s[1] * p^1 + ... + s[n-1] * p^(n-1)) % m
- Implement both iterative and recursive versions

### Exercise 07: Double Hashing

Implement double hashing for collision resolution:

- Use two hash functions: h1(key) and h2(key)
- For the i-th probe, use the formula: (h1(key) + i * h2(key)) % table_size
- Ensure h2(key) is relatively prime to the table size

### Exercise 08: Cuckoo Hashing

Implement cuckoo hashing with two hash functions:

- Use two tables, each with its own hash function
- On insertion, if both positions are occupied, evict one element and reinsert it
- Implement a method to detect and handle cycles (rehash if necessary)

### Exercise 09: Bloom Filter

Implement a basic Bloom filter:

- Use k different hash functions
- Provide methods for insertion and membership queries
- Analyze false positive probability based on filter size and number of hash functions

### Exercise 10: Count-Min Sketch

Implement a Count-Min Sketch for approximate frequency counting:

- Use multiple hash functions and a 2D array for counters
- Provide methods for increment and query
- Analyze the trade-off between space usage and estimation accuracy

These exercises cover various aspects of hashing, from basic implementation to advanced techniques used in real-world applications.

## Hashing 02: 5 Medium to Hard Exercises

### Exercise 01: Number of Distinct Substrings

Implement a function to count unique substrings in a given string:

```cpp
int count_unique_substrings(const string &str)

```

Examples:

- "aaaaa" → 5
- "aaaba" → 11
- "abcdef" → 21

Use a hash-based solution. Consider if another data structure could provide a more efficient solution.

### Exercise 02: Common Substrings

Implement a function to count common substrings between two strings:

```cpp
int count_substrings_match(const string &str1, const string &str2)

```

Examples:

- "aaab", "aa" → 2 (common: "a", "aa")
- "aaab", "ab" → 3 (common: "a", "b", "ab")
- "aaaaa", "xy" → 0
- "aaaaa", "aaaaa" → 5

### Exercise 03: Unique Anagrams

Count unique anagrams among substrings of a given string:

```cpp
int count_anagram_substrings(const string &str)

```

Examples:

- "aaaaa" → 5
- "abcba" → 9
- "aabade" → 17

Aim for O(L³ log L) or O(L³) complexity.

### Exercise 04: Cycle in Linked List

Implement a function to remove a cycle in a singly linked list:

```cpp
void remove_cycle(LinkedList &list)

```

Use a hash-based solution. The last node in a cyclic list points to a middle node instead of null.

### Exercise 05: Quadratic Probing

Modify the hash table implementation to use quadratic probing:

```cpp
void put(PhoneEntry phone)

```

Ensure the function always adds the element. Implement a rehashing function:

```cpp
void rehashing()

```

Rehash without considering load factor. When called, perform rehashing.


---

# PART 2: ALGORITHMS (CORE)

## Sorting 01: 6 Medium-Hard Exercises

### Exercise 1: Insertion Sort v2

1. Modify the lecture code to sort data in descending order.
2. Use the swap function to reduce code length to 3 lines.
3. Compare the number of operations with the lecture version.

### Exercise 2: Count Sort for Negative Values

1. Implement count sort for:
    - Array length: 1 <= length <= 50000
    - Value range: -50000 <= nums[i] <= 50000
2. Example:
    - Input: [-5, 2, -3, 1, 1234, -2453]
    - Output: [-2453, -5, -3, 1, 2, 1234]
3. Leetcode: 912 - Sort an Array

### Exercise 3: Count Sort for a Range

1. Implement count sort for:
    - Value range: -10^9 <= nums[i] <= 10^9
    - Constraint: max value - min value <= 500
2. Example:
    - Input: [10000107, 10000035, 10000001]
    - Output: [10000001, 10000035, 10000107]
3. Leetcode: 912 - Sort an Array (can be helpful)

### Exercise 4: Count Sort for Strings v1

1. Implement `void countSort(vector<string> &array)` with:
    - Strings of lowercase letters (a-z), length >= 1
    - Sort based on the first character only
    - Maintain stability
2. Example:
    - Input: ziad, belal, adam, baheir, ali
    - Output: adam, ali, belal, baheir, ziad

### Exercise 5: Count Sort for Strings v2

1. Implement `void countSort(vector<string> &array)` with:
    - Strings of lowercase letters (a-z), length >= 2
    - Sort based on the first two characters
    - Maintain stability
2. Example:
    - Input: axz, axa, zzz, abc, abe
    - Output: abc, abe, axz, axa, zzz

### Exercise 6: Count Sort Version 2

1. Study and understand the provided alternative count sort implementation.
2. Compare it with the lecture implementation, noting pros and cons.

## Sorting 02: 6 Easy-Medium Exercises

### Exercise 1: LeetCode 1200 - Minimum Absolute Difference

Implement `vector<vector<int>> minimumAbsDifference(vector<int>& nums)` with O(nlogn) time complexity.

### Exercise 2: LeetCode 976 - Largest Perimeter Triangle

Implement `int largestPerimeter(vector<int> &nums)` to find the largest perimeter of a valid triangle from the given lengths. Use O(nlogn) time complexity.

### Exercise 3: LeetCode 561 - Array Partition I

Implement `int arrayPairSum(vector<int> &nums)` to maximize the sum of min(ai, bi) for n pairs. Use O(nlogn) time complexity.

### Exercise 4: LeetCode 280 - Wiggle Sort

Implement `void wiggleSort(vector<int> &nums)` to reorder the array such that nums[0] <= nums[1] >= nums[2] <= nums[3].... Use O(nlogn) time complexity.

### Exercise 5: LeetCode 1921 - Eliminate Maximum Number of Monsters

Implement `int eliminateMaximum(vector<int>& dist, vector<int>& speed)` to determine the maximum number of monsters that can be eliminated.

### Exercise 6: LeetCode 1005 - Maximize Sum Of Array After K Negations

Implement `int largestSumAfterKNegations(vector<int>& nums, int k)` to find the largest possible sum after applying K negations to the array elements.

## Sorting 03: 3 Hard Exercises

### Exercise 1: LeetCode 581 - Shortest Unsorted Continuous Subarray

1. Implement `int findUnsortedSubarray(vector<int> &nums)` to find the length of the shortest subarray that, when sorted, sorts the entire array.
2. Develop an O(nlogn) solution first.
3. Then, develop an O(n) time and O(1) space solution.

### Exercise 2: LeetCode 826 - Most Profit Assigning Work

Implement `int maxProfitAssignment(vector<int> &diff, vector<int> &pro, vector<int> &worker)` to maximize profit assignment. Improve upon the O(NM) brute force approach.

### Exercise 3: LeetCode 1887 - Reduction Operations to Make the Array Elements Equal

Implement `int reductionOperations(vector<int> &nums)` to find the number of operations needed to make all elements equal. Develop an O(nlogn) approach.

## Additional Notes

- For all homework problems, compute time and memory complexity when applicable.
- Use online judges when provided to test your solutions.
- Some problems might not have an online judge; test locally in these cases.
- The goal is to think efficiently, so don't stop at the first easy solution.
- Use the built-in sort function when convenient, assuming O(nlogn) time and O(1) space complexity.
- Include necessary headers like `<algorithm>` for sort and `<climits>` for constants like INT_MAX.

## Binary Search 01: 4 Medium Exercises

### Exercise 01: Leetcode 34 - Find First and Last Position of Element in Sorted Array

Implement a function that finds the starting and ending position of a given target value in a sorted array of integers. If the target is not found, return [-1, -1].

```cpp
vector<int> searchRange(vector<int> &v, int target)

```

1. Implement using your own binary search
2. Implement using C++ STL

### Exercise 02: Leetcode 436 - Find Right Interval

Given a set of intervals, for each interval i, find the index of the rightmost interval j such that startj >= endi. If no such interval exists, return -1 for interval i.

```cpp
vector<int> findRightInterval(vector<vector<int>>& intervals)

```

1. Develop a solution using your own binary search
2. Develop a solution using STL binary search
3. (Optional) Develop a solution using STL map lower_bound

### Exercise 03: Leetcode 611 - Valid Triangle Number

Given an integer array, return the number of triplets that can form triangles if we take them as side lengths.

```cpp
int triangleNumber(vector<int> &nums)

```

1. Develop a solution using your own binary search
2. Develop a solution using STL binary search
3. (Optional) Optimize your code by removing the binary search

### Exercise 04: Leetcode 441 - Arranging Coins

You have n coins to build a staircase where the i-th row has i coins. Return the number of complete rows you can build.

```cpp
int arrangeCoins(int n)

```

Implement using binary search.

## Binary Search 02: 3 Medium Exercises

### Exercise 01: Leetcode 1283 - Find the Smallest Divisor Given a Threshold

Find the smallest positive integer divisor such that when we divide all numbers in the array by it and sum up the division results (using ceiling division), the sum is less than or equal to the threshold.

```cpp
int smallestDivisor(vector<int> &nums, int threshold)

```

### Exercise 02: Leetcode 1482 - Minimum Number of Days to Make m Bouquets

Given an array `bloomDay` where `bloomDay[i]` is the number of days the i-th flower needs to bloom, and two integers `m` (number of bouquets) and `k` (flowers per bouquet), return the minimum number of days needed to make `m` bouquets from the garden. Each bouquet needs `k` adjacent flowers from the garden.

```cpp
int minDays(vector<int> &bloomDay, int m, int k)

```

### Exercise 03: Leetcode 475 - Heaters

Given positions of houses and heaters on a line, find the minimum radius of heaters so that all houses could be covered by those heaters.

```cpp
int findRadius(vector<int> &houses, vector<int> &heaters)

```

## Binary Search 03: 2 Hard Exercises

### Exercise 01: Leetcode 1060 - Missing Element in Sorted Array

Given a sorted array `nums` of unique numbers and an integer `k`, find the `k-th` missing number starting from the leftmost number of the array.

```cpp
int missingElement(vector<int> &nums, int k)

```

Develop an O(log n) time approach.

### Exercise 02: Leetcode 668 - Kth Smallest Number in Multiplication Table

Find the `k-th` smallest number in an `m x n` multiplication table.

```cpp
int findKthNumber(int m, int n, int k)

```

## Binary Search 04: 2 Medium and 2 Hard Exercises

### Exercise 01: Leetcode 69 - Sqrt(x)

Compute and return the square root of x, truncated to the integer part.

```cpp
int mySqrt(int x)

```

Use binary search for implementation.

### Exercise 02: Spoj PIE

Given N pies with different radii and M people, find the largest possible piece size that can be given to each person, ensuring all pieces are equal in size.

```cpp
double largest_area(vector<double> &pie_radius, int N)

```

### Exercise 03: Spoj GLASNICI

Calculate the minimum time needed to propagate a message from the first person to the last person in a line, given their positions and the maximum shouting distance.

```cpp
double min_time(vector<double> &positions, double msg_dist)

```

Implement using binary search.

### Exercise 04: Spoj GLASNICI (Implementation Details)

This is an extension of Exercise 03, focusing on implementation details:

- People can move at a speed of one unit per second.
- A person can shout the message, and anyone within `msg_dist` units can hear it.
- Return the minimum time to propagate the message from the first to the last person.
- Use binary search in your implementation.
- Consider edge cases like when the message can reach the last person immediately or when significant movement is required.

## Graph Representation 01: 3 Easy-Medium Exercises

### Exo 1: Edge List Representation

Implement a class `edge` for an edge list representation of a graph:

1. Make edges comparable based on weight
2. Implement `void add_edge(GRAPH &graph, int from, int to, int cost)`
3. Implement `void print_adjacency_matrix(GRAPH &graph)`
4. Read edges into the data structure and print them ordered by cost
5. State space and time complexity for operations

### Exo 2: Adjacency Hashset Representation

Implement an adjacency hashset representation for an unweighted graph:

1. Use `typedef vector<unordered_set<int>> GRAPH`
2. State time and space complexity
3. Discuss advantages and disadvantages of this representation

### Exo 3: Adjacency Matrix with Multiple Edges

Modify the adjacency matrix representation to support multiple edges:

1. Implement a way to store multiple edges between nodes
2. Print the graph with edges of each node printed first
3. Handle directed edges with integer weights

Example output format:

```
0: 1(5) 1(2) 2(3)
1: 2(1)
2: 0(2) 1(4)

```

## Graph Representation 02: 5 Medium Exercises

### Exo 1: Adjacency-based Representation for Flights v1

Implement a graph representation for flights:

1. Flights are (from, to, cost) where from/to are strings and cost is an integer
2. Represent as a directed graph with multiple edges
3. Print function requirements:
    - Sort "from" airports alphabetically
    - For each "from" airport, sort "to" cities alphabetically, then by cost

Example output:

```
Florida: California(200) California(250) Texas(150)
NewYork: California(180) Pennsylvania(90)
Pennsylvania: Florida(140) Texas(180) Texas(170)

```

### Exo 2: Adjacency-based Representation for Flights v2

Modify the previous solution to use standard graph algorithms:

1. Convert string-based representation to integer-based
2. Use `Edge: int from, to, weight;` and `typedef vector<edge> GRAPH;`
3. Implement `void add_edge(GRAPH &graph, int from, int to, int cost)`

### Exo 3: Image as a Graph

Represent an image as a graph:

1. Read dimensions R and C (R, C >= 1)
2. Create nodes for each cell (R * C nodes total)
3. Connect each cell to its 4 neighboring cells
4. Implement using appropriate graph representation
5. Print the resulting graph

### Exo 4: Print Chains

Implement a function to print chains in a directed graph:

1. Read graph as N nodes and M edges
2. Implement `void print_chain(GRAPH &graph, int from)`
3. For Q queries, print the path from the given node to the last possible node

Example:

```
Graph: 0 -> 5 -> 3 -> 4 -> 1 -> 2
Query(0): 0 5 3 4 1 2
Query(3): 3 4 1 2
Query(2): 2

```

### Exo 5: Print Paths of Length 2

Implement a function to print all paths of length 2 in a directed graph:

1. Read graph as usual
2. Implement `void print_paths_len_2(GRAPH &graph)` iteratively
3. Print all paths consisting of exactly 2 edges

Example output:

```
0 5 4
1 3 2
2 4 1

```

## Graph Representation 03: 2 Hard Exercises

### Exo 1: Find a Universal Sink

Implement an algorithm to find a universal sink in a directed graph:

1. Prove there's at most one universal sink
2. Implement `int find_universal_sink_fast(GRAPH &graph)` in O(N) time
3. Use adjacency matrix representation
4. Return 0-based index of sink or -1 if none exists
5. Read multiple test cases: T graphs, each with nodes and edges

### Exo 2: Adjacency Matrix Power

Analyze the meaning of adjacency matrix powers:

1. Consider M as the binary adjacency matrix of a directed unweighted graph
2. Analyze C = M^2 (M squared) in terms of the original graph
3. Optional: Investigate the meaning of M^k for any k
4. No code required; use online matrix calculators if needed

Tip: Start with simple examples like a chain of N-1 edges

## Leetcode Problem Set

### Exo 1: Two Sum

Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

Example:

```
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: Because nums[0] + nums[1] == 9, we return [0, 1].

```

### Exo 2: Reverse Integer

Given a signed 32-bit integer `x`, return `x` with its digits reversed. If reversing `x` causes the value to go outside the signed 32-bit integer range [-2^31, 2^31 - 1], then return 0.

Example:

```
Input: x = 123
Output: 321

Input: x = -123
Output: -321

```

### Exo 3: Palindrome Number

Given an integer `x`, return `true` if `x` is palindrome integer.

An integer is a palindrome when it reads the same backward as forward.

Example:

```
Input: x = 121
Output: true
Explanation: 121 reads as 121 from left to right and from right to left.

Input: x = -121
Output: false
Explanation: From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome.

```

### Exo 4: Roman to Integer

Roman numerals are represented by seven different symbols: I, V, X, L, C, D and M.

Given a roman numeral, convert it to an integer.

Example:

```
Input: s = "MCMXCIV"
Output: 1994
Explanation: M = 1000, CM = 900, XC = 90 and IV = 4.

```

### Exo 5: Longest Common Prefix

Write a function to find the longest common prefix string amongst an array of strings.

If there is no common prefix, return an empty string "".

Example:

```
Input: strs = ["flower","flow","flight"]
Output: "fl"

Input: strs = ["dog","racecar","car"]
Output: ""
Explanation: There is no common prefix among the input strings.

```


---

# PART 3: ALGORITHMS (GRAPH ALGORITHMS & DYNAMIC PROGRAMMING)


## DFS - 3E
### From: 04-01-DFS-3E.pdf

- Exercise 1: LeetCode 582 - Kill Process
- Exercise 2: LeetCode 690 - Employee Importance
- Exercise 3: LeetCode 323 - Number of Connected Components in an Undirected Graph

## DFS - 4M 2
### From: 04-02-DFS-4M 2.pdf

- Exercise 1: LeetCode 1905 - Count Sub Islands
- Exercise 2: LeetCode 1034 - Coloring A Border
- Exercise 3: LeetCode 1254 - Number of Closed Islands
- Exercise 4: LeetCode 1559 - Detect Cycles in 2D Grid

## DFS - 3MH
### From: 04-03-DFS-3MH.pdf

- Exercise 1: LeetCode 1743 - Restore the Array From Adjacent Pairs
- Exercise 2: LeetCode 1202 - Smallest String With Swaps
- Exercise 3: LeetCode 128 - Longest Consecutive Sequence

## DFS - 4H
### From: 04-04-DFS-4H.pdf

- Exercise 1: LeetCode 785 - Is Graph Bipartite?
- Exercise 2: LeetCode 1466 - Reorder Routes to Make All Paths Lead to the City Zero

## DFS - Leetcode
### From: 04-05-DFS-Leetcode.pdf

- [No exercises extracted - manual review needed]

## DFS - Leetcode
### From: 04-06-DFS-Leetcode.pdf

- [No exercises extracted - manual review needed]

## BFS - Leetcode
### From: 05-01-BFS-Leetcode.pdf

- [No exercises extracted - manual review needed]

## BFS - 3E
### From: 05-02-BFS-3E.pdf

- Exercise 1: LeetCode 261 - Graph Valid Tree
- Exercise 2: LeetCode 1730 - Shortest Path to Get Food

## BFS - Leetcode 2
### From: 05-03-BFS-Leetcode 2.pdf

- [No exercises extracted - manual review needed]

## BFS - Leetcode
### From: 05-04-BFS-Leetcode.pdf

- [No exercises extracted - manual review needed]

## BFS - 3M
### From: 05-05-BFS-3M.pdf

- Exercise 1: LeetCode 1306 - Jump Game III
- Exercise 2: LeetCode 2059 - Minimum Operations to Convert Number
- Exercise 3: LeetCode 2059 - Minimum Operations to Convert Number
- Exercise 4: LeetCode 752 - Open the Lock

## BFS - Leetcode
### From: 05-06-BFS-Leetcode.pdf

- [No exercises extracted - manual review needed]

## BFS - Leetcode 2
### From: 05-07-BFS-Leetcode 2.pdf

- [No exercises extracted - manual review needed]

## BFS - 3M
### From: 05-08-BFS-3M.pdf

- Exercise 1: LeetCode 286 - Walls and Gates
- Exercise 2: LeetCode 417 - Pacific Atlantic Water Flow
- Exercise 3: LeetCode 1215 - Stepping Numbers

## BFS - 4MH
### From: 05-09-BFS-4MH.pdf

- Exercise 1: LeetCode 1129 - Shortest Path with Alternating Colors
- Exercise 2: LeetCode 365 - Water and Jug Problem
- Exercise 3: LeetCode 773 - Sliding Puzzle
- Exercise 4: LeetCode 1298 - Maximum Candies You Can Get from Boxes

## BFS - 2H
### From: 05-10-BFS-2H.pdf

- Exercise 1: LeetCode 934 - Shortest Bridge
- Exercise 2: LeetCode 1245 - Tree Diameter

## Topological - Leetcode
### From: 06-01-Topological-Leetcode.pdf

- [No exercises extracted - manual review needed]

## Topological - 2EM
### From: 06-02-Topological-2EM.pdf

- Exercise 1: LeetCode 1136 - Parallel Courses

## Topological - Leetcode 2
### From: 06-03-Topological-Leetcode 2.pdf

- [No exercises extracted - manual review needed]

## Topological - 2MH
### From: 06-04-Topological-2MH.pdf

- Exercise 1: LeetCode 444 - Sequence Reconstruction
- Exercise 2: LeetCode 310 - Minimum Height Trees
- Exercise 3: LeetCode 329 - Longest Increasing Path in a Matrix

## Topological - 3H
### From: 06-05-Topological-3H-LastinAlgo1.pdf

- Exercise 1: LeetCode 2050 - Parallel Courses III
- Exercise 2: LeetCode 1857 - Largest Color Value in a Directed Graph
- Exercise 3: LeetCode 1591 - Strange Printer II

## DP - pick
### From: 07-01-DP-pick-or-leave-3M.pdf

- Exercise 1: LeetCode 416 - Partition Equal Subset Sum
- Exercise 2: LeetCode 1691 - Maximum Height by Stacking Cuboids

## DP - pick
### From: 07-02-DP-pick-or-leave-3MH.pdf

- Exercise 1: LeetCode 198 - House Robber
- Exercise 2: LeetCode 309 - Best Time to Buy and Sell Stock with Cooldown
- Exercise 3: LeetCode 1671 - Minimum Number of Removals to Make Mountain Array

## DP - Enumerating
### From: 07-03-DP-Enumerating-the-choices-2EM.pdf

- Exercise 1: LeetCode 746 - Min Cost Climbing Stairs
- Exercise 2: LeetCode 279 - Perfect Squares

## DP - Range
### From: 07-04-DP-Range-Patterns-3M 2.pdf

- Exercise 1: LeetCode 1105 - Filling Bookcase Shelves
- Exercise 2: LeetCode 1043 - Partition Array for Maximum Sum
- Exercise 3: LeetCode 1312 - Minimum Insertion Steps to Make a String Palindrome

## DP - Range
### From: 07-05-DP-Range-Patterns-2H.pdf

- Exercise 1: LeetCode 1547 - Minimum Cost to Cut a Stick
- Exercise 2: LeetCode 312 - Burst Balloons

## DP - Counting
### From: 07-06-DP-Counting-4M 2.pdf

- Exercise 1: LeetCode 518 - Coin Change 2
- Exercise 2: LeetCode 377 - Combination Sum IV
- Exercise 3: LeetCode 1155 - Number of Dice Rolls With Target Sum
- Exercise 4: LeetCode 823 - Binary Trees With Factors

## DP - Grid
### From: 07-06-DP-Grid-4MH.pdf

- Exercise 1: LeetCode 931 - Minimum Falling Path Sum
- Exercise 2: LeetCode 576 - Out of Boundary Paths
- Exercise 3: LeetCode 221 - Maximal Square
- Exercise 4: LeetCode 174 - Dungeon Game

## DP - Building
### From: 07-07-DP-Building-Output-3M.pdf

- [No exercises extracted - manual review needed]

## DP - Marathom
### From: 07-08-DP-Marathom-Leetcode.pdf

- [No exercises extracted - manual review needed]

## DP - Tabulation
### From: 07-09-DP-Tabulation-4EM.pdf

- Exercise 1: LeetCode 72 - Edit Distance
- Exercise 2: LeetCode 1105 - Filling Bookcase Shelves
- Exercise 3: LeetCode 1155 - Number of Dice Rolls With Target Sum
- Exercise 4: LeetCode 576 - Out of Boundary Paths

## DP - Tabulation
### From: 07-10-DP-Tabulation-3VH.pdf

- Exercise 1: LeetCode 801 - Minimum Swaps To Make Sequences Increasing
- Exercise 2: LeetCode 264 - Ugly Number II
- Exercise 3: LeetCode 376 - Wiggle Subsequence

## Backtracking - Leetcode
### From: 08-01-Backtracking-Leetcode.pdf

- [No exercises extracted - manual review needed]

## Backtracking - Leetcode
### From: 08-02-Backtracking-Leetcode.pdf

- [No exercises extracted - manual review needed]

## Backtracking - Leetcode
### From: 08-03-Backtracking-Leetcode.pdf

- [No exercises extracted - manual review needed]