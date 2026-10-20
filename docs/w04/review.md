# Exercises and answers

## The week in twelve sentences {#the}

One base and bound per process gives the empty middle of the address space real memory, so the first fix keeps a base and size pair per segment, and the hole between heap and stack gets none. Translation takes the segment from the top bits of the address and the offset from the low bits, checks the offset against the size, and adds the base; a failed check is the segmentation fault. Segments come in different sizes, and pieces of different sizes leave holes between them: external fragmentation, with enough memory free in total and no single hole big enough. The same holes appear inside one heap, and an allocator lives with them by splitting, coalescing, keeping a header before every chunk and the free list inside the free chunks, and choosing holes by a fit policy; xv6's `umalloc.c` does all of that in 90 lines, and none of it removes the holes. `kalloc.c` needs none of it, because every unit is one page: the only real fix for external fragmentation is to stop handing out variable sizes, at the price of some waste inside each piece. Paging does that for all of memory: virtual pages and physical frames of one size, and any page fits in any frame. A virtual address splits into a page number and an offset; the page number is looked up in the page table and replaced by a frame number; the offset is copied through, so 21 becomes 117, and Linux's own table does the same. The table lives in memory, a register (PTBR; satp on RISC-V, CR3 on x86) holds its address, and each entry is a frame number plus flags: valid, read, write, execute, user, accessed, dirty. The OS writes entries (`mappages` in xv6, fed by `kalloc`), the hardware reads them on every access, and an access to an invalid entry or against the flags traps, so the table is also the fence between processes. A flat table is far too big on a real machine, 256 GiB per process on x86-64, which is next week's problem. Reading the table before every access doubles the memory references, and the TLB, a small cache of recent translations inside the MMU, fixes that because locality makes hits the common case. A miss costs one table walk, a change of table must flush the TLB or tag its entries with an ASID (xv6 flushes), and a program that keeps revisiting more pages than the TLB can hold runs several times slower, which you can measure.

## Exercises {#exercises}

Do these on paper, with the figures of the sections they name beside you. Write out the bits; the bits are the point. The answers follow, worked in full. Try each one before you look.

**Exercise 1.** The deck's first exercise, from [Section 1.3](class-1.md#sec-1-3). With the register table of OSTEP Figure 16.3 (code: base 32K, size 2K; heap: base 34K, size 3K; stack: base 28K, size 2K), translate virtual address 100 (in the code) and virtual address 4200 (in the heap) to physical addresses. Which of the two printed candidates for 4200, 39016 or 34920, is right, and where does the 104 come from?

