# Exercises and answers

## The class in ten sentences {#the-week}

1. A priority ranks jobs; it says who runs first but never how much each gets, so it cannot promise a share.
2. A ticket count is a share: a job's percentage of all tickets is its percentage of the CPU.
3. Lottery scheduling draws one random ticket per time slice and runs its owner, found by a walk that adds up ticket counts.
4. The lottery is right only on average, so a short job can be treated unfairly; the fairness metric F (first finish over second finish) measures it.
5. Stride scheduling gives each job a step of 10000 over its tickets and a counter, the pass; the lowest pass runs and climbs by its step, which gives the exact ticket ratio in every cycle.
6. Linux's version of the pass is vruntime: in CFS the lowest runs, and in CFS a turn is the job's weight share of a 48 ms window, never below 6 ms.
7. A table turns each nice value into a weight; the weight sets both the turn (its share, weight over the sum of weights, of the 48 ms window) and how slowly the job's virtual clock runs, and keeping the clocks level gives the share.
8. Each CPU has its own cache; the hardware keeps copies correct (cache coherence), but a moved job may find its data gone from the new CPU's cache and fetch it again, so a scheduler keeps a job where it last ran (cache affinity).
9. One shared queue (SQMS, as in xv6) needs a lock on every decision and bounces jobs between CPUs; a queue per CPU (MQMS) scales and keeps affinity but can leave a CPU idle.
10. Linux keeps a queue per CPU and a balancer that migrates jobs, and the lock that a shared queue needs is where the next piece of the course begins.

## Exercises {#exercises}

Try each one before you look at its answer. The method each one needs is in the part named in brackets.

