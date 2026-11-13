# DESIGN.md · COMP3430 self-study site

Direction: **ink on paper**. The site reads like a printed textbook that happens to have a sidebar. The page is white, the text is dark ink, and the only strong colors are the seven section-kind labels. Navigation and controls stay quiet so the labels and the figures carry the color.

Status: applied 2026-11-13 to `docs/assets/extra.css`, `docs/assets/anim/stepper.css` and `mkdocs.yml`. Still open: the font sizes inside the stepper, and the two map generators (see the last section).

## Why this direction

1. The site already has its own identity, and it lives in the figures: 456 SVGs and 1,141 PNGs drawn in navy ink on white with the seven label colors. Those cannot change cheaply, so the design is built around them.
2. The one part that still looks like every other MkDocs Material site is the chrome: the saturated indigo header band and the default palette. It is also the largest block of color on the page, so it competes with the labels.
3. The labels are the teaching device (Problem, Concept, Worked example and so on). A color should mean "this kind of section" and nothing else.

This direction comes from the project itself. It was not compared against other real sites (the UXKIN library is not connected).

## Color

Every value below is already in use somewhere in the figures or maps. Nothing new is introduced except the dark-mode tints.

### Neutrals (ink and paper)

| token | light | dark | role |
|---|---|---|---|
| `--ink-1` | `#1b2430` | `#e6e9ef` | body text, headings (15.7:1 on paper) |
| `--ink-2` | `#5b6675` | `#a9b1bd` | captions, secondary nav, hints (5.8:1) |
| `--ink-3` | `#7a8291` | `#7f8896` | large or non-essential text only (3.9:1) |
| `--line-strong` | `#9aa3b2` | `#4a5361` | control borders, connector lines |
| `--line` | `#d9dde4` | `#2e3541` | hairlines, box borders, header rule |
| `--surface` | `#f3f4f6` | `#1f242d` | code blocks, search field, quiet boxes |
| `--paper` | `#ffffff` | `#171b22` | page and header background |

### Primary (one color for actions)

| token | light | dark | role |
|---|---|---|---|
| `--primary` | `#2f3e9e` | `#3d4fc4` | fills and rules: chapter rule on `h2`, active tab underline, selected animation tab and step dot |
| `--primary-text` | `#2f3e9e` | `#9aa8f0` | links, active nav item, step number (9.1:1 light, 7.6:1 dark) |
| `--primary-hover` | `#1f3864` | `#c3ccf7` | link hover |

`#2f3e9e` is the indigo the course map and class maps already use, so they match without being regenerated. It replaces Material's `#4051b5`.

### Accent (one)

| token | value | role |
|---|---|---|
| `--mark` | `#e8b23a` | "look here, this just changed": highlighted code line, changed field in an animation. Used as a tint behind text (18 to 25% opacity), never as text. |

### Section kinds (fixed, semantic)

White text on each fill. These seven mean a kind of section everywhere: heading badges, table of contents, maps, animation chips.

| token | value | kind | contrast with white |
|---|---|---|---|
| `--k-problem` | `#b23a48` | Problem | 5.9 |
| `--k-concept` | `#1f6f8b` | Concept | 5.7 |
| `--k-example` | `#5b7a2a` | Worked example | 4.9 |
| `--k-kernel` | `#6b4fa0` | Real kernel | 6.5 |
| `--k-machine` | `#a0632a` | Real machine | 4.9 |
| `--k-check` | `#2a7a6b` | Check yourself, Your turn | 5.1 |
| `--k-meta` | `#555555` | Roadmap, Summary | 7.5 |
| `--k-deeper` | `#6b6b6b` | Deeper (was `#7a7a7a`, 4.3, below the 4.5 minimum) | 5.3 |

Rule: do not use a kind color for decoration. If something is red, it is a Problem or an error.

### Status (reuses three kind colors)

| token | light (text) | dark (text) | role |
|---|---|---|---|
| `--good` | `#2a7a6b` | `#6fcab8` | correct, safe, answer boxes |
| `--bad` | `#b23a48` | `#ee8f9a` | bug, race, lost update |
| `--warn` | `#a0632a` | `#e0a66f` | caution, gap, interrupt |

The "Connect to theory" box moves from `#00838f` to `--k-concept`. That removes a third teal that is close to two existing ones.

## Typography

| family | where | weights |
|---|---|---|
| Source Serif 4 | reading prose only | 400, 400 italic, 700 |
| Source Sans 3 | everything that is structure: headings, header, tabs, both sidebars, badges, captions, box titles, buttons, table heads, animations | 400, 600, 700 |
| JetBrains Mono | code, terminal captures, values in animations | 400, 700 |

Serif means "read this". Sans means "this is where you are". Today the sidebars and the table of contents are set in the serif, which makes them compete with the prose.

**Keep the `@import` on line 1 of `extra.css`.** Browsers ignore an `@import` that comes after other rules. Before 11-13 it sat in the middle of the file, so Source Sans 3 never loaded and headings fell back to Helvetica or Arial.

