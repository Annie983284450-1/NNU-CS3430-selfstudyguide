# Step 0. A program is a file, a process is that file running

## Why this step

The question: what is the difference between a program and a process?

A program is like a recipe card. It is a file. It can sit in a drawer for years and
nothing happens. A process is the cooking: it uses a stove, a counter and ingredients,
which for a program means memory, registers and open files. Three cooks can follow the
same card at the same time and make three separate dinners; on Linux, `sleep 300 &` three
times gives three processes with three pids, all running the one file `/usr/bin/sleep`.
Hold on to that difference, because in a minute xv6 will tell you that `sleep` failed, and
the reason is that the file does not exist yet. No recipe card, nothing to cook.

## The picture

```
   on the disk (fs.img)                  in memory (a process)
   +------------------+                  +------------------+
   | echo   (a file)  |   exec("echo")   | stack            |
   | ls     (a file)  |  --------------> | heap             |
   | sleep  (missing) |                  | data             |
   | wf.txt (a file)  |                  | code  <- echo    |
   +------------------+                  +------------------+
                                         registers: pc = main
                                         open files: 0, 1, 2
```

`fs.img` is the disk. It is built by `make` from the list `UPROGS` in the
Makefile, one file per program. When you type `echo hello`, the shell forks a
copy of itself and the copy calls `exec("echo", ...)`. `exec` looks for a file
named `echo` on the disk and replaces the copy's memory with that file. If the
file is not on the disk, `exec` fails, and the shell prints the message you will
see below.

## Do this

**On Ubuntu (or Mac), in the lab folder:**

```
$ make clean
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ ls
$ echo hello
$ sleep 10
$ echo hello > hi.txt
$ cat hi.txt
```

## You should see

```
xv6 kernel is booting

init: starting sh
$ ls
.              1 1 1024
..             1 1 1024
README         2 2 2425
findtest.sh    2 3 91
wf.txt         2 4 55
cat            2 5 35176
echo           2 6 34104
...
memdump        2 24 35416
console        3 25 0
$ echo hello
hello
$ sleep 10
exec sleep failed
$ echo hello > hi.txt
$ cat hi.txt
hello
```

The four columns of `ls` are: name, type (1 = directory, 2 = file, 3 = device),
inode number, size in bytes. `echo` is 34,104 bytes of program sitting on the
disk. `memdump` is there because the lab shipped it. `sleep`, `wf` and `find`
are not there yet, because you have not written them.

!!! theory "Connect to theory: a program is a file, a process is that file running"

    **What the theory says.** A program is a file on disk, and a file on disk does
    nothing. A process is a program running, with its own memory, registers and open
    files ([Week 2, Section 1.2](../../w02/class-1.md#sec-1-2)). `exec()` does not create a
    process. It loads a program from a file into the process that calls it
    ([Week 2, Section 3.2](../../w02/class-1.md#sec-3-2)).

    **What this run showed.** `ls` listed every program as an ordinary file on xv6's
    disk, with an inode number and a size: `echo` is file 6, 34,104 bytes. `echo hello`
    ran, because that file is there. `sleep 10` failed, because there is no file named
    `sleep` yet.

    **Why the run confirms the theory.** Typing a command name is not enough to get a
    process. There has to be a file for `exec()` to load, and a missing file becomes no
    process at all. The disk listing and the failed `sleep` show both sides of that:
    programs sit on the disk as files, and only a file that is there can run.

!!! question "Think"

    `sleep 10` printed `exec sleep failed`. Which program printed that line, and
    what did it try to do first?

    Answer it in your own words before you read on. The answer is not printed here.

Quit xv6 with Ctrl-a, then x. You will do this many times today.
