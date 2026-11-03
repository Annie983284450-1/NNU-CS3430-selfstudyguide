"""Draw a map of each class, in the style of the home page's course map, and put it at the top of the class page.

For every docs/wNN/class-K.md: the class (root) -> its questions (the chapters) -> the steps of each question
(its sections, in the order taught, each coloured by its role: Problem, Concept, Worked example, Real machine,
Real kernel, Check yourself) -> the optional Extras that deepen it. Where the class page lists its questions in the
Roadmap ("1. Where does the lock go ...? ([Chapter 1](#chapter-1))"), that sentence is the question's text; otherwise
the chapter title is. Every box is a link to its section. Nothing on the map is written by hand: every word is a
heading or a roadmap line of the page itself, so the map can never disagree with the page.

Run after guide2site.py (build.sh does). It is idempotent: the map sits between two marker comments right under
the page title and is replaced on every run. It also writes docs/wNN/maps/class-K.svg, the full-size copy.
    python3 tools/make_classmaps.py            (all weeks)
    python3 tools/make_classmaps.py w09        (one week)
"""
import html, re, sys
from pathlib import Path

DOCS = Path(__file__).resolve().parent.parent / "docs"
FONT = "Source Sans 3, Helvetica Neue, Arial, sans-serif"
DASH, ITAL = ' stroke-dasharray="4 3"', ' font-style="italic"'
START, END = "<!-- classmap:start -->", "<!-- classmap:end -->"

ROLE = {  # label class -> (colour, what the step does, as the legend says it)
    "problem": ("#b23a48", "Problem", "why we ask: what breaks"),
    "concept": ("#1f6f8b", "Concept", "the idea, one step at a time"),
    "example": ("#5b7a2a", "Worked example", "traced by hand"),
    "machine": ("#a0632a", "Real machine", "measured on a real computer"),
    "kernel": ("#6b4fa0", "Real kernel", "read in xv6 or Linux"),
    "check": ("#2a7a6b", "Check yourself", "what is settled, what is open"),
    "deeper": ("#7a7a7a", "Deeper", "optional"),
}
PIECE = {"w01": "#555e6b"}
for w in ("w02", "w03", "w04", "w05", "w06", "w07"):
    PIECE[w] = "#2f3e9e"
for w in ("w08", "w09", "w10"):
    PIECE[w] = "#a0632a"

H1 = re.compile(r"^# (.*?)\s*\{#(class-\d)\}\s*$")
CHAP = re.compile(r"^## Chapter (\d+)\. (.*?)\s*\{#(chapter-\d+)\}\s*$")
SEC = re.compile(r'^### (\S+(?: \d+)?) <span class="lbl lbl-([a-z]+)">([^<]*)</span> (.*?)\s*\{#([A-Za-z0-9_-]+)')
H2 = re.compile(r'^## (?:<span class="lbl lbl-([a-z]+)">([^<]*)</span> )?(.*?)\s*\{#([A-Za-z0-9_-]+)')
SUMQ = re.compile(r"^(\d+)\. \*\*(.*?)\*\*\s+(.*)$")
ROADQ = re.compile(r"^\d+\. (.*?)\s*\(\[Chapter (\d+)\]\(#chapter-\d+\)\)\.?\s*$")
MDLINK = re.compile(r"\[([^\]]*)\]\([^)]*\)")


def plain(s):
    s = MDLINK.sub(r"\1", s)
    s = re.sub(r"`([^`]*)`", r"\1", s)
    s = re.sub(r"\*\*?([^*]+)\*\*?", r"\1", s)
    return s.strip()


