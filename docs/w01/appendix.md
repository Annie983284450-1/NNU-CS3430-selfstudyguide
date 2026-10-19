# Appendix A. Small tools: hexadecimal, and the marks of C {#appendix-a}

This guide uses two small tools without stopping for them: numbers written in hexadecimal, and the punctuation marks of the C language. If either is new, read this appendix once; it takes about ten minutes.

## Hexadecimal {#a-hex}

Ordinary numbers are written in base 10: ten digits, 0 to 9, and each position is worth ten times the one to its right (ones, tens, hundreds). **Hexadecimal**, or hex, is base 16: sixteen digits, 0 to 9 and then a, b, c, d, e, f for 10, 11, 12, 13, 14 and 15. Each position is worth sixteen times the one to its right: 1, 16, 256, 4096, 65,536, 1,048,576, and so on (16 × 16 = 256, 256 × 16 = 4096, 4096 × 16 = 65,536, 65,536 × 16 = 1,048,576). A hex number is written with `0x` in front, so you know it is hex: `0x10` is sixteen, not ten.

To turn a hex number into an ordinary one, multiply each digit by the worth of its position and add. Take `0x200000`, the address of [Section 3.2](class-1.md#sec-3-2). It has six digits: a 2 and then five zeros. The 2 sits in the sixth position from the right, worth 1,048,576. So 0x200000 = 2 × 1,048,576 = 2,097,152, about two million. Check it a second way: 0x200000 is 2 × 16^5, and 16^5 = 16 × 16 × 16 × 16 × 16 = 1,048,576, so the answer is again 2,097,152. Another example: `0x51a000` is 5 × 1,048,576 + 1 × 65,536 + 10 × 4096 = 5,242,880 + 65,536 + 40,960 = 5,349,376.

Why hex at all? Because every hex digit stands for exactly four binary digits (bits): four bits can be set in 2 × 2 × 2 × 2 = 16 ways, exactly one for each hex digit from 0 to f. So memory addresses, which the hardware handles as bits, are shorter and easier to read in hex. You never need to convert one to follow this guide; the numbers are names.

## The marks of C {#a-c}

Every program in this guide is written in **C**. You do not need to write C; you need to recognize its marks. Here they are, in roughly the order the guide meets them.

| written | meaning | where first met |
|---|---|---|
| `#include <stdio.h>` | pull in a file of ready-made definitions | [Section 2.2](class-1.md#sec-2-2) |
| `// text` | a comment: a note for people, ignored by the computer | [Section 1.5](class-1.md#sec-1-5) |
| `#define NAME 1` | give the name NAME to the value 1 | [Section 1.5](class-1.md#sec-1-5) |
| `{` and `}` | the start and end of a block of code | [Section 2.2](class-1.md#sec-2-2) |
| `;` | the end of one statement | [Section 2.2](class-1.md#sec-2-2) |
| `main` | the function where a C program starts | [Section 2.2](class-1.md#sec-2-2) |
| `argv[1]` | the first word typed after the program's name; `[ ]` picks an item by position, from 0 | [Section 2.2](class-1.md#sec-2-2) |
| `while (1)` | repeat the block below forever | [Section 2.2](class-1.md#sec-2-2) |
| `printf("%s\n", str)` | print text; `%s`, `%d` and `%p` are placeholders for text, a whole number and an address; `\n` is a newline | [Section 2.2](class-1.md#sec-2-2) and 3.2 |
| `int *p` | p is a pointer: it holds the address of an `int` (a whole number) | [Section 3.2](class-1.md#sec-3-2) |
| `*p` (outside a declaration) | the value at the address p holds | [Section 3.2](class-1.md#sec-3-2) |
| `&a` | the address of a | [Section 4.2](class-2.md#sec-4-2) |
| `p->lock` | the field `lock` of the struct that the pointer p points to | [Section 2.5](class-1.md#sec-2-5) |
| `counter++`, `i++` | add one to the variable | [Section 4.1](class-2.md#sec-4-1) |
| `for (i = 0; i < loops; i++)` | run the block with i = 0, 1, 2, and so on, while i is less than loops | [Section 4.2](class-2.md#sec-4-2) |
| `=` | store a value | everywhere |
| `==`, `!=`, `>=`, `<` | compare: equal, not equal, greater than or equal, less than | Sections [4.2](class-2.md#sec-4-2) and [6.2](class-2.md#sec-6-2) |
| `\|` | combine options into one number | [Section 6.2](class-2.md#sec-6-2) |
| `NULL` | "no address" | [Section 4.2](class-2.md#sec-4-2) |
| `return 0;` | end the function; 0 from main means "no error" | [Section 2.2](class-1.md#sec-2-2) |
| `\0` | the NUL byte, value 0, which C puts after every text in double quotes | [Section 6.2](class-2.md#sec-6-2) |

When a listing in this guide uses a mark that is not in this table, the section that shows the listing explains it where it appears.
