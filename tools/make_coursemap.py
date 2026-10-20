"""Draw the clickable course map as inline SVG for the home page.

Content map, not a calendar: root -> the three pieces -> weeks -> the two classes of each week.
Every node that has a page is an <a href>; weeks not yet on the site are drawn grey without a link.
Dashed arrows carry the question that leads from one week to the next.
    python3 make_coursemap.py > docs/assets/coursemap.svg   (also written into docs/index.md by the caller)
"""
import html

PFX = ""   # links are relative to the home page: "w04/class-2/"

PIECES = [
    ("Virtualization", "one machine pretends to be many", "#2f3e9e", [
        ("the CPU", [
            ("w02", "Week 2 · The process", "fork, exec, wait; staying in control", [
                ("What a process is, how it is made, how it runs a program", "4, 5", "w02/class-1/"),
                ("Limited direct execution: staying in control", "6", "w02/class-2/")]),
            ("w06", "Week 6 · Scheduling", "who runs next, and for how long", [
                ("FIFO, SJF, STCF, round robin", "7", "w06/class-1/"),
                ("The multi-level feedback queue", "8", "w06/class-2/")]),
            ("w07", "Week 7 · Fair share, many CPUs", "proportional share; many CPUs", [
                ("Lottery and stride scheduling; Linux CFS", "9", None),
                ("Scheduling on more than one CPU", "10", None)]),
        ]),
        ("memory", [
            ("w03", "Week 3 · Address spaces", "the address space; malloc and free", [
                ("The address space, malloc and free", "13, 14", "w03/class-1/"),
                ("Address translation: base and bounds", "15", "w03/class-2/")]),
            ("w04", "Week 4 · Paging", "chopping the address space into pieces", [
                ("Segments, and the holes they leave behind", "16, 17", "w04/class-1/"),
                ("Pages, and the TLB that makes them affordable", "18, 19", "w04/class-2/")]),
            ("w05", "Week 5 · Tables and swapping", "page-table trees; swapping", [
                ("Multi-level page tables", "20", "w05/class-1/"),
                ("Swapping and page replacement", "21, 22", "w05/class-2/")]),
        ]),
    ]),
    ("Concurrency", "many things at once, correctly", "#a0632a", [
        ("", [
            ("w08", "Week 8 · Threads and locks", "one address space, many threads", [
                ("Threads and the thread API", "26, 27", None),
                ("Locks: building mutual exclusion", "28", None)]),
            ("w09", "Week 9 · Coordination", "condition variables; semaphores", [
                ("Locked data structures; condition variables", "29, 30", None),
                ("Semaphores", "31", None)]),
            ("w10", "Week 10 · Concurrency bugs", "deadlock and how to avoid it", [
                ("Non-deadlock bugs; deadlock", "32", None),
                ("Event-based concurrency", "33", None)]),
        ]),
    ]),
    ("Persistence", "data that survives power loss", "#2a7a6b", [
        ("", [
            ("w11", "Week 11 · Devices and disks", "I/O devices; hard disk drives", [
                ("I/O devices and drivers", "36", None),
                ("Hard disk drives", "37", None)]),
            ("w12", "Week 12 · Files", "files, directories, inodes", [
                ("Files and directories", "39", None),
                ("File-system implementation: inodes", "40", None)]),
            ("w13", "Week 13 · Fast and safe", "locality; crash consistency", [
                ("The Fast File System", "41", None),
                ("Crash consistency: fsck and journaling", "42", None)]),
            ("w14", "Week 14 · Logs and flash", "LFS; SSDs; data integrity", [
                ("Log-structured file systems; flash SSDs", "43, 44", None),
                ("Data integrity and protection", "45", None)]),
        ]),
    ]),
]

INTRO = ("w01", "Week 1 · Introduction", "the three easy pieces", [
    ("What an OS is; a private CPU and a private memory", "1, 2", "w01/class-1/"),
    ("Concurrency and persistence: a lost update, a lost write", "2", "w01/class-2/")])

# geometry (px)
X_ROOT, X_PIECE, X_SUB, X_WEEK, X_CLASS = 12, 180, 352, 440, 680
W_ROOT, W_PIECE, W_SUB, W_WEEK, W_CLASS = 150, 156, 72, 226, 448
H_CLASS, GAP_CLASS, GAP_WEEK, GAP_GROUP = 30, 5, 24, 30
FONT = "Source Sans 3, Helvetica Neue, Arial, sans-serif"

