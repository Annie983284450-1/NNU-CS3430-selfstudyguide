#!/usr/bin/env python3
"""Turn one lab's session guide (LABn_SESSION_MASTER_vN.md, in the lab's
instructor-notes folder) into the lab's pages on the website.

    python3 tools/lab2site.py labs/lab1-util.yml path/to/LAB1_SESSION_MASTER_v6.md

The MASTER stays the single source of truth for the lab text and is never
edited here. What the website adds or changes lives in the lab's overlay file
(labs/<lab>.yml): the "Connect to theory" boxes, and the few sentences that only
make sense inside one course (dates, Canvas, the lab report), which the public
site must not carry.

Steps, in order:
  1. Make the student copy, the same way make_session_guides.py does: keep
     STUDENT-ONLY, drop INSTRUCTOR-ONLY and ANSWER blocks (so the Think answers
     never reach the site), drop BLANK markers, drop the FROM/CAP comments.
  2. Apply the overlay's `replace` list. Every `old` string must occur exactly
     `count` times (default 1), or the build stops: a MASTER that changed under
     the overlay is caught, never silently half-converted.
  3. Drop the overlay's `drop_sections` (a heading and everything under it).
  4. Insert each `theory` box after the paragraph or code block that contains its
     `after` string (which must occur on exactly one line).
  5. Split at the `## ` headings into pages: the overview (everything before the
     first page heading), then one page per `pages` entry.
  6. On each page: headings move up one level; every "The answer..." section
     becomes a folded box (the run instructions that follow an answer stay
     outside the fold); every "Think" section becomes a question box; "Step N"
     in the prose links to that step's page; a complete listing whose line count
     matches its heading gets line numbers; links written root-relative
     (w02/class-2.md#sec-4-4, labs/lab1/step-1.md) are made relative and every
     anchor is checked against the target page.

Writes docs/labs/<id>/*.md. Prints the nav block for mkdocs.yml.
"""
import re
import shutil
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"

HEADING = re.compile(r"^(#{1,6})\s+(.*?)\s*$")


# ---------- 1. the student copy (same rules as make_session_guides.py) ----------

def strip_block(t, tag):
    return re.sub(r"<!-- %s -->.*?<!-- /%s -->\n?" % (tag, tag), "", t, flags=re.S)


def keep_block(t, tag):
    return re.sub(r"<!-- %s -->\n?(.*?)<!-- /%s -->\n?" % (tag, tag), r"\1", t, flags=re.S)


def student(t):
    t = keep_block(t, "STUDENT-ONLY")
    t = strip_block(t, "INSTRUCTOR-ONLY")
    t = strip_block(t, "ANSWER")
    t = t.replace("<!-- BLANK -->\n", "").replace("<!-- BLANK -->", "")
    t = re.sub(r"^<!-- (FROM|CAP) [^>]*-->\n", "", t, flags=re.M)
    return t


# ---------- 2-4. overlay ----------

def apply_replacements(t, reps):
    for r in reps or []:
        old, new, want = r["old"], r.get("new", ""), r.get("count", 1)
        got = t.count(old)
        if got != want:
            sys.exit(f"replace: expected {want} occurrence(s), found {got}:\n  {old[:120]!r}")
        t = t.replace(old, new)
    return t


def drop_sections(t, titles):
    lines = t.split("\n")
    for title in titles or []:
        idx = [i for i, l in enumerate(lines) if HEADING.match(l) and HEADING.match(l).group(2) == title]
        if len(idx) != 1:
            sys.exit(f"drop_sections: heading {title!r} found {len(idx)} times")
        i = idx[0]
        level = len(HEADING.match(lines[i]).group(1))
        j = i + 1
        in_fence = False
        while j < len(lines):
            if lines[j].startswith("```"):
                in_fence = not in_fence
            m = HEADING.match(lines[j]) if not in_fence else None
            if m and len(m.group(1)) <= level:
                break
            j += 1
        del lines[i:j]
    return "\n".join(lines)


def theory_box(title, body):
    out = [f'!!! theory "Connect to theory: {title}"', ""]
    for l in body.strip("\n").split("\n"):
        out.append(("    " + l) if l.strip() else "")
    return out


def insert_theory(t, boxes):
    lines = t.split("\n")
    for b in boxes or []:
        hits = [i for i, l in enumerate(lines) if b["after"] in l]
        if len(hits) != 1:
            sys.exit(f"theory box {b['title']!r}: 'after' string found on {len(hits)} lines: {b['after']!r}")
        i = hits[0]
        # inside a code fence? then end of the fence; else end of the paragraph
        fence_open = sum(1 for l in lines[:i] if l.startswith("```")) % 2 == 1
        j = i
        if fence_open:
            while not lines[j + 1].startswith("```"):
                j += 1
            j += 1                            # the closing fence line
        else:
            while j + 1 < len(lines) and lines[j + 1].strip():
                j += 1
        lines[j + 1:j + 1] = [""] + theory_box(b["title"], b["body"]) + [""]
    return "\n".join(lines)


# ---------- 5. split ----------

