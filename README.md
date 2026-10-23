# COMP3430 self-study website

A website version of the weekly self-study guides, built with MkDocs Material from the same `.md` files that produce the HTML and PDF editions. The guide `.md` in `Theory/Slides/W0N/` stays the single source of truth. Nothing here is edited by hand except `mkdocs.yml`, `docs/index.md` and `docs/assets/extra.css`.

## What is in this folder

| path | what it is | edit by hand? |
|---|---|---|
| `tools/guide2site.py` | converts one guide `.md` into the pages under `docs/w0N/` | only to change the conversion rules |
| `build.sh` | runs the converter for every week, then `mkdocs build` | add one line per new week |
| `mkdocs.yml` | site title, theme, navigation (the left sidebar) | add the new week's five pages |
| `docs/index.md` | the home page | add the new week to the list |
| `docs/assets/extra.css` | section-label badges, figure captions, type size | rarely |
| `docs/w05/`, `docs/w06/` | generated pages and figures. Regenerated on every build; do not edit | never |
| `.github/workflows/pages.yml` | GitHub Actions: builds and publishes on every push | no |
| `site/` | the built website (local preview only; not committed) | never |

## One-time setup on the Mac

```bash
pip3 install mkdocs-material
```

One-time setup on GitHub (about five minutes):

1. Create a new repository, for example `comp3430-guides`, public (GitHub Pages on a free personal account needs a public repo; with GitHub Education or a paid plan it can be private).
2. In this folder:

   ```bash
   git init -b main
   git add .
   git commit -m "Self-study site: W05 and W06"
   git remote add origin https://github.com/<your-user>/comp3430-guides.git
   git push -u origin main
   ```

3. On GitHub: Settings, Pages, "Build and deployment", Source = **GitHub Actions**. The workflow in `.github/workflows/pages.yml` runs on the push and publishes the site.
4. Put the resulting address (`https://<your-user>.github.io/comp3430-guides/`) into `site_url:` in `mkdocs.yml`, commit, push once more. Then paste the same link into Canvas.

## Every week after that

1. Finish the week's guide `.md` as usual (structured edition, with `{#id}` on every heading).
2. Add one line to `build.sh` for the new week, five lines to the `nav:` block of `mkdocs.yml`, and one bullet to `docs/index.md`.
3. Run:

   ```bash
   ./build.sh          # regenerates docs/w0N/ and builds site/
   ./build.sh serve    # same, then opens a live preview at http://127.0.0.1:8000
   ```

4. Commit and push. GitHub publishes the new version in about a minute.

   ```bash
   git add . && git commit -m "W07 guide" && git push
   ```

## What the converter does to a guide

It never touches the source `.md`. On the way to `docs/w0N/` it:

- splits the one long file into five pages: `index.md` (front matter, "Where this guide comes from", the label legend, Part 0), `class-1.md`, `class-2.md` (each `# <class>` heading starts a page), `review.md` (the week-in-N-sentences, Exercises, Answers) and `appendix.md`;
- drops the hand-made `## Contents` list, because the sidebar and the right-hand table of contents replace it, but keeps the legend paragraph;
- rewrites every `(#id)` link to `(<page>.md#id)` so cross-links survive the split, and turns plain-text references such as "Section 3.5", "Sections 3.1 and 3.2", "Extra 4", "Extras 1 to 5", "Chapter 2", "Appendix A" into links (only when the target heading exists);
- wraps every standalone image in `<figure>` with a visible caption (pandoc shows the alt text as a caption; Python-Markdown does not, so the converter adds it);
- turns the `[Problem]`, `[Concept]`, ... labels in headings into colored badges, and keeps the plain text for the tables of contents through `data-toc-label`;
- folds each "The program behind Figures ... (you can skip this listing)" block into a collapsible box.

The split and the link rewriting depend on the guide's heading conventions: `# ` for a class, `## ` with `{#extras-N}` for the deeper blocks, an id starting with `the` (`{#the}`, `{#the-week}`) or `{#exercises}` for the start of the tail, `{#appendix-a}` for the appendix. A guide that follows the structure rules in the self-study skill converts without changes.

## The Labs tab (added 2026-10-23)

The lab session guides are on the site too, under the **Labs** tab, one page per step. Their text still comes only from each lab's `LABn_SESSION_MASTER_vN.md` in `COMP3430_labs_v2/labs/labN-.../instructor-notes/`. Edit the MASTER, never the pages in `docs/labs/labN/`.

| path | what it is | edit by hand? |
|---|---|---|
| `tools/lab2site.py` | converts one MASTER into `docs/labs/<lab>/` (overview, before, one page per step, wrap-up) | only to change the conversion rules |
| `labs/lab1-util.yml`, `labs/lab2-syscall.yml` | one overlay per lab: the "Connect to theory" boxes, the sentences the public site changes, the page list | yes, this is where the boxes are written |
| `docs/labs/index.md` | the Labs landing page | yes |
| `docs/labs/lab1/`, `docs/labs/lab2/` | generated; rewritten on every build | never |

What the converter does on the way: it makes the student copy (keeps STUDENT-ONLY, drops INSTRUCTOR-ONLY and every ANSWER block, so Think answers never reach the site); applies the overlay's `replace` list, where every old string must occur exactly as many times as stated, so a changed MASTER stops the build instead of being half-converted; drops "Hand in"; inserts each theory box after the paragraph or output it explains; folds every "The answer ..." section into a click-to-open box (the run instructions after it stay visible); turns each Think into a question box; links "Step N" to that step's page; numbers the lines of complete listings from the file's own line numbers; and checks that every link into the weekly guides lands on an existing heading.

To move a lab to a new MASTER version: change the file name in its `build.sh` line, run `./build.sh`. If the build stops on a `replace` or `after` string, the MASTER's wording changed there; update that line of the overlay.

To add a lab: copy `labs/lab2-syscall.yml` to a new overlay, set `id`, `title`, `pages` and the boxes, add a `build.sh` line and a nav block in `mkdocs.yml` (the converter prints it), and a row on `docs/labs/index.md`.

`build.sh` looks for `COMP3430_labs_v2` both inside the course folder and at the OneDrive root, because it sits in different places on different computers. If it finds neither, it leaves `docs/labs/` as it is.

## Known limits

- `mkdocs build --strict` fails on any broken internal link; that is on purpose, so a bad link is caught before it reaches students.
- The search index covers all weeks at once; it is built in the browser, so the first search on a page takes a second.
- Table layout in the appendix comes from the `tables` extension; pipe tables in the guide `.md` render as is.
