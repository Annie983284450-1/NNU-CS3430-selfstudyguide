# Before Step 0. One folder, one copy (Windows and WSL2)

If you are on a Mac or on native Linux, skip this section. You have one folder,
wherever you unzipped it.

On Windows, xv6 builds inside Ubuntu (WSL2), and Ubuntu has its own file system.
The lab folder belongs in your Ubuntu home folder `~`: copy the zip there and
unzip it there. That folder, `~/lab1-util-student`, is the only copy that `make`
reads.

## The picture

```
   Windows side                                Ubuntu side (WSL2)
   C:\Users\<you>\Downloads\lab1-util-student  /home/<you>/lab1-util-student
   +-----------------------------+             +-----------------------------+
   | user/sleep.c  <- you edit   | two copies, | user/sleep.c  <- make reads |
   | Makefile         here       | --- X ---   | Makefile         this one   |
   +-----------------------------+ not linked  +-----------------------------+
    from Ubuntu: /mnt/c/Users/<you>/...        from Windows: \\wsl$\Ubuntu\home\<you>\...
```

If you also unzipped the lab on the Windows side (Downloads, Desktop, OneDrive)
and you edit that copy, in Notepad or in a VS Code window opened from Windows,
then `make` in Ubuntu never sees the change. The symptom is the one in [Step 0](step-0.md):
`sleep 10` says `exec sleep failed` after you are sure you wrote `sleep.c` and
added the Makefile line. Nothing is wrong with your code. It is in the other
folder.

## Do this: pick one way to edit, and use only that one

All three edit the Ubuntu copy. Type the command in the Ubuntu terminal, inside
`~/lab1-util-student`.

| Way | Command | What to expect |
|---|---|---|
| VS Code | `code .` | Needs VS Code's WSL extension. The window title ends with `[WSL: Ubuntu]`. The terminal at the bottom is Ubuntu. |
| nano | `nano user/sleep.c` | Creates the file if it does not exist. Type, then Ctrl-O and Enter to save, Ctrl-X to quit. |
| Windows Explorer | `explorer.exe .` | Opens the Ubuntu folder in Explorer. The address bar starts with `\\wsl.localhost\Ubuntu\` (or `\\wsl$\`). Files you open from there are the Ubuntu copy, whatever editor you use. |

What not to do: keep a copy in Downloads or OneDrive and copy files across
each time. If you already have such a copy and want to bring one file over,
do it once and then forget the Windows copy:

**On Ubuntu (or Mac), in the lab folder:**

```
$ cp /mnt/c/Users/<WindowsName>/Downloads/sleep.c ~/lab1-util-student/user/
```

One more trap. `unzip` or `cp -r` into a folder that already exists can give
you a folder inside a folder, `~/lab1-util-student/lab1-util-student/`, and
then there are two `Makefile`s on the Ubuntu side as well. Check:

**On Ubuntu (or Mac), in the lab folder:**

```
$ cd ~/lab1-util-student
$ ls
```

You should see `Makefile`, `user`, `kernel`, `mkfs` and `grade-lab-util` side by side.
If that list also contains another `lab1-util-student`, that is a nested copy.
Work in the folder where `Makefile` and `user/` sit next to each other, and
remove the other one.

## You should see

Two commands, typed in the terminal where you will run `make qemu`, tell you
which copy you are in:

**On Ubuntu (or Mac), in the lab folder:**

```
$ pwd
/home/<you>/lab1-util-student
$ ls Makefile user/echo.c
Makefile  user/echo.c
```

If `pwd` starts with `/mnt/c/`, you are building on the Windows drive. It
works, but it is slow, and it is not the folder this guide uses. `cd ~/lab1-util-student` and stay there.
