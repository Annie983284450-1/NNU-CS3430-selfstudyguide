# Step 7. `answers-pgtbl.txt` and `time.txt`

## Do this

Two text files in the top folder. The grader reads both.

**`answers-pgtbl.txt`** already has the three questions with empty `A:` lines.
Answer each in a few full sentences, in your own words, using what you saw in
Steps 0, 1, 2 and 6. The grader only checks that the file has text in it. The three questions are:

1. For each PTE that `print_pgtbl` prints, what does it contain and what do
   its permission bits mean? ([Step 0](step-0.md) is the material.)
2. Besides `getpid()`, which other system calls could be made faster with a
   shared read-only page like `USYSCALL`, and why? ([Step 1](step-1.md) and [Step 6](step-6.md).)
3. For the leaf entries that `vmprint` prints, which page does each map, and
   with what permissions? ([Step 2](step-2.md), read together with [Step 0](step-0.md)'s table.)

**`time.txt`** does not exist yet. Create it with one line holding a whole
number: the hours you spent on this lab. The grader rejects anything else
(`time.txt does not contain a single integer`), and prints `Cannot read time.txt` if
the file is missing.

**On Ubuntu (or Mac), in the lab folder:**

```
$ echo 8 > time.txt
$ cat time.txt
```

(Put your own number, not 8.)