out = []
def esc(s): return html.escape(s, quote=True)
def wrap(x1, y1, x2, y2, color="#9aa3b2", dash=False):
    mx = (x1 + x2) / 2
    out.append(f'<path d="M{x1:.0f},{y1:.0f} C{mx:.0f},{y1:.0f} {mx:.0f},{y2:.0f} {x2:.0f},{y2:.0f}" fill="none" stroke="{color}" stroke-width="1.6"{" stroke-dasharray=\"5 4\"" if dash else ""}/>')

def node(x, y, w, h, title, sub, href, fill, stroke, bold=True, small=False):
    live = href is not None
    g = []
    g.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="7" fill="{fill if live else "#f3f4f6"}" stroke="{stroke if live else "#c9ced6"}" stroke-width="1.4"/>')
    tcol = "#1b2430" if live else "#8a919c"
    scol = "#5b6675" if live else "#a3a9b3"
    if sub:
        g.append(f'<text x="{x+11}" y="{y+15}" font-family="{FONT}" font-size="12.5" font-weight="{600 if bold else 500}" fill="{tcol}">{esc(title)}</text>')
        g.append(f'<text x="{x+11}" y="{y+29}" font-family="{FONT}" font-size="10.5" fill="{scol}">{esc(sub)}</text>')
    else:
        g.append(f'<text x="{x+11}" y="{y+h/2+4.5}" font-family="{FONT}" font-size="{11 if small else 12.5}" font-weight="{600 if bold else 500}" fill="{tcol}">{esc(title)}</text>')
    body = "\n".join(g)
    if live:
        out.append(f'<a href="{PFX}{href}" class="cmap-link"><title>{esc(title)}</title>{body}</a>')
    else:
        out.append(f'<g class="cmap-soon"><title>{esc(title)} (coming later in the term)</title>{body}</g>')

def draw_week(y, wk, color):
    key, title, sub, classes = wk
    h_week = len(classes) * H_CLASS + (len(classes) - 1) * GAP_CLASS
    live = any(c[2] for c in classes)
    node(X_WEEK, y, W_WEEK, h_week, title, sub, f"{key}/" if live else None, "#ffffff", color)
    cy = y
    for ctitle, ch, href in classes:
        label = f"{ctitle}"
        node(X_CLASS, cy, W_CLASS, H_CLASS, label, "", href, "#fbfcfe", color, bold=False, small=True)
        out.append(f'<text x="{X_CLASS+W_CLASS-8}" y="{cy+H_CLASS/2+4}" text-anchor="end" font-family="{FONT}" font-size="10" fill="{"#7a8291" if href else "#b0b6bf"}">OSTEP {esc(ch)}</text>')
        wrap(X_WEEK + W_WEEK, y + h_week / 2, X_CLASS, cy + H_CLASS / 2)
        cy += H_CLASS + GAP_CLASS
    return h_week

# ---- layout pass: compute y positions
y = 56
layout = []  # (kind, data, y, h)
# intro week
h = draw_week.__code__ and (len(INTRO[3]) * H_CLASS + (len(INTRO[3]) - 1) * GAP_CLASS)
layout.append(("intro", INTRO, y, h)); y += h + GAP_GROUP
for pname, psub, pcolor, subs in PIECES:
    py0 = y
    sub_entries = []
    for sname, weeks in subs:
        sy0 = y
        wk_entries = []
        for wk in weeks:
            hw = len(wk[3]) * H_CLASS + (len(wk[3]) - 1) * GAP_CLASS
            wk_entries.append((wk, y, hw)); y += hw + GAP_WEEK
        y -= GAP_WEEK
        sub_entries.append((sname, sy0, y - sy0, wk_entries)); y += GAP_GROUP
    y -= GAP_GROUP
    layout.append(("piece", (pname, psub, pcolor), py0, y - py0, sub_entries)); y += GAP_GROUP + 8
H_TOTAL = y + 10
W_TOTAL = X_CLASS + W_CLASS + 16

