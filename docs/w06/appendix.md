# Appendix A. The small arithmetic this week uses {#appendix-a}

Units of time: 1 s = 1000 ms; 1 ms = 1000 µs. To turn microseconds into a share of a slice measured in milliseconds, turn the slice into microseconds first: a 10 ms slice is 10,000 µs, so 1.5 µs of it is 1.5 / 10,000 = 0.00015, which is 0.015%.

Percent: a fraction times 100. 0.903 is 90.3%. To get a share from weights, divide one weight by the sum of all the competing weights.

Average: sum, then divide by the count. For turnaround times, each job's turnaround is its finish time minus its arrival time, and the subtraction happens before the average.

Reading a timeline: the left edge of a bar is when the job got the CPU; the right edge is when it gave the CPU up; a job's response time is the left edge of its first bar minus its arrival; its turnaround is the right edge of its last bar minus its arrival.