def split_pages(t, pages):
    """pages: list of {heading (prefix of the ## text), file, nav}. Returns
    [(file, nav, lines)], the overview first."""
    lines = t.split("\n")
    starts = []
    in_fence = False
    for i, l in enumerate(lines):
        if l.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence or not l.startswith("## "):
            continue
        for p in pages:
            if l[3:].startswith(p["heading"]):
                starts.append((i, p))
    if len(starts) != len(pages):
        found = [p["heading"] for _, p in starts]
        sys.exit(f"split: expected {len(pages)} page headings, found {found}")
    out = [("index.md", "Overview", lines[:starts[0][0]])]
    for k, (i, p) in enumerate(starts):
        end = starts[k + 1][0] if k + 1 < len(starts) else len(lines)
        out.append((p["file"], p["nav"], lines[i:end]))
    return out


# ---------- 6. per page ----------

STEP_REF = re.compile(r"(?<![\[\w/])\bStep ([0-9])\b(?![^\[]*\]\()")
ROOT_LINK = re.compile(r"\]\(((?:w\d\d|labs)/[^)#\s]+)(#[A-Za-z0-9_-]+)?\)")
FOLD_END = re.compile(r"^(Then:|Add `\$U/|Rebuild and run|Run the first grader|\*\*On Ubuntu|\*\*At the xv6|\*\*Terminal 1)")
RANGE = re.compile(r"lines (\d+) to (\d+)")
COUNT = re.compile(r"\((\d+) lines\)")


def anchors_of(md_path):
    if not md_path.exists():
        return None
    text = md_path.read_text(encoding="utf-8")
    ids = set(re.findall(r"\{#([A-Za-z0-9_-]+)", text))
    # headings without {#id}: Python-Markdown's toc slug
    for m in re.finditer(r"^#{1,6}\s+(.*)$", text, flags=re.M):
        h = re.sub(r"\{.*\}\s*$", "", m.group(1))
        h = re.sub(r"<[^>]+>", "", h)
        slug = re.sub(r"[^\w\s-]", "", h.lower()).strip()
        ids.add(re.sub(r"[\s]+", "-", slug))
    return ids


def fix_links(text, this_file, problems):
    """Root-relative links -> relative to this page; check targets and anchors."""
    depth = len(this_file.relative_to(DOCS).parts) - 1

    def repl(m):
        target, anchor = m.group(1), m.group(2) or ""
        tpath = DOCS / target
        if target.startswith("labs/"):
            ids = None  # lab pages are written by this run; checked after writing
        else:
            ids = anchors_of(tpath)
            if ids is None:
                problems.append(f"{this_file.name}: missing page {target}")
            elif anchor and anchor[1:] not in ids:
                problems.append(f"{this_file.name}: missing anchor {target}{anchor}")
        return "](" + "../" * depth + target + anchor + ")"
    return ROOT_LINK.sub(repl, text)


def link_steps(line, step_files, this_file):
    parts = re.split(r"(`[^`]*`|\[[^\]]*\]\([^)]*\))", line)
    for k in range(0, len(parts), 2):
        def repl(m):
            f = step_files.get(m.group(1))
            if not f or f == this_file:
                return m.group(0)
            return f"[{m.group(0)}]({f})"
        parts[k] = STEP_REF.sub(repl, parts[k])
    return "".join(parts)


def add_linenums(block, heading):
    """```c fence of a complete listing -> ```c linenums="N" when the heading's
    line range or line count matches the listing."""
    fence = block[0]
    body = block[1:-1]
    if not re.match(r"^```(c|make|perl)\s*$", fence):
        return block
    n = len(body)
    start = None
    m = RANGE.search(heading)
    if m:
        start = int(m.group(1))
        if int(m.group(2)) - start + 1 != n:
            print(f"  note: heading says lines {m.group(1)} to {m.group(2)}, listing has {n} lines: {heading[:70]}")
    elif "complete" in heading and body and body[0].startswith("#include"):
        start = 1                             # a whole file
        m = COUNT.search(heading)
        if m and int(m.group(1)) != n:
            print(f"  note: heading says {m.group(1)} lines, listing has {n}: {heading[:70]}")
    if start is None:
        return block
    attrs = f' linenums="{start}"'
    m = re.search(r"the new lines are (\d+) to (\d+)", heading)
    if m:                                     # highlight them, counted from the block's first line
        attrs += ' hl_lines="%d-%d"' % (int(m.group(1)) - start + 1, int(m.group(2)) - start + 1)
    return [fence.rstrip() + attrs] + body + [block[-1]]


