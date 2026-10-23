# Appendix A. Four small tools: binary, hex, powers of two, and the bit operators {#appendix-a}

Every week of memory is arithmetic on addresses, plus one new habit: cutting a number into pieces of bits. To follow it you need four tools: binary numbers, hexadecimal numbers, powers of two, and the four bit operators that the code uses. If you already know them, skim this part and check yourself with the "check this" lines.

## Bits and binary

A **bit** is a single 0 or 1. A **byte** is eight bits in a row. A **binary number** is a number written with only the digits 0 and 1, where each position is worth twice as much as the one to its right. Reading from the right, the positions are worth 1, 2, 4, 8, 16, 32, 64, and so on.

Take the binary number 010101 and read it right to left. The rightmost 1 is worth 1. The next digit is 0, worth nothing. The next 1 is worth 4. The next 0 is nothing. The next 1 is worth 16. The leftmost 0 is nothing. Add them: 16 + 4 + 1 = 21. So 010101 is 21.

Check this: 1110 is 8 + 4 + 2 = 14. And 1111 is 8 + 4 + 2 + 1 = 15.

Bits in a number are counted from the right, starting at 0. In 010101, bit 0 is the rightmost 1, bit 1 is the 0 next to it, bit 2 is the next 1, and so on. So "bit 0" means the position worth 1, "bit 4" means the position worth 16, and "bits 5 down to 2" means the four positions worth 32, 16, 8 and 4. This guide names bit positions this way all week.

One fact you will use constantly: with **n bits you can write 2^n different numbers**, from 0 up to 2^n − 1. Four bits give 16 numbers, 0 through 15. Nine bits give 512 numbers. Twelve bits give 4096 numbers.

## Hexadecimal

Binary numbers get long. **Hexadecimal** (or "hex") is a shorthand: base 16, with digits 0 to 9 and then a, b, c, d, e, f for 10 to 15. Every hex digit stands for exactly four bits. A hex number is written with **0x** in front so you know it is hex: 0x10 is sixteen, not ten.

Hex to binary is a lookup, four bits per digit: 0x3F80 is 0011 1111 1000 0000, because 3 is 0011, F is 1111, 8 is 1000 and 0 is 0000. Binary to hex is the same lookup backwards, so first group the bits in fours **starting from the right**. For example, 11 1111 1000 0000 has fourteen bits, so pad the left with two zeros to make 0011 1111 1000 0000, then read 3, F, 8, 0.

Hex to decimal: each position is worth 16 times the one to its right, so the positions are worth 1, 16, 256, 4096, and so on. Check this: 0x0DC0 is 0 × 4096 + 13 × 256 + 12 × 16 + 0 = 3328 + 192 = 3520.

Decimal to hex is repeated division by 16, writing down the remainders. Take 3520: 3520 ÷ 16 = 220 remainder 0; 220 ÷ 16 = 13 remainder 12; 13 ÷ 16 = 0 remainder 13. Read the remainders from the last to the first: 13, 12, 0, which is D, C, 0. So 3520 = 0xDC0, and the two directions agree. Check this: 3786 ÷ 16 = 236 remainder 10; 236 ÷ 16 = 14 remainder 12; 14 ÷ 16 = 0 remainder 14. Remainders backwards: 14, 12, 10 = E, C, A. So 3786 = 0xECA.

Two writing habits you will meet. A hex number is often padded with leading zeros to a fixed width: 0x0DC0 and 0xDC0 are the same number, and 0x0000000000005000 is just 0x5000 printed as sixteen digits, which is how a 64-bit value is printed. And when a long address changes only at the end, the guide sometimes writes the unchanged leading digits as "..." to save space.

When you see an address such as 0x87f22000, do not panic. It is just a number, written in hex because hex is shorter: those eight hex digits stand for 8 × 4 = 32 bits of binary, and nobody wants to read 32 ones and zeros.

## Powers of two, and the names for big ones