def parse(md):
    lines = md.splitlines()
    cls = {"title": "", "id": "", "opening": None, "summary": None, "chapters": [], "roadq": {}}
    cur = None
    in_extras = False
    in_summary = False
    cls["sumlines"] = []
    for ln in lines:
        m = H1.match(ln)
        if m:
            cls["title"], cls["id"] = plain(m.group(1)), m.group(2)
            continue
        m = ROADQ.match(ln)
        if m and not cls["chapters"]:
            cls["roadq"][m.group(2)] = plain(m.group(1))
            continue
        m = CHAP.match(ln)
        if m:
            cur = {"n": m.group(1), "title": plain(m.group(2)), "id": m.group(3), "secs": [], "extras": []}
            cls["chapters"].append(cur)
            in_extras = False
            continue
        m = SEC.match(ln)
        if m:
            num, role, label, title, hid = m.groups()
            item = {"num": num, "role": role, "label": label, "title": plain(title), "id": hid}
            if role == "deeper":
                q = re.search(r"Q(\d+)", label)
                item["q"] = int(q.group(1)) if q else None
                cls.setdefault("extras", []).append(item)
            elif cur is not None and not in_extras:
                cur["secs"].append(item)
            continue
        m = H2.match(ln)
        if m:
            role, label, title, hid = m.groups()
            if role == "roadmap" and cls["opening"] is None:
                cls["opening"] = (plain(title), hid)
            elif role == "summary":
                cls["summary"] = (plain(title), hid)
                cur = None
                in_summary = True
            else:
                in_summary = False
                if hid.startswith("extras"):
                    in_extras = True
                    cls.setdefault("extras_id", hid)
                    cur = None
            continue
        if in_summary:
            cls["sumlines"].append(ln)
    cls["answers"] = summary_answers(cls)
    return cls


def summary_answers(cls):
    """The summary of each class page answers its questions, but the pages of different weeks word it in four
    ways: '1. **Q?** answer', '**Q?** answer', 'Question 4, q. answer' / 'Question 1: q? answer', and 'Q? answer'.
    Return {chapter id: the answer, word for word (the leading question removed)}."""
    found = []   # (number or None, answer)
    for ln in cls["sumlines"]:
        s = ln.strip()
        if not s or s[0] in "<!#|-" or s.startswith("The words") or s.startswith("In one sentence"):
            continue
        m = SUMQ.match(s)
        if m:
            found.append((int(m.group(1)), plain(m.group(3))))
            continue
        m = re.match(r"^\*\*(.+?)\*\*\s+(.*)$", s)
        if m and m.group(1).rstrip().endswith("?"):
            found.append((None, plain(m.group(2))))
            continue
        m = re.match(r"^Question (\d+)[:,]\s+(.*)$", s)
        if m:
            rest = plain(m.group(2))
            q = re.match(r"^(.*?[?.])\s+(.*)$", rest)
            found.append((int(m.group(1)), q.group(2) if q else rest))
            continue
        m = re.match(r"^([A-Z][^.?]*\?)\s+(.*)$", plain(s))
        if m:
            found.append((None, m.group(2)))
    chapters = cls["chapters"]
    nums = {int(c["n"]): c["id"] for c in chapters}
    out = {}
    numbered = [(n, a) for n, a in found if n is not None]
    if numbered and all(n in nums for n, _ in numbered if n in nums) and any(n in nums for n, _ in numbered):
        for n, a in numbered:
            if n in nums:
                out[nums[n]] = a
    elif len(found) == len(chapters):
        for c, (_, a) in zip(chapters, found):
            out[c["id"]] = a
    elif len(found) > len(chapters) and int(chapters[0]["n"]) == len(found) - len(chapters) + 1:
        # a second class whose summary answers the whole week's questions in order: take the last ones
        for c, (_, a) in zip(chapters, found[-len(chapters):]):
            out[c["id"]] = a
    if len(out) != len(chapters):
        return {}      # all or nothing, so every question of a map has an answer box or none does
    for k, a in out.items():
        if "The answer: " in a:
            a = a[a.index("The answer: ") + len("The answer: "):]
        if len(a) > 330:
            cut = [m.end() for m in re.finditer(r"[.;](?=\s)", a) if m.end() <= 330]
            a = a[:cut[-1]] + " \u2026" if cut else a[:330] + " \u2026"
        out[k] = a
    return out


def wrap(text, width_px, size):
    per = max(12, int(width_px / (size * 0.5)))
    words, rows, row = text.split(), [], ""
    for w in words:
        if len(row) + len(w) + (1 if row else 0) > per and row:
            rows.append(row)
            row = w
        else:
            row = (row + " " + w) if row else w
    if row:
        rows.append(row)
    return rows


def esc(s):
    return html.escape(s, quote=True)


