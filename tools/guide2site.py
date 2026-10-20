#!/usr/bin/env python3
"""Turn one week's self-study guide (the pandoc .md Annie already keeps) into
a set of MkDocs pages.

    python3 tools/guide2site.py W05 path/to/W05_..._SelfStudy.md path/to/W05_SelfStudy_figs

Writes docs/<week>/{index,class-1,class-2,review,appendix}.md and copies the
figures to docs/<week>/figs/. The guide .md stays the single source of truth;
this script never edits it.

What it changes on the way (and why):
  1. Splits the one long file into pages at the `# <class>` headings and at
     the tail (exercises, appendix), so the left sidebar can list them.
  2. Drops the hand-made `## Contents` list (the sidebar and the right-hand
     table of contents replace it) but keeps the label legend paragraph.
  3. Rewrites every `(#id)` link to `(<page>.md#id)` so cross-links still
     work after the split, and turns plain-text "Section 3.5", "Extra 4",
     "Chapter 2", "Appendix A" into links to the same anchors.
  4. Wraps every standalone image in <figure> with a visible <figcaption>,
     because Python-Markdown (unlike pandoc) does not show the alt text.
  5. Turns the `[Problem]`, `[Concept]`, ... labels in headings into badges,
     keeping the plain text for the tables of contents (data-toc-label).
  6. Folds each "The program behind Figures ... (you can skip this listing)"
     block into a collapsible box.
"""
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"

HEADING = re.compile(r"^(#{1,6})\s+(.*?)\s*(\{#([A-Za-z0-9_-]+)\})?\s*$")
IMAGE = re.compile(r"^!\[(?P<cap>.*)\]\((?P<src>[^)\s]+)\)(?P<attr>\{[^}]*\})?\s*$")
LABEL = re.compile(r"\[(Problem|Concept|Worked example|Real kernel|Real machine|"
                   r"Check yourself|Your turn|Roadmap|Summary|Deeper(?:, Q\d)?)\]")

LABEL_CLASS = {
    "Problem": "problem", "Concept": "concept", "Worked example": "example",
    "Real kernel": "kernel", "Real machine": "machine", "Check yourself": "check",
    "Your turn": "check", "Roadmap": "roadmap", "Summary": "summary",
}


def slug_class(label: str) -> str:
    if label.startswith("Deeper"):
        return "deeper"
    return LABEL_CLASS[label]


def read_front_matter(lines):
    """pandoc YAML block: title / subtitle."""
    meta = {}
    if lines and lines[0].strip() == "---":
        i = 1
        while i < len(lines) and lines[i].strip() != "---":
            m = re.match(r'^(\w+):\s*"?(.*?)"?\s*$', lines[i])
            if m:
                meta[m.group(1)] = m.group(2)
            i += 1
        return meta, lines[i + 1:]
    return meta, lines


def split_pages(lines):
    """Return list of (page_key, page_title, lines). Tracks code fences so a
    `#include` inside a listing is never mistaken for a heading."""
    pages = []
    cur_key, cur_title, cur = "index", None, []
    in_fence = False
    class_n = 0
    tail_started = False
    seen_extras = False

    def flush():
        nonlocal cur
        if cur:
            pages.append((cur_key, cur_title, cur))
        cur = []

    for line in lines:
        if line.startswith("```"):
            in_fence = not in_fence
            cur.append(line)
            continue
        m = HEADING.match(line) if not in_fence else None
        if m:
            level, text, _, hid = m.group(1), m.group(2), m.group(3), m.group(4)
            if level == "#":
                flush()
                class_n += 1
                cur_key, cur_title = f"class-{class_n}", text
            elif level == "##" and hid and hid.startswith("extras"):
                seen_extras = True
            elif (level == "##" and seen_extras and not tail_started
                  and hid and (hid.startswith("the") or hid == "exercises")):
                flush()
                tail_started = True
                cur_key, cur_title = "review", "Exercises and answers"
            elif level == "##" and hid and hid.startswith("appendix"):
                flush()
                cur_key, cur_title = "appendix", text
        cur.append(line)
    flush()
    return pages


def collect_ids(pages):
    """id -> page file, for every heading with an explicit {#id}."""
    ids = {}
    for key, _, lines in pages:
        in_fence = False
        for line in lines:
            if line.startswith("```"):
                in_fence = not in_fence
                continue
            m = HEADING.match(line) if not in_fence else None
            if m and m.group(4):
                ids[m.group(4)] = f"{key}.md"
    return ids


