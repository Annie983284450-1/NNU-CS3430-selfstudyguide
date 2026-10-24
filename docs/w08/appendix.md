# Appendix A. Reading the C of this week {#appendix-a}

The symbols of C that this guide uses, with where each first appears.

| in the code | what it means | first in |
|---|---|---|
| `int x = 0;` | a variable `x` holding a whole number, starting at 0; `;` ends a statement | Part 0 |
| `#include <stdio.h>` | pull in a library's declarations | [Section 1.4](class-1.md#sec-1-4) |
| `#define N 400000000L` | make `N` a name for a number (`L`: a `long` constant) | [Section 1.4](class-1.md#sec-1-4) |
| `a[i]`, `long sum[2];` | element `i` of array `a`, counting from 0; an array of 2 elements | [Section 1.4](class-1.md#sec-1-4) |
| `s += x` | `s = s + x` | [Section 1.4](class-1.md#sec-1-4) |
| `a * b`, `a / b` | multiply; divide (between two whole numbers the fraction is dropped) | Part 0, [Section 1.4](class-1.md#sec-1-4) |
| `int main(int argc, char *argv[])` | where a program starts; the number of words on the command line, and the words as text | [Section 1.4](class-1.md#sec-1-4) |
| `argv[1]`, `atoi(...)` | the first word after the program's name on the command line; turn text into a number | [Section 1.4](class-1.md#sec-1-4) |
| `if (c) { ... } else { ... }` | run the first block if `c` is true, the second block otherwise | [Section 1.4](class-1.md#sec-1-4) |
| `1e9` | 1,000,000,000 written in scientific notation | [Section 1.4](class-1.md#sec-1-4) |
| `double` | a number type that can hold a fraction | [Section 1.4](class-1.md#sec-1-4) |
| `char *` | a pointer to text (to its first character) | [Section 1.4](class-1.md#sec-1-4) (`char *argv[]`), [Section 1.5](class-1.md#sec-1-5) |
| `kmem.freelist` | the field `freelist` of the bundle `kmem` | [Section 1.4](class-1.md#sec-1-4) (the dot), [Section 2.7](class-1.md#sec-2-7) |
| `void` (result or input list) | returns nothing; takes no input | Part 0 |
| `strcmp(a, b)` | compare two pieces of text; 0 means equal | [Section 6.6](class-2.md#sec-6-6) |
| `long` | a bigger whole-number type | [Section 1.4](class-1.md#sec-1-4) |
| `static` (outside a function) | the variable or function belongs to this file only | [Section 1.4](class-1.md#sec-1-4) |
| `volatile` | really read and write memory every time; not a synchronization tool | [Section 2.1](class-1.md#sec-2-1) |
| global variable | declared outside every function: one copy, seen by every thread | Part 0 |
| `f(x) { ... }`, `return` | a function, its body, and the value it hands back | Part 0 |
| `for (int i = 0; i < n; i++)` | repeat the body n times; `i++` adds 1 to `i` | Part 0 |
| `while (c) ;` | repeat while `c` is true; the lone `;` is an empty body (spinning) | Part 0 |
| `==`, `!=`, `!`, `&&` | is equal to; is not equal to; not; and (the "or" operator is given just below the table) | Part 0, [Section 5.3](class-2.md#sec-5-3), [Extra 5](class-2.md#extra-5) |
| `if (r)` | if `r` is not zero (for a pointer: not the empty pointer) | [Section 2.7](class-1.md#sec-2-7) |
| `&x` | the address of `x` | Part 0 |
| `int *p`, `*p` | `p` is a pointer to an integer; the thing at the address `p` holds | Part 0 |
| `p->f` | the field `f` of the record that pointer `p` points at | Opening of the first class |
| `NULL` | the empty pointer, pointing at nothing | [Section 1.4](class-1.md#sec-1-4) |
| `struct { int a; int b; }`, `struct timespec` | a bundle of named fields; the bundle that holds a time | Sections [1.4](class-1.md#sec-1-4), [2.7](class-1.md#sec-2-7), [3.3](class-1.md#sec-3-3) |
| `typedef ... myarg_t;` | gives a bundle type a name | [Section 3.3](class-1.md#sec-3-3) |
| `void *` | a pointer that may point at anything | Part 0, [Section 3.3](class-1.md#sec-3-3) |
| `void **` | a pointer to an anything-pointer | [Section 3.3](class-1.md#sec-3-3) |
| `(long) arg`, `(void *) 0` | casts: turn the pointer `arg` back into a number; pass the number 0 where a pointer is expected | [Section 1.4](class-1.md#sec-1-4) |
| `(myarg_t *) arg` | a cast: treat `arg` as a pointer to a `myarg_t` | [Section 3.3](class-1.md#sec-3-3) |
| `myarg_t args = { 10, 20 };` | make a bundle and fill its fields in order: `a` = 10, `b` = 20 | [Section 3.3](class-1.md#sec-3-3) |
| `malloc(n)`, `free(p)`, `sizeof(t)` | ask for n bytes of heap memory; give it back; the size of type t in bytes | Sections 1.3 (`malloc`), 1.4 (`sizeof`), 3.2 (`free`) |
| `\n` (inside the text of a `printf`) | start a new line | [Section 1.4](class-1.md#sec-1-4) |
| `printf("%d %s", ...)` | print text; `%d` is replaced by a number, `%s` by a piece of text, `%ld` by a `long`, `%.2f` by a number with 2 decimals | Part 0 (`%d`), [Section 1.4](class-1.md#sec-1-4) (`%ld`, `%.2f`), [Section 1.5](class-1.md#sec-1-5) (`%s`) |
| `a = b = 0;` | set both to 0 in one statement (`b = 0` first, then `a` gets the same value) | [Extra 5](class-2.md#extra-5) |
| `//` | a comment, ignored by the computer | Part 0 |
| `pthread_t` | a thread handle, filled in by `pthread_create` | [Section 1.4](class-1.md#sec-1-4) |
| `pthread_create(&p, NULL, f, arg)` | start `f(arg)` as a new thread, with default settings, named `p` | [Section 1.4](class-1.md#sec-1-4) |
| `pthread_join(p, (void **) &result)` | wait for thread `p`, and write what it returned into `result` (the cast is needed, [Section 3.3](class-1.md#sec-3-3)) | Sections [1.4](class-1.md#sec-1-4), [3.3](class-1.md#sec-3-3) |
| `pthread_mutex_t`, `PTHREAD_MUTEX_INITIALIZER` | a lock variable, and its starting value "free" | [Section 3.5](class-1.md#sec-3-5) |
| `pthread_mutex_lock(&m)`, `pthread_mutex_unlock(&m)` | take the lock (waiting if needed); give it back | [Section 3.5](class-1.md#sec-3-5) |
| `__sync_lock_test_and_set(&x, 1)`, `__sync_lock_release(&x)` | the compiler's test-and-set; store 0 | Sections [5.3](class-2.md#sec-5-3), [5.4](class-2.md#sec-5-4) |
| `__sync_synchronize()` | a fence | [Section 5.3](class-2.md#sec-5-3) |

Two vertical bars, `||`, mean "or" ([Extra 4](class-2.md#extra-4)).

And the machine-code notation of Sections [2.3](class-1.md#sec-2-3), [5.3](class-2.md#sec-5-3) and [5.4](class-2.md#sec-5-4):

| in a disassembly | what it means |
|---|---|
| `11dd:` | the address of the instruction, in hex |
| `mov a,b` | copy a into b (x86 notation used here: source first) |
| `add $0x1,%eax` | add the constant 1 to register `eax` |
| `%eax`, `%rip`, `%rbp` | x86 registers: a working register; the program counter; the pointer to this function's part of the stack |
| `0x2e31(%rip)` | the address `rip` + `0x2e31` |
| `xchg` | x86 atomic exchange (test-and-set) |
| `cmp`, `je`, `jmp` | compare; jump if equal; jump |
| `amoswap.w.aq` | RISC-V atomic swap, with acquire ordering |
| `fence rw,rw` | RISC-V fence: no load or store moves across it |
| `fence rw,w` | RISC-V fence: every earlier load and store finishes before any later store |
| `jmp`, `jle` | x86: jump; jump if less or equal |
| `.w`, `.aq` (RISC-V suffixes) | a 32-bit word; acquire ordering (no later load or store moves ahead) |
| `sw`, `sd`, `li`, `mv`, `bnez`, `jal` | RISC-V: store word; store doubleword; load a constant; copy; branch if not zero; call |
| `sext.w` | RISC-V: copy a 32-bit value into a whole 64-bit register |
| `zero` | RISC-V: a register that always holds 0 |
| `movl`, `addl`, `cmpl` (the `l` suffix) | x86: the value is 32 bits wide, the size of an `int` |
| `nop` | x86: do nothing |

And the shell commands of the captures:

| command | what it does |
|---|---|
| `$` | the prompt: the rest of the line is a typed command |
| `./prog` | run the program `prog` from the current folder |
| `a \| b` (a pipe, drawn as a vertical bar) | the output of `a` becomes the input of `b` |
| `for i in $(seq 100); do ...; done` | repeat 100 times; `$(...)` is replaced by a command's output |
| `sed -n 2p` | print line 2 only |
| `sort`, `uniq -c` | put lines in order; count each run of equal lines |
| `grep -c pattern`, `grep -A6`, `grep -B2`, `grep -n` | count matching lines; keep 6 lines after a match; 2 before; show line numbers |
| `head -16`, `tail -3` | keep the first 16 lines; the last 3 |
| `2>&1` | send error messages into the same output |
| `wsl --install` | in a Windows command prompt opened as administrator: install WSL, once (then restart) |
| `time prog` | run `prog` and report `real` (wall clock), `user` and `sys` time |
| `taskset -c 0 prog` | run `prog` on core 0 only |
| `objdump -d -S prog` | print the instructions of `prog`, with its C lines |
| `strace -f -c -e trace=futex prog` | count `prog`'s futex system calls, in every thread |
| `man pthread_create` | show the reference page (the manual page) of `pthread_create` |
| `valgrind --tool=helgrind prog` | run `prog` under the race checker (`-s` also lists which hiding rules were used) |
| `make`, `make CPUS=1 qemu` | build by the recipe in the file `Makefile`; for xv6, build it and start it in QEMU with 1 CPU |
| `riscv64-linux-gnu-objdump -d kernel/kernel` | objdump for RISC-V code, run on the compiled xv6 kernel |
| `sudo apt install git` | install the program git (`apt` is Ubuntu's installer; `sudo` runs it with the administrator's rights) |
| `git clone URL`, `cd folder` | copy a project from a website such as GitHub into a new folder; change to a folder |
| `python3 x86.py -p flag.s -t 2 -a bx=100,bx=100 -M count -i 7 -c` (or `./x86.py ...`) | the textbook's simulator: run `flag.s` with 2 threads, `bx` = 100 each, print `count`, interrupt every 7 instructions, show the answers |
| `gcc -g -Wall -pthread -o prog prog.c` | compile `prog.c` into the program `prog`, with the threads library |
