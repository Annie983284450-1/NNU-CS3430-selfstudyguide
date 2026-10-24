# Step 1. The `USYSCALL` page: `ugetpid()` without a system call

## Why this step

The question: how can a program read kernel data without a system call?

A system call costs a trap: save 32 registers, switch to the kernel stack, run
the handler, switch back. `getpid()` pays all of that to copy one integer. Real
kernels avoid it with a trick: the kernel keeps a small read-only page mapped
into every process and writes the frequently read values into it. The program
reads the page like any variable. Linux calls this the vDSO, and uses it for
`gettimeofday()` and `clock_gettime()`. Here you build the same thing for the
pid.

The picture: a notice board in the lobby. Instead of calling the front desk to
ask what the building's number is, you read it off the board. Only the staff can
write on the board; everyone can read it.

## The picture

```
   struct proc (kernel)                  the process's page table
   +----------------------+              +--------------------------------+
   | pid = 3              |              | 0x3FFFFFF000 -> trampoline  RX |
   | trapframe  ----------+---------+    | 0x3FFFFFE000 -> trapframe   RW |
   | usyscall   ----------+----+    +--> | 0x3FFFFFD000 -> usyscall  R U  |  <-- new
   | pagetable            |    |         |        ...                     |
   +----------------------+    |         +--------------------------------+
                               |
                               v
                        one physical page (kalloc)
                        +------------------------+
                        | pid      = 3           |   written by the kernel in allocproc()
                        | nsyscall = 0           |   (counted up in Step 6)
                        +------------------------+
                                ^
                                |  user/ulib.c:  ugetpid() { return ((struct usyscall*)USYSCALL)->pid; }
```

The page has two names. The kernel reaches it through `p->usyscall`, a kernel
address, with write permission. The process reaches it through the virtual
address `USYSCALL`, mapped `PTE_R | PTE_U` and nothing else. Same bytes, two
mappings, two sets of permissions.

The lifetime of this page copies the trapframe page exactly, and the trapframe
code is already in `kernel/proc.c`, so each of the four edits below sits right
next to the trapframe line it mirrors: allocate in `allocproc()`, free in
`freeproc()`, map in `proc_pagetable()`, unmap in `proc_freepagetable()`.

## Do this, part A: the field

Open `kernel/proc.h`. `struct proc` ends at line 107 with `};`, and the
line before it, 106, is `char name[16];`. Add one line after `char name[16];`,
so the struct now ends:

```c
  struct file *ofile[NOFILE];  // Open files
  struct inode *cwd;           // Current directory
  char name[16];               // Process name (debugging)
  struct usyscall *usyscall;   // USYSCALL read-only page (holds pid, nsyscall)
};
```

## Do this, part B: four blocks in `kernel/proc.c`

Each block goes right after the trapframe code it mirrors. Fill the two blanks
as you go; the complete answer is below.

**1. `allocproc()`, after the trapframe allocation (after line 133, the `}`
that closes `if((p->trapframe = ...`).** Allocate one page and write the pid
into it. The second field, `nsyscall`, is set to zero now and counted up in
[Step 6](step-6.md).

```c
#ifdef LAB_PGTBL
  // Allocate the read-only USYSCALL page and seed it with the pids.
  if((p->usyscall = (struct usyscall *)kalloc()) == 0){
    freeproc(p);
    release(&p->lock);
    return 0;
  }
  p->usyscall->pid = ________;
  p->usyscall->nsyscall = 0;
#endif
```

**2. `freeproc()`, after `p->trapframe = 0;` (line 160, before the edit).**
Give the page back.

```c
#ifdef LAB_PGTBL
  if(p->usyscall)
    kfree((void*)p->usyscall);
  p->usyscall = 0;
#endif
```

**3. `proc_pagetable()`, after the trapframe `mappages` block (after line
203, before the edit), before `return pagetable;`.** Map the page at
`USYSCALL`, readable by the user, and nothing else. If the mapping fails, undo
both mappings already made, the same way the trapframe block undoes the
trampoline.

```c
#ifdef LAB_PGTBL
  // map the read-only USYSCALL page just below the trapframe page.
  if(mappages(pagetable, USYSCALL, PGSIZE,
              (uint64)(p->usyscall), ________ | ________) < 0){
    uvmunmap(pagetable, TRAMPOLINE, 1, 0);
    uvmunmap(pagetable, TRAPFRAME, 1, 0);
    uvmfree(pagetable, 0);
    return 0;
  }
#endif
```

**4. `proc_freepagetable()`, after `uvmunmap(pagetable, TRAPFRAME, 1, 0);`
(line 214, before the edit).** Remove the mapping, without freeing the page
(the last argument `0`): `freeproc()` frees it.

```c
#ifdef LAB_PGTBL
  uvmunmap(pagetable, USYSCALL, 1, 0);
#endif
```

Then rebuild and run.

**On Ubuntu (or Mac), in the lab folder:**

```
$ make qemu
```

**At the xv6 `$` prompt:**

```
$ pgtbltest
```

## You should see

