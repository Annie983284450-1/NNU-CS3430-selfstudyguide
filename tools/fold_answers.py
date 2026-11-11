#!/usr/bin/env python3
"""Fold each answer under its exercise on a week's review page.

Input: docs/w0N/review.md as guide2site.py writes it, with a `## Exercises {#exercises}` block
followed by a `## Answers {#answers}` block.  Output: the same page with one `### Exercise N {#exercise-N}`
heading per exercise, the question under it, and the answer in a collapsed
`<details class="success answer" id="answer-N">` block that opens when the reader clicks "Answer N".
The `## Answers` block disappears; links to `#answers` / `#exercises` that name a number are retargeted
to `#answer-N` / `#exercise-N` on every page of the week.

The masters write exercises and answers in three styles, all handled here:
  * bold paragraphs      **Exercise 3.**  /  **[Exercise 3](#exercises).**  /  **Exercise 3** ([Section 2.1](...)).
  * a numbered list       3. question ...   (continuation lines indented four spaces)
  * answers likewise      **Answer 3.**  /  **[Answer 3](#answers).**  /  3. answer ...
Material that sits after a numbered exercise list ("The capture for Exercise 6 ...", a table start for
Exercise 13) is attached to the exercise it names.

Run by build.sh after guide2site.py and before make_anims.py; `python3 tools/fold_answers.py` alone redoes
every week.  Idempotent: a page that is already folded is left alone.
"""
import re
import sys
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent / "docs"
MARK = "<!-- answers folded under their exercises -->"

HEADING = re.compile(r"^(#{1,6}) (.*?)(?:\s*\{#([A-Za-z0-9_-]+)\})?\s*$")
# `**Exercise 3.**`, `**[Exercise 3](#exercises).**`, `**Exercise 3** ([Section 2.1](...)).`
BOLD = re.compile(
    r"^\*\*\[?(Exercise|Answer) (\d+)(?:\]\([^)]*\))?\.?\*\*\s*"
    r"(?P<refs>\((?:[^()]|\([^()]*\))*\))?\.?\s*(?P<rest>.*)$")
LIST = re.compile(r"^(\d+)\. (.*)$")
MENTION = re.compile(r"\bExercise (\d+)\b")


def split_blocks(lines):
    """[(hid, heading_line_index, end_index)] for every `## ` heading; end is exclusive."""
    starts, in_fence = [], False
    for i, l in enumerate(lines):
        if l.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        m = HEADING.match(l)
        if m and m.group(1) == "##":
            starts.append((m.group(3), i))
    out = []
    for k, (hid, i) in enumerate(starts):
        end = starts[k + 1][1] if k + 1 < len(starts) else len(lines)
        out.append((hid, i, end))
    return out


def parse_items(lines, kind):
    """Split a block's body into (intro_lines, {n: item_lines}, trailing_lines).

    `kind` is 'Exercise' or 'Answer'.  An item starts at a bold marker or a numbered-list line
    (outside code fences); it runs to the next item.  In list style a non-indented, non-blank line
    that is not an item ends the list: what follows is trailing material."""
    intro, items, trailing = [], {}, []
    order = []
    cur, style, in_fence, in_list_item = None, None, False, False
    for l in lines:
        if l.lstrip().startswith("```") and not in_fence:
            in_fence = True
            fence_indented = l.startswith("    ")
        elif in_fence and l.lstrip().startswith("```"):
            in_fence = False
        if not in_fence or l.lstrip().startswith("```"):
            mb = BOLD.match(l) if not in_fence else None
            ml = LIST.match(l) if not in_fence else None
            if mb and mb.group(1) == kind:
                n = int(mb.group(2))
                rest = mb.group("rest")
                if mb.group("refs"):
                    rest = (rest + " " + mb.group("refs")).strip() if rest else mb.group("refs")
                cur, style = n, "bold"
                items[n] = [rest] if rest else []
                order.append(n)
                continue
            if ml and style != "bold" and not trailing:
                n = int(ml.group(1))
                cur, style = n, "list"
                items[n] = [ml.group(2)]
                order.append(n)
                continue
        if cur is None:
            intro.append(l)
            continue
        if style == "list":
            if not in_fence and l.strip() and not l.startswith("    ") and kind == "Exercise":
                # end of the list: trailing material
                trailing.append(l)
                cur_trailing = True
                continue
            if trailing:
                trailing.append(l)
                continue
            # de-indent the continuation
            items[cur].append(l[4:] if l.startswith("    ") else l)
        else:
            items[cur].append(l)
    return intro, items, trailing, order


