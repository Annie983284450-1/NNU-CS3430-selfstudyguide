# Appendix A. Small tools for reading addresses: binary, hexadecimal, powers of two, and units {#appendix-a}

This week is full of addresses such as 0x7ffcfb971f04 and sizes such as 132 KB. To follow it you need four small tools: binary numbers, hexadecimal numbers, powers of two with the names for big ones, and what an address is. If you already know them, skim this part and check yourself with the "check this" lines.

## Bits and binary {#h-bits-and-binary}

A **bit** is a single 0 or 1. A **byte** is eight bits in a row. A **binary number** is a number written with only the digits 0 and 1, where each position is worth twice as much as the one to its right. Reading from the right, the positions are worth 1, 2, 4, 8, 16, 32, 64, and so on.

Take the binary number 10101 and read it right to left. The rightmost 1 is worth 1. The next digit is 0, worth nothing. The next 1 is worth 4. The next 0 is nothing. The leftmost 1 is worth 16. Add them: 16 + 4 + 1 = 21. So 10101 is 21. Check this: 1111 is 8 + 4 + 2 + 1 = 15.

One fact you will use: with n bits you can write 2^n different numbers, from 0 up to 2^n − 1. Four bits give 16 numbers, 0 to 15. Twelve bits give 4096. So a number that is 48 bits long can name 2^48 different bytes.

## Hexadecimal {#h-hexadecimal}

Binary numbers get long. **Hexadecimal** (or "hex") is a shorthand: base 16, with the digits 0 to 9 and then a, b, c, d, e, f for 10 to 15. Every hex digit stands for exactly four bits, because four bits give 16 values. A hex number is written with **0x** in front so you know it is hex: 0x10 is sixteen, not ten. This is how C's `%p` prints an address, and how strace, gdb and valgrind print them too. The file `/proc/PID/maps` prints them without the `0x`.

Hex to decimal: each position is worth 16 times the one to its right, so the positions are worth 1, 16, 256, 4096, 65,536, and so on. Check this: 0x21000 is 2 × 65,536 + 1 × 4096 + 0 + 0 + 0 = 131,072 + 4,096 = 135,168. And 0x10 is 1 × 16 + 0 = 16.

How long is an address? Count its hex digits and multiply by 4. 0x7ffcfb971f04 has 12 hex digits, so it is 12 × 4 = 48 bits long. Its first digit is 7, which is 0111 in binary, so its top bit is 0 and it is a little under 0x800000000000. That number is 8 followed by 11 zeros; each zero is a factor of 16 = 2^4, so it is 8 × 16^11 = 2^3 × 2^44 = 2^47.

Comparing two hex addresses is like comparing two decimal numbers. If one has more digits (not counting leading zeros), it is the larger: 0x400000 has 6 digits and 0x555555554000 has 12, so 0x400000 is smaller. If they have the same number of digits, look at the first digit where they differ. 0x555555556004 is smaller than 0x555555558000, because they agree up to `55555555` and then 6 < 8.

Subtracting two hex addresses: when the leading digits agree, drop them and subtract what is left, column by column from the right, the way you subtract in decimal, but borrowing 16 instead of 10. Take 0x55c356e20000 − 0x55c356dff000 ([Section 3.3](class-1.md#sec-3-3)). Drop the common `55c356`, leaving e20000 − dff000. From the right: 0 − 0 = 0 three times. Then 0 − f: borrow, 16 − 15 = 1. Then 2 − f, minus the 1 borrowed: borrow again, 16 + 2 − 15 − 1 = 2. Then e − d, minus the 1 borrowed: 14 − 13 − 1 = 0. Reading back: 021000, which is 0x21000. Check it by adding: 0xdff000 + 0x21000 = 0xe20000.

## Powers of two, and the names for big ones {#h-powers-of-two-and-the-names-for-big-ones}

Memory sizes come in powers of two, because addresses are binary numbers. n bits name exactly 2^n bytes, so a size of 2^n bytes is the natural unit. 2^10 = 1024 bytes is a **kilobyte** (KB), the power of two closest to a thousand. 2^20 is a **megabyte** (MB), 1024 KB. 2^30 is a **gigabyte** (GB), 1024 MB. 2^40 is a **terabyte** (TB), 1024 GB. When you multiply powers of two you add the exponents: 2^7 × 2^40 = 2^47. When you divide, you subtract them: 2^47 / 2^40 = 2^7 = 128. So 2^47 bytes is 128 TB.

Three spelling habits appear in the captures. KiB, MiB, GiB and TiB, with an extra i, are the careful spelling of the same powers of two, so 128 TiB and 128 TB mean the same number in this guide. Linux files such as `/proc/self/status` write "kB" with a small k, and also mean 1024 bytes. And in everyday speech, and in a line such as `malloc(100e6)`, a size can be a power of ten instead: 100e6 is 100 × 10^6 = 100,000,000 bytes, which this guide calls 100 MB "in the everyday, decimal sense". The difference matters in arithmetic, which is why the second class insists that KB means 1024 when it translates addresses: 3000 + 16 KB is 3000 + 16,384 = 19,384, not 19,000.

Check this: 4 KB is 4 × 1024 = 4096 bytes = 2^12 bytes. A block of that size is a **page** on the Ubuntu machine and in xv6, and every boundary in a maps file is a multiple of it, which in hex means it ends in three zeros (0x1000 = 4096).

## What an address is {#h-what-an-address-is}

A computer's main memory (RAM) is a very long row of bytes. Each byte has a number, its **address**, starting from 0. When a program says "read the byte at address 21", it is naming a position in that row. An address is stored as a fixed number of bits, and the number of bits decides how many positions can be named: 32 bits name 2^32 positions (4 GB), 48 bits name 2^48 (256 TB). Linux gives a program the lower half, 128 TB, as [Extra 6](class-1.md#extra-6) explains. On the Ubuntu machine an address is stored in 64 bits, 8 bytes, but only the low 48 are used. This week adds one twist to that picture: the addresses a program uses are positions in its own private row, its address space, and the hardware turns each one into a position in the real row on every access.
