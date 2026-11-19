# Two shell facts worth knowing before Lab 1

Files you create inside xv6 do not survive `make qemu`:

```
$ echo hi > test
$ cat test
hi
$ ls test
test           2 29 3
```

Quit (Ctrl-a x), run `make qemu` again, and `cat test` says `cat: cannot open test`. That is
because `make qemu` rebuilds `fs.img` from scratch every time. `make qemu-fs` boots the
existing image and keeps your files, which is useful when you are testing `find` in Lab 1.

And a few numbers, so you know how small this thing is. On your host, `wc -l kernel/*.c`
gives about 5,100 lines for the entire kernel; `grep -c 'define SYS_' kernel/syscall.h`
gives 21 system calls; the `UPROGS` list has around twenty programs. xv6 is meant to be read
end to end, and over the semester you will read most of it.
