# Step 4. `find`: a directory is a file full of fixed-size entries

## Why this step

The question: where does the operating system keep the names of your files?

Not in a special place. In a file. Picture a drawer of index cards, all cut to the same
size: each card carries a number and a name, and to find something you pull the drawer
open and read the cards in order. A directory is that drawer, and one card is one
`struct dirent`: a 2-byte inode number and a 14-byte name, 16 bytes per card, every card
the same size. Same size is what lets a plain loop read them. Because a directory really
is a file, `cat` works on it, and in part A you pour one straight into the `memdump` you
wrote in [Step 3](step-3.md). `find` is a new program you write: `find <dir> <name>` prints the path
of every file under `<dir>` whose name is `<name>`, walking into every subdirectory.

## The picture

```
   directory d, as bytes on disk:  a sequence of 16-byte entries

   +--------+----------------+--------+----------------+--------+---------------
   | inum 30| "."            | inum 1 | ".."           | inum 31| "b"
   | 2 bytes| 14 bytes       | 2 bytes| 14 bytes       | 2 bytes| 14 bytes
   +--------+----------------+--------+----------------+--------+---------------

   kernel/fs.h, line 54-59:
     #define DIRSIZ 14
     struct dirent {
       ushort inum;          // 2 bytes: which inode
       char name[DIRSIZ];    // 14 bytes: the name, 0-padded
     };
```

`open` a directory and `read` from it 16 bytes at a time and you get one
`struct dirent` per read. An entry with `inum == 0` is an empty slot. To learn
whether a name is a file or a directory you ask the kernel with `stat`, which
fills a `struct stat` (`kernel/stat.h`): `type` is 1 for a directory, 2 for a
file. `ls.c` does all of this, and `find` is `ls` with recursion and a
comparison.