**Exercise 2.** Same registers and the same 16 KB address space (code from 0 to 2K, heap from 4K to 7K). (a) Translate virtual address 1000. (b) Translate virtual address 6000. (c) What happens for virtual address 7300? (d) Now do (b) again the way the hardware of [Section 1.5](class-1.md#sec-1-5) does it: write 6000 as a 14-bit binary number, take the segment from the top two bits with `(6000 & 0x3000) >> 12`, and the offset with `6000 & 0xFFF`. Check that you get the same offset as in (b).

**Exercise 3.** A free list holds four holes, in this order: 25, 12, 40 and 18 bytes. A request for 16 bytes arrives. Which hole does each policy choose, and how big is the leftover sliver: (a) best fit, (b) worst fit, (c) first fit, (d) next fit, if the previous search ended at the 12-byte hole?

**Exercise 4.** The 30-byte heap of [Section 2.2](class-1.md#sec-2-2): bytes 0 to 9 free, 10 to 19 in use, 20 to 29 free, so the free list is (addr 0, len 10) then (addr 20, len 10). Ignore headers, as [Section 2.3](class-1.md#sec-2-3) did, and use first fit. (a) `malloc(4)` arrives. Which address does it return, and what is the free list after? (b) Then the chunk at 10 to 19 is freed, with coalescing. What is the free list now? (c) Could a 15-byte request succeed now? Could it have succeeded without coalescing? (d) Finally the 4-byte chunk from (a) is freed. What is the free list?

**Exercise 5.** `umalloc.c` of [Section 3.2](class-1.md#sec-3-2), with its 16-byte header. (a) How many units does `malloc` reserve for requests of 100, 16 and 17 bytes? (b) Suppose the free list, starting at the node after `freep`, holds chunks of 4 units (at unit 200), 10 units (at unit 400) and 6 units (at unit 600), and then wraps around to `base`. A request for 100 bytes arrives. Which chunk is used, what size is left on the list, and at which unit does the returned pointer point? Where does `freep` point afterwards? (c) Right after that, a second request for 100 bytes arrives. What happens?

**Exercise 6.** The deck's exercise from [Section 4.4](class-2.md#sec-4-4). In the 64-byte address space of [Section 4.2](class-2.md#sec-4-2), with the page table 0 → 3, 1 → 7, 2 → 5, 3 → 2, translate virtual address 50. Show the split, the lookup and the glue, in bits.

**Exercise 7.** Same address space and table: translate virtual address 63.

**Exercise 8.** Same address space and table: what happens for virtual address 64? Explain in one or two sentences.

**Exercise 9.** Use the pagemap capture of [Section 4.5](class-2.md#sec-4-5) (four pages at 0x55f823c38000; frames 1148497, 1102928, 1080841 and 1343822). Give the physical address of virtual address 0x55f823c39fff, and of 0x55f823c3b000. (With 4 KB pages the last three hex digits are the offset. You will need to convert one frame number from decimal to hex; show the check.)

**Exercise 10.** The deck's exercise from [Section 6.4](class-2.md#sec-6-4). The array of OSTEP Figure 19.2: ten 4-byte integers starting at virtual address 100, 16-byte pages, TLB empty at the start. For each access `a[0]` to `a[9]`, write hit or miss, and give the hit rate. Then: (a) what is the hit rate with 32-byte pages? (b) what is the hit rate if the loop runs a second time right after the first? (c) In one sentence, what kind of program does a TLB help most?

**Exercise 11.** A different small machine: 8-bit virtual addresses (a 256-byte address space) and 32-byte pages. (a) How many pages are there, and how many bits are the VPN and the offset? (b) With the page table 0 → 6, 1 → 2, 2 → 7, 3 → 0, 4 → 5, 5 → 1, 6 → 3, 7 → 4, translate virtual address 77.

**Exercise 12.** A machine has 32-bit virtual addresses and 16 KB pages, with 4-byte page-table entries. How big is one process's flat page table? Compare with the 4 MB for 4 KB pages in [Section 5.1](class-2.md#sec-5-1), and say in one sentence what the comparison shows.

**Exercise 13.** This is the hard one, and Answer 13 walks every step, so do not worry if it takes a few tries. xv6 wrote the 64-bit page-table entry 0x21fcd85b (written without its leading zeros; the top 32 bits are all 0). Using the RISC-V entry layout of [Section 5.2](class-2.md#sec-5-2): (a) What are the flag bits, as letters in the order r w x u g a d, and is the entry valid? (b) What is the physical address of the frame? (c) Which row of the `info mem` capture in [Section 5.3](class-2.md#sec-5-3) is this entry? (Hint: dropping 10 bits is two and a half hex digits, so write the entry in binary first, drop the low ten bits, and regroup the rest in fours from the right; Answer 13 does it step by step.)

**Exercise 14.** In the `info mem` capture of [Section 5.3](class-2.md#sec-5-3), the page at 0x2000 is mapped `rw-----`, with no u bit. Explain in your own words why a page with no u bit protects a program from its own stack overflow. Then say what would go wrong if xv6 had mapped it `rw-u---` instead.

**Exercise 15.** In your own words, in four or five sentences: on a machine whose TLB has no ASID field, what must happen to the TLB when the OS switches from one process to another, why, and what does it cost? Use the two entries "VPN 10 → PFN 100" and "VPN 10 → PFN 170" of [Extra 22](class-2.md#extra-22) in your explanation.

## Answers {#answers}

**Answer 1.** Address A, 100, is in the code, which starts at virtual 0. The offset is 100 − 0 = 100, which is less than the code's size, 2K = 2048, so it is legal. Physical = base + offset = 32K + 100 = 32,768 + 100 = 32,868. Address B, 4200, is in the heap, which starts at virtual 4K = 4096. The offset is 4200 − 4096 = 104: that is where the 104 comes from. 104 is less than 3K = 3072, so it is legal. Physical = 34K + 104 = 34,816 + 104 = 34,920. The other candidate, 39016, adds the heap's base to the whole virtual address (4200 + 34,816), as if the heap started at virtual 0. It is wrong, and it is not even inside the heap: the heap occupies physical 34,816 to 34,816 + 3,072 = 37,888, and 39,016 is past its end. [Section 1.4](class-1.md#sec-1-4)'s figure draws both.

**Answer 2.** (a) 1000 is in the code (0 to 2047). Offset 1000 − 0 = 1000 < 2048. Physical 32,768 + 1000 = 33,768. (b) 6000 is between 4096 and 7168, so it is in the heap. Offset 6000 − 4096 = 1904 < 3072. Physical 34,816 + 1904 = 36,720. (c) 7300 is past the heap's end at 7K = 7168. As a heap address its offset would be 7300 − 4096 = 3204, and 3204 ≥ 3072, the heap's size. The check fails: the hardware traps, and the process gets a segmentation fault. (d) 6000 = 4096 + 1904, and 1904 = 1024 + 512 + 256 + 64 + 32 + 16, so in 14 bits 6000 is 01 0111 0111 0000 (in hex, 0x1770). `6000 & 0x3000` keeps bits 13 and 12: 01 0000 0000 0000 = 0x1000; shifted right 12, that is 1, the heap. `6000 & 0xFFF` keeps the low 12 bits: 0111 0111 0000 = 0x770 = 7 × 256 + 7 × 16 = 1792 + 112 = 1904. Same offset as in (b), with no subtraction: the top bits name the segment, so the bottom bits already count from the segment's start.

**Answer 3.** (a) Best fit takes the smallest hole that is big enough. The holes of at least 16 are 25, 40 and 18; the smallest is 18. Leftover 18 − 16 = 2 bytes. (b) Worst fit takes the largest, 40. Leftover 40 − 16 = 24. (c) First fit takes the first hole that is big enough, scanning from the front: 25 fits. Leftover 25 − 16 = 9. (d) Next fit starts where the last search ended, just after the 12-byte hole, so it looks at 40 first: it fits. Leftover 24. Best fit leaves the smallest sliver, 2 bytes, which nobody is likely to want; worst and next fit here leave a 24-byte hole that is still useful. No policy wins on every request; [Extra 9](class-1.md#extra-9) gives a verdict on each.

**Answer 4.** (a) First fit scans from the front: the hole at 0 has 10 bytes, enough for 4. Split: bytes 0 to 3 go out, so `malloc` returns 0, and the hole now starts at 4 with 10 − 4 = 6 bytes. Free list: (4, 6) then (20, 10). (b) The chunk 10 to 19 comes back. It ends at 20, where the free chunk (20, 10) starts, so they merge into (10, 20). And the free chunk (4, 6) ends at 4 + 6 = 10, where the returned chunk starts, so that merges too: (4, 26), bytes 4 to 29. Free list: one entry, (4, 26). (c) Yes: 26 ≥ 15. Without coalescing the list would have been (4, 6), (10, 10), (20, 10), with no single entry of 15, and the request would fail although 26 bytes were free. (d) The chunk 0 to 3 comes back and ends at 4, where (4, 26) starts. Merge: (0, 30). The whole heap is one free chunk again.

**Answer 5.** (a) The rule is `nunits = (nbytes + 16 − 1) / 16 + 1`, with integer division. For 100: (100 + 15) / 16 = 115 / 16 = 7, plus 1 = 8 units (128 bytes: 7 units of data, 112 bytes, hold the 100, and one unit is the header). For 16: 31 / 16 = 1, plus 1 = 2 units. For 17: 32 / 16 = 2, plus 1 = 3 units; one byte more than 16 costs a whole extra unit. (b) 100 bytes need 8 units. The search starts at the node after `freep`: the chunk of 4 units is too small; the chunk of 10 fits. It is not an exact fit, so it is split from the end: its size drops to 10 − 8 = 2 units, which stay on the list at unit 400. The tail, units 402 to 409, gets a header saying 8, and `malloc` returns `p + 1`, the address of unit 403, one header past the chunk's start. `freep = prevp`, so `freep` now points at the 4-unit chunk at unit 200, the node just before the chunk that was used. (c) The search starts after `freep`, at unit 400, now 2 units: too small. Then unit 600, 6 units: too small. Then `base`, size 0. Then the 4-unit chunk at unit 200, which is `freep` itself: too small, and the walk has come all the way around. So `malloc` calls `morecore(8)`, which asks `sbrk` for at least 4096 units (64 KB, [Extra 11](class-1.md#extra-11)), frees that block into the list, and the search continues and finds it.

**Answer 6.** 50 in six bits is 110010 (32 + 16 + 2). Split: the top two bits, 11, are page 3; the bottom four, 0010, are offset 2. Look up: the table says page 3 is in frame 2, which is 010 in three bits. Glue: 010 followed by 0010 is 0100010 = 32 + 2 = 34. Check: frame 2 starts at 2 × 16 = 32, and byte 2 of it is 34. Figure R.1 draws it.

<figure markdown="1">
![Figure R.1. Virtual address 50: page 3, offset 2, frame 2, physical address 34. From slide 49.](figs/answers50.png){width=72%}
<figcaption markdown="1">Figure R.1. Virtual address 50: page 3, offset 2, frame 2, physical address 34. From slide 49.</figcaption>
</figure>

**Answer 7.** 63 is 111111. Split: 11 = page 3, 1111 = offset 15. Look up: page 3 is in frame 2 = 010. Glue: 0101111 = 32 + 8 + 4 + 2 + 1 = 47. Check: 2 × 16 + 15 = 47. The last byte of the address space is the last byte of frame 2. Figure R.2 draws it, together with Exercise 8.

<figure markdown="1">
![Figure R.2. Virtual address 63 translates to 47; virtual address 64 needs a seventh bit, and there is no page 4. From slide 49.](figs/answers63_64.png){width=73%}
<figcaption markdown="1">Figure R.2. Virtual address 63 translates to 47; virtual address 64 needs a seventh bit, and there is no page 4. From slide 49.</figcaption>
</figure>

**Answer 8.** 64 in binary is 1000000, which needs seven bits, and the toy machine's addresses have only six. So 64 is not a virtual address on the toy machine at all: no instruction can even name it. If you force it anyway, the top bits would say "page 4", and the table has rows 0 to 3 only, so there is no entry to look up and the hardware must refuse. That is the trick in the question: an address space has a hard edge, set by the number of address bits. Real machines have the same edge, much farther out (2^38 for an xv6 process, [Section 5.3](class-2.md#sec-5-3)). What `badaddr` hit in [Extra 18](class-2.md#extra-18) is the other way an address can fail, and the more common one: an address that fits in the bits and lands on a real row, but the row's valid bit is 0, because the page was never given a frame.

**Answer 9.** 0x55f823c39fff: the last three hex digits, 0xfff, are the offset (4095, the very last byte of the page). The rest, 0x55f823c39, is page 1 of the four (the row at ...39000), and page 1's frame is 1102928. In hex, by dividing by 16 ([Appendix A](appendix.md#appendix-a)): 1,102,928 ÷ 16 = 68,933 remainder 0; 68,933 ÷ 16 = 4,308 remainder 5; 4,308 ÷ 16 = 269 remainder 4; 269 ÷ 16 = 16 remainder 13 (d); 16 ÷ 16 = 1 remainder 0; 1 ÷ 16 = 0 remainder 1. Remainders from last to first: 1, 0, d, 4, 5, 0, so 0x10d450. The capture's physical-address column agrees: 0x10d450000 for page 1. Glue in the offset: 0x10d450fff. Second, 0x55f823c3b000: offset 0x000, page 3 (the row at ...3b000), frame 1343822 = 0x14814e. Check it the other way: 1 × 1,048,576 + 4 × 65,536 + 8 × 4,096 + 1 × 256 + 4 × 16 + 14 = 1,048,576 + 262,144 + 32,768 + 256 + 64 + 14 = 1,343,822. Physical address 0x14814e000, the first byte of that frame.

**Answer 10.** Figure R.3 shows the ten accesses. `a[0]` is on page 6, which is not in the TLB: miss, and page 6's translation goes in. `a[1]` and `a[2]` are also on page 6: hit, hit. `a[3]` is on page 7: miss. `a[4]`, `a[5]`, `a[6]`: hit, hit, hit. `a[7]` is on page 8: miss. `a[8]`, `a[9]`: hit, hit. Three misses, seven hits: a hit rate of 70%.

<figure markdown="1">
![Figure R.3. The ten accesses: miss, hit, hit, miss, hit, hit, hit, miss, hit, hit. Seven hits out of ten. From slide 60.](figs/hitmiss_a.png){width=100%}
<figcaption markdown="1">Figure R.3. The ten accesses: miss, hit, hit, miss, hit, hit, hit, miss, hit, hit. Seven hits out of ten. From slide 60.</figcaption>
</figure>

(a) With 32-byte pages each page holds eight integers, and pages start at multiples of 32: 0, 32, 64, 96, 128. Address 100 is in the page that starts at 96 (96 = 3 × 32), at offset 100 − 96 = 4, so `a[0]` to `a[6]` fit in that page (offsets 4 to 28; `a[6]` ends at offset 31, the page's last byte), and `a[7]` (at address 128) to `a[9]` are on the next page. Two misses, eight hits: 80%. Bigger pages mean fewer misses, because more neighbors share one translation: spatial locality. (b) On a second run, pages 6, 7 and 8 are all still in the TLB. Ten hits: 100%. That is temporal locality: what was used a moment ago is used again. (c) A TLB helps most a program that keeps touching the same pages, or nearby addresses, for a while: loops over arrays, code that runs in a small region. A program that jumps to a new page on every access gets no help, as the column-order matrix of [Extra 24](class-2.md#extra-24) showed. Figure R.4 is the deck's three cards on the same points.

<figure markdown="1">
![Figure R.4. Spatial locality, page size, and temporal locality, the three lessons of the reveal. From slide 60, following textbook section 19.2.](figs/locality_cards.png){width=100%}
<figcaption markdown="1">Figure R.4. Spatial locality, page size, and temporal locality, the three lessons of the reveal. From slide 60, following textbook section 19.2.</figcaption>
</figure>

**Answer 11.** (a) 256 ÷ 32 = 8 pages. The offset must count 32 bytes, so it is 5 bits (2^5 = 32). The VPN must count 8 pages, so it is 3 bits (2^3 = 8). 3 + 5 = 8, the whole address. (b) 77 in eight bits is 01001101 (64 + 8 + 4 + 1). Top three bits: 010 = page 2. Bottom five: 01101 = 8 + 4 + 1 = 13. The table says page 2 is in frame 7 = 111. Glue: 111 01101 = 128 + 64 + 32 + 8 + 4 + 1 = 237. Check: 7 × 32 + 13 = 224 + 13 = 237.

**Answer 12.** 16 KB = 2^14 bytes, so the offset is 14 bits and the VPN is 32 − 14 = 18 bits. That is 2^18 = 262,144 entries. At 4 bytes each: 2^18 × 2^2 = 2^20 bytes = 1,048,576 bytes = 1 MB. With 4 KB pages the same machine needs 4 MB. Bigger pages make a smaller table, four times smaller for pages four times bigger, because there are fewer pages to keep track of. (Bigger pages also waste more memory inside each page when a program needs only part of one: internal fragmentation, which comes back in a later chapter.)

**Answer 13.** (a) The low ten bits are the flags. 0x21fcd85b ends in the hex digits 85b = 1000 0101 1011. Keep the low ten bits: 00 0101 1011. Reading from bit 0 upward: bit 0 (V) = 1, bit 1 (R) = 1, bit 2 (W) = 0, bit 3 (X) = 1, bit 4 (U) = 1, bit 5 (G) = 0, bit 6 (A) = 1, bit 7 (D) = 0 (bits 8 and 9 are the two software bits, both 0). As letters: r-xu-a-, and valid. (b) Shift the whole entry right by 10 bits to drop the flags. Ten bits is two and a half hex digits, so do it in binary: 0x21fcd85b = 0010 0001 1111 1100 1101 1000 0101 1011. Remove the low ten bits, and 22 bits are left: 0010000111111100110110. Regroup them in fours from the right; the top two bits are 00 and can be dropped, and the other twenty are 1000 0111 1111 0011 0110 = 8, 7, f, 3, 6 = 0x87f36. That is the frame number. The physical address is the frame number followed by 12 zero bits, three hex zeros: 0x87f36000. This is `PTE2PA` from [Section 5.2](class-2.md#sec-5-2), done by hand. (c) The frame at 0x87f36000 with flags `r-xu-a-` is the first row of the capture: the code page at virtual address 0x0000.

**Answer 14.** On the stack page, items are pushed toward lower addresses, and xv6 never gives the stack a second page. When a program calls functions deeper and deeper, its **stack pointer** (the register that holds the address of the newest item on the stack) moves from near 0x3fff, the top of the stack page, toward 0x3000, its lowest address. A program that pushes past the bottom of its one stack page does not get more stack. If it goes below 0x3000, the next byte it writes is inside the page at 0x2000. That page has a valid entry but no u bit, so a user program may not touch it. The hardware traps on the first such write, and the OS can see exactly what happened and stop the program. If the page were mapped `rw-u---` instead, the write would succeed silently. The overflowing stack would scribble over whatever was in that page, and the damage would show up later as a mysterious wrong answer or a crash far from the real cause. (Worse, the page below the guard, at 0x1000, holds the program's data.) The guard page turns a silent corruption into an immediate, precise trap. (In xv6 the guard page does have a frame behind it, 0x87f44000, because the kernel allocates the stack and the guard together and then clears the u bit on the guard.)

**Answer 15.** A model answer. Without an ASID, a TLB entry says only "VPN 10 is in frame 100"; it does not say whose VPN 10 that is. After a switch from P1 to P2, P2's own VPN 10 is in frame 170, but the TLB could still answer "frame 100" and let P2 read P1's memory. The hardware cannot tell such entries apart, so they must never be in the TLB together. Therefore the TLB is flushed on every context switch: the OS runs a privileged instruction, or the hardware does it when the base register changes, and every TLB valid bit becomes 0. The cost is that each process starts with an empty TLB every time it runs, and misses again on every page it uses; the more often the OS switches, the more of those misses it pays. xv6 pays exactly this cost, and more often than a context switch requires, because it flushes on every trap and every return.

## Q&A {#student-questions}

Questions from Assignment 1, quoted as you wrote them, in the order the guide covers them. Each one says where to reread, then answers.

### Q1. "In my mind I am asking 'how is shifting 110000 >> 4 is 11, I thought the result would be 000011 which in binary is 3. It does state this, I'm just confused why the example calls it 11." {#sq-1}

Where to reread: [Appendix A, the four bit operators](appendix.md#appendix-a-operators), and [Extra 13](class-2.md#extra-13).

You had it right. That 11 was binary, so it is the same number as 000011, which is 3. Think of it the way the hardware does. A register has a fixed number of bits. When you shift right by 4, every bit moves four places toward the low end, the four that fall off are gone, and four zeros come in at the high end. So in six bits, 110000 >> 4 = 000011. The tables now write it that way.

### Q2. "Why are the first 3 of the PNF hexadecimal and the latter 4 binary?" {#sq-2}

Where to reread: [Section 4.3](class-2.md#sec-4-3), step 3.

They are all binary. The three bits are the frame number, the four bits are the offset. The frame number has three bits and the page number only two because physical memory in the example is bigger than the address space: 128 bytes, eight frames, so you need three bits to name a frame; the address space is 64 bytes, four pages, so two bits name a page. The offset is four bits on both sides, because a page and a frame are the same size. Real machines work the same way. On xv6's RISC-V, a virtual address is 39 bits and a physical address can be 56, and the difference is all in the frame-number part.

### Q3. "I'd like more detail on why the code page's PTE is read three times per loop trip, and why reading the PTE doesn't itself need translating." {#sq-3}

Where to reread: [Section 6.1](class-2.md#sec-6-1), [Section 5.1](class-2.md#sec-5-1), and [Extra 20](class-2.md#extra-20).

Three times because the loop body is three instructions. Each instruction has to be fetched from memory, and each fetch is a memory access with its own translation. Without a TLB the hardware does not remember what it translated a moment ago, so it reads the code page's entry again for the second instruction and again for the third. The TLB is the fix for exactly this.

Reading the PTE does not need translating because satp holds a physical address. In [Section 5.3](class-2.md#sec-5-3), satp = 0x8000000000087f33, which means the table starts at physical address 0x87f33000. The MMU adds the row's position to that and reads memory at a physical address, no translation involved. The frame numbers inside the table are physical too. So the OS only ever writes physical addresses into satp and into the table, and the hardware only translates the addresses the program uses.

### Q4. "I didn't understand what decides which memory references are 'wanted' and which are 'hardware overhead.'" {#sq-4}

Where to reread: [Section 6.1](class-2.md#sec-6-1).

A reference is wanted if the program's own instruction caused it: fetching the instruction, or the load or store the instruction does. A reference is overhead if its only purpose is to read a page-table entry. In the loop of [Section 6.1](class-2.md#sec-6-1), the four fetches and stores are wanted and the four table reads are overhead.

### Q5. "I wasn't sure what a TLB actually is and where it sits. I'd like more detail on why it's called 'fully associative' and what the hardware does to check every slot at once." {#sq-5}

Where to reread: [Section 6.2](class-2.md#sec-6-2).

A TLB is a small cache inside the MMU. Each slot holds one translation: a VPN, the frame it maps to, and the permission bits. On a hit the page table is not read at all.

Fully associative means a translation can sit in any slot. There is no rule like "VPN 7 goes in slot 7". So a lookup has to ask every slot, and the hardware does that by giving every slot its own small comparator. The VPN being looked up goes to all of them at once, each compares it with what it holds, and the one that matches hands out its frame number. That is why a TLB is fast and also why it has to be small: a thousand slots means a thousand comparators working at the same time.

### Q6. "Another thing I would appreciate clarification on is the difference between a TLB miss and a page fault, since both seem to involve difficulties accessing memory." {#sq-6}

Where to reread: end of [Section 6.3](class-2.md#sec-6-3); page faults in [Section 5.3](class-2.md#sec-5-3) and [Extra 18](class-2.md#extra-18).

A TLB miss means the cache does not have the translation yet. The hardware reads the entry from the page table, puts it in the TLB, and retries. The program never notices. It costs one extra memory read and nothing else. Every page misses the first time it is touched; that is normal.

A page fault means the page table itself says no. Either the entry's valid bit is 0, or the access is a kind the entry forbids, like writing a read-only page or a user program touching a kernel page. Then the hardware stops the instruction and traps into the OS. The OS decides what happens next: kill the process, as in [Section 5.3](class-2.md#sec-5-3), or, next week, bring the page in from disk and retry.

A page fault always starts with a TLB miss, because the entry has to be read before it can be found bad. But almost every miss ends with a hit on the retry, not with a fault.

### Q7. "I would also like to understand how the TLB decides which translations to remove when it becomes full." {#sq-7}

Where to reread: [Extra 23](class-2.md#extra-23), card 1.

That is the replacement policy, and it is built into the chip. The two usual choices are LRU, which throws out the entry that has gone unused the longest, and random. Random sounds worse but has one advantage: if a loop touches one more page than the TLB has slots, LRU misses on every single access, while random still hits some of the time.

### Q8. "I don't quite understand everything happening with the TLB when it's doing context switches. I think it's confusing me just because there's so many things happening at the same time with caching, address spaces, etc." {#sq-8}

Where to reread: [Extra 22](class-2.md#extra-22) first, then [Section 6.5](class-2.md#sec-6-5), then [Extra 21](class-2.md#extra-21).

Take it in four steps, and stop after each one.

Step 1, the problem. There is one TLB. Process P1 has virtual page 10 in frame 100. Process P2 has virtual page 10 in frame 170. The OS switches from P1 to P2, but the TLB still holds P1's entry. If P2 now touches its page 10, the TLB may answer "frame 100", and P2 reads P1's memory.

Step 2, two fixes. Fix 1: empty the TLB on every switch. Safe, but every process starts cold. Fix 2: stamp each TLB entry with a process number, the ASID, and only accept entries whose stamp matches the running process. Nothing is thrown away.

Step 3, what xv6 does. Fix 1. The `sfence.vma zero, zero` next to every write of satp is the flush.

Step 4, an xv6 detail you can skip the first time. xv6 also has a page table for the kernel itself, and it switches to it on every trap and back on every return. So xv6 flushes on every trip into and out of the kernel, not only when the process changes. Simple and slow. Real kernels use Fix 2 to avoid this.

[Extra 22](class-2.md#extra-22) covers steps 1 to 3. [Extra 21](class-2.md#extra-21) is step 4.

### Q9. "I understood that two processes can both have a virtual page 10 in different frames, so the TLB needs a way to tell them apart. What confused me was how an ASID does that. I'm still working on how the TLB uses the ASID during a lookup, why xv6 leaves it at 0 (the MAKE_SATP macro never sets bits 44 to 59), and what happens when the OS runs out of ASIDs." {#sq-9}

Where to reread: [Extra 22](class-2.md#extra-22), [Section 6.5](class-2.md#sec-6-5), and the global bit in [Extra 23](class-2.md#extra-23).

How the lookup uses it. With ASIDs, each TLB slot holds an ASID and a VPN together with the frame. The comparators from Q5 now check both: the VPN must match, and the slot's ASID must match the ASID of the running process, which the OS has written into satp. A slot stamped with another process's ASID just does not match. It is not thrown away; it is still there when that process runs again. The one exception is the global bit G. A slot marked global matches whatever the ASID, which is how kernel pages shared by every process get by with one slot.

Why xv6 leaves it at 0. The macro is the how; the why is that it is a choice. Using ASIDs means the kernel has to hand out the numbers, keep track of who has which, write the right one into satp at every switch, and flush just that number's entries when a process exits. xv6 is a teaching kernel and keeps it simple: everyone is ASID 0, and the whole TLB is flushed at every switch.

Running out. RISC-V reserves 16 bits for the ASID, so up to 65,536 of them, though a given chip may implement fewer. Linux handles running out with a generation counter: when the numbers are all used, it flushes the whole TLB once, starts a new generation, and hands the numbers out again from the beginning. So the fallback is Fix 1, done once in a long while instead of on every switch.

### Q10. "I would like more details on why accessing the same data in a different order can cause such a significant difference in execution time. I understand that this has something to do with TLB misses, but I am still confused about why accessing different pages causes such a large performance difference." {#sq-10}

Where to reread: [Extra 24](class-2.md#extra-24).

Two caches miss at the same time when you walk the matrix by column. The TLB misses because every step jumps 16 KB, which is a new page, and one column visits 4096 pages, more than the roughly 2000 the TLB can hold. By the time the next column comes back to a page, its entry is gone. The data cache misses too. It holds recent 64-byte lines of memory. Walking a row, you get 16 integers out of every line you fetch. Walking a column, you get one integer per line and then jump away, so every access fetches a fresh line. The `tlb2.c` experiment in [Extra 24](class-2.md#extra-24) is designed so only the TLB is in play, and there a miss costs about five times a hit. The 15x of `matrix.c` is the TLB and the data cache together. The lesson is the same either way: walk memory in the order it is laid out.

### Q11. "I couldn't tell what the attr column (r-xu-a-, rw-----, and so on) meant. I'm still unsure why a and d are set by the hardware, why the heap pages have no a bit even though the kernel zeroed them, and why the guard page works just by missing the u bit." {#sq-11}

Where to reread: [Section 5.3](class-2.md#sec-5-3), [Section 5.2](class-2.md#sec-5-2), and [Answer 14](#answers).

The letters are the flag bits in the order r w x u g a d. A letter means the bit is 1, a dash means 0. There is no letter for the valid bit because `info mem` only prints valid entries.

a and d are set by the hardware because only the hardware sees every access. Telling the OS about each read and write would mean a trap on every access, which is far too slow. So the MMU sets a on the first read and d on the first write, and the OS looks at the bits later, when it has to pick a page to push out to disk (next week).

The heap pages have no a bit because the bit belongs to the entry, not the frame. The kernel's `memset` did write zeros into those frames, but it went through the kernel's own page table, which maps all of RAM. The process's three entries were never used for that, so their a bits stayed 0. The first time the process itself touches a heap page, the a bit appears.

The guard page works because the hardware checks the u bit on every access from a user program, in the same step as the valid bit. For the program, a page without u is just as untouchable as a page with no entry, and the trap is the same trap: scause 13 for a load, 15 for a store. The only difference is that the guard page has a frame behind it. An OS could save that frame by leaving the entry invalid instead; the trap would be the same.

### Q12. "I'm still building speed at converting between hex and binary and at regrouping bits, such as decoding the PTE 0x21fcd85b in Exercise 8, where 10 flag bits don't line up with the hex digits." {#sq-12}

Where to reread: [Answer 13](#answers) (this was Exercise 8 in the earlier edition), and the macros in [Section 5.2](class-2.md#sec-5-2).

They do not line up, because 10 is not a multiple of 4. Two ways to deal with it. In code, let the shifts do the work: `PTE_FLAGS(pte)` is `pte & 0x3FF`, and `PTE2PA(pte)` is `(pte >> 10) << 12`. On paper, turn only the last three hex digits into binary, which is 12 bits; the low 10 are the flags, and the top 2 of those 12 belong to the frame number. Answer 13 does it step by step. It helps to write 0x3FF out once as 11 1111 1111; after that the pattern is familiar.

### Q13. "A practical example showing how the TLB handles consecutive memory accesses would help me better understand why memory access patterns matter for program performance." {#sq-13}

Where to reread: [Section 6.4](class-2.md#sec-6-4), [Exercise 10](#exercises) and [Answer 10](#answers).

That example is in the guide. [Section 6.4](class-2.md#sec-6-4) puts ten array elements on 16-byte pages, Exercise 10 asks you to mark each access hit or miss, and Answer 10 walks through all ten with a drawing. It is optional, but it is the quickest way to see why locality matters. Ten minutes with a pencil.
