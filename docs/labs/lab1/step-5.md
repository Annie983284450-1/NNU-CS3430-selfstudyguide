# Step 5. `-exec`: fork, exec, wait, the same three calls the shell makes

## Why this step

The question: how do you build new behavior out of programs you already have?

`find` can now name every match. The next thing anyone wants is to do something with
each match: run `grep` on it, or delete it. You do not rewrite `grep` inside `find`. You
start a second process and hand it the job, once per match, with the three calls the
shell makes every time you press Enter. `fork`: a temp arrives who is an exact copy of
you; the only difference is the number each of you gets back. `exec`: you hand the temp a
different job description; same person, same desk, new work. `wait`: you sit and do
nothing until they are finished. Why not just call `grep` as a function? Because `grep` is
a separate program in a separate file with its own memory; the only way to run it is to
become it, and you cannot become it and stay yourself. So you fork first.

## The picture

```
   find (pid 3)                              child (pid 4)
   |
   | fork() ------ copy everything ------->  a copy of find, fork returned 0
   | fork returned 4                         |
   |                                         | exec("grep", ["grep","hello",path,0])
   | wait(0)                                 |   memory replaced by the grep file
   | . . . blocked . . .                     |   pid still 4, name now "grep"
   | . . . . . . . . . .                     | grep runs, prints, exit(0)
   | wait returns 4  <----------------------+
   |
   v  next match
```

