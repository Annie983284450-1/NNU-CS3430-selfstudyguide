# Appendix A. The small tools: hexadecimal, sizes, time units, and reading C {#appendix-a}

This appendix collects the small tools the guide uses. Each is explained where it first appears; this is the place to look one up again.

## Hexadecimal {#appendix-a-hex}

Memory addresses are long numbers, and programs print them in **hexadecimal** (hex), which is base 16. Because 16 = 2^4, each hex digit is exactly four bits (binary digits): 0 is 0000, 7 is 0111, a is 1010 and f is 1111. Base 16 needs sixteen digits, so after 0 to 9 it uses the letters a to f for ten to fifteen: a = 10, b = 11, c = 12, d = 13, e = 14, f = 15. A hex number is marked with `0x` in front, so `0x10` is hex 10, not ten.

Each position is worth 16 times the one to its right, just as each decimal position is worth 10 times the one to its right. The positions from the right are worth 1, 16, 256 (16 × 16), 4,096 (16 × 256), 65,536 (16 × 4,096), and so on. To turn a short hex number into decimal, multiply each digit by its position's worth and add. For example, `0x2a0` = 2 × 256 + 10 × 16 + 0 × 1 = 512 + 160 = 672. And `0x24000` = 2 × 65,536 + 4 × 4,096 = 131,072 + 16,384 = 147,456. Check this: `0x10` = 1 × 16 + 0 = 16, and `0x1000` = 1 × 4,096 = 4,096.

Two habits make long addresses easy. First, compare from the left. Two addresses that start with the same digits differ only in the rest, so to decide whether an address lies inside a range, find the first digit where they differ. Second, to subtract two addresses that share their first digits, drop the shared digits and subtract what is left, using the place values above. For example, `0x7ffd5c48c000` − `0x7ffd5c468000`: both start `7ffd5c4`, and 0x8c000 − 0x68000 = 0x24000 (hex subtraction works like decimal subtraction, borrowing 16 instead of 10: c − 8 = 4 and 8 − 6 = 2, with c = 12). An address that ends in `000` is a multiple of 0x1000, which is 4,096, so it is the start of a 4 KB page.

## Sizes {#appendix-a-sizes}

A **byte** is 8 bits, enough for one character of text. Memory sizes go up in steps of 1,024, which is 2^10 (2 multiplied by itself 10 times). A **KB** (kilobyte, also written KiB) is 1,024 bytes. An **MB** is 1,024 KB = 2^20 bytes. A **GB** is 1,024 MB = 2^30 bytes. A **TB** (or TiB, tebibyte) is 1,024 GB = 2^40 bytes. A **page** is 4 KB = 4,096 bytes = 2^12 bytes on the machines of this course. The top of a user program's address space on the Ubuntu machine is 2^47 bytes, which is 2^7 × 2^40 = 128 TiB (a design fact of the processor and of Linux).

## Time units {#appendix-a-time}

| unit | written | in seconds | example from this guide |
|---|---|---|---|
| millisecond | ms | a thousandth, 10^-3 | the timer interrupts every few ms |
| microsecond | µs, or us | a millionth, 10^-6 | one context switch, about 1 µs |
| nanosecond | ns | a billionth, 10^-9 | one system call, about 100 ns |

1 ms = 1,000 µs and 1 µs = 1,000 ns. So 100 ns = 0.1 µs, and 2.72 µs = 2,720 ns. In C code, `1e9` means 1 × 10^9, a billion, and `1e6` means a million.

## Reading C {#appendix-a-c}

The guide explains every line of C it shows. These are the marks that come back most often.

| written | meaning |
|---|---|
| `// text` | a comment: a note for people, ignored by the computer |
| `int x = 5;` | make a whole-number variable `x` holding 5; `;` ends a statement |
| `x = y` and `x == y` | store `y` into `x`; ask whether `x` equals `y` |
| `!=`, `<`, `>=` | not equal; less than; greater than or equal |
| `x++` | add 1 to `x` |
| `if (...) { } else { }` | run the first block if the test is true, otherwise the second |
| `for (i = 0; i < n; i++)` | repeat with `i` = 0, 1, ..., n − 1 |
| `while (...)`, `for(;;)` | repeat while the test is true; repeat forever |
| `f(a, b)` | call the function `f` with the arguments `a` and `b` |
| `return x;` | end the function, handing back `x` |
| `a[i]` | slot number `i` of the array `a` (slots start at 0) |
| `&x` | the address of `x` |
| `*p` | the thing at the address held in the pointer `p` |
| `p->f` | the field `f` of the record that `p` points to |
| `"text"`, `char *` | a string; the type of a string |
| `NULL` | no address at all |
| `(int) x` | treat `x` as a whole number |
| `#include <file.h>` | bring in the declarations of library functions |
| `#define N 64` | let the name `N` stand for 64 everywhere |
| `printf("%d %s\n", n, s)` | print text, with `%d` replaced by a whole number, `%s` by a string, `%p` by an address in hex; `\n` ends the line |

Three more marks combine tests: `&&` means "and", two vertical bars `||` mean "or", and `!` in front of a test means "not".

## Reading a shell command {#appendix-a-shell}

| written | meaning |
|---|---|
| `prompt>` or `$` | the shell is ready for a command (Linux captures and xv6 captures) |
| `./p1` | run the program file `p1` in the current folder |
| `cmd &` | run `cmd` in the background and give the prompt back at once |
| `cmd > file` | send `cmd`'s output into `file` (redirection, [Section 3.3](class-1.md#sec-3-3)) |
| `cmd < file` | take `cmd`'s input from `file` |
| `a; b` | run `a`, then `b` |
| `$!`, `%1` | the pid of the last background job; the shell's job number 1 |
| `gcc -o p p.c` | compile `p.c` into the program `p` |

And `a | b`, with a vertical bar between two commands, sends the output of `a` into the input of `b`: a pipe ([Section 3.4](class-1.md#sec-3-4)).