# ---- draw
root_y = H_TOTAL / 2 - 30
for item in layout:
    if item[0] == "intro":
        _, wk, yy, hh = item
        wrap(X_ROOT + W_ROOT, root_y + 30, X_WEEK, yy + hh / 2, "#9aa3b2")
        draw_week(yy, wk, "#555e6b")
    else:
        _, (pname, psub, pcolor), yy, hh, subs = item
        pc_y = yy + hh / 2 - 22
        wrap(X_ROOT + W_ROOT, root_y + 30, X_PIECE, pc_y + 22, "#9aa3b2")
        out.append(f'<rect x="{X_PIECE}" y="{pc_y:.0f}" width="{W_PIECE}" height="44" rx="8" fill="{pcolor}"/>')
        out.append(f'<text x="{X_PIECE+W_PIECE/2}" y="{pc_y+19:.0f}" text-anchor="middle" font-family="{FONT}" font-size="13" font-weight="700" fill="#fff">{esc(pname.upper())}</text>')
        out.append(f'<text x="{X_PIECE+W_PIECE/2}" y="{pc_y+34:.0f}" text-anchor="middle" font-family="{FONT}" font-size="9.5" fill="#e6e9f2">{esc(psub)}</text>')
        for sname, sy, sh, wks in subs:
            if sname:
                sc_y = sy + sh / 2 - 14
                wrap(X_PIECE + W_PIECE, pc_y + 22, X_SUB, sc_y + 14, pcolor)
                out.append(f'<rect x="{X_SUB}" y="{sc_y:.0f}" width="{W_SUB}" height="28" rx="14" fill="#fff" stroke="{pcolor}" stroke-width="1.4"/>')
                out.append(f'<text x="{X_SUB+W_SUB/2}" y="{sc_y+18:.0f}" text-anchor="middle" font-family="{FONT}" font-size="11.5" font-weight="600" fill="{pcolor}">{esc(sname)}</text>')
                src_x, src_y = X_SUB + W_SUB, sc_y + 14
            else:
                src_x, src_y = X_PIECE + W_PIECE, pc_y + 22
            for wk, wy, wh in wks:
                wrap(src_x, src_y, X_WEEK, wy + wh / 2, pcolor)
                draw_week(wy, wk, pcolor)

# root
out.append(f'<rect x="{X_ROOT}" y="{root_y:.0f}" width="{W_ROOT}" height="60" rx="10" fill="#1b2430"/>')
out.append(f'<text x="{X_ROOT+W_ROOT/2}" y="{root_y+26:.0f}" text-anchor="middle" font-family="{FONT}" font-size="14" font-weight="700" fill="#fff">Operating Systems</text>')
out.append(f'<text x="{X_ROOT+W_ROOT/2}" y="{root_y+44:.0f}" text-anchor="middle" font-family="{FONT}" font-size="10" fill="#c5ccd8">three easy pieces</text>')

# the questions that lead from one week to the next (dashed, between week boxes)
def week_box(key):
    for item in layout:
        if item[0] == "intro" and item[1][0] == key: return item[2], item[3]
        if item[0] == "piece":
            for _, _, _, wks in item[4]:
                for wk, wy, wh in wks:
                    if wk[0] == key: return wy, wh
ARROWS = [("w03", "w04", "the empty middle still costs memory"),
          ("w04", "w05", "the table is too big; memory is too small"),
          ("w02", "w06", "which process runs next?"),
          ("w06", "w07", "fairness; more than one CPU"),
          ("w08", "w09", "waiting without spinning"), ("w09", "w10", "what goes wrong")]
for a, b, label in ARROWS:
    ay, ah = week_box(a); by, bh = week_box(b)
    ym = (ay + ah + by) / 2
    out.append(f'<text x="{X_WEEK+W_WEEK/2}" y="{ym+3.5:.0f}" text-anchor="middle" font-family="{FONT}" font-size="9.5" font-style="italic" fill="#6b7482">\u2193 {esc(label)}</text>')
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W_TOTAL} {H_TOTAL:.0f}" class="cmap" role="img" aria-label="Course map: the three pieces of operating systems and the weeks under each, each node a link to its page">\n'
       f'<style>.cmap .cmap-link rect{{transition:filter .15s}} .cmap .cmap-link:hover rect{{stroke-width:2.4;filter:drop-shadow(0 2px 4px rgba(0,0,0,.18))}} .cmap .cmap-link:hover text{{text-decoration:underline}}</style>\n'
       + f'<rect x="0" y="0" width="{W_TOTAL}" height="{H_TOTAL:.0f}" fill="#ffffff"/>\n' + "\n".join(out) + "\n</svg>")
print(svg)
