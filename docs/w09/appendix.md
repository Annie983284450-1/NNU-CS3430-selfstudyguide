# Appendix A. Reading the C of this week {#appendix-a}

The symbols of C that this guide uses, with where each first appears.

| in the code | what it means | first in |
|---|---|---|
| `int x = 0;` | a variable `x` holding a whole number, starting at 0; `;` ends a statement | Part 0 |
| `static` | the variable or function belongs to this file only | Part 0 |
| `volatile` | fetch the variable from memory on every use, never from a stale register copy; not a lock | Part 0 |
| `typedef struct __counter_t { ... } counter_t;` | a bundle of named fields, with the short name `counter_t` | Part 0, [Section 1.1](class-1.md#sec-1-1) |
| `c->value`, `x.count` | a field of the bundle a pointer points at; a field of a bundle by name | Part 0 |
| `&x`, `*p` | the address of `x`; the thing a pointer `p` points at | Part 0 |
| `counter_t *c`, `void *arg`, `NULL` | a pointer to a counter; a pointer of unstated type; the pointer to nothing | Part 0 |
| `x++`, `x--`, `x += n` | add 1; subtract 1; add `n`; inside an expression `x++` gives the old value | Part 0, [Section 4.10](class-2.md#sec-4-10) |
| `a / b`, `a % b` | divide (dropping the fraction); the remainder | Part 0 |
| `int local[4]`, `a[i]` | four `int`s side by side; element `i` of an array, counting from 0 | Part 0, [Section 2.4](class-1.md#sec-2-4) |
| `#define LOOPS 1000000` | make `LOOPS` a name for a number | Part 0 |
| `for`, `while`, `if` | repeat with a counter; repeat while true; run once if true | Part 0 |
| `==`, `!=`, `<`, `>=`, `<=`, `&&` | is equal; is not equal; less than; at least; at most; and | Part 0 |
| `return rc;` | end the function and hand back `rc` | Part 0 |
| `printf("%d %s\n", n, s)` | print a number and a text | Part 0 |
| `//`, `...` | a comment; lines left out of a listing | Part 0 |
| `pthread_mutex_t`, `PTHREAD_MUTEX_INITIALIZER`, `pthread_mutex_init(&l, NULL)` | the POSIX lock type; starts a lock free where it is declared; sets a lock up at run time | Part 0, [Section 1.4](class-1.md#sec-1-4) |
| `pthread_mutex_lock(&l)`, `pthread_mutex_unlock(&l)` | take the lock, waiting if held; give it back | Part 0 |
| `int main(int argc, char *argv[])` | where a C program starts; the count and text of its command-line inputs | Part 0, [Section 3.1](class-1.md#sec-3-1) |
| `pthread_t`, `pthread_create(&t, NULL, f, arg)`, `pthread_join(t, NULL)` | the type that names a thread; start `f` as a thread with input `arg`; wait for it | [Section 3.1](class-1.md#sec-3-1) |
| `__sync_lock_test_and_set(&flag, 1)`, `__sync_lock_release(&flag)` | gcc's test-and-set; its store of 0 | Part 0 |
| `__sync_fetch_and_add(&x, 1)` | gcc's atomic add, one instruction | [Section 6.1](class-2.md#sec-6-1) |
| `int rc = c->value;` | a local variable, alive while the function runs | [Section 1.6](class-1.md#sec-1-6) |
| `threadID % NUMCPUS` | the remainder picks a slot | [Section 2.4](class-1.md#sec-2-4) |
| `__attribute__((aligned(128)))` | gcc: start each element on a 128-byte boundary | [Section 2.8](class-1.md#sec-2-8) |
| `sizeof(x)` | the size of `x` in bytes | [Section 2.7](class-1.md#sec-2-7) |
| `node_t *curr = L->head; while (curr) { ... curr = curr->next; }` | walk a linked list to its end | [Section 2.9](class-1.md#sec-2-9) |
| `break` | leave the loop at once | [Section 2.9](class-1.md#sec-2-9) |
| `malloc(n)`, `free(p)`, `perror("...")` | ask for `n` bytes of heap memory; give memory back; print an error message | [Extra 2](class-1.md#extra-2), [Extra 4](class-1.md#extra-4) |
| `2000000000L`, `long` | a `long` constant; a bigger whole-number type | [Section 3.1](class-1.md#sec-3-1) |
| `pthread_cond_t`, `PTHREAD_COND_INITIALIZER` | a condition variable; starts it with nobody asleep | [Section 3.4](class-1.md#sec-3-4), [Section 3.6](class-1.md#sec-3-6) |
| `pthread_cond_wait(&c, &m)`, `pthread_cond_signal(&c)`, `pthread_cond_broadcast(&c)` | release `m` and sleep on `c` in one step; wake one sleeper; wake every sleeper | [Section 3.4](class-1.md#sec-3-4), [Section 3.5](class-1.md#sec-3-5), [Extra 6](class-2.md#extra-6) |
| `usleep(100000)` | sleep for that many microseconds (0.1 s) | [Section 3.8](class-1.md#sec-3-8) |
| `Pthread_cond_wait(&c)` (capital P) | the book's error-checking wrapper; in Figure 30.5, with the lock argument dropped | [Section 3.9](class-1.md#sec-3-9) |
| `assert(count == 1)` | stop the program if the condition is false | [Section 4.1](class-2.md#sec-4-1) |
| `(int)(long)arg * ITEMS` | turn the thread's number, passed as a pointer, back into a number | [Section 4.6](class-2.md#sec-4-6) |
| `(fill_ptr + 1) % MAX` | step an index around a ring | [Section 4.7](class-2.md#sec-4-7) |
| `struct spinlock`, `uint`, `acquire()`, `release()` | xv6's lock type; unsigned `int`; xv6's lock and unlock | [Section 4.10](class-2.md#sec-4-10) |
| `sleep(chan, &lock)`, `wakeup(chan)` | xv6: sleep on an address, releasing the lock; wake every sleeper on it | [Section 4.10](class-2.md#sec-4-10) |
| `//DOC:` | a note the xv6 authors leave for their book | [Section 4.10](class-2.md#sec-4-10) |
| `sem_t`, `sem_init(&s, 0, X)`, `sem_wait(&s)`, `sem_post(&s)` | a semaphore; start it at X (0: shared between threads); value − 1, sleep below 0; value + 1, wake one | [Section 5.2](class-2.md#sec-5-2) |
| `right(p)` = `(p + 1) % 5` | the fork to the right, wrapping at the table | [Extra 8](class-2.md#extra-8) |

The shell commands the guide uses:

| command | what it does | first in |
|---|---|---|
| `$` | the prompt; what follows was typed | Part 0 |
| `./counter_lock 4` | run the program in this folder with input `4` | Part 0 |
| `time ./counter` | run and print how long it took (last week's form) | Part 0 |
| `/usr/bin/time -f 'real %e s  user %U s' ./join_spin` | run and print the real and user time | Part 0, [Section 3.2](class-1.md#sec-3-2) |
| `taskset -c 0 ./join_spin` | run on CPU 0 only | Part 0, [Section 3.2](class-1.md#sec-3-2) |
| `timeout 5 ./pc_onecv` | stop the program after 5 seconds | Part 0, [Section 3.8](class-1.md#sec-3-8) |
| `a; b` | run `a`, then `b` | Part 0 |
| `echo "exit status $?"` | print the last command's exit status (0 normal, 124 timeout, 134 assert) | Part 0, [Section 3.8](class-1.md#sec-3-8) |
| `stdbuf -oL ./join_nostate` | print each line as soon as it is made | [Section 3.8](class-1.md#sec-3-8) |
| `a \| b` | a pipe: `a`'s output becomes `b`'s input | Part 0, [Section 4.1](class-2.md#sec-4-1) |
| `strace -f -c -e trace=futex ./counter_mutex` | count the futex system calls a program and its threads make (`-c`: a summary row per call) | Part 0 |
| `getconf LEVEL1_DCACHE_LINESIZE` | ask Linux for the cache line size | [Section 2.7](class-1.md#sec-2-7) |

Units and arithmetic: 1 s = 1,000 ms = 1,000,000 µs. "A took N times as long as B" is A / B; "A is N times faster than B" is B's time / A's time. The remainder `a % b` is what is left after dividing `a` by `b` as whole numbers: 103 % 101 = 2, because 103 = 1 × 101 + 2.
