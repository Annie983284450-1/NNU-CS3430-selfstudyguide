# Step 5. `attack`: reading uninitialized memory

## Why this step

The question: what is left in a page after the process that used it exits?

When a process exits, its pages return to the kernel's free list, and the next
process that requests memory may receive the same pages. A correct kernel clears
a page before handing it out, so a program can never observe the previous
contents. This tree has that clearing switched off, in two places, on purpose.
This is a known class of defect, called an uninitialized-memory disclosure. The
exercise is to observe it directly: one program stores a value and exits, a second
program requests memory and reads what the first one left. This is the standard
xv6 "attack" exercise, and the point is defensive: it shows why the clearing step
in a real kernel is a correctness requirement, not an optimization.

## What was switched off

The lab config defines `LAB_SYSCALL`, and three `memset` calls are wrapped in
`#ifndef LAB_SYSCALL`, so they compile out:

- `kernel/kalloc.c` line 59: `memset(pa, 1, PGSIZE);` in `kfree`, which normally
  fills a freed page with the byte 1. Its `#ifndef LAB_SYSCALL` is line 57.
- `kernel/kalloc.c` line 88: `memset((char*)r, 5, PGSIZE);` in `kalloc`, which
  normally fills a page with 5 as it is handed out. Its `#ifndef` is line 86.
- `kernel/vm.c` line 263: `memset(mem, 0, sz);` in `uvmalloc`, which normally
  zeroes a newly mapped user page. Its `#ifndef` is line 262.

With all three gone, a page keeps its bytes from `kfree` to the next `kalloc` to
the next `uvmalloc`, and those bytes reach the next program unchanged. You do not
edit any of these. `secret.c` is also fixed; do not change it.

## The picture

```
   time --->

   (1) secret runs            (2) secret exits            (3) attack runs
   +------------------+       +------------------+        +------------------+
   | page P           |       | page P (freed,   |        | page P handed to |
   |  "This may help."|  -->  |  not cleared)    |  -->   | attack by sbrk   |
   |  <the value>     |       |  "This may help."|        |  "This may help."|
   +------------------+       |  <the value>     |        |  <the value> <---+-- attack
   writes the value,          +------------------+        +------------------+   scans and
   then exits                 bytes survive in the        same bytes come back   prints it
                              free list                   to a new owner
```

Nothing is copied from one program to the other. It is the same physical page,
reused. `attack` can read it only because the clearing step is gone.

## What `secret.c` does

```c
#define DATASIZE (8*4096)

char data[DATASIZE];

int
main(int argc, char *argv[])
{
  if(argc != 2){
    printf("Usage: secret the-secret\n");
    exit(1);
  }

  strcpy(data, "This may help.");

  strcpy(data + 16, argv[1]);

  exit(0);
}
```

It writes the fixed marker `This may help.` at the start of a large global buffer,
and the word you gave it 16 bytes after the start of that marker. Then it exits,
which frees the buffer's pages.

## Do this, part A: see the empty stub

`user/attack.c` exists with an empty `main`. Build and run it as is:

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ secret mySecret1
$ attack
```

## You should see

```
$ secret mySecret1
$ attack
$
```

`attack` prints nothing: its `main` only calls `exit(1)`. Quit xv6.

## Do this, part B: write the body of `main`

Edit `user/attack.c`. Replace `// Your code here.` and the `exit(1);` with the
scan. Three blanks:

```c
int
main(int argc, char *argv[])
{
  int npages = 64;
  char *start = sbrk(PGSIZE * npages);       // ask for 64 pages
  if(start == (char*)-1){
    printf("attack: sbrk failed\n");
    exit(1);
  }
  char *end = start + PGSIZE * npages;

  for(char *p = start; p + 32 < end; p++){
    if(strcmp(p, "____________") == 0)       // (1) the marker
      printf("%s\n", p + ____);              // (2) where the value is
  }
  exit(__);                                  // (3)
}
```

Hints. (1) The exact marker string `secret.c` wrote, `This may help.` (2) The
value is 16 bytes after the start of the marker. (3) 0, a clean exit.

Two things that decide whether it works. First, ask for enough memory: one or two
pages might not reclaim `secret`'s page, so the reference asks for 64
(`PGSIZE * 64`). `PGSIZE` is 4096, from `kernel/riscv.h`; `attack.c` already
includes `kernel/riscv.h`. Second, print every match, not the first. Reclaimed
pages can hold more than one copy of the marker, including a stale copy from an
earlier run and `attack`'s own copy of the string literal. If you stop at the
first, you often print the wrong one, and the program passes some runs and fails
others. Scanning the whole block and printing every candidate is why the loop runs
to `end`.

??? success "The answer: the three blanks"

    (1) `"This may help."` (2) `16`. (3) `0`.

