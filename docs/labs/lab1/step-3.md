# Step 3. `memdump`: memory is bytes, a type is a way of reading them

## Why this step

The question: if memory is only bytes, what is a type?

In [Step 2](step-2.md) the kernel handed you 55 bytes and you decided where each word ended. That
decision was a rule for reading bytes, and a rule for reading bytes is what a type is.
Nothing in memory says `int`, or `char`, or pointer. Take one box and read it as a
letter, you get `a`. Take two and read them as a number, you get 25185. Take four as an
`int`, you get 1684234849. The bytes never moved; only the rule changed. `memdump` is a
program for making that rule visible, and in [Step 4](step-4.md) you will point it at a directory to
check, rather than believe, that a directory is a file full of 16-byte records. Step 3
builds the microscope. [Step 4](step-4.md) looks through it.

## The tool: what `memdump` is

`memdump` is already in your folder and already in `UPROGS`. `main()` is written; the
function `memdump()` at the bottom is yours. Two ways to run it:

```
$ memdump                               no argument: five built-in examples from main()
$ echo abcdefgh12345678 | memdump h     one argument: argv[1] is the format string,
25185                                   the bytes come from standard input (up to 512)
```

Each letter of the format string is one field: take this many bytes from `data`, print
them this way, move `data` forward by that many bytes.

| letter | bytes | printed as | on `abcdefgh12345678` |
|---|---|---|---|
| `c` | 1 | one character | `a` |
| `h` | 2 | a short, decimal | `25185` |
| `i` | 4 | an int, decimal | `1684234849` |
| `p` | 8 | the low 32 bits, in hex | `64636261` |
| `s` | 8 | a pointer; print the string it points at | (Example 3 prints `another`) |
| `S` | the rest | the bytes themselves, as a string, then stop | `abcdefgh12345678` |

Where the letters come from: Example 4 in `main()` is `memdump("pihcS", &example)` on a
struct with a pointer, an int, a short, a char and an 8-byte array, one letter per field
in order. Example 5 reads the same struct as `"sccccc"` and prints `hello`, `w`, `o`, `r`,
`l`, `d`: the int 1819438967 is 0x6C726F77, and its four bytes are the letters `worl`.
The same bytes, an int one moment and four characters the next.

## The picture

```
   echo abcdefgh12345678 | memdump p

   the bytes as they sit in memory, lowest address first:
   addr:   +0   +1   +2   +3   +4   +5   +6   +7
   byte:   'a'  'b'  'c'  'd'  'e'  'f'  'g'  'h'
   hex:    61   62   63   64   65   66   67   68

   read as an 8-byte number (RISC-V is little-endian: byte +0 is the LOW end):
        0x 68 67 66 65 64 63 62 61
   low 32 bits, printed:   64636261
```

Same eight bytes. Read them one at a time with `c` and you get `a b c d`. Read
the first four as an `int` and you get 1684234849, which is 0x64636261. Read
eight as a pointer-sized number and print the low half, and you get `64636261`.
The bytes never changed. Only the format string did.

## Do this

`memdump` is already in `UPROGS`. Open `user/memdump.c`. `main` is written. The
function `memdump(char *fmt, char *data)` at the bottom is yours. Here is the
`i` case, which is the pattern for all of them. Fill in `h` and `p`.

```c
void
memdump(char *fmt, char *data)
{
  for(int i = 0; fmt[i]; i++){
    switch(fmt[i]){
    case 'i': {                 // 4-byte int, decimal
      int v;
      memmove(&v, data, 4);     // copy the bytes into a real int
      printf("%d\n", v);
      data += 4;                // step past what we consumed
      break;
    }
    case 'h': {                 // 2-byte short, decimal
      ____ v;
      memmove(&v, data, __);
      printf("%d\n", (int)v);
      data += __;
      break;
    }
    case 'p': {                 // 8-byte value, print the low 32 bits in hex
      ______ v;
      memmove(&v, data, __);
      printf("%x\n", (uint32)v);
      data += __;
      break;
    }
    case 'c':                   // one byte, as a character
      printf("%c\n", data[0]);
      data += 1;
      break;
    // 's' and 'S' are yours to do on your own:
    //   's': the next 8 bytes ARE a pointer to a string. Follow it, print
    //        the string it points at, then step data past 8 bytes.
    //   'S': the string starts HERE. Print from data, then stop.
    }
  }
}
```

??? success "The answer: `memdump()`, complete (lines 60 to 104 of `user/memdump.c`)"

    ```c linenums="60"
    void
    memdump(char *fmt, char *data)
    {
      for(int i = 0; fmt[i]; i++){
        switch(fmt[i]){
        case 'i': {                 // 4-byte int, decimal
          int v;
          memmove(&v, data, 4);
          printf("%d\n", v);
          data += 4;
          break;
        }
        case 'p': {                 // 8-byte value, hex
          uint64 v;
          memmove(&v, data, 8);
          printf("%x\n", (uint32)v);
          data += 8;
          break;
        }
        case 'h': {                 // 2-byte int, decimal
          short v;
          memmove(&v, data, 2);
          printf("%d\n", (int)v);
          data += 2;
          break;
        }
        case 'c':                   // 1 byte, ASCII char
          printf("%c\n", data[0]);
          data += 1;
          break;
        case 's': {                 // 8-byte pointer to a C string
          char *p;
          memmove(&p, data, 8);
          printf("%s\n", p);
          data += 8;
          break;
        }
        case 'S':                   // rest of data is a null-terminated string
          printf("%s\n", data);
          return;
        default:
          break;
        }
      }
    }
    ```

    `h`: a `short`, 2 bytes, cast to `int` so that `%d` gets an int. `p`: a `uint64`, 8
    bytes; `(uint32)v` keeps the low 32 bits and `%x` prints them in hex. `c`: one byte
    needs no `memmove`; `data[0]` is the byte. `s`: the 8 bytes are a pointer; copy them
    into a `char *p` and print the string `p` points at, one dereference. `S`: the string
    starts here; print `data` itself and return. Any other letter is ignored.

    Why `memmove` and not `*(int*)data`: `data` may not be aligned to 4 or 8 bytes. On
    RISC-V a misaligned load can trap. Copying the bytes into a properly aligned local
    variable is always safe. `main()` (lines 7 to 58) is already in your file; lines 60 to
    104 are everything you write.

Then:

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ echo abcdefgh12345678 | memdump cccc
$ echo abcdefgh12345678 | memdump h
$ echo abcdefgh12345678 | memdump ii
$ echo abcdefgh12345678 | memdump p
```

## You should see

```
$ echo abcdefgh12345678 | memdump cccc
a
b
c
d
$ echo abcdefgh12345678 | memdump h
25185
$ echo abcdefgh12345678 | memdump ii
1684234849
1751606885
$ echo abcdefgh12345678 | memdump p
64636261
```

!!! question "Think"

    `memdump h` printed 25185. Show, with the two bytes and their hex values, why
    it is 25185 and not 24930.

    Answer it in your own words before you read on. The answer is not printed here.
