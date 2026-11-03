# Get the code and boot xv6

## Getting the code

**For this setup you use `xv6-setup-student`**, which comes as `xv6-setup-student.zip`. It is the
xv6 source tree by itself, with no lab tasks and no grader, so nothing in it can be graded
and there is nothing to hand in. Unzip it and use that folder for everything on this page:

```
unzip xv6-setup-student.zip
cd xv6-setup-student
```

(Windows students: you already unzipped it in Step 7 of the Windows section; just `cd` into it.)

**From Lab 1 on**, each lab comes as its own **zip** (for example `lab1-util-student.zip`).
Unzip the lab you are working on. That gives you a folder with the lab's starter code;
the lab's steps are on [this site](../../labs/index.md):

```
unzip lab1-util-student.zip
cd lab1-util-student
```

There is no shared repository and no branches to switch between: each lab is its own folder,
and you unzip the next one when you start it. The lab zips contain the same xv6 as
`xv6-setup-student` plus that lab's tasks, so anything you learned there carries over.

## Checking your setup

From inside the `xv6-setup-student` folder, run:

```
make qemu
```

You should see xv6 boot and land at a shell prompt:

```
xv6 kernel is booting

init: starting sh
$
```

Type `ls` and press Enter. You should see a list of programs. To **quit QEMU**, press
`Ctrl-a`, release, then press `x`. (That is the QEMU escape: hold Ctrl and press `a`, let go,
then press `x`.)

If `make qemu` prints "Couldn't find a riscv64 version of GCC/binutils", the cross-compiler
is not installed or is not on your PATH. Recheck the install step for your OS. If QEMU starts
but nothing appears, make sure you are on WSL2 (not WSL1) or inside your Linux VM.

Once you see the `$` prompt and can quit cleanly, your setup is done.

## When your setup is done

This setup has nothing to hand in, and nothing is graded. Its only purpose is to get your
tools working before the labs begin. You are done when all three of these work on your
own machine:

1. **xv6 boots**: `make qemu` reaches the `$` prompt and `ls` shows a list of programs.
2. **The cross-compiler runs**: `riscv64-unknown-elf-gcc --version` (macOS) or
   `riscv64-linux-gnu-gcc --version` (Linux / WSL) prints a version.
3. **The emulator runs**: `qemu-system-riscv64 --version` prints a version.

If one of the three does not work, go back to the install section for your system and
its list of what can go wrong. Have all three working before you start Lab 1 (`util`), so
that your time there goes to the lab itself and not to installation. You will not use
`make grade` here; the grader belongs to the labs and starts with Lab 1.
