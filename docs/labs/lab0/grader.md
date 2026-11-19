# Running the autograder

Every lab ships with an automatic grader so you always know where you stand. This page
explains how to run it.

## Running the tests

From the top of the lab folder (the folder you unzipped for this lab):

```
make grade
```

This builds xv6 and runs every test for the lab, printing `OK` or `FAIL` for each and a
final score. You can run a single test by name, which is much faster while you work:

```
./grade-lab-util sleep        # just the sleep tests
./grade-lab-fs symlink        # just the symlink tests
```

The grader boots xv6 in QEMU for each test, so a full run takes a few minutes; the file
tests (`bigfile`, `usertests`) take the longest. That is normal.

## The `time.txt` file

Each lab expects a file called `time.txt` in the lab folder containing just the number of
hours you spent (for example, `6`). Create it before your final `make grade`:

```
echo 6 > time.txt
```

The grader gives it one point.

## A note on public solutions

Public solutions to the original MIT labs exist online. Each lab here has one or more
tasks of its own that are not in any public solution, and the grader checks them. More to
the point, the difficulty of these labs is meant to be in *understanding* the system, not
in typing the code, and a pasted solution you cannot explain teaches you nothing.
