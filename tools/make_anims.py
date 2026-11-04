"""Put the step-through animations (docs/assets/anim/) into the pages that explain the same process.

Each entry: the page, the id of the section, the animation's name, where it goes, and the sentence that introduces it.
  "fig": right after the first figure of that section (the static figure stays first, then the reader steps through it).
  "end": at the end of that section, before its "What this part settled" lines. Used when the animation follows a
         process told across several sections; the id is the last of them, so the reader has read all the parts first.
  "after:TEXT": after the paragraph (and the figure right below it, if any) that starts with TEXT, inside that section.
         Used on the review page, where an animation belongs to one answer, not to a heading.
Idempotent: everything between the marker comments is replaced on every run. Run after guide2site.py (build.sh does),
because guide2site rewrites the pages.
    python3 tools/make_anims.py
"""
import re
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent / "docs"

ANIMS = [
    # Week 2, class 2
    ("w02/class-2.md", "sec-4-6", "syscall", "end",
     "Step through the six stations yourself: one call to fork(), from the program into the kernel and back, with the registers each station changes."),
    ("w02/class-2.md", "sec-6-3", "swtch", "end",
     "Step through swtch.S yourself: A's registers go out to A's context, B's come in from B's, and ret lands in B."),
    # Week 4, class 2 and review
    ("w04/class-2.md", "sec-4-3", "translate", "end",
     "Step through the translation of address 21 yourself: split, look up, glue."),
    ("w04/class-2.md", "sec-6-3", "tlb", "end",
     "Step through the algorithm yourself, once for a hit and once for a miss."),
    ("w04/review.md", "answers", "tlb10", "after:**[Answer 10]",
     "Step through the ten accesses yourself, with the TLB filling as it goes."),
    # Week 5, class 1
    ("w05/class-1.md", "sec-3-3", "ptwalk", "end",
     "Step through both walks yourself: the three reads of Section 2.4's example, and walk() going down xv6's three levels."),
    # Week 5, class 2 and review
    ("w05/class-2.md", "sec-4-7", "lazyalloc", "end",
     "Step through the run yourself: a touch inside the heap that vmfault() fixes, and a touch beyond sz that kills the process."),
    ("w05/review.md", "answers", "belady", "after:**Answer 4.**",
     "Step through both FIFO runs yourself, one reference at a time, with 3 frames and with 4."),
    # Week 6
    ("w06/class-1.md", "sec-3-4", "rr", "end",
     "Step through it yourself: xv6's loop handing the CPU from A to B one tick at a time, and Figure 3.2's three jobs, one slice at a time."),
    ("w06/class-2.md", "sec-5-4", "mlfq", "end",
     "Step through both examples yourself, with the rule in force marked at each step."),
    # Week 7, class 1
    ("w07/class-1.md", "sec-1-4", "lottery", "end",
     "Step through the ticket walk yourself, for the draw of Section 1.3 and the six draws of Figure 1.5."),
    ("w07/class-1.md", "sec-1-7", "stride", "end",
     "Step through one stride cycle yourself, turn by turn."),
    # Week 8, class 1
    ("w08/class-1.md", "sec-2-5", "race", "end",
     "Step through both races yourself: the one-CPU trace of Section 2.4, row by row, and the two-core run of this section."),
    ("w08/class-1.md", "sec-2-7", "kallocrace", "end",
     "Step through it yourself: two CPUs in kalloc() with the lock gone, and then with it."),
    # Week 8, class 2
    ("w08/class-2.md", "sec-5-2", "spinlock", "end",
     "Step through the two traces yourself: the flag of Section 4.3, where both threads get in, and the test-and-set lock, where only the first swap gets the 0."),
    ("w08/class-2.md", "sec-5-6", "ticket", "fig",
     "Step through it yourself: three threads take numbers, and each unlock calls the next one."),
    ("w08/class-2.md", "sec-6-3", "queuelock", "fig",
     "Step through it yourself: T2 and T3 park, and unlock hands the lock straight to T2. The second tab is unlock with nobody waiting."),
    ("w08/class-2.md", "sec-6-4", "setpark", "fig",
     "Step through it yourself: the seven steps without `setpark()`, and then the same timing with it."),
    ("w08/class-2.md", "sec-6-5", "futex", "fig",
     "Step through the five moments yourself, and watch which ones enter the kernel."),
    # Week 9, class 1
    ("w09/class-1.md", "sec-2-5", "approx", "end",
     "Step through the table of Section 2.3 yourself, one time row at a time, and then the get() of this section."),
    ("w09/class-1.md", "sec-3-9", "join", "end",
     "Step through the four runs of Sections 3.6 to 3.9 yourself: the two orders that work, and the two shortcuts that fail."),
    # Week 9, class 2
    ("w09/class-2.md", "sec-4-6", "prodcons", "end",
     "Step through the three versions of Sections 4.3 to 4.6 yourself: the if that fails, the single queue where everyone sleeps, and the two queues that work."),
    ("w09/class-2.md", "sec-4-11", "xv6sleep", "end",
     "Step through it yourself: a reader sleeps on an empty pipe, a write wakes every sleeper on that address, and each one checks again."),
    ("w09/class-2.md", "sec-5-4", "sema", "end",
     "Step through both uses yourself: a semaphore that starts at 1 (Section 5.3), and one that starts at 0 (this section)."),
    ("w09/class-2.md", "sec-6-1", "twoprod", "end",
     "Step through the table yourself, one action at a time: two producers write slot 3, and slot 4 is skipped."),
    ("w09/class-2.md", "sec-6-3", "bbdeadlock", "end",
     "Step through both versions yourself: the lock around everything of Section 6.2, and the lock only around put() and get()."),
    # Q&A pages: an answer that explains the same process gets the same animation, right after its figure.
    ("w04/qa.md", "q9", "tlb", "fig",
     "Step through a hit and a miss yourself. In the Miss tab, lines 13 and 15 check the row: if either check failed, the hardware would raise an exception instead of filling the TLB, which is the second case above."),
    ("w04/qa.md", "q12", "tlb10", "fig",
     "Step through the ten accesses yourself, with the TLB filling as it goes."),
    ("w09/qa.md", "f3", "ticket", "fig",
     "Step through it yourself: three threads take numbers, and each unlock calls the next one."),
    ("w09/qa.md", "q6", "queuelock", "fig",
     "Step through the guard, the queue and the hand-off yourself."),
    ("w09/qa.md", "q9", "setpark", "fig",
     "Step through the seven steps yourself, without `setpark()` and then with it."),
    ("w09/qa.md", "q10", "futex", "fig",
     "Step through Linux's version yourself. In moment 2, futex_wait sleeps only if the word still says 2, so a wake-up that came first is not lost."),
    ("w09/qa.md", "q15", "approx", "fig",
     "Step through the table yourself with S = 5, and watch how far G falls behind the true total."),
]

