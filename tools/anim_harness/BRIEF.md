# Brief for writing a step-through animation (read all of it)

Give this file to each subagent that writes an animation; all paths are relative to the website folder (Theory/SelfStudyWebsite).

You are writing step-through web animations for an operating-systems course website (OSTEP and xv6 based). The engine exists; you write scenario files only, in docs/assets/anim/.

Read first, in this order:
1. docs/assets/anim/README.md: the format and the instructor's rules. Follow them strictly.
2. docs/assets/anim/setpark.js and docs/assets/anim/race.js: reference examples. Copy their style of scene: ONE connected picture. The shared structure (registers, a page table, a queue...) is drawn as one structure with its fields inside; the actors are around it; each step's action is an arrow from the actor to the field it touches, labeled with the code line or the step name of the page. A changed value turns yellow on its field.
3. docs/assets/anim/stepper.js: the engine and the H helpers. Do NOT edit stepper.js, stepper.css, README.md or any existing scenario file. If you need a helper, define it inside your own file.

Rules learned on the first eleven animations:
- Everything (code text, line numbers, values, addresses, register names, the order of the steps, every fact in a caption) must come from the section(s) named, or their figures (figures are in the week's figs/ folder next to the page; view them with the Read tool). Copy code lines exactly as the page prints them (same text, same line numbers), because a checker compares every code line with the page. You may split a too-long line's comment onto an unnumbered line (n: null).
- If the page gives no step-by-step trace for something, do NOT invent one. Either leave it out, or build the steps only from sentences the page does state, and say so in your report.
- Do not claim "OSTEP shows" or "the book traces" unless the page says so.
- Captions: one or two short plain English sentences. No em dashes. No rhetorical questions. American spelling. Say what happens, not "we see".
- Code-marker names (the chips on code lines) must be short (up to about 5 characters) or they overflow the marker column.
- Text in the scene at 10 or more in a 360-wide viewBox; nothing overlapping; labels at fixed spots near their field; one main arrow per step.
- Two or more tabs only when the page compares runs or cases.
- If the process is a "Your turn" exercise, its answer is not animated in that section; say so in the report (the caller puts it on the review page).
- When the page shows code only as a figure image, transcribe it from the image exactly and say so; the caller checks it against the image or the xv6 source.

Check your work by rendering every step: `node tools/anim_harness/shoot.js NAME` writes tools/anim_harness/out/NAME/v<variant>_s<step>.png and reports JS errors. Open every PNG with the Read tool and fix overlaps, clipped text, labels covering other labels, and anything unreadable. Iterate until every step is clean.

Final report (short): the section(s) used; each step's label with the sentence, table row or figure detail of the page it comes from; anything on the page you could not represent; any step built from your own reading rather than a stated sentence; confirmation that every step renders with no JS errors.