FACETS = [  # the four branches of every question, in the words of the request: why, the steps, the method, the result
    ("why", "Why we ask", "#b23a48", ("problem",)),
    ("steps", "The steps", "#1f6f8b", ("concept", "example")),
    ("method", "How we know", "#a0632a", ("machine", "kernel")),
    ("settled", "What it settles", "#2a7a6b", ("check",)),
    ("deeper", "Going deeper", "#7a7a7a", ("deeper",)),
]


def draw(week, cls, href_prefix):
    """href_prefix: '' for the map inside the page (links '#sec-1-2'), '../class-1/' for the full-size file."""
    color = PIECE.get(week, "#555e6b")
    out = []
    X_ROOT = 10                    # left edge (the page title above the map is the root)
    X_Q, W_Q = 10, 206
    X_F, W_F = 248, 104
    X_S, W_S = 384, 400
    PAD, LH, SZ = 8, 15, 11.5
    W = X_S + W_S + 12

    def link(hid, inner, title):
        return f'<a href="{href_prefix}#{hid}" class="cmap-link"><title>{esc(title)}</title>{inner}</a>'

    def curve(x1, y1, x2, y2, col, dash=False):
        mx = (x1 + x2) / 2
        out.append(f'<path d="M{x1:.0f},{y1:.0f} C{mx:.0f},{y1:.0f} {mx:.0f},{y2:.0f} {x2:.0f},{y2:.0f}" fill="none" stroke="{col}" stroke-width="1.4"{DASH if dash else ""}/>')

    def leaf(x, yy, w, item, faded=False):
        col, name, _ = ROLE[item["role"]]
        pill = item["label"] if item["role"] == "deeper" else name
        pw = len(pill) * 5.6 + 12
        rows = wrap(f'{item["num"]}  {item["title"]}', w - pw - 24, SZ)
        h = PAD + len(rows) * LH + PAD - 4
        g = [f'<rect x="{x}" y="{yy}" width="{w}" height="{h}" rx="6" fill="{"#fafafa" if faded else "#ffffff"}" stroke="{col}" stroke-width="1.1"{DASH if faded else ""}/>',
             f'<rect x="{x + 6}" y="{yy + 6}" width="{pw:.0f}" height="15" rx="3" fill="{col}"/>',
             f'<text x="{x + 12}" y="{yy + 16.5}" font-family="{FONT}" font-size="9.5" font-weight="600" fill="#fff">{esc(pill)}</text>']
        for i, r in enumerate(rows):
            g.append(f'<text x="{x + pw + 13:.0f}" y="{yy + PAD + 10 + i * LH}" font-family="{FONT}" font-size="{SZ}" fill="{"#5b6675" if faded else "#1b2430"}">{esc(r)}</text>')
        out.append(link(item["id"], "".join(g), f'{item["num"]} {item["label"]}: {item["title"]}'))
        return h

    def textbox(x, yy, w, text, hid, title, fill, stroke, italic=False, col="#1b2430"):
        rows = wrap(text, w - 22, SZ)
        h = 10 + len(rows) * LH + 6
        g = [f'<rect x="{x}" y="{yy}" width="{w}" height="{h}" rx="6" fill="{fill}" stroke="{stroke}" stroke-width="1.1"/>']
        for i, r in enumerate(rows):
            g.append(f'<text x="{x + 10}" y="{yy + 16 + i * LH}" font-family="{FONT}" font-size="{SZ}"{ITAL if italic else ""} fill="{col}">{esc(r)}</text>')
        out.append(link(hid, "".join(g), title))
        return h

    # heading and the legend of roles
    wk = "Week %d" % int(week[1:])
    out.append(f'<text x="{X_ROOT}" y="20" font-family="{FONT}" font-size="12" font-weight="700" letter-spacing=".05em" fill="{color}">{esc(wk.upper())} \u00b7 MAP OF THIS CLASS</text>')
    out.append(f'<text x="{X_ROOT}" y="36" font-family="{FONT}" font-size="10.5" fill="#5b6675">Each question: why we ask it, the steps that answer it, how we know, and what it settles. Every box opens its section.</text>')
    lx, ly = X_ROOT, 48
    for key in ("problem", "concept", "example", "machine", "kernel", "check", "deeper"):
        col, name, what = ROLE[key]
        tw = len(name) * 5.6 + 12
        piece_w = tw + 5 + len(what) * 4.9 + 14
        if lx + piece_w > W - 10:
            lx, ly = X_ROOT, ly + 20
        out.append(f'<rect x="{lx}" y="{ly}" width="{tw:.0f}" height="15" rx="3" fill="{col}"/>')
        out.append(f'<text x="{lx + 6}" y="{ly + 11}" font-family="{FONT}" font-size="9.5" font-weight="600" fill="#fff">{esc(name)}</text>')
        out.append(f'<text x="{lx + tw + 5:.0f}" y="{ly + 11}" font-family="{FONT}" font-size="10" fill="#5b6675">{esc(what)}</text>')
        lx += piece_w
    y = ly + 34
    boxes = []
    if cls["opening"]:
        t, hid = cls["opening"]
        h = textbox(X_Q, y, W_Q, "Where we left off: " + t.replace("Where we left off: ", ""), hid, t, "#f3f4f6", "#9aa3b2", italic=True, col="#3a4350")
        boxes.append((X_Q, y, W_Q, h, "#9aa3b2"))
        y += h + 22
    extras = cls.get("extras", [])
    for qi, ch in enumerate(cls["chapters"], 1):
        qtext = cls["roadq"].get(ch["n"], ch["title"])
        groups = []
        for key, fname, fcol, roles in FACETS:
            if key == "deeper":
                items = [e for e in extras if e.get("q") in (qi, int(ch["n"]))]
                if len(items) > 4:
                    more = len(items) - 3
                    items = items[:3] + [{"more": more}]
            else:
                items = [s for s in ch["secs"] if s["role"] in roles]
            if key == "settled" and cls["answers"].get(ch["id"]):
                items = items + [{"answer": cls["answers"][ch["id"]]}]
            if items:
                groups.append((key, fname, fcol, items))
        y0 = y
        fboxes = []
        for key, fname, fcol, items in groups:
            gy0 = y
            ys = []
            for it in items:
                if "more" in it:
                    h = textbox(X_S + 0, y, W_S, "and %d more optional extras on this question" % it["more"], cls.get("extras_id") or ch["id"], "Going deeper", "#fafafa", "#9aa3b2", italic=True, col="#5b6675")
                elif "answer" in it:
                    h = textbox(X_S, y, W_S, "The answer: " + it["answer"], cls["summary"][1] if cls["summary"] else ch["id"], "The answer", "#eef7f4", "#2a7a6b")
                else:
                    h = leaf(X_S, y, W_S, it, faded=(key == "deeper"))
                ys.append(y + h / 2)
                y += h + 4
            gh = y - 4 - gy0
            fy = gy0 + gh / 2 - 13
            for yy in ys:
                curve(X_F + W_F, fy + 13, X_S, yy, fcol, dash=(key == "deeper"))
            out.append(f'<rect x="{X_F}" y="{fy:.0f}" width="{W_F}" height="26" rx="13" fill="#ffffff" stroke="{fcol}" stroke-width="1.5"{DASH if key == "deeper" else ""}/>')
            out.append(f'<text x="{X_F + W_F / 2}" y="{fy + 17:.0f}" text-anchor="middle" font-family="{FONT}" font-size="11.5" font-weight="700" fill="{fcol}">{esc(fname)}</text>')
            fboxes.append((fy + 13, fcol, key == "deeper"))
            y += 8
        y -= 8
        block_h = max(y - y0, 40)
        rows = wrap(qtext, W_Q - 52, 12.5)
        qh = 12 + len(rows) * 16 + 8
        qy = y0 + block_h / 2 - qh / 2
        for fyc, fcol, dash in fboxes:
            curve(X_Q + W_Q, qy + qh / 2, X_F, fyc, color, dash=dash)
        g = [f'<rect x="{X_Q}" y="{qy:.0f}" width="{W_Q}" height="{qh}" rx="8" fill="#ffffff" stroke="{color}" stroke-width="1.9"/>',
             f'<circle cx="{X_Q + 18}" cy="{qy + 20:.0f}" r="11" fill="{color}"/>',
             f'<text x="{X_Q + 18}" y="{qy + 24:.0f}" text-anchor="middle" font-family="{FONT}" font-size="11" font-weight="700" fill="#fff">Q{qi}</text>']
        for i, r in enumerate(rows):
            g.append(f'<text x="{X_Q + 38}" y="{qy + 24 + i * 16:.0f}" font-family="{FONT}" font-size="12.5" font-weight="600" fill="#1b2430">{esc(r)}</text>')
        out.append(link(ch["id"], "".join(g), f"Q{qi}. {qtext}"))
        boxes.append((X_Q, qy, W_Q, qh, color))
        if qi < len(cls["chapters"]):
            out.append(f'<text x="{X_Q + W_Q / 2}" y="{y + 18:.0f}" text-anchor="middle" font-family="{FONT}" font-size="10" font-style="italic" fill="#6b7482">\u2193 what is left open leads to the next question</text>')
        y += 30
    if cls["summary"]:
        t, hid = cls["summary"]
        rows = wrap("Summary: " + t, W_Q - 22, 12)
        h = 12 + len(rows) * 16 + 6
        g = [f'<rect x="{X_Q}" y="{y}" width="{W_Q}" height="{h}" rx="7" fill="#555e6b"/>']
        for i, r in enumerate(rows):
            g.append(f'<text x="{X_Q + 11}" y="{y + 19 + i * 16}" font-family="{FONT}" font-size="12" font-weight="600" fill="#fff">{esc(r)}</text>')
        out.append(link(hid, "".join(g), t))
        boxes.append((X_Q, y, W_Q, h, "#555e6b"))
        y += h + 10
    H = y + 6
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H:.0f}" class="cmap" role="img" aria-label="Map of this class: each question, why we ask it, its steps, how we know, and what it settles; each box a link to its section">\n'
           f'<style>.cmap .cmap-link rect{{transition:filter .15s}} .cmap .cmap-link:hover rect{{stroke-width:2.2;filter:drop-shadow(0 2px 4px rgba(0,0,0,.18))}} .cmap .cmap-link:hover text{{text-decoration:underline}}</style>\n'
           f'<rect x="0" y="0" width="{W}" height="{H:.0f}" fill="#ffffff"/>\n' + "\n".join(out) + "\n</svg>")
    return svg