Memory sizes come in powers of two. 2^10 = 1024 is called a **kilobyte** (KB). 2^20 is a **megabyte** (MB). 2^30 is a **gigabyte** (GB). 2^40 is a **terabyte** (TB). When you multiply powers of two, you add the exponents: 2^20 × 2^12 = 2^32. When you divide, you subtract them: 2^32 ÷ 2^12 = 2^20. Read that backwards and you can name any power of two: 2^38 = 2^8 × 2^30 = 256 × 2^30, so 2^38 bytes is 256 GB. You will also see these units written KiB, MiB, GiB, TiB. The extra i is the careful spelling for "the power of two, not the power of ten." In this guide both spellings mean the power of two, so 256 GiB and 256 GB are the same number, 2^38 bytes. Some captures in this guide print "kB" with a small k; that is Linux's spelling for the same 1024 bytes.

Check this: 4 KB is 4 × 1024 = 4096 bytes = 2^12 bytes. So a block of 4 KB has 4096 byte positions, and naming one position inside it needs 12 bits. Blocks of exactly this size come up all week. And 2 MiB is 2 × 2^20 = 2^21 bytes, which is 512 blocks of 4 KiB, because 2^21 ÷ 2^12 = 2^9 = 512.

## What an address is

A computer's main memory (**RAM**) is a very long row of bytes. Each byte has a number, its **address**, starting from 0. When a program says "read the byte at address 21," it is naming a position in that row. That is all an address is: a position number. An address is stored as a fixed number of bits, and how many bits decides how many positions can be named: 32 bits name 2^32 positions (about four billion bytes, 4 GiB), 48 bits name 2^48 (256 TiB).

## The four bit operators, and what shifting means

Code this week cuts numbers into pieces of bits and glues pieces back together. It does that with four operators, written the way the C language writes them. **C** is the programming language the operating system and the demo programs are written in; you do not need to know it, and every line of C that appears is explained in words.

| written | name | what it does | example |
|---|---|---|---|
| `x >> n` | shift right | drop the lowest n bits; the rest slide right | 1011 0110 >> 4 = 1011 |
| `x << n` | shift left | append n zero bits on the right | 1011 << 4 = 1011 0000 |
| `x & m` | and, with a mask | keep only the bits where m has a 1; every other bit becomes 0 | 1011 0110 & 0000 1111 = 0000 0110 |
| `x \| y` | or | a bit is 1 if it is 1 in x or in y or both | 1010 0000 \| 0000 0101 = 1010 0101 |

Two more marks you will see in code: `*` between two numbers is multiplication, and `+` is addition, as in `15 * 4 + 60`. ([Section 3.3](class-1.md#sec-3-3) gives `*` a second meaning when it stands in front of a name.) Two facts about shifting make most of this week's arithmetic easy. Shifting left by n bits is the same as multiplying by 2^n, because every bit moves to a position worth 2^n times more: 55 << 6 is 55 × 64 = 3520. Shifting right by n bits is the same as dividing by 2^n and throwing away the remainder: 3520 >> 6 is 55. Check this: 5 << 12 is 5 × 4096 = 20480, which is 0x5000 (5 × 4096 + 0 + 0 + 0), and 0x5000 >> 12 is 5.

A **mask** is a number used with `&` to pick out some bits. The mask that keeps the lowest 9 bits is nine 1s in binary, 1 1111 1111, which is 511, which is 0x1FF (1 × 256 + 15 × 16 + 15 = 256 + 240 + 15 = 511). The mask that keeps the lowest 10 bits is ten 1s, 0x3FF, which is 3 × 256 + 15 × 16 + 15 = 768 + 240 + 15 = 1023. So `x & 0x1FF` means "the lowest 9 bits of x", and `(x >> 12) & 0x1FF` means "shift x right by 12, then keep the lowest 9 bits of what is left", which picks out bits 20 down to 12 of the original x (12 + 9 − 1 = 20). This one pattern, shift then mask, is how the hardware and the operating system's own code cut a 9-bit slice out of an address.
