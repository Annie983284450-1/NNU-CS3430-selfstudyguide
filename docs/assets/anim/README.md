# Step-through animations: how a scenario file is written

`stepper.js` draws every animation. Each animation is one file here, `NAME.js`, that registers
`window.OS_ANIMS.NAME = {...}` and ends with `if (window.OS_ANIM_INIT) window.OS_ANIM_INIT();`.
`tools/make_anims.py` puts `<div class="anim" data-anim="NAME">` on the page, right after the figure of the section it
animates; `mkdocs.yml` loads the file. `setpark.js` is the reference example: read it first.

## The object

```js
window.OS_ANIMS.NAME = {
  title: "short title of the animation",
  interval: 4200,                       // ms per step at speed 1x; the reader's Speed control (1x, 1.5x, 2x, 3x,
                                        // default 2x, shared by the page and remembered) divides it
  threads: ["T1", "T2"],                // names that get a color
  colors: { T1: "#1f6f8b", T2: "#b5651d" },
  code: [ { n: 13, text: "void lock(lock_t *m) {" }, ... ],   // the code beside the picture
  codeTitle: "optional caption above the code",
  sceneBox: "0 0 360 334",              // the SVG viewBox of the picture
  scene: function (s, H, ctx) { return "<svg elements as a string>"; },
  variants: [ { key: "a", label: "Tab label", steps: [ ... ], code: optionalOtherCode } ]
};
```

A step:

```js
{ label: "Step 3",                      // shown in bold before the caption
  text: "One or two plain sentences: what happens at this step.",
  at: [ { who: "T2", line: 21 } ],      // a marker on the code line each thread is at
  cpu: "T2",                            // optional, for the scene to use
  state: { ... },                       // whatever the scene needs: the values after this step
  threads: { T1: { kind: "run|ready|gap|dead", text: "short status" }, ... },
  acts: [ { from: "T2", to: "guard", label: "line 21: guard = 0", kind: "info|ok|bad" } ],
  event: "optional one-line verdict under the picture", eventKind: "info|warn|bad|good" }
```

`n` may be `null` for a line without a number, and `added: true` marks a line that the variant adds (shown as `+`).

## The scene

`scene(s, H, ctx)` returns SVG markup for step `s`. `ctx.prev` is the step before (or null), `ctx.col(name)` the color of
a thread. Helpers in `H`: `box(x, y, w, h, {r, fill, stroke, sw, dash, cls})`, `text(x, y, str, {size, weight, color,
anchor, italic, mono, cls})`, `lines(x, y, [str], {..., lh})`, `chip(cx, cy, name, color, {cls})`,
`arrow(x1, y1, x2, y2, {color, bend: [dx, dy], label, mono, lpos: [x, y], sw, dash})`, `mark(x, y, ok)` (a check or a
cross). Class `anim-pop` pops an element in, `anim-new` fades it in, `anim-pulse` makes it breathe. Use CSS colors
`var(--md-default-fg-color)`, `var(--md-default-fg-color--light)`, `var(--md-code-bg-color)`,
`var(--md-default-bg-color)` for neutral parts, so the picture works in the dark theme too.

## Rules (Annie's)

1. **One connected picture, not separate boxes.** The shared object (the lock, the counter, the buffer) is drawn as one
   structure with its fields inside; the threads are drawn around it; what a thread does at this step is an arrow from
   that thread to the field it touches, labeled with the code line (`line 20: queue_add`). A change of value is shown
   on the field (yellow), a change of owner by the chip moving. The reader should see the workflow, not a table.
2. **Everything comes from the page.** Code, line numbers, values, the order of the steps and the facts in the
   captions are taken from the section the animation sits in (and its figure). Nothing new is claimed. If the page
   numbers lines, use its numbers; if it shows output, use its numbers.
3. **Plain English, short sentences, no em dashes**, American spelling. Captions say what happens, not "we see".
4. **Readable.** The scene is about 330 px wide on the page: keep text at 10 px or more in viewBox units of a 360-wide
   box, avoid overlaps (labels at fixed spots near the field they belong to), and give each step one main arrow.
5. **Two tabs when the page compares two runs** (without/with a fix, order 1/order 2).
6. **No answer before the question.** When a process is a "Your turn" exercise, the animation of its answer goes on the
   review page after that answer (`make_anims.py` mode `after:**Answer N**`), never in the section that asks it.
7. **Where nothing is on the page, nothing is drawn.** If a section gives no step-by-step trace, build steps only from the
   sentences it states, and say in the captions what is a replay of an earlier trace.

## Checks

`python3 tools/make_anims.py` places every animation (and reports what it could not place).
`node tools/codecheck.js` checks that every numbered code line appears on a page where the animation sits.
`node tools/srccheck.js <folder with xv6 kernel files>` checks xv6 listings shown only as figure images against the source.