```
$ pgtbltest
print_pgtbl starting
va 0x0 pte 0x21FC7C5B pa 0x87F1F000 perm 0x5B
va 0x1000 pte 0x21FC705B pa 0x87F1C000 perm 0x5B
va 0x2000 pte 0x21FC6C17 pa 0x87F1B000 perm 0x17
va 0x3000 pte 0x21FC6807 pa 0x87F1A000 perm 0x7
va 0x4000 pte 0x21FC64D7 pa 0x87F19000 perm 0xD7
va 0x5000 pte 0x0 pa 0x0 perm 0x0
va 0x6000 pte 0x0 pa 0x0 perm 0x0
va 0x7000 pte 0x0 pa 0x0 perm 0x0
va 0x8000 pte 0x0 pa 0x0 perm 0x0
va 0x9000 pte 0x0 pa 0x0 perm 0x0
va 0x3FFFFF6000 pte 0x0 pa 0x0 perm 0x0
va 0x3FFFFF7000 pte 0x0 pa 0x0 perm 0x0
va 0x3FFFFF8000 pte 0x0 pa 0x0 perm 0x0
va 0x3FFFFF9000 pte 0x0 pa 0x0 perm 0x0
va 0x3FFFFFA000 pte 0x0 pa 0x0 perm 0x0
va 0x3FFFFFB000 pte 0x0 pa 0x0 perm 0x0
va 0x3FFFFFC000 pte 0x0 pa 0x0 perm 0x0
va 0x3FFFFFD000 pte 0x21FD4813 pa 0x87F52000 perm 0x13
va 0x3FFFFFE000 pte 0x21FD00C7 pa 0x87F40000 perm 0xC7
va 0x3FFFFFF000 pte 0x2000184B pa 0x80006000 perm 0x4B
print_pgtbl: OK
ugetpid_test starting
ugetpid_test: OK
print_kpgtbl starting
print_kpgtbl: OK
superpg_fork starting
pgtbltest: superpg_fork failed: pte different, pid=3
```

Two changes from [Step 0](step-0.md). Line `va 0x3FFFFFD000` now shows a PTE with
`perm 0x13`: V, R, U. The page exists, and it is read-only. And
`ugetpid_test: OK`: the test calls `getpid()` (a system call) and `ugetpid()`
(a memory read), 64 times across 64 forked children, and they always agree.