def ref_target(kind, num, ids):
    """'Section', '3.5' -> 'sec-3-5' if such a heading exists."""
    if kind == "Section":
        hid = "sec-" + num.replace(".", "-")
    elif kind == "Extra":
        hid = f"extra-{num}"
    elif kind == "Chapter":
        hid = f"chapter-{num}"
    elif kind == "Appendix":
        hid = f"appendix-{num.lower()}"
    else:
        return None
    return hid if hid in ids else None


PROSE_REF = re.compile(r"\b(Section|Extra|Chapter|Appendix) ([0-9]+(?:\.[0-9]+)?|[A-Z])\b(?![^\[]*\]\()")


def link_prose_refs(text, ids, this_page):
    """Link 'Section 3.5' etc. Skips text already inside [..](..) links and
    inline code spans."""
    out = []
    # protect inline code and existing links
    parts = re.split(r"(`[^`]*`|\[[^\]]*\]\([^)]*\))", text)
    for i, part in enumerate(parts):
        if i % 2 == 1:
            out.append(part)
            continue

        def repl(m):
            hid = ref_target(m.group(1), m.group(2), ids)
            if not hid:
                return m.group(0)
            page = ids[hid]
            href = f"#{hid}" if page == this_page else f"{page}#{hid}"
            return f"[{m.group(0)}]({href})"
        part = PROSE_REF.sub(repl, part)

        def repl_list(m):
            # "Sections 3.1, 3.2 and 3.5" / "Extras 1 to 5": link each number
            kind = "Section" if m.group(1) == "Sections" else "Extra"
            def one(n):
                hid = ref_target(kind, n.group(0), ids)
                if not hid:
                    return n.group(0)
                page = ids[hid]
                href = f"#{hid}" if page == this_page else f"{page}#{hid}"
                return f"[{n.group(0)}]({href})"
            return m.group(1) + " " + re.sub(r"[0-9]+(?:\.[0-9]+)?", one, m.group(2))
        part = re.sub(r"\b(Sections|Extras) ((?:[0-9]+(?:\.[0-9]+)?)(?:(?:, | and | to )[0-9]+(?:\.[0-9]+)?)+)", repl_list, part)
        out.append(part)
    return "".join(out)


def rewrite_anchor_links(text, ids, this_page):
    def repl(m):
        hid = m.group(1)
        page = ids.get(hid)
        if page is None or page == this_page:
            return m.group(0)
        return f"]({page}#{hid})"
    return re.sub(r"\]\(#([A-Za-z0-9_-]+)\)", repl, text)


FENCE = re.compile(r"^```\{([^}]*)\}\s*$")


def fence_for_site(line):
    """pandoc's fence attributes -> Material's.
    ```{.c .numberLines startFrom="437" hl="438 440"}  ->  ```c linenums="437" hl_lines="2 4"
    (hl_lines counts from the first line of the block; hl in the guide uses the file's own numbers).
    ```{.text}  ->  ```text"""
    m = FENCE.match(line)
    if not m:
        return line
    attrs = m.group(1)
    classes = re.findall(r"\.([A-Za-z0-9_-]+)", attrs)
    kv = dict(re.findall(r'([A-Za-z]+)="([^"]*)"', attrs))
    lang = next((c for c in classes if c != "numberLines"), "text")
    parts = ["```" + lang]
    start = int(kv.get("startFrom", "1"))
    if "numberLines" in classes:
        parts.append(f'linenums="{start}"')
    if "hl" in kv:
        rel = [str(int(n) - start + 1) for n in kv["hl"].split()]
        parts.append('hl_lines="' + " ".join(rel) + '"')
    return " ".join(parts)


def badge_heading(level, text, hid):
    plain = text
    m = LABEL.search(text)
    if m:
        label = m.group(1)
        cls = slug_class(label)
        text = text[:m.start()] + f'<span class="lbl lbl-{cls}">{label}</span>' + text[m.end():]
    attrs = []
    if hid:
        attrs.append(f"#{hid}")
    if m:
        attrs.append(f'data-toc-label="{plain}"')
    attr = " {" + " ".join(attrs) + "}" if attrs else ""
    return f"{level} {text}{attr}"


