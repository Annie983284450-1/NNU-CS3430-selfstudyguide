"""Put the step-through animations (docs/assets/anim/) into the pages that explain the same process.

Each entry: the page, the id of the section, the animation's name, where it goes, and the sentence that introduces it.
  "fig": right after the first figure of that section (the static figure stays first, then the reader steps through it).
  "end": at the end of that section, before its "What this part settled" lines. Used when the animation follows a
         process told across several sections; the id is the last of them, so the reader has read all the parts first.
Idempotent: everything between the marker comments is replaced on every run. Run after guide2site.py (build.sh does),
because guide2site rewrites the pages.
    python3 tools/make_anims.py
"""
import re
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent / "docs"

ANIMS = [
    # Week 8, class 1
    ("w08/class-1.md", "sec-2-5", "race", "end",
     "Step through both races yourself: the one-CPU trace of Section 2.4, row by row, and the two-core run of this section."),
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
    ("w09/class-2.md", "sec-5-4", "sema", "end",
     "Step through both uses yourself: a semaphore that starts at 1 (Section 5.3), and one that starts at 0 (this section)."),
    ("w09/class-2.md", "sec-6-3", "bbdeadlock", "end",
     "Step through both versions yourself: the lock around everything of Section 6.2, and the lock only around put() and get()."),
    # Week 9 Q&A
    ("w09/qa.md", "q9", "setpark", "fig",
     "Step through the seven steps yourself, without `setpark()` and then with it."),
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
        if where == "end":
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