!!! theory "Connect to theory: one frame, two mappings, two sets of permissions"

    **What the theory says.** A system call is a full trip through the trap path. On
    the Ubuntu machine one cost about 100 ns, about 85 times a plain function call
    ([Week 2, Section 4.7](../../w02/class-2.md#sec-4-7)). One frame can appear in more than
    one row: the trampoline sits in every process's table
    ([Week 4, Section 5.3](../../w04/class-2.md#sec-5-3)), and Linux maps one copy of the
    C library's code into many processes
    ([Week 4, Extra 4](../../w04/class-1.md#extra-4)). Permissions live in the row, not in
    the frame ([Week 4, Section 5.2](../../w04/class-2.md#sec-5-2)), so each row can give
    different permissions.

    **What this run showed.** The entry at `USYSCALL` is now `perm 0x13`: V, R and U.
    `ugetpid()` and `getpid()` agreed in all 64 children.

    **Why the run confirms the theory.** In the code, the kernel writes the frame
    through `p->usyscall`, using its own page table, which maps physical memory above
    the kernel's code read and write. The process reaches the same frame through the
    row at `USYSCALL`, which says read only. Same bytes, two rows, two sets of
    permissions. And `ugetpid()` in `user/ulib.c` is an ordinary load, so it skips the
    trap path (about 100 ns per call on the Ubuntu machine) and still gets the right
    pid.

The run then stops at `superpg_fork failed: pte different`. That is [Step 4](step-4.md);
ignore it until then. `print_kpgtbl: OK` with nothing printed under it is
[Step 2](step-2.md).

You can also run the grader on just this program. It confirms the
`ugetpid` points and shows what is still missing.

**On Ubuntu (or Mac), in the lab folder** (quit xv6 first with Ctrl-a then x):

```
$ ./grade-lab-pgtbl pgtbltest
```

```
== Test pgtbltest == (4.2s) 
== Test   pgtbltest: ugetpid == 
  pgtbltest: ugetpid: OK 
== Test   pgtbltest: print_kpgtbl == 
```

followed by `FAIL` and a list of `MISSING` lines for `print_kpgtbl` and
`superpg`. Those are the next steps.

??? success "The answer: the two blanks"

    `p->usyscall->pid = p->pid;` and `PTE_R | PTE_U`.

??? success "The answer: `kernel/proc.h`, the end of `struct proc` (lines 98 to 108)"

    ```c linenums="98"
      // these are private to the process, so p->lock need not be held.
      uint64 kstack;               // Virtual address of kernel stack
      uint64 sz;                   // Size of process memory (bytes)
      pagetable_t pagetable;       // User page table
      struct trapframe *trapframe; // data page for trampoline.S
      struct context context;      // swtch() here to run process
      struct file *ofile[NOFILE];  // Open files
      struct inode *cwd;           // Current directory
      char name[16];               // Process name (debugging)
      struct usyscall *usyscall;   // USYSCALL read-only page (holds pid, nsyscall)
    };
    ```

??? success "The answer: `allocproc()` after Step 1 (lines 124 to 161 of `kernel/proc.c`, the new lines are 135 to 144)"

    ```c linenums="124" hl_lines="12-21"
    found:
      p->pid = allocpid();
      p->state = USED;

      // Allocate a trapframe page.
      if((p->trapframe = (struct trapframe *)kalloc()) == 0){
        freeproc(p);
        release(&p->lock);
        return 0;
      }

    #ifdef LAB_PGTBL
      // Allocate the read-only USYSCALL page and seed it with the pids.
      if((p->usyscall = (struct usyscall *)kalloc()) == 0){
        freeproc(p);
        release(&p->lock);
        return 0;
      }
      p->usyscall->pid = p->pid;
      p->usyscall->nsyscall = 0;
    #endif

      // An empty user page table.
      p->pagetable = proc_pagetable(p);
      if(p->pagetable == 0){
        freeproc(p);
        release(&p->lock);
        return 0;
      }

      // Set up new context to start executing at forkret,
      // which returns to user space.
      memset(&p->context, 0, sizeof(p->context));
      p->context.ra = (uint64)forkret;
      p->context.sp = p->kstack + PGSIZE;

      return p;
    }
    ```

??? success "The answer: `freeproc()` after Step 1 (lines 166 to 188, the new lines are 172 to 176)"

    ```c linenums="166" hl_lines="7-11"
    static void
    freeproc(struct proc *p)
    {
      if(p->trapframe)
        kfree((void*)p->trapframe);
      p->trapframe = 0;
    #ifdef LAB_PGTBL
      if(p->usyscall)
        kfree((void*)p->usyscall);
      p->usyscall = 0;
    #endif
      if(p->pagetable)
        proc_freepagetable(p->pagetable, p->sz);
      p->pagetable = 0;
      p->sz = 0;
      p->pid = 0;
      p->parent = 0;
      p->name[0] = 0;
      p->chan = 0;
      p->killed = 0;
      p->xstate = 0;
      p->state = UNUSED;
    }
    ```

??? success "The answer: `proc_pagetable()` after Step 1 (lines 190 to 233, the new lines are 221 to 230)"

    ```c linenums="190" hl_lines="32-41"
    // Create a user page table for a given process, with no user memory,
    // but with trampoline and trapframe pages.
    pagetable_t
    proc_pagetable(struct proc *p)
    {
      pagetable_t pagetable;

      // An empty page table.
      pagetable = uvmcreate();
      if(pagetable == 0)
        return 0;

      // map the trampoline code (for system call return)
      // at the highest user virtual address.
      // only the supervisor uses it, on the way
      // to/from user space, so not PTE_U.
      if(mappages(pagetable, TRAMPOLINE, PGSIZE,
                  (uint64)trampoline, PTE_R | PTE_X) < 0){
        uvmfree(pagetable, 0);
        return 0;
      }

      // map the trapframe page just below the trampoline page, for
      // trampoline.S.
      if(mappages(pagetable, TRAPFRAME, PGSIZE,
                  (uint64)(p->trapframe), PTE_R | PTE_W) < 0){
        uvmunmap(pagetable, TRAMPOLINE, 1, 0);
        uvmfree(pagetable, 0);
        return 0;
      }

    #ifdef LAB_PGTBL
      // map the read-only USYSCALL page just below the trapframe page.
      if(mappages(pagetable, USYSCALL, PGSIZE,
                  (uint64)(p->usyscall), PTE_R | PTE_U) < 0){
        uvmunmap(pagetable, TRAMPOLINE, 1, 0);
        uvmunmap(pagetable, TRAPFRAME, 1, 0);
        uvmfree(pagetable, 0);
        return 0;
      }
    #endif

      return pagetable;
    }
    ```

??? success "The answer: `proc_freepagetable()` after Step 1 (lines 237 to 246, the new lines are 242 to 244)"

    ```c linenums="237" hl_lines="6-8"
    void
    proc_freepagetable(pagetable_t pagetable, uint64 sz)
    {
      uvmunmap(pagetable, TRAMPOLINE, 1, 0);
      uvmunmap(pagetable, TRAPFRAME, 1, 0);
    #ifdef LAB_PGTBL
      uvmunmap(pagetable, USYSCALL, 1, 0);
    #endif
      uvmfree(pagetable, sz);
    }
    ```

!!! question "Think"

    The kernel writes `pid` into the page through `p->usyscall`, and the process
    reads it through `USYSCALL`. If you had mapped the page with
    `PTE_R | PTE_W | PTE_U` instead, `ugetpid_test` would still print `OK`. What
    would then be wrong, and which program in the folder would be able to show it?

    Answer it in your own words before you read on. The answer is not printed here.
