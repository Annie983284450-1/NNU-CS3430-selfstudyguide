# Step 2. `wf`: reading a file is a loop of `read()` calls

## Why this step

The question: the kernel gave you bytes. Who decides where a word ends?

In [Step 1](step-1.md) you asked the kernel for one thing and got a number back. Now you ask for a
file, and what comes back is a pile of bytes and a count, nothing more. Picture a mail
slot: someone pushes a long letter through it a handful of pages at a time. The slot does
not know where a sentence ends, or a word. It only knows how many pages it just pushed
through. Working out where the words are is your job, from the pages. `wf` (word
frequency) is a new program you write: `wf wf.txt` prints every distinct word in the file
once, with how many times it appeared, in the order the words first appear.

## The picture

```
   open("wf.txt", O_RDONLY)  -->  fd 3          the file, 55 bytes:
                                                 the quick brown fox\n
   read(3, buf, 512) --> 55 bytes into buf       the lazy dog\n
   read(3, buf, 512) --> 0   (end of file)       the fox jumps\n
                                                 the fox\n

   buf:  t h e _ q u i c k _ b r o w n _ f o x \n t h e _ l a z y ...
         [word ] [word ] [word] [word]   [word] [word]
          ^ a word is a run of non-space bytes; a space or \n ends it
```