CLOSERS = re.compile(r"^(- What this part settled|\*The argument in one line:\*)")


def main():
    for page, sec, name, where, intro in ANIMS:
        p = DOCS / page
        if not p.exists():
            print(f"{page}: missing, skipped")
            continue
        md = p.read_text(encoding="utf-8")
        start, end = f"<!-- anim:{name}:start -->", f"<!-- anim:{name}:end -->"
        md = re.sub(r"\n*" + re.escape(start) + r".*?" + re.escape(end) + r"\n*", "\n\n", md, flags=re.S)
        lines = md.split("\n")
        h = next((i for i, l in enumerate(lines) if re.match(r"^#{2,4} .*\{#" + re.escape(sec) + r"[\s}]", l)), None)
        if h is None:
            print(f"{page}: section {sec} not found, skipped")
            continue
        nxt = next((i for i in range(h + 1, len(lines)) if re.match(r"^#{2,4} ", lines[i])), len(lines))
        if where.startswith("after:"):
            key = where[len("after:"):]
            par = next((i for i in range(h + 1, nxt) if lines[i].startswith(key)), None)
            if par is None:
                print(f"{page}: paragraph {key!r} not found in {sec}, skipped")
                continue
            at = next((i for i in range(par, nxt) if not lines[i].strip()), nxt)
            j = at
            while j < nxt and not lines[j].strip():
                j += 1
            if j < nxt and lines[j].startswith("<figure"):
                at = next((i for i in range(j, nxt) if lines[i].strip() == "</figure>"), at - 1) + 1
            how = f"after the paragraph {key!r} of"
        elif where == "end":
            close = next((i for i in range(h + 1, nxt) if CLOSERS.match(lines[i])), None)
            at = close if close is not None else nxt
            how = "before the closing lines of" if close is not None else "at the end of"
        else:
            fig = next((i for i in range(h + 1, nxt) if lines[i].strip() == "</figure>"), None)
            at = (fig + 1) if fig is not None else h + 1
            how = "after the first figure of" if fig is not None else "after the heading of"
        block = ["", start, intro, "", f'<div class="anim" data-anim="{name}" markdown="0"></div>', end, ""]
        lines[at:at] = block
        p.write_text("\n".join(lines), encoding="utf-8")
        print(f"{page}: {name} {how} {sec}")


if __name__ == "__main__":
    main()
