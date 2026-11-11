# Step 3. `fork` must carry the mask

## Why this step

The question: why does a sandbox have to survive `fork`?

A sandbox that a program can leave by asking for a copy of itself is not a
sandbox. Picture a visitor's badge that says "no server room". If the badge
vanished from every photocopy of the visitor, the visitor would photocopy
themselves at the door and send the copy in. `fork` is the photocopier. Right now
`kfork()` copies memory, registers, open files and the name, and it does not copy
`sysmask`, so the copy is born clean. This step is two lines, and the test that
shows why they matter is a shell script.

## The picture

```
   sandbox 32768 - sh < exec.sh

   sandbox (pid 4)  ---fork--->  child (pid 4 after exec is "sh")
                                  sysmask = 32768 (open rejected)
                                   |
                                   | sh reads exec.sh: two commands
                                   |
                                   +--fork--> child, exec "echo"     prints "hello world!"   (echo does not open)
                                   |
                                   +--fork--> child, exec "ls"       ls opens "." ...
                                                 before Step 3:  sysmask = 0      -> ls opens ".", lists the disk
                                                 after  Step 3:  sysmask = 32768  -> ls: cannot open .
```

The sandboxed process is the shell. The shell does what shells do: `fork`, then
`exec` in the child. Whether `ls` can open the directory depends only on whether
the child got the parent's mask in `kfork`.

## Do this, part A: see the escape

Before you edit, run the script under the sandbox as things are now:

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ sandbox 32768 - sh < exec.sh
```

## You should see

```
$ sandbox 32768 - sh < exec.sh
$ "hello world!"
$ .              1 1 1024
..             1 1 1024
README         2 2 2425
exec.sh        2 3 23
cat            2 4 35264
```

and the rest of the directory listing. The extra `$` signs are the sandboxed shell
echoing a prompt for each line of the script. `ls` listed the whole disk, although
its parent had `open` masked. That is the escape.

## Do this, part B: two lines in `kfork()`

Edit `kernel/proc.c`. In `kfork()`, find line 293,
`safestrcpy(np->name, p->name, sizeof(p->name));`, and add after it:

```c
  safestrcpy(np->name, p->name, sizeof(p->name));

  // interpose(): child inherits the sandbox restrictions
  np->sysmask = p->sysmask;
  safestrcpy(np->syspath, p->syspath, MAXPATH);

  pid = np->pid;
```

`p` is the parent, `np` is the new child. The mask is an integer, so `=` copies
it. The path is a character array, so it needs `safestrcpy`, the same call the
line above uses for the name. `nblocked` is deliberately not copied: `allocproc`
set it to 0 for the child, and the count is per process ([Step 6](step-6.md)).

Rebuild and run the script again.

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ sandbox 32768 - sh < exec.sh
```

## You should see

```
$ sandbox 32768 - sh < exec.sh
$ "hello world!"
$ ls: cannot open .
```

`echo` still works, because it opens nothing. `ls` now fails at `ls.c` line 36:
its `open(".")` was rejected, in a child of the sandboxed shell, one fork away from the process that called
`interpose`. You will also see one more line, `$ $`: the sandboxed shell prints a
prompt when it reaches the end of `exec.sh`, and then your own shell prints its
prompt.

!!! theory "Connect to theory: fork copies the record, one field at a time"

    **What the theory says.** `fork()` asks the kernel for a copy of the caller: its
    memory, its registers, its open files ([Week 2, Section 2.2](../../w02/class-1.md#sec-2-2)).
    In xv6 the copy is the function `kfork()`, which copies the parent's record field
    by field ([Week 2, Extra 13](../../w02/class-1.md#extra-13)).

    **What this run showed.** Before your two lines, `ls`, a child of the sandboxed
    shell, listed the whole disk. After them, it printed
    `ls: cannot open .`.

    **Why the run confirms the theory.** A child inherits only the fields `kfork`
    copies. Every other field keeps the fresh value `allocproc` gave it, so the child's
    `sysmask` started at 0. A field added to `struct proc` later is not inherited until
    someone writes the line that copies it. "A copy of the caller" is
    a promise kept by code, one assignment per field.

??? success "The answer: `kfork()` after Step 3 (lines 259 to 299 of `kernel/proc.c`, the new lines are 295 to 297)"

    ```c linenums="259" hl_lines="37-39"
    // Create a new process, copying the parent.
    // Sets up child kernel stack to return as if from fork() system call.
    int
    kfork(void)
    {
      int i, pid;
      struct proc *np;
      struct proc *p = myproc();

      // Allocate process.
      if((np = allocproc()) == 0){
        return -1;
      }

      // Copy user memory from parent to child.
      if(uvmcopy(p->pagetable, np->pagetable, p->sz) < 0){
        freeproc(np);
        release(&np->lock);
        return -1;
      }
      np->sz = p->sz;

      // copy saved user registers.
      *(np->trapframe) = *(p->trapframe);

      // Cause fork to return 0 in the child.
      np->trapframe->a0 = 0;

      // increment reference counts on open file descriptors.
      for(i = 0; i < NOFILE; i++)
        if(p->ofile[i])
          np->ofile[i] = filedup(p->ofile[i]);
      np->cwd = idup(p->cwd);

      safestrcpy(np->name, p->name, sizeof(p->name));

      // interpose(): child inherits the sandbox restrictions
      np->sysmask = p->sysmask;
      safestrcpy(np->syspath, p->syspath, MAXPATH);

      pid = np->pid;
    ```

    Everything above the new lines is the picture of `fork` from [Week 2, Extra 13](../../w02/class-1.md#extra-13), in code: a new
    `struct proc`, a copy of the memory, a copy of the registers with `a0` forced to 0
    so that the child sees `fork()` return 0, shared open files, the same working
    directory, the same name. Your two lines make the sandbox one more thing a child
    inherits.

**On Ubuntu (or Mac), in the lab folder:**

```
$ ./grade-lab-syscall sandbox_fork
```

```
== Test sandbox_fork == sandbox_fork: OK (0.6s)
```

!!! question "Think"

    `kfork` copies `sysmask` and `syspath` but not `nblocked`, so a child starts its
    count at 0. Suppose it did copy `nblocked`. `sandbox 32768 - blockcount 5` (the
    [Step 6](step-6.md) program) would still print `blocked 5`. Give a case where the copied count
    would be visibly wrong, and say which process the count would then be describing.

    Answer it in your own words before you read on. The answer is not printed here.
