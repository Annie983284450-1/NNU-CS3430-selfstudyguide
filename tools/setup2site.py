#!/usr/bin/env python3
"""Turn the setup guides (COMP3430_labs_v2/labs/setup/*.md) into the Lab 0 pages on the website.

    python3 tools/setup2site.py labs/lab0-setup.yml path/to/COMP3430_labs_v2/labs/setup

The setup guides stay the single source of truth and are never edited here. Unlike a lab, Lab 0
is not one session MASTER but several short guides, so this script first joins them into one
text, then hands that text to the same machinery as tools/lab2site.py:

  1. Join the overlay's `overview` and the `sources` files in order. Each file's headings move
     down by its `shift` (fence-aware), so a guide's own `# title` can become a `## ` page heading.
  2. Each inline <figure><svg>...</svg></figure> becomes a file figs/<name>.svg plus a markdown
     figure with a caption, in the order of the overlay's `figures` list. (An inline SVG's
     <style> would leak into the whole page, and a fixed-width SVG would not shrink on a phone.)
  3. Apply `replace` (each old string asserted), `drop_sections`, and the `theory` boxes.
  4. Split at the `pages` headings and convert each page with lab2site.convert_page.

Writes docs/labs/<id>/*.md and docs/labs/<id>/figs/. Prints the nav block for mkdocs.yml.
"""
import re
import shutil
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).resolve().parent))
import lab2site as L  # noqa: E402

FIG = re.compile(r"<figure>\s*\n(<svg\b.*?</svg>)\s*\n</figure>", re.S)


def shift_headings(text, k):
    if k == 0:
        return text
    out, fence = [], False
    for line in text.split("\n"):
        if line.startswith("```"):
            fence = not fence
        elif not fence and re.match(r"^#{1,6}\s", line):
            line = "#" * k + line
        out.append(line)
    return "\n".join(out)


def main():
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    overlay = yaml.safe_load(Path(sys.argv[1]).read_text(encoding="utf-8"))
    srcdir = Path(sys.argv[2])

    parts = [overlay.get("overview", "").rstrip("\n")]
    for s in overlay["sources"]:
        t = (srcdir / s["file"]).read_text(encoding="utf-8")
        parts.append(shift_headings(t, s.get("shift", 0)).rstrip("\n"))
    text = "\n\n".join(parts) + "\n"

    # 2. inline SVG figures -> files
    figs = overlay.get("figures") or []
    found = FIG.findall(text)
    if len(found) != len(figs):
        sys.exit(f"figures: the sources have {len(found)} inline <svg> figures, the overlay lists {len(figs)}")
    svgs = {}
    for f, svg in zip(figs, found):
        svgs[f["file"]] = svg
        cap = " ".join(f["caption"].split())
        md = (f'<figure markdown="1">\n![{cap}](figs/{f["file"]}){{width=100%}}\n'
              f'<figcaption markdown="1">{cap}</figcaption>\n</figure>')
        text = text.replace(f"<figure>\n{svg}\n</figure>", md, 1)

    # 3. overlay edits
    text = L.apply_replacements(text, overlay.get("replace"))
    text = L.drop_sections(text, overlay.get("drop_sections"))
    text = L.insert_theory(text, overlay.get("theory"))

    # 4. pages
    lab = overlay["id"]
    outdir = L.DOCS / "labs" / lab
    pages = L.split_pages(text, overlay["pages"])
    if outdir.exists():
        shutil.rmtree(outdir)
    (outdir / "figs").mkdir(parents=True)
    for name, svg in svgs.items():
        (outdir / "figs" / name).write_text('<?xml version="1.0" encoding="UTF-8"?>\n' + svg + "\n", encoding="utf-8")
    # every figure lands on the page that refers to it
    problems = []
    for f, nav, plines in pages:
        md = L.convert_page(f, list(plines), overlay["title"], {}, outdir / f, problems)
        (outdir / f).write_text(md, encoding="utf-8")
        print(f"labs/{lab}/{f:13s} {md.count(chr(10)):5d} lines   {nav}")

    for f in outdir.glob("*.md"):
        for target, anchor in re.findall(r"\]\((?:\.\./)+(labs/[^)#\s]+)(#[A-Za-z0-9_-]+)?\)", f.read_text()):
            ids = L.anchors_of(L.DOCS / target)
            if ids is None:
                problems.append(f"{f.name}: missing page {target}")
            elif anchor and anchor[1:] not in ids:
                problems.append(f"{f.name}: missing anchor {target}{anchor}")
        for img in re.findall(r"\]\((figs/[^)\s]+)\)", f.read_text()):
            if not (outdir / img).exists():
                problems.append(f"{f.name}: missing figure {img}")

    print(f"{len(svgs)} figures, {len(overlay.get('theory') or [])} theory boxes, "
          f"{len(overlay.get('replace') or [])} replacements")
    if problems:
        sys.exit("link problems:\n  " + "\n  ".join(problems))
    print("nav for mkdocs.yml:")
    print(f'      - "{overlay["nav_title"]}":')
    for f, nav, _ in pages:
        print(f'          - "{nav}": labs/{lab}/{f}')


if __name__ == "__main__":
    main()