??? success "The answer: `user/attack.c`, complete"

    ```c linenums="1"
    #include "kernel/types.h"
    #include "kernel/fcntl.h"
    #include "user/user.h"
    #include "kernel/riscv.h"

    // secret.c wrote "This may help." at the start of a buffer and the real secret
    // 16 bytes later, then exited -- freeing its memory.  On this (deliberately
    // buggy) xv6, freed pages are not zeroed, so the allocator hands those bytes
    // back to us.  We grab a large block of memory and, wherever the marker still
    // appears, print what follows it.  (Reclaimed pages may hold several stale
    // markers, so we report every candidate; the true secret is among them.)

    int
    main(int argc, char *argv[])
    {
      int npages = 64;
      char *start = sbrk(PGSIZE * npages);
      if(start == (char*)-1){
        printf("attack: sbrk failed\n");
        exit(1);
      }
      char *end = start + PGSIZE * npages;

      for(char *p = start; p + 32 < end; p++){
        if(strcmp(p, "This may help.") == 0)
          printf("%s\n", p + 16);
      }
      exit(0);
    }
    ```

    `sbrk(PGSIZE * 64)` grows the program by 64 pages and returns the old top, a
    pointer to the start of the new block. Because the clearing step is gone, that
    block holds whatever the last owner left. The loop walks it one byte at a time;
    `strcmp(p, "This may help.")` is 0 exactly where the marker sits, and the value is
    16 bytes past the marker's first byte, so `p + 16` points at it. `p + 32 < end`
    keeps the scan inside the block. Printing every match is the point, not a
    shortcut.

## Do this, part C: run it

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ secret mySecret1
$ attack
$ attack
```

## You should see

```
$ secret mySecret1
$ attack
(null)
mySecret1
$ attack
mySecret1
(null)
%s

```

`mySecret1` is there, on its own line. The other lines are the extra candidates,
and they are real text, not empty values. The marker `This may help.` is also a
string constant inside the programs `secret` and `attack` themselves, in their
read-only data (the part of a program file that holds its fixed strings). In
`secret`, the string stored 16 bytes after that constant is `(null)`, which
`printf` keeps for printing a null pointer. In `attack`, it is the format string
`%s`. When a program exits, the pages that held its code and constants are freed
without being cleared too, so `attack` finds these extra copies of the marker and
prints what sits 16 bytes after each. That is exactly why the loop prints every
match. The two `attack` runs give different extra lines, because different pages
come back each time; `mySecret1` appears in both.

!!! theory "Connect to theory: protection needs the kernel to wipe pages between owners"

    **What the theory says.** Protection is one of the three goals of memory
    virtualization: no process may read another's memory
    ([Week 3, Section 1.5](../../w03/class-1.md#sec-1-5)). The kernel hands out physical
    pages with `kalloc` and takes them back with `kfree`, and a freed page simply goes
    back on the free list for the next user. In a normal xv6, `kfree` and `kalloc` fill
    each page with junk bytes (1 and 5) so that nobody's old data survives in it
    ([Week 4, Section 3.3](../../w04/class-1.md#sec-3-3)), and every new user page is zeroed
    before the program gets it, so a program sees only zeros
    ([Week 4, Extra 12](../../w04/class-1.md#extra-12)).

    **What this run showed.** With those fills compiled out, `attack` printed
    `mySecret1`, a word that another process wrote before it exited.

    **Why the run confirms the theory.** No page table was broken and no check was
    skipped while `secret` was alive. The leak happened after it exited, through a
    reused page. So isolation needs more than address translation: it also needs the
    kernel to wipe a page between owners, which is the job of exactly the lines this
    lab switched off.

You can see the two constants yourself (optional):

**On Ubuntu (or Mac), in the lab folder:**

```
$ riscv64-linux-gnu-objdump -s -j .rodata user/_secret
$ riscv64-linux-gnu-objdump -s -j .rodata user/_attack
```

```
user/_secret:     file format elf64-littleriscv

Contents of section .rodata:
 08d8 00000000 00000000 55736167 653a2073  ........Usage: s
 08e8 65637265 74207468 652d7365 63726574  ecret the-secret
 08f8 0a000000 00000000 54686973 206d6179  ........This may
 0908 2068656c 702e0000 286e756c 6c290000   help...(null)..
 0918 30313233 34353637 38394142 43444546  0123456789ABCDEF
 0928 00                                   .

user/_attack:     file format elf64-littleriscv

Contents of section .rodata:
 08f8 00000000 00000000 61747461 636b3a20  ........attack:
 0908 7362726b 20666169 6c65640a 00000000  sbrk failed.....
 0918 54686973 206d6179 2068656c 702e0000  This may help...
 0928 25730a00 00000000 286e756c 6c290000  %s......(null)..
 0938 30313233 34353637 38394142 43444546  0123456789ABCDEF
 0948 00                                   .
```

(Trailing spaces at the ends of lines were removed.) In `_secret` the constant starts at `0900` and `(null)` at `0910`, 16 bytes later.
In `_attack` the constant starts at `0918` and `%s` at `0928`. (On a Mac with
`riscv64-elf-objdump` the addresses can differ; the 16-byte gap is what matters.)

**On Ubuntu (or Mac), in the lab folder:**

```
$ ./grade-lab-syscall attack
```

```
== Test attack == attack: OK (1.5s)
```

The grader plants a random word, runs `secret`, then runs `attack` twice, and
checks that the word appears on a line by itself. Extra lines are fine.

!!! question "Think"

    Your `attack` prints several lines, and only one is the real value. The grader
    still passes. If instead `attack` printed only the first marker it found, the
    grader would pass on some runs and fail on others. Explain why "print the first
    match" is unreliable here, in terms of what else is in the pages `sbrk` returned.

    Answer it in your own words before you read on. The answer is not printed here.