def convert_page(key, title, lines, ids, meta, week, legend):
    this_page = f"{key}.md"
    out = []
    in_fence = False
    in_listing = False      # inside a collapsible "program behind" block
    skip_contents = False

    def close_listing():
        nonlocal in_listing
        in_listing = False

    # page-level heading
    if key == "index":
        out.append(f"# {meta.get('title', week)}")
        out.append("")
        out.append(f"*{meta.get('subtitle', '')}*")
        out.append("")

    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("```"):
            if not in_fence:
                line = fence_for_site(line)
            in_fence = not in_fence
            out.append(("    " if in_listing else "") + line)
            i += 1
            continue
        if in_fence:
            out.append(("    " if in_listing else "") + line)
            i += 1
            continue

        m = HEADING.match(line)
        if m:
            level, text, hid = m.group(1), m.group(2), m.group(4)
            close_listing()
            if hid == "contents":
                skip_contents = True
                out.append("## How to read this guide {#contents}")
                out.append("")
                i += 1
                continue
            skip_contents = False
            # listing block -> collapsible
            if level == "####" and text.startswith("The program behind"):
                in_listing = True
                out.append(f'??? note "{text}"')
                out.append("")
                i += 1
                continue
            # level adjustments per page type
            if key == "index":
                pass                                   # ## stays ##
            elif key.startswith("class"):
                pass                                   # # class, ## chapter, ### section
            elif key == "review":
                if not any(l.startswith("# ") for l in out):
                    out.append(f"# {title}")
                    out.append("")
            elif key == "appendix":
                if level == "##":
                    level = "#"
                elif level == "####":
                    level = "##"
            if key == "review" and level == "##":
                pass
            if out and out[-1].strip():
                out.append("")
            out.append(badge_heading(level, text, hid))
            out.append("")
            i += 1
            continue

        if skip_contents:
            # keep the legend paragraph, drop the list
            if line.startswith("- ") or line.startswith("    ") or not line.strip():
                i += 1
                continue
            legend_text = rewrite_anchor_links(line, ids, this_page)
            legend_text = legend_text.replace("Every line below is a link. The label", "The label")
            out.append(legend_text)
            out.append("")
            out.append("The navigation on the left lists every class and chapter of this week; "
                       "the table of contents on the right lists the sections of the page you are on. "
                       "Every section number in the text (\"Section 3.5\", \"Extra 4\") is a link.")
            i += 1
            continue

        im = IMAGE.match(line)
        if im:
            cap = im.group("cap")
            src = im.group("src")
            src = "figs/" + Path(src).name
            attr = im.group("attr") or ""
            cap_md = link_prose_refs(rewrite_anchor_links(cap, ids, this_page), ids, this_page)
            pre = "    " if in_listing else ""
            out.append(pre + '<figure markdown="1">')
            out.append(pre + f"![{cap}]({src}){attr}")
            out.append(pre + '<figcaption markdown="1">' + cap_md + "</figcaption>")
            out.append(pre + "</figure>")
            i += 1
            continue

        text = rewrite_anchor_links(line, ids, this_page)
        text = link_prose_refs(text, ids, this_page)
        out.append(("    " if in_listing else "") + text)
        i += 1

    # collapse runs of blank lines
    cleaned = []
    for l in out:
        if l.strip() == "" and cleaned and cleaned[-1].strip() == "":
            continue
        cleaned.append(l)
    return "\n".join(cleaned).rstrip() + "\n"


def main():
    week, md_path, figs_path = sys.argv[1], Path(sys.argv[2]), Path(sys.argv[3])
    wk = week.lower()
    lines = md_path.read_text(encoding="utf-8").splitlines()
    meta, body = read_front_matter(lines)
    pages = split_pages(body)
    ids = collect_ids(pages)

    outdir = DOCS / wk
    if outdir.exists():
        shutil.rmtree(outdir)
    (outdir / "figs").mkdir(parents=True)
    for f in figs_path.iterdir():
        if f.is_file():
            shutil.copy2(f, outdir / "figs" / f.name)

    for key, title, plines in pages:
        text = convert_page(key, title, plines, ids, meta, week, None)
        (outdir / f"{key}.md").write_text(text, encoding="utf-8")
        print(f"{wk}/{key}.md  {len(plines)} lines  ({title or meta.get('title')})")
    print(f"{len(ids)} anchors, {sum(1 for _ in (outdir / 'figs').iterdir())} figures")


if __name__ == "__main__":
    main()