1. ([Section 1.6](class-1.md#sec-1-6), 1.7) Three jobs hold X 400, Y 200 and Z 100 tickets. Compute their strides with 10000. Then run stride by hand until all three passes are level again, breaking every tie in the order X, Y, Z. How many turns does each job get in one cycle, and why does that match the tickets?
2. ([Section 1.2](class-1.md#sec-1-2)) Use OSTEP's 20 draws from [Section 1.2](class-1.md#sec-1-2) (63, 85, 70, 39, 76, 17, 29, 41, 36, 39, 10, 99, 68, 83, 63, 62, 43, 0, 49, 12), but now A holds tickets 0 to 59 and B holds 60 to 99. What share should B get, and what share did B get in these 20 slices?
3. ([Section 1.3](class-1.md#sec-1-3)) A holds 100 tickets, B 50 and C 250, in that order. Walk the list for the draws 99, 100, 149, 150 and 399. Who wins each one?
4. ([Section 1.6](class-1.md#sec-1-6)) In the stride example of [Section 1.6](class-1.md#sec-1-6) (A 100, B 50, C 250), break the turn-2 tie the other way: C goes before B. Trace the whole cycle. Does the cycle still close at 200, and with the same number of turns per job?
5. ([Section 2.3](class-1.md#sec-2-3)) Two always-running jobs share one core, one at nice 0 and one at nice 3. Using the weight table, what share does each get, and how long is each one's turn in CFS's 48 ms window?
6. ([Section 2.4](class-1.md#sec-2-4), reading a capture) In `vruntime.out` ([Section 2.4](class-1.md#sec-2-4)), divide the nice 5 job's `se.sum_exec_runtime` by the nice 10 job's. Compare it with the ratio of their weights. Then explain, in two sentences, why their `se.vruntime` values are almost equal.
7. ([Section 3.3](class-1.md#sec-3-3), 3.5, 3.6) Which of the two designs, one shared queue or a queue per CPU, loses cache affinity, and which one risks an idle CPU? Say why each one does.
8. ([Section 3.2](class-1.md#sec-3-2), reading a capture) [Section 3.2](class-1.md#sec-3-2) worked out the cost per move for the first repeat round. The other two rounds of `affinity_x3.out` gave pinned 4.08 and 3.45 s, same 3.83 and 4.50 s, and bounce 10.38 and 10.90 s, with 6102 moves in each bounce run. For each of these two rounds, work out the extra time per move and the time per line of the 16,384-line list. Are both in the range of a fetch from far away (tens of nanoseconds per line)? What do the same runs say about the cost of the `pin()` call?
9. ([Section 1.7](class-1.md#sec-1-7), [Extra 4](class-1.md#extra-4)) What should the pass value of a new process be set to: 0, the smallest pass in the queue, or the largest? And what about a process that returns from waiting for input or output?
10. ([Section 1.4](class-1.md#sec-1-4), [Section 2.1](class-1.md#sec-2-1)) Count the work as the number of jobs the scheduler has to look at to make one decision. How does that number grow with the number of jobs (in step with it, which is called linear, or much more slowly) under lottery, and under stride with a plain list? Does keeping the jobs in a balanced tree ordered by pass help stride with very many processes?
11. ([Section 1.5](class-1.md#sec-1-5)) Two equal jobs of 100 slices each run under the lottery. The first finishes at slice 190. What is F? Could F ever be below 0.5 for two equal jobs?
12. ([Chapter 3](class-1.md#chapter-3), in your own words) A friend says: "The hardware keeps caches coherent, so moving a job to another CPU costs nothing, and a shared queue needs no lock." Explain in your own words, in four or five sentences, what is right and what is wrong about each half of that sentence.

## Answers {#answers}

**[Answer 1](#answers).** Strides: X 10000 / 400 = 25, Y 10000 / 200 = 50 and Z 10000 / 100 = 100. All passes start at 0.

| turn | pass X | pass Y | pass Z | who runs |
|---|---|---|---|---|
| 1 | 0 | 0 | 0 | X (tie, X first) |
| 2 | 25 | 0 | 0 | Y (tie of Y and Z, Y first) |
| 3 | 25 | 50 | 0 | Z |
| 4 | 25 | 50 | 100 | X |
| 5 | 50 | 50 | 100 | X (tie of X and Y, X first) |
| 6 | 75 | 50 | 100 | Y |
| 7 | 75 | 100 | 100 | X |
| (next) | 100 | 100 | 100 | level: the cycle is over |

X ran 4 turns (1, 4, 5, 7), Y 2 (2, 6) and Z 1 (3). The cycle closes at 100, the first number that whole steps of 25, 50 and 100 all land on: 4 × 25 = 100, 2 × 50 = 100, 1 × 100 = 100. So the turns are 100 / 25 = 4, 100 / 50 = 2 and 100 / 100 = 1, and 4 : 2 : 1 is 400 : 200 : 100, the tickets divided by 100.

**[Answer 2](#answers).** B should get 40 / 100 = 40%. B's draws are those from 60 to 99: 63, 85, 70, 76, 99, 68, 83, 63, 62. That is 9 of 20, and 9 / 20 = 45%. Five points too many this time; the lottery is only right on average.

**[Answer 3](#answers).** A's block ends at 100, B's at 150, C's at 400, and a draw belongs to the first block whose end is past it.

- 99: after A the total is 100, which is past 99: A.
- 100: after A the total is 100, which is not past 100; after B it is 150, past 100: B.
- 149: after B, 150 is past 149: B.
- 150: after B, 150 is not past 150; after C, 400 is: C.
- 399: after C, 400 is past 399: C.

**[Answer 4](#answers).** Turn 1: A (0 → 100). Turn 2: B and C tie at 0, and C goes: C 0 → 40. Turn 3: B at 0 is the lowest: B 0 → 200. Turn 4: C at 40 is lowest: 40 → 80. Turn 5: C 80 → 120. Turn 6: A at 100 is lowest: 100 → 200. Turn 7: C 120 → 160. Turn 8: C 160 → 200. All three are at 200 after 8 turns, with A 2, B 1 and C 5, as before. Only the order inside the lap changed (A C B C C A C C instead of A B C C C A C C).

**[Answer 5](#answers).** The table's line labeled 0 reads 1024, 820, 655, 526, 423 for nice 0 to 4, so nice 3 has weight 526. The sum is 1024 + 526 = 1550. Shares: 1024 / 1550 = 66.1% and 526 / 1550 = 33.9%, about 2 to 1. Turns: 0.661 × 48 = 31.7 ms and 0.339 × 48 = 16.3 ms. Check this: 31.7 + 16.3 = 48.0.

**[Answer 6](#answers).** 566.67 / 187.71 = 3.02, and the weights give 335 / 110 = 3.05: the run times are in the ratio of the weights. The vruntimes are almost equal because the scheduler keeps the clocks close (under CFS it always runs the lowest clock; under EEVDF it never runs a job whose clock is ahead of the weighted average of the clocks, [Extra 5](class-1.md#extra-5)), so no clock can get far from the others. Each clock ticks at 1024 over the job's weight, so keeping the clocks level forces the real run times into the ratio of the weights, which is the 3.02 we just computed.

**[Answer 7](#answers).** The single shared queue loses cache affinity: every CPU takes whatever job is next, so a job lands on a different CPU nearly every slice and its cache is never warm ([Section 3.3](class-1.md#sec-3-3)). A queue per CPU risks an idle CPU: each queue sees only its own jobs, so when jobs finish unevenly one queue runs dry while another still holds several, and that CPU idles until a job is migrated ([Section 3.6](class-1.md#sec-3-6)).

**[Answer 8](#answers).** Second round: (10.38 − 4.08) / 6102 = 6.30 / 6102 = 1.03 ms per move, and 1.03 ms / 16,384 = 63 ns per line. Third round: (10.90 − 3.45) / 6102 = 7.45 / 6102 = 1.22 ms per move, and 1.22 ms / 16,384 = 74.5 ns per line. Both are tens of nanoseconds per line, the cost of a fetch from far away, so both are consistent with a refill of the list after every move. Same against pinned: 3.83 against 4.08 (faster), 4.50 against 3.45 (slower). The differences go both ways and are as large as a second, which is the machine's noise, so the `pin()` call itself is hidden in that noise: with about one call a millisecond, these runs of 3.8 and 4.5 s make about 3,800 and 4,500 calls, so a second of noise only says each call costs under about 0.3 ms. Only the bounce difference is consistent, and it comes from the moves.

**[Answer 9](#answers).** Not 0: with pass 0 the newcomer is the lowest for a long time and takes the whole CPU until it catches up, which starves the others (the same problem as the sleeper of [Extra 4](class-1.md#extra-4)). The largest pass would make it wait almost a whole cycle before its first turn. The smallest pass in the queue is the safe choice: the newcomer gets its first turn soon, without starving the others or waiting a whole cycle, and then advances by its stride like everyone else. A process back from waiting for input or output is the same case: its old pass is now far behind everyone's, so it gets the current minimum. That is what CFS does with vruntime on wake-up ([Extra 4](class-1.md#extra-4)), at the cost of forgetting the time the job was owed; EEVDF refines the rule with the lag of [Extra 5](class-1.md#extra-5).

**[Answer 10](#answers).** Lottery: one random number, then a walk down the list adding tickets until the total passes the draw. In the worst case the walk reads every job, so the work grows in step with the number of jobs (twice the jobs, twice the work), which is called **linear**. (Putting the jobs with the most tickets first shortens the average walk, but not the worst case.) Stride with a plain list: finding the lowest pass means reading every job, also linear. With the jobs in a balanced tree ordered by pass, finding, removing and reinserting take about as many steps as there are levels, about 10 for 1000 jobs and 20 for a million: logarithmic. That is what Linux does with vruntime, and it is what lets a kernel hold very many runnable jobs and still decide every few milliseconds. For stride, then, yes: the data structure is what lifts the practical limit. For the lottery a tree ordered by pass does not help, because the lottery walks ticket ranges, not passes; it needs a different structure, beyond this class.

**[Answer 11](#answers).** Both jobs need 100 slices, so between them they use 200 slices, and the second finishes at slice 200. F = 190 / 200 = 0.95. F cannot be below 0.5: the first job finishes at slice 100 at the earliest (it needs 100 slices of its own), and the second at slice 200 at the latest, so F is at least 100 / 200 = 0.5.

**[Answer 12](#answers).** Several good answers are possible; this is one. The first half is half right. The hardware does keep caches coherent, so a moved job computes the right answer. But it may arrive at its new CPU to find its data missing from that cache and have to fetch it again from farther away (the shared cache or memory), a cost the size of the 0.48 to 1.2 ms per move that made the affinity test 1.7 to 3.3 times slower; moving is correct but not free. The second half is wrong. Coherence keeps each copy of each value up to date, but taking a job from a queue is several steps (read the head, then change it), and two CPUs can do those steps at the same moment and both take the same job. Only a lock, which lets one CPU at a time touch the queue, prevents that.