The theory class said the shell is a loop of fork, exec, wait ([Week 2, Extra 20](../../w02/class-1.md#extra-20)). `find -exec` is
the same loop, once per match. Before you write it, watch the shell do it, in
gdb, with real pids.

## Do this, part A: watch the shell fork and exec

Terminal 1, on Ubuntu (or Mac), in the lab folder: `make CPUS=1 qemu-gdb`.
Terminal 2, same place: `gdb-multiarch -x .gdbinit` (or `riscv64-elf-gdb`). Then,
at the `(gdb)` prompt:

```
(gdb) break kfork if myproc()->pid == 2
(gdb) break kwait if myproc()->pid == 2
(gdb) break kexec if myproc()->pid == 3
(gdb) continue
```

The conditions matter: init (pid 1) also forks and execs during boot, and we
only want to see the shell (pid 2) and its first child (pid 3). In Terminal 1,
at the xv6 `$` prompt, type `echo hello`. Then in gdb, at each stop, type the
`print` lines shown below and `continue`.

## You should see

```
Breakpoint 1, kfork () at kernel/proc.c:258
(gdb) print myproc()->name
$1 = "sh", '\000' <repeats 13 times>
(gdb) print myproc()->pid
$2 = 2
(gdb) finish
Value returned is $3 = 3
(gdb) continue

Breakpoint 2, kwait (addr=0) at kernel/proc.c:369
(gdb) print myproc()->pid
$5 = 2
(gdb) continue

Breakpoint 3, kexec (path=path@entry=0x3fffff9f10 "echo", argv=...) at kernel/exec.c:28
(gdb) print myproc()->name
$6 = "sh", '\000' <repeats 13 times>
(gdb) print myproc()->pid
$7 = 3
(gdb) print myproc()->parent->pid
$8 = 2
(gdb) print argv[0]
$10 = 0x87f23000 "echo"
(gdb) print argv[1]
$11 = 0x87f22000 "hello"
(gdb) print argv[2]
$12 = 0x0
(gdb) finish
Value returned is $13 = 2
(gdb) print myproc()->name
$14 = "echo", '\000' <repeats 11 times>
(gdb) print myproc()->pid
$15 = 3
(gdb) continue
```

Read it as a story. The shell, pid 2, calls `kfork`, and `kfork` returns 3: a
new process exists. The shell then calls `kwait` and blocks. Process 3 reaches
`kexec`. At that moment its name is still `"sh"`, because it is a copy of the
shell; its parent is 2; and it is asking for the file `echo` with the argument
list `echo`, `hello`, and a 0 to end the list. After `kexec` returns (the value
2 is `argc`), the same pid 3 is now named `"echo"`. Then `echo` runs, exits,
and the shell's `wait` returns.

!!! theory "Connect to theory: fork makes a second process, exec keeps the pid, the parent waits"

    **What the theory says.** `fork()` makes a copy of the caller and returns twice:
    the child's pid to the parent, 0 to the child
    ([Week 2, Section 2.2](../../w02/class-1.md#sec-2-2)). `exec()` keeps the process (same
    pid, same parent, same open files) and replaces its memory and its program counter
    with a new program
    ([Week 2, Section 3.2](../../w02/class-1.md#sec-3-2); the kernel side is
    [Week 2, Extra 17](../../w02/class-1.md#extra-17)). `wait()` blocks the parent until a
    child has exited ([Week 2, Section 2.4](../../w02/class-1.md#sec-2-4)).

    **What this run showed.** In the shell, pid 2, `kfork` returned 3. The shell then
    entered `kwait`. Process 3 reached `kexec` still named `sh`, with parent 2 and the
    argument list `echo`, `hello`, 0. After `kexec` returned, the same pid 3 was named
    `echo`.

    **Why the run confirms the theory.** Each claim is visible in the kernel's own
    records. One call produced a second process, number 3. Its name changed from `sh`
    to `echo` while its pid stayed 3: the same process with a new program (xv6 also
    writes the new name into the record). The shell entered `kwait` before the child
    reached `kexec`. Your `run_exec` below makes the same three calls
    in the same order.

## Do this, part B: write the `-exec` part

Four changes to your [Step 4](step-4.md) `find.c`: add `#include "kernel/param.h"` (for
`MAXARG`); add the function `run_exec` below; give `find` a third parameter,
`char **cmd`, pass it on in the recursive call, and call `run_exec` instead of
`printf` when `cmd` is set; and in `main`, look for `-exec` in `argv`. Three
blanks in `run_exec`: the three system calls, in the right places.

```c
void
run_exec(char **cmd, char *path)
{
  int pid = ______();                     // (1)
  if(pid < 0){
    fprintf(2, "find: fork failed\n");
    return;
  }
  if(pid == 0){                           // the child
    char *nargv[MAXARG];
    int i = 0;
    for(; cmd[i] != 0 && i < MAXARG - 2; i++)
      nargv[i] = cmd[i];                  // the command and its fixed args
    nargv[i++] = path;                    // the match goes last
    nargv[i] = 0;                         // end of list
    ______(nargv[0], nargv);              // (2)
    fprintf(2, "find: exec %s failed\n", nargv[0]);
    exit(1);
  }
  ______(0);                              // (3) the parent
}
```

In `main`, find `-exec` in `argv` and remember where the command starts:

```c
  char **cmd = 0;

  if(argc < 3){
    fprintf(2, "usage: find <dir> <name> [-exec cmd args...]\n");
    exit(1);
  }

  for(int i = 3; i < argc; i++){
    if(strcmp(argv[i], "-exec") == 0){
      cmd = &argv[i + 1];   // argv is null-terminated at argv[argc]
      break;
    }
  }
```

??? success "The answer: the three blanks"

    (1) `fork()`. (2) `exec(nargv[0], nargv)`. (3) `wait(0)`.

    The `fprintf` after `exec` runs only if `exec` failed, exactly like line 80 of
    `sh.c`. In `find`, the file case becomes:

    ```c
        if(strcmp(lastcomp(path), name) == 0){
          if(cmd)
            run_exec(cmd, path);
          else
            printf("%s\n", path);
        }
    ```

??? success "The answer: `user/find.c`, final, complete (112 lines)"

    ```c linenums="1"
    #include "kernel/types.h"
    #include "kernel/stat.h"
    #include "user/user.h"
    #include "kernel/fs.h"
    #include "kernel/fcntl.h"
    #include "kernel/param.h"

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

    // Run "cmd args... path" in a child process and wait for it.
    void
    run_exec(char **cmd, char *path)
    {
      int pid = fork();
      if(pid < 0){
        fprintf(2, "find: fork failed\n");
        return;
      }
      if(pid == 0){
        char *nargv[MAXARG];
        int i = 0;
        for(; cmd[i] != 0 && i < MAXARG - 2; i++)
          nargv[i] = cmd[i];
        nargv[i++] = path;
        nargv[i] = 0;
        exec(nargv[0], nargv);
        fprintf(2, "find: exec %s failed\n", nargv[0]);
        exit(1);
      }
      wait(0);
    }

    void
    find(char *path, char *name, char **cmd)
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
          if(cmd)
            run_exec(cmd, path);
          else
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
          find(buf, name, cmd);
        }
        break;
      }
      close(fd);
    }

    int
    main(int argc, char *argv[])
    {
      char **cmd = 0;

      if(argc < 3){
        fprintf(2, "usage: find <dir> <name> [-exec cmd args...]\n");
        exit(1);
      }

      for(int i = 3; i < argc; i++){
        if(strcmp(argv[i], "-exec") == 0){
          cmd = &argv[i + 1];   // argv is null-terminated at argv[argc]
          break;
        }
      }

      find(argv[1], argv[2], cmd);
      exit(0);
    }
    ```

    What changed since the [Step 4](step-4.md) file: line 6 (`param.h`), lines 19 to 40
    (`run_exec`), line 43 (`find` takes `cmd`), lines 64 to 67 (`if(cmd)`), line 86
    (`find(buf, name, cmd)`), and `main`, lines 96 to 110 (`cmd` starts as 0; at
    least two arguments; the `-exec` scan; `cmd` passed to `find`). Everything else
    is the [Step 4](step-4.md) file, untouched. With this file, `make grade` reports 131/131.

Rebuild and run. Again the disk is fresh after `make qemu`, so recreate `b` and
`d/b` first.

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ echo > b
$ mkdir d
$ echo > d/b
$ find . b -exec echo
$ sh < findtest.sh
$ find . b
```

## You should see

```
$ find . b -exec echo
./b
./d/b
$ sh < findtest.sh
$ $ $ $ $ $ hello
hello
hello
$ $ find . b
./b
./d/b
./a/b
./c/b
```

The first command runs `echo ./b` and `echo ./d/b`, so it looks like [Step 4](step-4.md) but
each line was printed by a separate `echo` process. `findtest.sh` makes three
files named `b` containing `hello` and runs `find . b -exec grep hello`; the
three `hello` lines are three `grep` processes. The extra `$` prompts are the
shell echoing each line of the script.

!!! question "Think"

    Move `wait(0)` from the parent into the child branch (just before `exec`). What
    changes in the output of `sh < findtest.sh`, and why?

    Answer it in your own words before you read on. The answer is not printed here.