Every process starts with file descriptors 0, 1 and 2 ([Week 2, Section 1.2](../../w02/class-1.md#sec-1-2)).
`open` returns the next free number, which is 3. `read` fills your buffer with
as many bytes as it can and tells you how many. It returns 0 when the file is
finished. Your program has to cut that byte stream into words itself. The kernel
does not know what a word is.

## Do this, part A: look at the input

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ cat wf.txt
```

(On Ubuntu the same file is `user/wf.txt`; `cat wf.txt` typed on Ubuntu says
`No such file or directory`. `make` copied `user/wf.txt` onto xv6's disk, and
`mkfs` dropped the `user/` part of the name. You can see it go by: the
`mkfs/mkfs fs.img ...` line near the end of the `make qemu` output lists every
file that goes onto the disk, and `user/wf.txt` is one of them.)

You should see:

```
the quick brown fox
the lazy dog
the fox jumps
the fox
```

Count by hand before you write code: `the` 4, `fox` 3, everything else 1. The
expected output prints each word once, in the order it first appears.

## Do this, part B: write `user/wf.c`

`wf.c` is a new file; create it in `user/`. The whole program is 85 lines. Here
is the reading loop, `count_words`, which is the part that matters. Type it
first. Two blanks. The rest of the file is printed in full under "The answer"
below, so type that next.

```c
void
count_words(int fd)
{
  char buf[512];
  char word[MAXLEN];
  int wl = 0;                 // how many letters of the current word so far
  int n;

  while((n = read(fd, buf, sizeof(buf))) > 0){
    for(int i = 0; i < n; i++){
      char c = buf[i];
      if(is_space(c)){
        if(wl > 0){
          word[wl] = 0;       // end the string
          add_word(word);     // count it
          wl = 0;
        }
      } else if(wl < MAXLEN - 1){
        word[wl++] = c;       // (1) what does this line do?
      }
    }
  }
  // (2) something is missing here. What?
}
```

`add_word` looks the word up in a table (`words[]`, `counts[]`). If it is there,
add one to its count. If not, append it with count 1. Appending at the end is
what gives first-appearance order for free. `main` opens each file named on the
command line, calls `count_words`, and at the end prints the table.

The rest of the file is yours to write. The loop above uses three things you
have to supply:

- `is_space(c)`: one line, true for a space, a tab, a newline or a carriage
  return. (The answer below also counts vertical tab and form feed, the six
  characters C's `isspace()` calls whitespace. Four or six both pass the grader:
  the test files contain only letters, spaces and newlines, so the two versions
  never disagree on any byte they are given. Either is fine.)
- The table: `#define MAXWORDS 2048` and `#define MAXLEN 64`, then
  `char words[MAXWORDS][MAXLEN]`, `int counts[MAXWORDS]`, and an `int nwords`
  for how many are in use. `add_word` walks it with `strcmp`.
- `main`: with no file name, call `count_words(0)` and read standard input.
  With one or more names, `open(argv[a], O_RDONLY)` each in turn and `close`
  it when `count_words` returns. Then print one `word count` per line.

Headers: `kernel/types.h`, `kernel/stat.h`, `user/user.h`, and
`kernel/fcntl.h` for `O_RDONLY`.

??? success "The answer: the two blanks"

    (1) `word[wl++] = c` appends the byte `c` to the word being built and moves the
    write position forward by one. The `wl < MAXLEN - 1` guard leaves room for the
    final 0 byte, so a 100-letter word is cut short rather than overflowing the array.

    (2) The last word. If the file does not end in whitespace, `read` returns 0
    while `word[]` still holds letters that were never handed to `add_word`. The
    missing lines, after the `while` loop:

    ```c
      if(wl > 0){
        word[wl] = 0;
        add_word(word);
      }
    ```

    (Both files the grader uses end in a newline, so the grader will not catch a
    missing flush. Real files often have no final newline, and then the last word
    is silently lost. Write it anyway.)

??? success "The answer: `user/wf.c`, complete (85 lines)"

    ```c linenums="1"
    #include "kernel/types.h"
    #include "kernel/stat.h"
    #include "user/user.h"
    #include "kernel/fcntl.h"

    #define MAXWORDS 2048
    #define MAXLEN   64

    char words[MAXWORDS][MAXLEN];
    int  counts[MAXWORDS];
    int  nwords = 0;

    int
    is_space(char c)
    {
      return c == ' ' || c == '\t' || c == '\n' ||
             c == '\r' || c == '\v' || c == '\f';
    }

    void
    add_word(char *w)
    {
      for(int i = 0; i < nwords; i++){
        if(strcmp(words[i], w) == 0){
          counts[i]++;
          return;
        }
      }
      if(nwords < MAXWORDS){
        strcpy(words[nwords], w);
        counts[nwords] = 1;
        nwords++;
      }
    }

    void
    count_words(int fd)
    {
      char buf[512];
      char word[MAXLEN];
      int wl = 0;
      int n;

      while((n = read(fd, buf, sizeof(buf))) > 0){
        for(int i = 0; i < n; i++){
          char c = buf[i];
          if(is_space(c)){
            if(wl > 0){
              word[wl] = 0;
              add_word(word);
              wl = 0;
            }
          } else if(wl < MAXLEN - 1){
            word[wl++] = c;
          }
        }
      }
      if(wl > 0){
        word[wl] = 0;
        add_word(word);
      }
    }

    int
    main(int argc, char *argv[])
    {
      if(argc < 2){
        count_words(0);
      } else {
        for(int a = 1; a < argc; a++){
          int fd = open(argv[a], O_RDONLY);
          if(fd < 0){
            fprintf(2, "wf: cannot open %s\n", argv[a]);
            exit(1);
          }
          count_words(fd);
          close(fd);
        }
      }

      for(int i = 0; i < nwords; i++)
        printf("%s %d\n", words[i], counts[i]);

      exit(0);
    }
    ```

    Lines 1 to 4: headers; `fcntl.h` is what defines `O_RDONLY`. Lines 6 and 7: the
    two limits. Lines 9 to 11: the table, global so that `add_word` and `main` both
    see it. Lines 13 to 18: `is_space`. Lines 20 to 34: `add_word`, a linear search,
    then an append at the end, which is what gives first-appearance order. Lines 36
    to 62: `count_words`, with the flush at 58 to 61. Lines 64 to 85: `main`; with
    no file name it reads standard input, otherwise it opens, counts and closes each
    file named, then prints one `word count` per line.

Add `$U/_wf\` to `UPROGS`, then:

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ wf wf.txt
$ echo aa bb aa aa > t.txt
$ wf t.txt
```

## You should see

```
$ wf wf.txt
the 4
quick 1
brown 1
fox 3
lazy 1
dog 1
jumps 1
$ echo aa bb aa aa > t.txt
$ wf t.txt
aa 3
bb 1
```

!!! theory "Connect to theory: redirection happens between fork and exec"

    **What the theory says.** Every process starts with descriptors 0, 1 and 2, and
    `open()` always returns the lowest free descriptor. For `command > file` the shell
    forks; the child closes descriptor 1 and opens the file, which therefore lands in
    slot 1; then the child calls `exec()`, which keeps the table of open files as it is
    ([Week 2, Section 3.4](../../w02/class-1.md#sec-3-4)).

    **What this run showed.** `echo aa bb aa aa > t.txt` printed nothing on the screen,
    yet `wf t.txt` found all four words in the file: `aa 3`, `bb 1`. `echo` writes with
    `write(1, ...)` ([Step 1](step-1.md), part A), and its 19 lines contain no `open` call.

    **Why the run confirms the theory.** `echo` did what it always does: it wrote to
    descriptor 1. The bytes reached `t.txt` because descriptor 1 had been pointed at
    the file before `echo` started, in the gap between `fork()` and `exec()`. `exec()`
    replaced the program and kept the table, so `echo` never knew. Your `wf` is the
    witness that the bytes arrived.

!!! question "Think"

    `wf.txt` is 55 bytes and your buffer is 512 bytes, so one `read` gets the whole
    file. Suppose the file were 1000 bytes and a word sat exactly on the boundary
    between the first 512 bytes and the rest. Does the loop above still count it
    correctly? Why?

    Answer it in your own words before you read on. The answer is not printed here.
