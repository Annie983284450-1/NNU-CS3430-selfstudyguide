"""Put the step-through animations (docs/assets/anim/) into the pages that explain the same process.

Each entry: the page, the id of the section, the animation's name, and the sentence that introduces it. The animation
goes right after the first figure of that section, so the static figure stays first and the reader can then step
through it. Idempotent: everything between the marker comments is replaced on every run. Run after guide2site.py
(build.sh does), because guide2site rewrites the pages.
    python3 tools/make_anims.py
"""
import re
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent / "docs"

ANIMS = [
    ("w08/class-2.md", "sec-6-4", "setpark",
     "Step through it yourself: the seven steps without `setpark()`, and then the same timing with it."),
    ("w09/qa.md", "q9", "setpark",
     "Step through the seven steps yourself, without `setpark()` and then with it."),
]


def main():
    for page, sec, name, intro in ANIMS:
        p = DOCS / page
        md = p.read_text(encoding="utf-8")
        start, end = f"<!-- anim:{name}:start -->", f"<!-- anim:{name}:end -->"
        md = re.sub(r"\n*" + re.escape(start) + r".*?" + re.escape(end) + r"\n*", "\n\n", md, flags=re.S)
        lines = md.split("\n")
        h = next((i for i, l in enumerate(lines) if re.match(r"^#{2,4} .*\{#" + re.escape(sec) + r"[\s}]", l)), None)
        if h is None:
            print(f"{page}: section {sec} not found, skipped")
            continue
        nxt = next((i for i in range(h + 1, len(lines)) if re.match(r"^#{2,4} ", lines[i])), len(lines))
        fig = next((i for i in range(h + 1, nxt) if lines[i].strip() == "</figure>"), None)
        at = (fig + 1) if fig is not None else h + 1
        block = ["", start, intro, "", f'<div class="anim" data-anim="{name}" markdown="0"></div>', end, ""]
        lines[at:at] = block
        p.write_text("\n".join(lines), encoding="utf-8")
        print(f"{page}: {name} after {'the first figure of' if fig is not None else 'the heading of'} {sec}")


if __name__ == "__main__":
    main()