Scale (Material's root is 20px, and grows to 22px and 24px on wide screens):

| step | size | line height | use |
|---|---|---|---|
| h1 | 1.9em | 1.25 | page title, 700 |
| h2 | 1.45em | 1.3 | chapter, 600, with the primary rule above |
| h3 | 1.12em | 1.35 | numbered section, 600 |
| h4 | 0.95em | 1.4 | sub-step, 600 |
| body | 0.82rem (16.4px) | 1.65 | prose |
| ui | 0.72rem | 1.4 | nav, tabs, chapter entries in the contents, code |
| small | 0.68rem | 1.4 | section entries in the contents, captions, hints |
| badge | 0.6em | 1.4 | section-kind labels, uppercase, 600, tracking 0.04em |

Not done yet: the stepper CSS uses eleven sizes between 0.55 and 0.8rem. Collapse them onto `ui`, `small` and one micro size (0.62rem), and check each animation still fits.

Measure: prose (`p`, `ul`, `ol`, `blockquote`) is capped at **36em**, about 78 characters. Figures, maps, code, tables and animations keep the full column, aligned to the same left edge as the text. Today a line of prose runs past 100 characters, and more on a wide monitor.

## Spacing

One scale, base 4px (0.2rem): **4, 8, 12, 16, 24, 32, 48**.

- Between paragraphs: 16. Around figures and boxes: 24.
- Above an `h3`: 2em. Above an `h2` (a new chapter): 2.6em plus 12 of padding under the rule.
- Page grid: 72rem. Prose measure: 36em.

## Shape and depth

- Radius: **4px** for small things (badges, inline code, images), **6px** for boxes (code blocks, admonitions, animation frame, buttons, map nodes), **pill** for toggles and tabs inside animations. Nothing else. Today the CSS uses 3, 4, 5, 6, 8px and 1rem.
- Borders, not shadows. Boxes are a 1px `--line` border with a 3px colored left edge. The header drops its shadow for a 1px `--line` rule.
- One shadow in the whole site: the hover lift on a clickable map node (`0 2px 4px rgba(0,0,0,.18)`).

## Components

- **Header and tabs.** Paper background, `--ink-1` text, hairline below. Tabs are `--ink-2`, 600. The active tab is `--ink-1` with a 2px `--primary` underline. Search field is `--surface` with a 6px radius.
- **Left sidebar.** Sans, `ui` size. Open week 600. Current page `--primary-text`, 600.
- **Contents (right).** Chapters 700 in `--ink-1`. Sections 400 in `--ink-2` with their kind badge. Active entry `--primary-text`.
- **Links.** `--primary-text`, hover `--primary-hover` with underline. Focus: 2px `--primary` outline, 2px offset.
- **Section-kind badge.** Fill is the kind color, white text, 4px radius, uppercase sans 600.
- **Chapter heading (`h2`).** 3px `--primary` rule above. No other heading gets a rule.
- **Boxes.** Each admonition type has one job:
  - `abstract`: the map of the class. Border `--primary`.
  - `theory`: lab to theory link. Border `--k-concept`.
  - `question`: your turn. Border `--k-check`.
  - `success` / `answer`: folded answer. Border `--k-check`.
  - `note`: folded listing you can skip. Border `--line-strong`.
- **Buttons.** Quiet is the default: 1px `--line-strong` border, paper fill, `--ink-1` text, 6px radius. Hover: border and text `--primary-text`. Selected: `--primary` fill, white text. Disabled: 40% opacity. There is no large filled call-to-action button on this site.
- **Code.** `--surface` background, 6px radius, line numbers in `--line-strong`, highlighted line in `--mark` at 25%.
- **Animations (stepper).** Same tokens as the page. Thread colors stay `--k-concept` and `#b5651d`. The caption bar keeps its 4px `--primary` left edge.
- **Footer.** Material's previous/next footer on paper with a hairline above, sans.

## Imagery and icons

- Figures are always ink on white paper, in dark mode too (white background, 8px padding). They are never inverted.
- SVG figures have no border. PNG screenshots and captures get a 1px `--line` border and a 4px radius.
- Captions: sans, `small`, `--ink-2`, left-aligned under the figure, starting with the figure number.
- New figures use `#1f3864` (figure navy) for main shapes, `--ink-1` for text, and the kind colors only for their meaning.
- Icons: Material's built-in set only. No emoji.

## Where the values go

1. `mkdocs.yml`: `palette: primary: custom, accent: custom` for both schemes.
2. `docs/assets/extra.css`: one `:root` block with the tokens above, one `[data-md-color-scheme="slate"]` block with the dark values, and the Material variables (`--md-primary-fg-color`, `--md-typeset-a-color`, `--md-default-fg-color`, `--md-code-bg-color` and so on) set from them. Then replace each raw hex in the rules with its token.
3. `docs/assets/anim/stepper.css`: replace `--t1`, `--bad`, `--good`, `--warn` and the raw ambers with the tokens.
4. `tools/make_classmaps.py`, `tools/make_coursemap.py` (not done yet): change the Deeper grey to `#6b6b6b`, and quote the font name in the SVG (`font-family="'Source Sans 3', ..."`). Unquoted, browsers reject the name because of the bare `3`, and the map text falls back to another face. On the site a CSS rule (`.cmap text`) covers this, but a map opened in its own tab still needs the fix.
