# Appendix A. Reading the C of this class {#appendix-a}

The symbols of C that this guide uses, with where each first appears.

| in the code | what it means | first in |
|---|---|---|
| `int x = 0;`, `long i` | a whole-number variable starting at 0; a whole number with room for bigger values | Part 0, [Section 2.4](class-1.md#sec-2-4) |
| `char text[] = "...";`, `char *p` | a row of characters holding a text; a pointer to text | Part 0, [Section 2.2](class-1.md#sec-2-2) |
| `struct thd_t { char *proc_info; };` | a bundle type with one field | Part 0, [Section 2.2](class-1.md#sec-2-2) |
| `thd->proc_info`, `t->State` | a field of the bundle a pointer leads to | Part 0 |
| `&x` | the address of `x` | Part 0 |
| `*t`, `sizeof(*t)` | the thing the pointer `t` points to; its size in bytes | Part 0, [Section 2.3](class-1.md#sec-2-3) |
| `NULL` | the pointer to nothing; following it crashes the program | Part 0 |
| `if (p) { ... }` | run the body only if `p` is not 0 (not NULL) | Part 0, [Section 2.2](class-1.md#sec-2-2) |
| `for (;;)`, `for (long i = 1; ; i++)` | a loop with no end; a counted loop with no stop condition | Part 0, [Section 3.2](class-1.md#sec-3-2) |
| `while (mtInit == 0)` | repeat while the flag is 0 | Part 0, [Section 2.9](class-1.md#sec-2-9) |
| `==`, `!=`, `<`, `>=` | is equal to; is not equal to; is less than; is at least | Part 0 |
| `x++`, `seen[tmp]++` | add 1; add 1 to element `tmp` of an array | Part 0 |
| `#define LOOPS 10000000` | make `LOOPS` a name for a number | Part 0, [Section 2.4](class-1.md#sec-2-4) |
| `void *thread1(void *arg)`, `return NULL;` | the form of a thread's function: one pointer in (`arg`), one pointer out; `void *` is a pointer to anything | Part 0 |
| `int main(int argc, char *argv[])` | where every C program starts; how many words were typed on the command line, and the list of them | Part 0 |
| `printf("mState = %d\n", mState)` | print a text with a number in it | Part 0, [Section 2.8](class-1.md#sec-2-8) |
| `fputs(s, stdout)`, `"\r"` | print the text `s` on the normal output; back to the start of the line | [Section 2.2](class-1.md#sec-2-2) |
| `fprintf(stderr, "... %ld\n", i)` | print on the error stream, which shows each line at once | [Section 2.5](class-1.md#sec-2-5), [Section 3.2](class-1.md#sec-3-2) |
| `malloc(sizeof(*t))` | hand out memory the size of the thing `t` points to | Part 0, [Section 2.3](class-1.md#sec-2-3) |
| `&t->id` | the address of the field `id` of the record `t` points to: `&(t->id)` | [Section 2.7](class-1.md#sec-2-7) |
| `pthread_t`, `pthread_create(&id, NULL, f, NULL)`, `pthread_join(id, NULL)` | the type that names a thread; start a thread running `f()`; wait for it to finish | Part 0, [Section 2.3](class-1.md#sec-2-3), [Section 2.7](class-1.md#sec-2-7) |
| `pthread_mutex_t m = PTHREAD_MUTEX_INITIALIZER;` | a lock, free at the start | Part 0 |
| `pthread_mutex_lock(&m)`, `pthread_mutex_unlock(&m)` | take the lock, waiting if held; give it back | Part 0 |
| `pthread_cond_t c = PTHREAD_COND_INITIALIZER;` | a condition variable, with nobody asleep | Part 0 |
| `pthread_cond_wait(&c, &m)`, `pthread_cond_signal(&c)` | give the lock back and sleep in one step; wake one sleeper | Part 0, [Section 2.9](class-1.md#sec-2-9) |
| `sem_init(&s, 0, X)`, `sem_wait(&s)`, `sem_post(&s)` | start a semaphore at X; take one, and sleep if the count is now below 0 (in the textbook's count, −1 means one thread waiting; Linux's count stays at 0); add one, and wake a sleeper | Part 0 |
| `usleep(100000)` | pause 100,000 microseconds, a tenth of a second | Part 0 |
| `for (volatile int k = 0; k < 100000; k++) ;` | an empty loop that the compiler must keep: a little time spent | [Section 2.8](class-1.md#sec-2-8) |
| `//`, `...` | a comment; lines left out of a listing | Part 0 |

The shell commands the guide uses:

| command | what it does | first in |
|---|---|---|
| `$` | the prompt; what follows was typed | Part 0 |
| `./atomicity` | run the program in this folder | Part 0 |
| `a; b` | run `a`, then `b` | Part 0 |
| `echo $?` | print the last program's exit status (0 normal, 124 timeout, 128 + n killed by signal n) | Part 0, [Section 2.3](class-1.md#sec-2-3) |
| `kill -l` | print Linux's list of signals with their numbers (SIGSEGV is 11) | [Section 2.3](class-1.md#sec-2-3) |
| `> /dev/null`, `2> /dev/null`, `2>&1` | throw the normal output away; throw the error stream away; send the error stream where the normal output goes | Part 0, [Section 2.8](class-1.md#sec-2-8) |
| `gcc -g -Wall -pthread -o atomicity atomicity.c` | compile, with debug information, all warnings and thread support, into `atomicity` | [Section 2.3](class-1.md#sec-2-3) |
| `timeout 5 ./deadlock` | kill the program if it still runs after 5 seconds (exit status 124) | Part 0, [Section 3.3](class-1.md#sec-3-3) |
| `/usr/bin/time -f 'real %e s' ./pc 1` | run and print the seconds it took | Part 0 |
| `./runs.sh ./ordering 200` | run a program 200 times and count the ok and crashed runs | [Section 2.8](class-1.md#sec-2-8) |
| `for i in $(seq 1 $2); do ... done` | repeat the body once for each number; `$( ... )` puts a command's output in its place | [Section 2.8](class-1.md#sec-2-8) |
| `seq 1 200`, `$1`, `$2`, `[ $? -eq 0 ]`, `$((ok+1))` | the numbers 1 to 200; the script's first and second inputs; "is the exit status 0?"; ok plus one | [Section 2.8](class-1.md#sec-2-8) |
| `diff a b` | print the lines in which two files differ (`20a21`: after line 20, add line 21) | [Section 2.8](class-1.md#sec-2-8) |
| `./deadlock 2> /dev/null &` | start the program in the background, as a job the shell numbers (`[1]`) | [Section 3.3](class-1.md#sec-3-3) |
| `ps -L -o tid,stat,pcpu,wchan:16,comm -C deadlock` | list each thread of the program with its id, state, CPU share, what it sleeps in, and name | [Section 3.3](class-1.md#sec-3-3) |
| `kill %1` | end background job 1 | [Section 3.3](class-1.md#sec-3-3) |

Arithmetic: a share is a part divided by the whole (74 / 105 = 0.705, about 70%), checked by multiplying back (0.705 × 105 = 74.0). When a run is killed by a signal, the shell reports 128 plus the signal's number, a fixed rule of the shell (139 = 128 + 11, SIGSEGV). A program can also end on its own with a number above 128, so read a status this way only for a run that was killed.
