# Before Step 0. What is already in the folder

Unzip, then look before you type. Four small programs were written for you.
Knowing what each one does saves you from guessing later.

**On Ubuntu (or Mac), in the lab folder:**

```
$ cd ~/lab2-syscall-student
$ ls
$ ls user/sandbox.c user/secret.c user/attack.c user/blockcount.c user/exec.sh
$ cat answers-syscall.txt
```

The first `ls` should show `Makefile`, `user`, `kernel`, `mkfs` and
`grade-lab-syscall` side by side. If it also shows another
`lab2-syscall-student`, you have a folder inside a folder; work in the one where
`Makefile` and `user/` sit next to each other. On Windows the lab must be in your
Ubuntu home folder, exactly as in [Lab 1](../../labs/lab1/before.md): `pwd` must start with `/home/`, not
`/mnt/c/`.

| File | What it is | Which step uses it |
|---|---|---|
| `user/sandbox.c` | Complete. `sandbox <mask> <path> <program> <args...>` forks, and the child calls `interpose(mask, path)` on itself and then `exec`s the program. So the program runs with some system calls switched off. It does not compile until [Step 1](step-1.md), because it calls `interpose()`, which does not exist yet. | 1 to 4, 6 |
| `user/exec.sh` | Two lines, `echo "hello world!"` and `ls`. A tiny shell script, run as `sh < exec.sh`. | 3, 4 |
| `user/secret.c` | Complete. `secret <word>` writes the marker `This may help.` into a buffer and your word 16 bytes after it, then exits. Do not change it. | 5 |
| `user/attack.c` | Only `main()` with `// Your code here.` You write the body. | 5 |
| `user/blockcount.c` | Complete. `blockcount <n>` tries to `open` a file that does not exist `n` times, then prints `blocked <count>`, where the count comes from the `blocked()` system call you write. | 6 |
| `answers-syscall.txt` | Five questions with empty `A:` lines. [Step 0](step-0.md) fills them. | 0 |

Two of these, `attack` and `secret`, are already in the Makefile's `UPROGS`
list. `sandbox` and `blockcount` are not; you add them in Steps 1 and 6.
