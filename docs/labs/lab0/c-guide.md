# A C survival guide for the kernel labs

You already know how to program and how basic data structures work. C is a smaller, older,
lower-level language than what you have probably used, and the kernel labs only need a
narrow slice of it. This guide covers exactly that slice. Read it once now, and keep it open
while you work. You will not need anything beyond what is here.

## Compiling and the pieces of a C program

C separates **declarations** (a promise that a function or type exists) from
**definitions** (the actual code). A header file (`.h`) holds declarations; a `.c` file holds
definitions. When you add a new function that other files call, you declare it in a header and
define it in a `.c`. This is why several lab steps say "add a prototype in `user.h`": that is
the declaration that lets other code call your function.

The build is driven by a `Makefile`. You never invoke the compiler by hand; you run `make`.
Two commands matter:

- `make qemu`: build xv6 and run it.
- `make grade`: build xv6 and run the automatic tests.

If you add a **new program** `user/foo.c`, you must also add `$U/_foo` to the `UPROGS` list in
the `Makefile`, or the build won't include it. Forgetting this is the single most common early
mistake.

## Types and sizes

C makes you care about the size of a number. The kernel uses fixed-size names:

| name     | meaning                    |
|----------|----------------------------|
| `char`   | 1 byte (also used for text)|
| `int`    | 32-bit signed integer      |
| `uint`   | 32-bit unsigned            |
| `short`  | 16-bit signed              |
| `uint64` | 64-bit unsigned            |
| `uint64` | also how pointers are held |

A **pointer** is a variable holding a memory address. `char *p` means "p holds the address of
a char". `*p` reads the char at that address; `p[3]` reads the char three bytes further on.
`&x` is "the address of x". Pointer bugs are the main hazard in these labs; when something
crashes, suspect a pointer that points somewhere wrong.

## Strings

A C string is just a `char` array ending in a zero byte (`'\0'`, written `0`). There is no
length stored; code walks the array until it hits the zero. Useful functions (already
provided in `user/ulib.c` and `kernel/string.c`):

- `strlen(s)`: length up to the `'\0'`.
- `strcmp(a, b)`: 0 if equal (note: **0 means equal**).
- `strcpy(dst, src)` / `safestrcpy(dst, src, n)`: copy a string.
- `memmove(dst, src, n)` / `memset(dst, c, n)`: copy / fill raw bytes.

The kernel has `strncmp` but **not** `strcmp`; user programs have both. If the compiler says
`strcmp` is an implicit declaration inside `kernel/`, use `strncmp` with a length instead.

## Structs

A `struct` groups fields, like a simple record:

```c
struct point { int x; int y; };
struct point p;
p.x = 3;              // through a value
struct point *pp = &p;
pp->y = 4;            // through a pointer: -> instead of .
```

You will add fields to existing structs (for example a counter to `struct proc`). Add your
field, then read/write it as `p->field`.

## Common patterns you'll actually use

Reading a file a chunk at a time:

```c
char buf[512];
int n;
while((n = read(fd, buf, sizeof(buf))) > 0){
  for(int i = 0; i < n; i++){
    // process buf[i]
  }
}
```

Walking a linked list (the free list in the allocator is one):

```c
for(struct run *r = head; r != 0; r = r->next){
  // use r
}
```

Bit masks (used by the sandbox of Lab 2):

```c
if(mask & (1L << SYS_open))   // is the bit for SYS_open set?
mask |= (1L << SYS_open);      // set that bit
```

## printf in the labs

`printf` in xv6 is a cut-down version. It understands only:

- `%d` decimal int, `%x` hex, `%c` a character, `%s` a string,
- `%p` a pointer (prints `0x` + 16 hex digits), `%ld`/`%lx` for 64-bit values.

It does **not** understand width or padding like `%08x`. If you need zero-padded 16-digit hex,
use `%p`. In the kernel, `printf` is for debugging and panics; in user programs it prints to
the screen.

## Debugging when it crashes

- A **panic** prints a message and stops the kernel. Read the message; it usually names the
  function.
- An `scause` number in a trap message tells you the fault type (13 = load page fault,
  15 = store page fault) and `stval` is the bad address, often `0` (a null pointer) or a
  wild value (a corrupted pointer).
- Add `printf(...)` calls to see what your code is doing. This is the fastest tool you have.
- For the harder labs, `make qemu-gdb` plus `gdb` lets you set breakpoints; the lab guide
  shows how.

That's the whole toolkit. When a lab step mentions a C feature not covered here, it will
explain it inline.