## Do this, part A: see the bytes

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ echo > b
$ mkdir d
$ echo > d/b
$ echo hi > d/notes
$ ls d
$ cat d | memdump hS
```

## You should see

```
$ ls d
.              1 30 64
..             1 1 1024
b              2 31 0
notes          2 32 3
$ cat d | memdump hS
30
.
```

`cat d` pours the directory's raw bytes into `memdump`. Format `hS` says: a
2-byte number, then a string. The number is 30, and the string is `.`. That is
the first `struct dirent`, and it matches the first line of `ls d`. Your [Step 3](step-3.md)
program just read a directory. The size 64 in `ls d` is four entries of 16 bytes.

!!! theory "Connect to theory: a name lives in a directory, as an inode number and a name"

    **What the theory says.** A file on disk has three pieces: a directory entry that
    holds its name, an inode that the file system knows it by, and the data blocks
    ([Week 1, Extra 8](../../w01/class-2.md#extra-8)). The name is not stored with the file.
    A directory maps each name to an inode number.

    **What this run showed.** `cat` read the directory `d` like any other file.
    `memdump hS` decoded its first entry: the 2-byte number 30, then the name `.`, which
    is the first line of `ls d`. The directory is 64 bytes long: four 16-byte entries for
    four names.

    **Why the run confirms the theory.** The raw bytes hold exactly the theory's
    directory entry, an inode number beside a name, and nothing else. The size and the
    type that `ls` prints are not in the directory. `ls` gets them by asking the kernel
    with `stat`, which reads the inode.

## Do this, part B: write `user/find.c`

`find.c` is a new file; create it in `user/`. Open `user/ls.c` and read the
`T_DIR` case (lines 52 to 71). `find` is that loop with three changes: compare
the name instead of printing every entry, skip two names, and call `find` on the
child path instead of `stat` and print. Fill in the two blanks. The whole file,
with `lastcomp` and `main`, is printed under "The answer" below.

```c
void
find(char *path, char *name)
{
  char buf[512], *p;
  int fd;
  struct dirent de;
  struct stat st;

  if((fd = open(path, O_RDONLY)) < 0){
    fprintf(2, "find: cannot open %s\n", path);
    return;
  }
  if(fstat(fd, &st) < 0){
    fprintf(2, "find: cannot stat %s\n", path);
    close(fd);
    return;
  }

  switch(st.type){
  case T_DEVICE:
  case T_FILE:
    if(strcmp(lastcomp(path), name) == 0)     // (1) why strcmp and not == ?
      printf("%s\n", path);
    break;

  case T_DIR:
    if(strlen(path) + 1 + DIRSIZ + 1 > sizeof(buf)){
      fprintf(2, "find: path too long\n");
      break;
    }
    strcpy(buf, path);
    p = buf + strlen(buf);
    *p++ = '/';
    while(read(fd, &de, sizeof(de)) == sizeof(de)){
      if(de.inum == 0)
        continue;
      if(______________________________________)   // (2) two names to skip
        continue;
      memmove(p, de.name, DIRSIZ);
      p[DIRSIZ] = 0;
      find(buf, name);                            // recurse
    }
    break;
  }
  close(fd);
}
```

`lastcomp` returns the part of a path after the last `/` (it is the loop from
`fmtname` in `ls.c`, lines 14 to 16, without the padding). The four lines at the
top of the `T_DIR` case make sure the path, a slash, a 14-byte name and a 0 fit
in `buf`. Headers for `find.c`: `kernel/types.h`, `kernel/stat.h`, `kernel/fs.h`
(for `struct dirent` and `DIRSIZ`), `user/user.h`, and `kernel/fcntl.h`. In
[Step 5](step-5.md) you also add `kernel/param.h`, which is where `MAXARG` comes from.

??? success "The answer: the two blanks"

    (1) In C, `==` on two `char*` compares the addresses, not the letters. Two
    different strings that both spell `b` live at two different addresses, so `==`
    says "different". `strcmp` walks the letters and returns 0 when they all match.

    (2) `strcmp(de.name, ".") == 0 || strcmp(de.name, "..") == 0`. Every directory
    contains `.` (itself) and `..` (its parent). Recursing into `.` means calling
    `find` on the same directory forever. Recursing into `..` walks up to the root
    and then back down into every directory, including this one, forever.

??? success "The answer: `user/find.c` after Step 4, complete (75 lines)"

    This file compiles and passes the three `find` tests. `-exec` is not in it yet;
    [Step 5](step-5.md) adds it.

    ```c linenums="1"
    #include "kernel/types.h"
    #include "kernel/stat.h"
    #include "user/user.h"
    #include "kernel/fs.h"
    #include "kernel/fcntl.h"

    // Return a pointer to the final path component ("basename") of path.
    char*
    lastcomp(char *path)
    {
      char *p;
      for(p = path + strlen(path); p >= path && *p != '/'; p--)
        ;
      p++;
      return p;
    }

    void
    find(char *path, char *name)
    {
      char buf[512], *p;
      int fd;
      struct dirent de;
      struct stat st;

      if((fd = open(path, O_RDONLY)) < 0){
        fprintf(2, "find: cannot open %s\n", path);
        return;
      }
      if(fstat(fd, &st) < 0){
        fprintf(2, "find: cannot stat %s\n", path);
        close(fd);
        return;
      }

      switch(st.type){
      case T_DEVICE:
      case T_FILE:
        if(strcmp(lastcomp(path), name) == 0){
          printf("%s\n", path);
        }
        break;

      case T_DIR:
        if(strlen(path) + 1 + DIRSIZ + 1 > sizeof(buf)){
          fprintf(2, "find: path too long\n");
          break;
        }
        strcpy(buf, path);
        p = buf + strlen(buf);
        *p++ = '/';
        while(read(fd, &de, sizeof(de)) == sizeof(de)){
          if(de.inum == 0)
            continue;
          if(strcmp(de.name, ".") == 0 || strcmp(de.name, "..") == 0)
            continue;
          memmove(p, de.name, DIRSIZ);
          p[DIRSIZ] = 0;
          find(buf, name);
        }
        break;
      }
      close(fd);
    }

    int
    main(int argc, char *argv[])
    {
      if(argc != 3){
        fprintf(2, "usage: find <dir> <name>\n");
        exit(1);
      }
      find(argv[1], argv[2]);
      exit(0);
    }
    ```

    Lines 8 to 16: `lastcomp`, walk back from the end of the path to the last `/`.
    Lines 25 to 34: open, then `fstat`; each can fail, and each failure prints and
    returns. Lines 36 to 42: the file case (a device counts as a file). Lines 44 to
    61: the directory case; line 63 closes the descriptor, one close for every open.
    Lines 66 to 75: `main`, exactly two arguments after the program name.

Add `$U/_find\` to `UPROGS`, then rebuild. `make qemu` builds a fresh disk, so
the files from part A are gone; make them again first.

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ echo > b
$ mkdir d
$ echo > d/b
$ echo hi > d/notes
$ find . b
$ find d b
```

## You should see

```
$ find . b
./b
./d/b
$ find d b
d/b
```

!!! question "Think"

    You forget the check in blank (2) and run `find . b`. Describe exactly what
    happens, in terms of the paths `find` builds. When does it stop?

    Answer it in your own words before you read on. The answer is not printed here.
