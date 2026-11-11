# Appendix A. The program behind the Linux captures {#appendix-a}

## The program diskio.c (you can skip this listing)

Extras [2](class-1.md#extra-2) and [4](class-1.md#extra-4) show what this program printed on the Linux VM. Here is all of it, from `W11_demos/diskio.c`. In plain words: it opens a file for reading with O_DIRECT, so that each read goes to the disk. It reads a given number of blocks of 4,096 bytes, either in order (`seq`) or at random places (`rand`). It measures the time that passed and the CPU time it used, and asks the kernel how many times the process gave up the CPU by waiting, which is its count of sleeps. Then it prints all of that.

```c linenums="1" hl_lines="26 41 47 52"
// diskio.c: read a file straight from the disk, one request at a time.
// O_DIRECT skips the kernel's page cache, so every read goes to the device.
// Mode "seq" reads blocks 0, 1, 2, ... in order; "rand" reads blocks chosen
// at random. It prints the time per read, the throughput, the CPU time the
// process used, and how many times it went to sleep (voluntary switches).
#define _GNU_SOURCE
#include <fcntl.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/resource.h>
#include <sys/stat.h>
#include <time.h>
#include <unistd.h>

static double secs(struct timeval t) { return t.tv_sec + t.tv_usec / 1e6; }

int main(int argc, char *argv[]) {
  if (argc < 4) {
    fprintf(stderr, "usage: %s file seq|rand count [blocksize]\n", argv[0]);
    return 1;
  }
  int rnd = strcmp(argv[2], "rand") == 0;
  long n = atol(argv[3]);
  long bs = argc > 4 ? atol(argv[4]) : 4096;
  int fd = open(argv[1], O_RDONLY | O_DIRECT);
  if (fd < 0) { perror("open"); return 1; }
  struct stat st;
  fstat(fd, &st);
  long nblocks = st.st_size / bs;
  void *buf;
  if (posix_memalign(&buf, 4096, bs) != 0) return 1;
  srandom(42);

  struct rusage r0, r1;
  struct timespec t0, t1;
  getrusage(RUSAGE_SELF, &r0);
  clock_gettime(CLOCK_MONOTONIC, &t0);
  for (long i = 0; i < n; i++) {
    long b = rnd ? random() % nblocks : i % nblocks;
    if (pread(fd, buf, bs, b * bs) != bs) { perror("pread"); return 1; }
  }
  clock_gettime(CLOCK_MONOTONIC, &t1);
  getrusage(RUSAGE_SELF, &r1);

  double el = (t1.tv_sec - t0.tv_sec) + (t1.tv_nsec - t0.tv_nsec) / 1e9;
  double cpu = secs(r1.ru_utime) - secs(r0.ru_utime) + secs(r1.ru_stime) - secs(r0.ru_stime);
  printf("%s: %ld reads of %ld bytes\n", rnd ? "random" : "sequential", n, bs);
  printf("elapsed %.3f s, %.1f us per read, %.1f MB/s\n", el, el / n * 1e6,
         (double)n * bs / el / (1024 * 1024));
  printf("CPU time %.3f s (%.0f%% of elapsed)\n", cpu, 100 * cpu / el);
  printf("went to sleep %ld times\n", r1.ru_nvcsw - r0.ru_nvcsw);
  return 0;
}
```

The lines that matter:

- Line 26 opens the file with `O_RDONLY | O_DIRECT`: read only, and bypass the page cache. Lines 7 to 14 bring in the library pieces it uses (`#include`), and line 6, `#define _GNU_SOURCE`, makes Linux's extra names such as `O_DIRECT` available.
- `argc` and `argv` (line 18) are the number of words typed on the command line and the words themselves; `1e6` and `1e9` are a million and a billion, written as powers of ten. Line 32: O_DIRECT needs the buffer to start at an address that is a multiple of 4,096, and `posix_memalign()` hands out such a buffer.
- Lines 39 to 42 are the loop. `c ? a : b` is C's short form of "if `c` then `a`, else `b`" (lines 25, 40 and 48). `pread(fd, buf, bs, b * bs)` reads `bs` bytes at byte position `b * bs` of the file, that is, block number `b`. In `seq` mode `b` is `i`, the loop count (`i % nblocks` only wraps around at the end of the file); in `rand` mode it is a random block number. `srandom(42)` on line 33 fixes the random sequence, so every `rand` run reads the same blocks.
- Lines 37, 38, 43 and 44 take the time and the process's resource counters before and after the loop. `clock_gettime(CLOCK_MONOTONIC, ...)` is the wall clock for measuring elapsed time; `getrusage(RUSAGE_SELF, ...)` fills a struct with the process's own counters.
- Line 47 adds the user time and the system time (time in the kernel on the process's behalf): that is the CPU time.
- Line 52 prints `ru_nvcsw`, the number of **voluntary context switches**: how many times the process gave up the CPU because it had to wait. With one read waiting at a time, that is the number of times it went to sleep for the disk.

Compile and run, on the Linux VM, as `W11_demos/run_all.sh` does (it puts the program and a 1 GiB file of random bytes in `~/w11work`, in the VM's own home folder):

```text
$ gcc -g -Wall -O0 -o diskio diskio.c
$ dd if=/dev/urandom of=testfile bs=1M count=1024 status=none
$ ./diskio testfile seq 20000
```

`dd` here writes 1,024 pieces of 1 MiB of random bytes, a 1 GiB file. [Extra 4](class-1.md#extra-4)'s interrupt counts need the kernel's counters around the run as well; `run_all.sh` does that part.
