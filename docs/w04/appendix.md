# Appendix A. Four small tools: binary, hex, powers of two, and the bit operators {#appendix-a}

This week is arithmetic on addresses, plus one new habit: cutting a number into pieces of bits. To follow it you need four tools: binary numbers, hexadecimal numbers, powers of two, and the four bit operators that the code uses. If you already know them, skim this part and check yourself with the "check this" lines.

## Bits and binary {#appendix-a-binary}

A **bit** is a single 0 or 1. A **byte** is eight bits in a row. A **binary number** is a number written with only the digits 0 and 1, where each position is worth twice as much as the one to its right. Reading from the right, the positions are worth 1, 2, 4, 8, 16, 32, 64, and so on.

Take the binary number 010101 and read it right to left. The rightmost 1 is worth 1. The next digit is 0, worth nothing. The next 1 is worth 4. The next 0 is nothing. The next 1 is worth 16. The leftmost 0 is nothing. Add them: 16 + 4 + 1 = 21. So 010101 is 21, the address the textbook translates in [Section 4.3](class-2.md#sec-4-3).

Check this: 110010 is 32 + 16 + 2 = 50. And 1111 is 8 + 4 + 2 + 1 = 15.

Going the other way, from a number to binary, take away the biggest power of two that fits, again and again. For 117: 64 fits, leaving 53; 32 fits, leaving 21; 16 fits, leaving 5; 8 does not fit; 4 fits, leaving 1; 2 does not fit; 1 fits, leaving 0. So 117 has 1s in the positions worth 64, 32, 16, 4 and 1: 1110101.

Bits in a number are counted from the right, starting at 0. In 010101, bit 0 is the rightmost 1, bit 1 is the 0 next to it, bit 2 is the next 1, and so on. So "bit 0" means the position worth 1, "bit 4" the position worth 16, and "bits 13 and 12" the two positions worth 8192 and 4096. This guide names bit positions this way all week.

One fact you will use constantly: with **n bits you can write 2^n different numbers**, from 0 up to 2^n − 1. Two bits give 4 numbers, 0 to 3, enough to name four pages or three segments. Four bits give 16 numbers, 0 to 15, enough to name every byte of a 16-byte page. Twelve bits give 4096 numbers, every byte of a 4 KB page.

## Hexadecimal {#appendix-a-hex}

Binary numbers get long. **Hexadecimal** (or "hex") is a shorthand: base 16, with digits 0 to 9 and then a, b, c, d, e, f for 10 to 15. Every hex digit stands for exactly four bits. A hex number is written with **0x** in front so you know it is hex: 0x10 is sixteen, not ten.

Hex to binary is a lookup, four bits per digit: 0x3000 is 0011 0000 0000 0000, because 3 is 0011 and 0 is 0000. Binary to hex is the same lookup backwards, so first group the bits in fours starting from the right. For example, 110000 has six bits, so pad the left with two zeros to make 0011 0000, then read 3 and 0: 0x30.

Hex to decimal: each position is worth 16 times the one to its right, so the positions are worth 1, 16, 256, 4096, 65,536, and so on. Check this: 0x1770 is 1 × 4096 + 7 × 256 + 7 × 16 + 0 = 4096 + 1792 + 112 = 6000.

Decimal to hex is repeated division by 16, writing down the remainders. Take 6000: 6000 ÷ 16 = 375 remainder 0; 375 ÷ 16 = 23 remainder 7; 23 ÷ 16 = 1 remainder 7; 1 ÷ 16 = 0 remainder 1. Read the remainders from the last to the first: 1, 7, 7, 0. So 6000 = 0x1770, and the two directions agree. Check this: 1080841 ÷ 16 = 67,552 remainder 9; 67,552 ÷ 16 = 4,222 remainder 0; 4,222 ÷ 16 = 263 remainder 14; 263 ÷ 16 = 16 remainder 7; 16 ÷ 16 = 1 remainder 0; 1 ÷ 16 = 0 remainder 1. Remainders backwards: 1, 0, 7, 14, 0, 9 = 1, 0, 7, e, 0, 9. So 1080841 = 0x107e09, a frame number from [Section 4.5](class-2.md#sec-4-5).

Two writing habits you will meet. A hex number is often padded with leading zeros to a fixed width: 0x0068 and 0x68 are the same number, and 0000000000001000 in a capture is just 0x1000 printed as sixteen digits, which is how a 64-bit value is printed. And when a long address changes only at the end, the guide sometimes writes the unchanged leading digits as "..." to save space: ...39000 for 0x55f823c39000.

When you see an address such as 0x87f36000, do not panic. It is just a number, written in hex because hex is shorter: those eight hex digits stand for 8 × 4 = 32 bits of binary, and nobody wants to read 32 ones and zeros. One more habit that saves work all week: with 4 KB pages, the last three hex digits of an address are the offset (3 × 4 = 12 bits), and the digits before them are the page number.

## Powers of two, and the names for big ones {#appendix-a-powers}

Memory sizes come in powers of two. 2^10 = 1024 is a **kilobyte** (KB). 2^20 is a **megabyte** (MB). 2^30 is a **gigabyte** (GB). 2^40 is a **terabyte** (TB). When you multiply powers of two, you add the exponents: 2^20 × 2^2 = 2^22, which is how 2^20 table entries of 4 bytes become 4 MB. When you divide, you subtract them: 2^32 ÷ 2^12 = 2^20. Read that backwards and you can name any power of two: 2^38 = 2^8 × 2^30 = 256 × 2^30, so 2^38 bytes is 256 GB. You will also see these units written KiB, MiB, GiB and TiB. The extra i is the careful spelling for "the power of two, not the power of ten". In this guide both spellings mean the power of two, so 256 GiB and 256 GB are the same number, 2^38 bytes.

Check this: 4 KB is 4 × 1024 = 4096 bytes = 2^12 bytes. So a page of 4 KB has 4096 byte positions, and naming one position inside it needs 12 bits. And 16 KB is 16 × 1024 = 16,384 = 2^14 bytes, so the textbook's 16 KB address space needs 14-bit addresses.

## What an address is {#appendix-a-address}

A computer's main memory (**RAM**) is a very long row of bytes. Each byte has a number, its **address**, starting from 0. When a program says "read the byte at address 21", it is naming a position in that row. That is all an address is: a position number. An address is stored as a fixed number of bits, and how many bits decides how many positions can be named: 6 bits name 2^6 = 64 positions (the textbook's tiny example), 32 bits name 2^32 (about four billion bytes, 4 GiB), 48 bits name 2^48 (256 TiB).

## The four bit operators, and what shifting means {#appendix-a-operators}

The code this week cuts numbers into pieces of bits and glues pieces back together. It does that with four operators, written the way the C language writes them. **C** is the programming language the operating system and the demo programs are written in; you do not need to know it, and every line of C that appears is explained in words.

| written | name | what it does | example |
|---|---|---|---|
| `x >> n` | shift right | drop the lowest n bits; the rest slide right | 110000 >> 4 = 11 |
| `x << n` | shift left | append n zero bits on the right | 010 << 4 = 0100000 |
| `x & m` | and, with a mask | keep only the bits where m has a 1; every other bit becomes 0 | 110010 & 001111 = 000010 |
| `x \| y` | or | a bit is 1 if it is 1 in x or in y or both | 0100000 \| 0000010 = 0100010 |

Two facts about shifting make most of the week's arithmetic easy. Shifting left by n bits is the same as multiplying by 2^n, because every bit moves to a position worth 2^n times more: 7 << 4 is 7 × 16 = 112. Shifting right by n bits is the same as dividing by 2^n and throwing away the remainder: 117 >> 4 is 117 ÷ 16 = 7, remainder 5 thrown away. Check this: 5 << 12 is 5 × 4096 = 20,480, which is 0x5000, and 0x5000 >> 12 is 5. In hex, a shift by 12 just adds or removes three hex digits.

A **mask** is a number used with `&` to pick out some bits. The mask that keeps the lowest 4 bits is four 1s, 1111 = 0xF = 15. The mask that keeps the lowest 12 bits is twelve 1s, 0xFFF = 4095. The mask that keeps bits 13 and 12 of a 14-bit address is 11 followed by twelve 0s, 0x3000. So `x & 0xFFF` means "the offset of x within a 4 KB page", and `(x & 0x3000) >> 12` means "the top two bits of a 14-bit x, as a number from 0 to 3". This one pattern, mask then shift, is how the hardware cuts an address into its pieces. And `|` puts pieces back together: when the two numbers have no 1 in the same place, as a frame number shifted up and an offset never do, `|` gives the same result as `+`.