def convert_page(fname, lines, title, step_files, out_path, problems):
    out = []
    if fname == "index.md":
        out += [f"# {title}", ""]
    i = 0
    n = len(lines)

    def section_end(k, level):
        """index of the next heading of level <= `level` after k (fence-aware)"""
        j, fence = k + 1, False
        while j < n:
            if lines[j].startswith("```"):
                fence = not fence
            elif not fence:
                m = HEADING.match(lines[j])
                if m and len(m.group(1)) <= level:
                    return j
            j += 1
        return j

    while i < n:
        line = lines[i]
        m = HEADING.match(line)
        if m and not line.startswith("```"):
            level, text = len(m.group(1)), m.group(2)
            if fname == "index.md" and level == 1:
                i += 1
                continue                      # the MASTER's own title; replaced above
            if fname != "index.md":
                level = max(1, level - 1)     # ## Step -> #, ### -> ##
            if text.startswith("The answer"):
                end = section_end(i, len(m.group(1)))
                body = lines[i + 1:end]
                # run instructions after the answer stay outside the fold
                cut = len(body)
                for k, l in enumerate(body):
                    prev_blank = k == 0 or not body[k - 1].strip()
                    if prev_blank and FOLD_END.match(l):
                        cut = k
                        break
                inner, tail = body[:cut], body[cut:]
                # line numbers on complete listings
                fixed, k = [], 0
                while k < len(inner):
                    if inner[k].startswith("```") and inner[k].strip() != "```":
                        e = k + 1
                        while not inner[e].startswith("```"):
                            e += 1
                        fixed += add_linenums(inner[k:e + 1], text)
                        k = e + 1
                    else:
                        fixed.append(inner[k])
                        k += 1
                label = text.replace('"', "'")
                out += [f'??? success "{label}"', ""]
                for l in fixed:
                    out.append(("    " + l) if l.strip() else "")
                out.append("")
                lines[i + 1:end] = tail       # the folded part is consumed; the tail is read next
                n = len(lines)
                i += 1
                continue
            if text == "Think":
                end = section_end(i, len(m.group(1)))
                body = lines[i + 1:end]
                stop = next((k for k, l in enumerate(body) if l.startswith("Answer it in your own words")), None)
                if stop is None:
                    sys.exit(f"{fname}: a Think section without the answer-it-yourself line")
                inner, tail = body[:stop + 1], body[stop + 1:]
                out += ['!!! question "Think"', ""]
                for l in inner:
                    out.append(("    " + l) if l.strip() else "")
                out.append("")
                lines[i + 1:end] = tail
                n = len(lines)
                i += 1
                continue
            out.append("#" * level + " " + text)
            i += 1
            continue
        if line.startswith("```"):
            # copy a fence through untouched
            out.append(line)
            i += 1
            while i < n and not lines[i].startswith("```"):
                out.append(lines[i])
                i += 1
            if i < n:
                out.append(lines[i])
            i += 1
            continue
        if line.strip() == "---":
            i += 1                            # the MASTER's step separators; pages split there anyway
            continue
        out.append(line)
        i += 1

    # prose passes (outside fences): Step links, root links
    final, fence = [], False
    for l in out:
        if l.lstrip().startswith("```"):
            fence = not fence
            final.append(l)
            continue
        if not fence and not l.startswith("#") and not l.lstrip().startswith(("!!!", "???")):
            l = link_steps(l, step_files, fname)
        if not fence:
            l = fix_links(l, out_path, problems)
        final.append(l)
    cleaned = []
    for l in final:
        if not l.strip() and cleaned and not cleaned[-1].strip():
            continue
        cleaned.append(l)
    while cleaned and not cleaned[0].strip():
        cleaned.pop(0)
    return "\n".join(cleaned).rstrip() + "\n"


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    overlay = yaml.safe_load(Path(sys.argv[1]).read_text(encoding="utf-8"))
    master = Path(sys.argv[2])
    text = student(master.read_text(encoding="utf-8"))
    text = apply_replacements(text, overlay.get("replace"))
    text = drop_sections(text, overlay.get("drop_sections"))
    text = insert_theory(text, overlay.get("theory"))

    lab = overlay["id"]
    outdir = DOCS / "labs" / lab
    pages = split_pages(text, overlay["pages"])
    step_files = {}
    for f, _, _ in pages:
        m = re.match(r"step-(\d)\.md$", f)
        if m:
            step_files[m.group(1)] = f

    if outdir.exists():
        shutil.rmtree(outdir)
    outdir.mkdir(parents=True)
    problems = []
    for f, nav, plines in pages:
        md = convert_page(f, list(plines), overlay["title"], step_files, outdir / f, problems)
        (outdir / f).write_text(md, encoding="utf-8")
        print(f"labs/{lab}/{f:12s} {md.count(chr(10)):5d} lines   {nav}")

    # links into other lab pages, now that they exist
    for f in outdir.glob("*.md"):
        for target, anchor in re.findall(r"\]\((?:\.\./)+(labs/[^)#\s]+)(#[A-Za-z0-9_-]+)?\)", f.read_text()):
            ids = anchors_of(DOCS / target)
            if ids is None:
                problems.append(f"{f.name}: missing page {target}")
            elif anchor and anchor[1:] not in ids:
                problems.append(f"{f.name}: missing anchor {target}{anchor}")

    print(f"{len(overlay.get('theory') or [])} theory boxes, "
          f"{sum(len(overlay.get(k) or []) for k in ('replace',))} replacements")
    if problems:
        sys.exit("link problems:\n  " + "\n  ".join(problems))
    print("nav for mkdocs.yml:")
    print(f'      - "{overlay["nav_title"]}":')
    for f, nav, _ in pages:
        print(f'          - "{nav}": labs/{lab}/{f}')


if __name__ == "__main__":
    main()