def attach_trailing(trailing, items):
    """Give each chunk of trailing material to the exercise it names; return what names none."""
    chunks, cur = [], None
    for l in trailing:
        m = MENTION.search(l)
        if m and int(m.group(1)) in items and not l.startswith("|") and not l.startswith("```"):
            cur = int(m.group(1))
            chunks.append((cur, [l]))
        elif chunks:
            chunks[-1][1].append(l)
        else:
            chunks.append((None, [l]))
    rest = []
    for n, body in chunks:
        if n is None:
            rest.extend(body)
        else:
            items[n].extend([""] + body)
    return rest


def strip_edges(ls):
    while ls and not ls[0].strip():
        ls.pop(0)
    while ls and not ls[-1].strip():
        ls.pop()
    return ls


def fold(md):
    if MARK in md:
        return md, 0
    lines = md.split("\n")
    blocks = split_blocks(lines)
    ex = next((b for b in blocks if b[0] == "exercises"), None)
    an = next((b for b in blocks if b[0] == "answers"), None)
    if not ex or not an:
        return md, 0
    e_intro, e_items, e_trail, e_order = parse_items(lines[ex[1] + 1:ex[2]], "Exercise")
    a_intro, a_items, _, _ = parse_items(lines[an[1] + 1:an[2]], "Answer")
    e_rest = attach_trailing(e_trail, e_items)

    out = [lines[ex[1]], MARK, ""]
    out.extend(strip_edges(e_intro))
    out.append("")
    for n in e_order:
        out.append(f"### Exercise {n} {{#exercise-{n}}}")
        out.append("")
        out.extend(strip_edges(e_items[n]))
        out.append("")
        if n in a_items:
            out.append(f'<details class="success answer" id="answer-{n}" markdown="1">')
            out.append(f'<summary>Answer {n} <span class="hint">click to show</span></summary>')
            out.append("")
            out.extend(strip_edges(a_items[n]))
            out.append("")
            out.append("</details>")
            out.append("")
        else:
            print(f"  exercise {n} has no answer", file=sys.stderr)
    for n in sorted(a_items):
        if n not in e_items:
            print(f"  answer {n} has no exercise; kept at the end", file=sys.stderr)
            out.append(f'<details class="success answer" id="answer-{n}" markdown="1">')
            out.append(f'<summary>Answer {n} <span class="hint">click to show</span></summary>')
            out.append("")
            out.extend(strip_edges(a_items[n]))
            out.append("")
            out.append("</details>")
            out.append("")
    out.extend(strip_edges(e_rest))
    a_tail = strip_edges(a_intro)
    if a_tail:
        out.append("")
        out.extend(a_tail)

    # splice: everything before the exercises block, the folded block, everything after the answers block,
    # keeping any block that sat between the two (there is none today, but do not lose one).
    between = lines[ex[2]:an[1]]
    new = lines[:ex[1]] + out + [""] + between + lines[an[2]:]
    cleaned = []
    for l in new:
        if l.strip() == "" and cleaned and cleaned[-1].strip() == "":
            continue
        cleaned.append(l)
    return "\n".join(cleaned).rstrip() + "\n", len(e_order)


LINK = re.compile(r"\[(Exercise|Answer) (\d+)\]\(((?:review\.md)?)#(exercises|answers)\)")


def retarget(md):
    return LINK.sub(lambda m: f"[{m.group(1)} {m.group(2)}]({m.group(3)}#{m.group(1).lower()}-{m.group(2)})", md)


def fold_week(wdir):
    p = wdir / "review.md"
    if not p.exists():
        return
    md = p.read_text(encoding="utf-8")
    new, n = fold(md)
    if n:
        p.write_text(new, encoding="utf-8")
        print(f"{wdir.name}/review.md: {n} exercises, answers folded")
    for q in wdir.glob("*.md"):
        t = q.read_text(encoding="utf-8")
        r = retarget(t)
        if r != t:
            q.write_text(r, encoding="utf-8")


def main():
    weeks = [DOCS / a for a in sys.argv[1:]] or sorted(d for d in DOCS.glob("w[0-9][0-9]") if d.is_dir())
    for w in weeks:
        fold_week(w)


if __name__ == "__main__":
    main()
