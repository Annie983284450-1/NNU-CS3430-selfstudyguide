# Exercises and answers

## The first class in ten points {#the-week}

1. Programs need input, output and data that outlasts the power, so the operating system has to drive devices: hardware on its own bus, a ladder of buses with the fast, short ones near the CPU.
2. Devices differ completely inside, so each one shows the OS the same kind of simple face: a few registers (in the textbook's example status, command and data), with everything else hidden.
3. The simplest protocol polls the status until the device is free, writes the data, writes the command, and polls again; polling is the asking, and programmed I/O is the CPU copying the data itself.
4. xv6's `uartputc_sync()` is that protocol for a console chip: line 118 polls bit 5 of the UART's LSR, and line 120's one write into THR is both the data and the command.
5. Polling a slow device wastes every slot of the wait, so the waiting process sleeps instead, another process runs, and the device raises an interrupt when it is done; the handler wakes the sleeper, and the CPU and the device work at once.
6. xv6's disk driver posts a request on the avail ring, writes the notify register once, and sleeps under its lock so the wake-up cannot be lost; the disk's interrupt reaches `devintr()` through the PLIC, and `virtio_disk_intr()` sets `b->disk` to 0 and calls `wakeup(b)`.
7. Counted on a run of xv6 under QEMU, `wc` on a 100-block file cost 106 requests, 106 sleeps and 106 interrupts in all 12 runs; on a fast device, though, polling can win, and a hybrid polls a little before it sleeps.
8. Copying a block word by word keeps the CPU busy again (1,024 stores for the textbook's 4 KB block), so with DMA the CPU only says where the data is, how much, and which device, and a helper copies it; xv6's descriptors give the disk the address of `b->data`, and the CPU touches none of its 1,024 bytes.
9. A plain load goes to RAM, so a device is reached either with privileged I/O instructions that name a port (x86 `in` and `out`) or with memory-mapped I/O; on xv6 the disk's registers sit at 0x10001000, which the QEMU monitor confirms by reading "virt", 2, 2, "QEMU" there.
10. One device driver per device keeps the rest of the kernel device-neutral behind block reads and writes, at the price of lost special abilities and a mountain of driver code; what a disk does with "block N" is the next class.

## Exercises {#exercises}
<!-- answers folded under their exercises -->

Try each one on paper before you open its answer. The method each one needs is in the section named in brackets.

### Exercise 1 {#exercise-1}

How does programmed I/O differ from DMA (direct memory access)? Which offers better performance and efficiency? ([Section 2.7](class-1.md#sec-2-7) and [Section 2.8](class-1.md#sec-2-8))

<details class="success answer" id="answer-1" markdown="1">
<summary>Answer 1 <span class="hint">click to show</span></summary>

With programmed I/O, the CPU moves every word between memory and the device itself: for a 4 KB block that is 4,096 / 4 = 1,024 stores, and the CPU can run nothing else while it copies. With DMA, the CPU only says where the data is in memory, how much to copy, and which device; the DMA engine copies, and the CPU runs another process meanwhile, until one interrupt says the copy is done. DMA is better whenever there is much data to move, because the CPU is free for the whole copy. For a tiny transfer, such as the UART's one character, the CPU simply writes it, as [Section 1.4](class-1.md#sec-1-4) showed.

</details>

### Exercise 2 {#exercise-2}

When is it better to poll a device instead of using interrupts? When is it the reverse? What about a hybrid? ([Section 2.2](class-1.md#sec-2-2) and [Section 2.6](class-1.md#sec-2-6))

<details class="success answer" id="answer-2" markdown="1">
<summary>Answer 2 <span class="hint">click to show</span></summary>

Poll a fast device: if the wait is short (in the textbook's example, the first poll usually finds the device done), then a sleep, an interrupt and a wake-up cost more than the wait. Use interrupts for a slow device: the CPU can run another process meanwhile, instead of spending the whole wait asking. If the speed varies or is unknown, use a hybrid: poll for a little while, and if the device is still not done, sleep and let it interrupt. Beyond the body, two optional parts add evidence: on xv6's emulated disk, polling returned sooner, about 120 µs a read against 246 µs, though it looped about 8,000 times a read ([Extra 3](class-1.md#extra-3)); and a flood of interrupts is one more reason to poll at times (livelock, [Extra 4](class-1.md#extra-4)).

</details>

### Exercise 3 {#exercise-3}

With programmed I/O, one store moves one 4-byte word. (a) How many stores does the CPU make to send one xv6 block of 1,024 bytes to a device? One 512-byte sector? A 16 KB block? (b) With xv6's DMA driver, how many of the block's 1,024 bytes does the CPU copy? ([Section 2.7](class-1.md#sec-2-7) and [Section 2.9](class-1.md#sec-2-9))

<details class="success answer" id="answer-3" markdown="1">
<summary>Answer 3 <span class="hint">click to show</span></summary>

One xv6 block: 1,024 / 4 = 256 stores (check: 256 × 4 = 1,024). One sector: 512 / 4 = 128 stores (check: 128 × 4 = 512). A 16 KB block: 16 × 1,024 = 16,384 bytes, and 16,384 / 4 = 4,096 stores (check: 4,096 × 4 = 16,384). (b) None. The descriptor of line 252 gives the disk the address of `b->data` and line 253 its length; the disk copies the 1,024 bytes itself. The CPU writes the descriptors, the avail ring entry and its count, and one store to the notify register, and then sleeps. (a)

</details>

### Exercise 4 {#exercise-4}

Here are the two `disk:` lines of `sleep_run01.out` from [Section 2.6](class-1.md#sec-2-6), with only the first and last counts kept: after booting, `44 requests, ..., 11109 us waiting`; after `wc big.txt`, `150 requests, ..., 35326 us waiting`. (a) How many requests did `wc` cost? (b) What was the average waiting time per request during booting, and during `wc`? Give each to one decimal place, and check each by multiplying back. ([Section 2.6](class-1.md#sec-2-6))

<details class="success answer" id="answer-4" markdown="1">
<summary>Answer 4 <span class="hint">click to show</span></summary>

150 − 44 = 106 requests. (b) During booting: 11,109 µs over 44 requests, 11,109 / 44 = 252.5 µs per request (check: 252.5 × 44 = 11,110, which is 11,109 up to the rounding). During `wc`: the waiting grew by 35,326 − 11,109 = 24,217 µs over 106 requests, so 24,217 / 106 = 228.46, about 228.5 µs per request (check: 228.46 × 106 = 24,216.8, about 24,217). `xv6_summary.out` prints this run's 228.46 as "228 us per read". (a)

</details>

### Exercise 5 {#exercise-5}

The UART's line status register LSR reads (a) 0x21, (b) 0x01, (c) 0x60. For each value, write it in bits, say which bits are set, and say whether the loop at line 118 of `uartputc_sync()` ends or goes round. Also: at what address does `ReadReg(LSR)` load? (Part 0, [Section 1.4](class-1.md#sec-1-4) and [Section 3.2](class-1.md#sec-3-2))

<details class="success answer" id="answer-5" markdown="1">
<summary>Answer 5 <span class="hint">click to show</span></summary>

Bit 5 is `LSR_TX_IDLE` (line 36); the loop at line 118 ends when bit 5 is 1.

- (a) 0x21: the digits 2 and 1 are 0010 and 0001, so 0010 0001. Bits 5 and 0 are set. Bit 5 is 1, so the loop ends. (Bit 0, `LSR_RX_READY` of line 35, says a typed character is also waiting; `uartputc_sync()` ignores it.)
- (b) 0x01: 0000 0001. Only bit 0 is set. Bit 5 is 0, so the loop goes round and reads LSR again.
- (c) 0x60: 0110 0000. Bits 6 and 5 are set. Bit 5 is 1, so the loop ends.

`ReadReg(LSR)` loads from `UART0` + 5 = 0x10000000 + 5 = 0x10000005.

</details>

### Exercise 6 {#exercise-6}

Process 1 runs for 3 time slots and then starts a disk read that keeps the disk busy for 4 slots. When the read is done, process 1 runs 2 more slots and is finished. Process 2 is ready from the start and needs 6 slots of CPU. Assume, as the textbook's timelines do, that process 1 runs again as soon as its read is done (a real scheduler may make it wait for its turn, as in [Section 2.5](class-1.md#sec-2-5); the exercise keeps the textbook's simpler timing), and that process 2 runs only when process 1 cannot. Draw the CPU row and the disk row, one box per slot, (a) with polling and (b) with interrupts. In which slot does process 2 finish in each? ([Section 2.1](class-1.md#sec-2-1) and [Section 2.2](class-1.md#sec-2-2))

<details class="success answer" id="answer-6" markdown="1">
<summary>Answer 6 <span class="hint">click to show</span></summary>

Number the slots from 1. The disk is busy in slots 4 to 7 in both cases.

<figure markdown="1">
![Figure R.1. Answer 6. (a) Polling: process 1 runs slots 1 to 3, polls in slots 4 to 7 (p), runs slots 8 and 9, and process 2 runs slots 10 to 15. (b) Interrupts: process 2 runs slots 4 to 7 while the disk works, process 1 runs slots 8 and 9, and process 2 finishes its last 2 slots in 10 and 11.](figs/ans_timeline.svg){width=78%}
<figcaption markdown="1">Figure R.1. [Answer 6](#answer-6). (a) Polling: process 1 runs slots 1 to 3, polls in slots 4 to 7 (p), runs slots 8 and 9, and process 2 runs slots 10 to 15. (b) Interrupts: process 2 runs slots 4 to 7 while the disk works, process 1 runs slots 8 and 9, and process 2 finishes its last 2 slots in 10 and 11.</figcaption>
</figure>

- (a) Polling. CPU: 1 1 1 p p p p 1 1 2 2 2 2 2 2. Process 1 polls through the disk's 4 slots, finishes in slots 8 and 9, and only then can process 2 run its 6 slots, in slots 10 to 15. Process 2 finishes in slot 15.
- (b) Interrupts. CPU: 1 1 1 2 2 2 2 1 1 2 2. While the disk works (slots 4 to 7), process 1 sleeps and process 2 runs 4 of its 6 slots. The interrupt at the end of slot 7 wakes process 1, which runs slots 8 and 9 and finishes. Process 2 runs its last 2 slots in slots 10 and 11. Process 2 finishes in slot 11.

Check: in (b) process 2 ran 4 + 2 = 6 slots, and the CPU did 3 + 2 = 5 slots of process 1's work and 6 of process 2's, 11 slots in all with none wasted. In (a) the same 11 slots of work took 15, because 4 were spent polling.

</details>

### Exercise 7 {#exercise-7}

Imagine a broken version of `virtio_disk_rw()` in which the check of `b->disk` at line 284 and the call that puts the process to sleep are not protected by the lock that `virtio_disk_intr()` takes (A holds no lock there), and interrupts stay on, so the handler can run between them. Give an order of events, on one CPU, in which process A sleeps forever. (Part 0, [Section 2.3](class-1.md#sec-2-3) and [Section 2.4](class-1.md#sec-2-4))

<details class="success answer" id="answer-7" markdown="1">
<summary>Answer 7 <span class="hint">click to show</span></summary>

One order that loses the wake-up:

<figure markdown="1">
![Figure R.2. Answer 7. Process A checks b->disk and sees 1; before A sleeps, the disk's interrupt runs the handler, which sets b->disk to 0 and calls wakeup(b) while nobody is asleep on b; then A calls sleep(b), and no second interrupt ever comes for this request.](figs/ans_lostwakeup.svg){width=78%}
<figcaption markdown="1">Figure R.2. [Answer 7](#answer-7). Process A checks b->disk and sees 1; before A sleeps, the disk's interrupt runs the handler, which sets b->disk to 0 and calls wakeup(b) while nobody is asleep on b; then A calls sleep(b), and no second interrupt ever comes for this request.</figcaption>
</figure>

1. Process A posts its request and writes the notify register; the disk starts.
2. A checks `b->disk` at line 284. It is 1, so A is about to call `sleep(b)`.
3. Before A sleeps, the disk finishes and raises its interrupt. Nothing stops the handler now: A holds no lock, so interrupts are on, and the handler's lock is free. The CPU runs `virtio_disk_intr()`.
4. The handler sets `b->disk` to 0 (line 320) and calls `wakeup(b)` (line 321). Nobody is asleep on `b` yet, so the wake-up does nothing.
5. The handler returns, and A goes on with what it was about to do: it calls `sleep(b)` and falls asleep.
6. The disk raises one interrupt per finished request, and this request is finished. No one will call `wakeup(b)` again, so A sleeps forever, even though its block is already in `b->data`.

This is the lost wake-up of Part 0. The real driver prevents it the way [Section 2.3](class-1.md#sec-2-3) says: it holds `disk.vdisk_lock` from line 220 through the check, and `sleep()` lets go of it and falls asleep as one step, so the handler, which must take the same lock at line 297 and then wake A, cannot get in between steps 2 and 5. (In xv6, holding the lock also keeps interrupts off on that CPU.)

</details>

### Exercise 8 {#exercise-8}

The disk's notify register is at offset 0x050 from the disk's base address (`kernel/virtio.h`, line 22). At what address does line 281 of `virtio_disk.c` store? Which line of the `info mtree` output in [Section 3.3](class-1.md#sec-3-3) shows that this address belongs to the disk and not to RAM? (Part 0, [Section 3.2](class-1.md#sec-3-2) and [Section 3.3](class-1.md#sec-3-3))

<details class="success answer" id="answer-8" markdown="1">
<summary>Answer 8 <span class="hint">click to show</span></summary>

The base is `VIRTIO0` = 0x10001000 (`memlayout.h` line 25), and `R(r)` adds the offset (`virtio_disk.c` line 20). So line 281 stores to 0x10001000 + 0x050 = 0x10001050. (In hex, the last three digits 000 + 050 = 050.) The `info mtree` line `0000000010001000-00000000100011ff (prio 0, i/o): virtio-mmio` covers 0x10001000 to 0x100011ff once the leading zeros are dropped (Part 0). Compared digit by digit from the left, 0x10001050 is above 0x10001000 and below 0x100011ff, so it is in that range, and it is marked `i/o`, a device. RAM starts only at 0x80000000.

</details>

### Exercise 9 {#exercise-9}

In your own words: why does every device show the operating system the same simple face, and why does the kernel still need one driver per device? Name one cost of this design. ([Section 1.1](class-1.md#sec-1-1), [Section 1.2](class-1.md#sec-1-2), [Section 3.4](class-1.md#sec-3-4) and [Section 3.5](class-1.md#sec-3-5))

<details class="success answer" id="answer-9" markdown="1">
<summary>Answer 9 <span class="hint">click to show</span></summary>

A model answer: there are thousands of kinds of devices, and new ones every year, so a kernel that had to know the inside of each one could never be finished. So each device shows a small fixed set of registers (in the textbook's example status, command and data) and hides its chips and firmware; then one way of talking works whatever is inside. But each kind of device still has its own registers and its own protocol, and someone has to know them. Putting that knowledge in one driver per device means everything above it, such as the file system, asks only for "read block N" or "write block N" and is written once. One cost: the generic interface hides special abilities, so a SCSI disk's detailed errors reach the file system only as a generic EIO. Another: drivers pile up, over 70% of Linux's code in the 2001 study, and they are a main source of kernel crashes.

</details>
