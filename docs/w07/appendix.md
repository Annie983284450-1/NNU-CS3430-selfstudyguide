# Appendix A. The C, the arithmetic and the shell words this class uses {#appendix-a}

## C notation, in the order it appears

| notation | what it means | where |
|---|---|---|
| `// text` and `/* text */` | a comment: a note for the reader that the computer ignores | [Section 1.4](class-1.md#sec-1-4) |
| `int x = 0;` | make a whole-number variable called `x` and store 0 in it; `=` stores, it does not compare | [Section 1.4](class-1.md#sec-1-4) |
| `counter = counter + current->tickets;` | compute the right side and store it in `counter` | [Section 1.4](class-1.md#sec-1-4) |
| `node_t *current` | `current` is a pointer: it holds the place in memory where one `node_t` record is (Java: a reference) | [Section 1.4](class-1.md#sec-1-4) |
| `current->tickets` | the `tickets` field of the record `current` points at (Java: `current.tickets`) | [Section 1.4](class-1.md#sec-1-4) |
| `while (cond) { ... }` | repeat the lines in braces as long as `cond` is true; a pointer counts as true unless it is NULL | [Section 1.4](class-1.md#sec-1-4) |
| `if (a > b) break;` | if `a` is greater than `b`, leave the loop now | [Section 1.4](class-1.md#sec-1-4) |
| `for (int i = 0; i < 100000; i++)` | count `i` from 0 up to 99,999, running the next line once per count; `i++` adds 1 to `i` | [Section 2.4](class-1.md#sec-2-4) |
| `x += i` | add `i` to `x` (the same as `x = x + i`) | [Section 2.4](class-1.md#sec-2-4) |
| `#define N 400` | before compiling, replace every `N` in the file by `400` | [Section 3.2](class-1.md#sec-3-2) |
| `long`, `double`, `char *` | a whole number with room for very large values; a decimal number; a string (a piece of text, kept as a row of characters) | Sections [2.4](class-1.md#sec-2-4), [3.2](class-1.md#sec-3-2) |
| `argc`, `argv` | how many words were typed on the command line, and the words themselves (`argv[1]` is the first word after the program's name) | Sections [2.4](class-1.md#sec-2-4), [3.2](class-1.md#sec-3-2) |
| `a % b` | the remainder when `a` is divided by `b` (`7 % 3` is 1) | [Section 3.2](class-1.md#sec-3-2) listing |
| `f(a, b)` and `return v;` | call the function `f` with `a` and `b`; a function hands back its result with `return` | [Section 2.4](class-1.md#sec-2-4) |
| `&x` | the address of `x`: where `x` lives in memory, so a function can fill it in. (Between two numbers, as in `s & 0xffff`, the same symbol means something else: a bit operation, below.) | Sections [2.4](class-1.md#sec-2-4), [3.4](class-1.md#sec-3-4) |
| `printf("%s: %.2f\n", ...)` | print text; each `%` code is replaced by the next value: `%s` a string, `%d` or `%ld` a whole number, `%.2f` a decimal number with 2 digits after the point; `\n` ends the line | [Section 2.4](class-1.md#sec-2-4) |
| `a[p].next` | the `next` field of record number `p` in the array `a` (an array is a row of records numbered from 0) | [Section 3.2](class-1.md#sec-3-2) |
| `s & 0xffff` and `core ^= 1` | bit operations on the binary digits (bits) of a number: `&` keeps only the bits that are 1 in both numbers, `^=` flips the bits that are 1 in the right side; [Section 3.2](class-1.md#sec-3-2) says what each does there | [Section 3.2](class-1.md#sec-3-2) |
| `c ? a : b` | if `c` is true the value is `a`, otherwise `b` | [Section 3.2](class-1.md#sec-3-2) listing |
| `atoi(s)`, `atof(s)` | turn typed text such as "2" or "4000" into a whole number or a decimal number | [Section 3.4](class-1.md#sec-3-4) listing, [Extra 1](class-1.md#extra-1) |
| `p < &proc[NPROC]; p++` | `p` walks over the array `proc`, one entry at a time, and stops after entry `NPROC − 1` | [Section 3.4](class-1.md#sec-3-4) |

## Numbers in base 2

Computers store numbers in **binary**, base 2: only the digits 0 and 1, with each place worth 2 times the place to its right. Binary 1011 is 8 + 0 + 2 + 1 = 11. That is why powers of 2, such as 2^10 = 1024, are round numbers for a computer.

## Numbers in base 16

Programmers often write numbers in base 16, called **hexadecimal**, with the prefix `0x`. The digits are 0 to 9 and then a to f for 10 to 15. Each place is worth 16 times the place to its right. So `0xffff` = 15 × 4096 + 15 × 256 + 15 × 16 + 15 = 61,440 + 3,840 + 240 + 15 = 65,535. Check this: 65,535 + 1 = 65,536 = 16 × 16 × 16 × 16. That is why `s & 0xffff` is 0 exactly once every 65,536 values of `s`.

## Powers of two

2^10 means 2 multiplied by itself 10 times: 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 × 2 = 1024. Each extra power doubles: 2^11 = 2048, 2^14 = 16,384, 2^20 = 1,048,576. A balanced tree with L levels holds about 2^L entries, which is why 1000 jobs need about 10 levels and a million about 20.

## Shell words

| word | what it does |
|---|---|
| `$` | the prompt: what follows is a command typed into the shell |
| `./prog` | run the program `prog` from the current folder |
| `cmd1; cmd2` | run `cmd1`, then `cmd2` |
| `X=$!` and `$X` | save the process id of the command just started in the background under the name `X`; read it back |
| `for p in a b c; do ...; done` | run the commands between `do` and `done` once for each of a, b, c, with `$p` standing for the current one |
| `echo text` | print `text` |
| `$(cmd)` | replaced by whatever `cmd` prints |
| `python3 prog.py` | run a program written in Python |
| `cmd &` | start `cmd` in the background and go on to the next command at once |
| `wait` | wait until all background commands have finished |
| `nice -n 5 cmd` | start `cmd` at nice 5 |
| `taskset -c 0 cmd` | run `cmd` on core 0 only |
| `sleep 2.5` | do nothing for 2.5 seconds |
| `grep pattern file` | print only the lines of `file` that match `pattern`; with `-E`, the pattern may list several alternatives |
| `ps`, `pgrep name` | list processes; list the process ids of the processes called `name` |
| `> /dev/null` | throw the command's printed output away |
| `gcc -O2 -o prog prog.c` | compile `prog.c` into a program called `prog` |