def inject(page, cls_id, svg_inline):
    md = page.read_text(encoding="utf-8")
    md = re.sub(re.escape(START) + r".*?" + re.escape(END) + r"\n*", "", md, flags=re.S)
    block = (f"{START}\n"
             f'<details class="abstract cmap-details" markdown="0" open>\n<summary>Map of this class: the questions, and the steps of each</summary>\n'
             f'<div class="cmap-wrap">\n{svg_inline}\n</div>\n'
             f'<p><a href="../maps/{cls_id}.svg" target="_blank" rel="noopener">Open the map in its own tab</a></p>\n</details>\n'
             f"{END}\n\n")
    lines = md.split("\n")
    i = next(k for k, l in enumerate(lines) if H1.match(l))
    lines.insert(i + 1, "\n" + block.rstrip("\n"))
    page.write_text("\n".join(lines), encoding="utf-8")


def main():
    weeks = sys.argv[1:] or sorted(p.name for p in DOCS.iterdir() if re.fullmatch(r"w\d\d", p.name))
    for wk in weeks:
        for page in sorted((DOCS / wk).glob("class-*.md")):
            md = page.read_text(encoding="utf-8")
            md_clean = re.sub(re.escape(START) + r".*?" + re.escape(END) + r"\n*", "", md, flags=re.S)
            cls = parse(md_clean)
            if not cls["chapters"]:
                print(f"{wk}/{page.name}: no chapters, skipped")
                continue
            (DOCS / wk / "maps").mkdir(exist_ok=True)
            (DOCS / wk / "maps" / f"{cls['id']}.svg").write_text(draw(wk, cls, f"../{page.stem}/"), encoding="utf-8")
            inject(page, cls["id"], draw(wk, cls, ""))
            n = sum(len(c["secs"]) for c in cls["chapters"])
            print(f"{wk}/{page.name}: {len(cls['chapters'])} questions, {n} steps, {len(cls.get('extras', []))} extras")


if __name__ == "__main__":
    main()
