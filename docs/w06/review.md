# Exercises and answers

## Exercises {#exercises}

Try each one on paper before looking at the answers.

1. (Asked in class.) Why don't we make the time slice really small, say one instruction?

2. (Asked in class.) If N jobs all arrived at the same time under round robin, which one would finish first, and by how much?

3. (Asked in class.) What is the longest a process can go without being scheduled in MLFQ, and why is that not a hard bound?

4. (Asked in class.) How does MLFQ approximate SJF?

5. Three jobs arrive together needing 30, 5 and 5 s. Draw the timelines for FIFO (in that order), SJF and round robin with a 5 s slice, and compute the average turnaround and the average response time for each.

6. A arrives at 0 and needs 40 s; B arrives at 10 and needs 10 s; C arrives at 15 and needs 5 s. Draw STCF and compute the average turnaround time, subtracting the arrival times.

7. The switch costs 1.5 µs on the Ubuntu machine. What share of the CPU is lost to switching with a 2 ms slice? With a 20 ms slice? Give both as percentages.

8. Read the capture batch_fifo.out in [Section 1.4](class-1.md#sec-1-4). If the shell had run C, A, B in that order, what would each job's turnaround time have been, and what would the average be?

9. A 25 ms job enters a 3-queue MLFQ with 10 ms slices and the first version of the rules (3, 4a, 4b) while a long job sits on Q0. On which queue is it at time 5, at time 15, and when it finishes? When does it finish?

10. In the trace of Figure 6.1 (the starvation trace), suppose a boost every 50 ms instead of 100. How much CPU would A get between 100 and 200?

11. Two jobs on one core, nice 0 and nice 5. Using the weight table in [Section 7.2](class-2.md#sec-7-2), what share does each get? Check the table's own column.

12. In your own words: why can no scheduling rule win both turnaround time and response time, and what does MLFQ do about it?

## Answers {#answers}

1. Because every switch has a cost that does not shrink with the slice. With a slice of one instruction the kernel would run the timer handler, save and restore registers, and refill the caches and the TLB for every single instruction of work, so nearly all the CPU would go to switching and almost none to the jobs. The slice must be long enough that the switch cost (1.5 µs on the Ubuntu machine, plus the hidden cache cost) is a small share of it; that is amortization ([Section 3.3](class-1.md#sec-3-3)).

2. The job at the front of the queue, but only by one slice. With N equal jobs and a slice of q, every job gets a slice in each round, so they all reach their last slice in the same final round: the first finishes at the end of its last slice, the next one q later, and so on. For three 5 s jobs with 1 s slices that was 13, 14, 15 ([Section 3.2](class-1.md#sec-3-2)).

3. About S plus one top-queue slice times the number of jobs. Worst case: the job has sunk to the bottom while jobs above keep the top busy, so it waits for the next boost, at most S; after the boost every job is on the top queue sharing by round robin, so it waits one slice for each job ahead of it. Not a hard bound, because the number of jobs can change while it waits: new jobs enter at the top ([Section 6.1](class-2.md#sec-6-1)).

4. It assumes every new job is short by putting it on the top queue (Rule 3). A job that really is short finishes there, ahead of everything below, which is what SJF would have done. A job that is long proves it by using its allotment and sinks (Rule 4), so it stops delaying the short ones. No length is known in advance; the guess is corrected by the job's own behavior, and the boost (Rule 5) lets it be revised (Sections [5.3](class-2.md#sec-5-3) and [5.4](class-2.md#sec-5-4)).

5. FIFO: 30 then 5 then 5. Finishes 30, 35, 40; turnaround average (30 + 35 + 40) / 3 = 35; response 0, 30, 35, average 21.67. SJF: 5, 5, 30. Finishes 5, 10, 40; turnaround average 55 / 3 = 18.33; response 0, 5, 10, average 5. RR with 5 s slices: A 0 to 5, B 5 to 10, C 10 to 15, then only A is left, 15 to 40. Finishes 40, 10, 15; turnaround average 65 / 3 = 21.67; response 0, 5, 10, average 5. (Here RR's turnaround beats FIFO because the long job came first in FIFO; with 5 s slices and 5 s short jobs, RR ran the short jobs to completion in one slice each, so it behaved like SJF after the first slice.)

6. STCF: A runs 0 to 10. At 10, B arrives with 10 left against A's 30, so B runs 10 to 15. At 15, C arrives with 5 left against B's 5 and A's 30; tie between B and C, keep B (it was running): B 15 to 20, then C 20 to 25, then A 25 to 55. Turnaround: A 55 − 0 = 55, B 20 − 10 = 10, C 25 − 15 = 10. Average 75 / 3 = 25. (If the tie at 15 is broken toward C, C runs 15 to 20 and B 20 to 25; turnaround B 15, C 5; the average is the same 25.)

7. 1.5 µs out of 2000 µs is 1.5 / 2000 = 0.00075, which is 0.075%. Out of 20,000 µs it is 0.0075%. (By the chapter's rough rule the slice should be long enough that this is small; both are.)

8. C would finish at about 0.1 s, A at about 1.1 s (0.1 + 1.0), B at about 1.2 s. Turnaround 0.1, 1.1, 1.2; average 2.4 / 3 = 0.8 s. (The real run would add a few milliseconds per job for start-up, as the capture shows.)

9. It enters on Q2 at time 0 and runs at once (Q2 beats Q0). At time 5 it is on Q2. After 10 ms it has used its allotment and drops to Q1; at time 15 it is on Q1. After 20 ms it drops to Q0, where it shares with the long job by round robin: it runs its last 5 ms as its first slice on Q0 (it arrives at the back of Q0, so if the long job is mid-slice it waits for that slice to end first). It finishes on Q0 at time 25 if it ran immediately, or up to 10 ms later if the long job's slice came first.

10. A would be boosted at 100 and 150, and run a 10 ms slice at the top each time before sinking: 20 ms of CPU between 100 and 200, instead of 10 with a boost every 100 ms (and 0 with no boost).

11. Weights 1024 and 335. nice 0: 1024 / (1024 + 335) = 1024 / 1359 = 0.753, about 75%. nice 5: 335 / 1359 = 0.247, about 25%. The table's column says 24.7% for nice 5 beside nice 0.

12. Turnaround rewards finishing jobs early, which means running one job to the end before another starts, so the others wait a long time for their first turn. Response rewards starting every job early, which means slicing the CPU so that nothing finishes early. The two goals ask for opposite orders, so any rule that is good at one is bad at the other. MLFQ does not escape the trade-off; it guesses which jobs are interactive (the ones that keep giving the CPU back) and gives them response, while the jobs that use every slice sink and get turnaround-style treatment among themselves. It learns the guess from behavior, since the lengths are never known, and it corrects the guess with a boost.
