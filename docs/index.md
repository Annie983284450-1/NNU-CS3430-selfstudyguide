---
hide:
  - navigation
  - toc
---

# COMP3430 self-study guides

Self-study guides for an undergraduate operating-systems course, one guide per week, following *Operating Systems: Three Easy Pieces* (OSTEP) and the xv6 teaching kernel. Each guide covers the two classes of its week and is written to be read on its own: every idea arrives with the problem it solves, every number is worked out on the page, and every program and capture is the real file. Anyone is welcome to use them.

## The course on one map

Click any box to open that page. Grey boxes are weeks that are not written yet. The small italic lines between weeks are the question that leads from one week to the next.

<div class="cmap-wrap" markdown="0">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1144 1366" class="cmap" role="img" aria-label="Course map: the three pieces of operating systems and the weeks under each, each node a link to its page">
<style>.cmap .cmap-link rect{transition:filter .15s} .cmap .cmap-link:hover rect{stroke-width:2.4;filter:drop-shadow(0 2px 4px rgba(0,0,0,.18))} .cmap .cmap-link:hover text{text-decoration:underline}</style>
<rect x="0" y="0" width="1144" height="1366" fill="#ffffff"/>
<path d="M162,683 C301,683 301,88 440,88" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<a href="w01/" class="cmap-link"><title>Week 1 · Introduction</title><rect x="440" y="56" width="226" height="65" rx="7" fill="#ffffff" stroke="#555e6b" stroke-width="1.4"/>
<text x="451" y="71" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="12.5" font-weight="600" fill="#1b2430">Week 1 · Introduction</text>
<text x="451" y="85" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10.5" fill="#5b6675">the three easy pieces</text></a>
<a href="w01/class-1/" class="cmap-link"><title>What an OS is; a private CPU and a private memory</title><rect x="680" y="56" width="448" height="30" rx="7" fill="#fbfcfe" stroke="#555e6b" stroke-width="1.4"/>
<text x="691" y="75.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#1b2430">What an OS is; a private CPU and a private memory</text></a>
<text x="1120" y="75.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#7a8291">OSTEP 1, 2</text>
<path d="M666,88 C673,88 673,71 680,71" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<a href="w01/class-2/" class="cmap-link"><title>Concurrency and persistence: a lost update, a lost write</title><rect x="680" y="91" width="448" height="30" rx="7" fill="#fbfcfe" stroke="#555e6b" stroke-width="1.4"/>
<text x="691" y="110.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#1b2430">Concurrency and persistence: a lost update, a lost write</text></a>
<text x="1120" y="110.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#7a8291">OSTEP 2</text>
<path d="M666,88 C673,88 673,106 680,106" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<path d="M162,683 C171,683 171,409 180,409" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<rect x="180" y="387" width="156" height="44" rx="8" fill="#2f3e9e"/>
<text x="258.0" y="406" text-anchor="middle" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="13" font-weight="700" fill="#fff">VIRTUALIZATION</text>
<text x="258.0" y="421" text-anchor="middle" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="9.5" fill="#e6e9f2">one machine pretends to be many</text>
<path d="M336,409 C344,409 344,272 352,272" fill="none" stroke="#2f3e9e" stroke-width="1.6"/>
<rect x="352" y="258" width="72" height="28" rx="14" fill="#fff" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="388.0" y="276" text-anchor="middle" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11.5" font-weight="600" fill="#2f3e9e">the CPU</text>
<path d="M424,272 C432,272 432,184 440,184" fill="none" stroke="#2f3e9e" stroke-width="1.6"/>
<a href="w02/" class="cmap-link"><title>Week 2 · The process</title><rect x="440" y="151" width="226" height="65" rx="7" fill="#ffffff" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="451" y="166" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="12.5" font-weight="600" fill="#1b2430">Week 2 · The process</text>
<text x="451" y="180" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10.5" fill="#5b6675">fork, exec, wait; staying in control</text></a>
<a href="w02/class-1/" class="cmap-link"><title>What a process is, how it is made, how it runs a program</title><rect x="680" y="151" width="448" height="30" rx="7" fill="#fbfcfe" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="691" y="170.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#1b2430">What a process is, how it is made, how it runs a program</text></a>
<text x="1120" y="170.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#7a8291">OSTEP 4, 5</text>
<path d="M666,184 C673,184 673,166 680,166" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<a href="w02/class-2/" class="cmap-link"><title>Limited direct execution: staying in control</title><rect x="680" y="186" width="448" height="30" rx="7" fill="#fbfcfe" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="691" y="205.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#1b2430">Limited direct execution: staying in control</text></a>
<text x="1120" y="205.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#7a8291">OSTEP 6</text>
<path d="M666,184 C673,184 673,201 680,201" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<path d="M424,272 C432,272 432,272 440,272" fill="none" stroke="#2f3e9e" stroke-width="1.6"/>
<a href="w06/" class="cmap-link"><title>Week 6 · Scheduling</title><rect x="440" y="240" width="226" height="65" rx="7" fill="#ffffff" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="451" y="255" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="12.5" font-weight="600" fill="#1b2430">Week 6 · Scheduling</text>
<text x="451" y="269" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10.5" fill="#5b6675">who runs next, and for how long</text></a>
<a href="w06/class-1/" class="cmap-link"><title>FIFO, SJF, STCF, round robin</title><rect x="680" y="240" width="448" height="30" rx="7" fill="#fbfcfe" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="691" y="259.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#1b2430">FIFO, SJF, STCF, round robin</text></a>
<text x="1120" y="259.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#7a8291">OSTEP 7</text>
<path d="M666,272 C673,272 673,255 680,255" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<a href="w06/class-2/" class="cmap-link"><title>The multi-level feedback queue</title><rect x="680" y="275" width="448" height="30" rx="7" fill="#fbfcfe" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="691" y="294.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#1b2430">The multi-level feedback queue</text></a>
<text x="1120" y="294.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#7a8291">OSTEP 8</text>
<path d="M666,272 C673,272 673,290 680,290" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<path d="M424,272 C432,272 432,362 440,362" fill="none" stroke="#2f3e9e" stroke-width="1.6"/>
<a href="w07/" class="cmap-link"><title>Week 7 · Fair share, many CPUs</title><rect x="440" y="329" width="226" height="65" rx="7" fill="#ffffff" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="451" y="344" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="12.5" font-weight="600" fill="#1b2430">Week 7 · Fair share, many CPUs</text>
<text x="451" y="358" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10.5" fill="#5b6675">proportional share; many CPUs</text></a>
<a href="w07/class-1/#chapter-1" class="cmap-link"><title>Lottery and stride scheduling; Linux CFS</title><rect x="680" y="329" width="448" height="30" rx="7" fill="#fbfcfe" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="691" y="348.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#1b2430">Lottery and stride scheduling; Linux CFS</text></a>
<text x="1120" y="348.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#7a8291">OSTEP 9</text>
<path d="M666,362 C673,362 673,344 680,344" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<a href="w07/class-1/#chapter-3" class="cmap-link"><title>Scheduling on more than one CPU</title><rect x="680" y="364" width="448" height="30" rx="7" fill="#fbfcfe" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="691" y="383.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#1b2430">Scheduling on more than one CPU</text></a>
<text x="1120" y="383.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#7a8291">OSTEP 10</text>
<path d="M666,362 C673,362 673,379 680,379" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<path d="M336,409 C344,409 344,546 352,546" fill="none" stroke="#2f3e9e" stroke-width="1.6"/>
<rect x="352" y="532" width="72" height="28" rx="14" fill="#fff" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="388.0" y="550" text-anchor="middle" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11.5" font-weight="600" fill="#2f3e9e">memory</text>
<path d="M424,546 C432,546 432,456 440,456" fill="none" stroke="#2f3e9e" stroke-width="1.6"/>
<a href="w03/" class="cmap-link"><title>Week 3 · Address spaces</title><rect x="440" y="424" width="226" height="65" rx="7" fill="#ffffff" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="451" y="439" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="12.5" font-weight="600" fill="#1b2430">Week 3 · Address spaces</text>
<text x="451" y="453" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10.5" fill="#5b6675">the address space; malloc and free</text></a>
<a href="w03/class-1/" class="cmap-link"><title>The address space, malloc and free</title><rect x="680" y="424" width="448" height="30" rx="7" fill="#fbfcfe" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="691" y="443.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#1b2430">The address space, malloc and free</text></a>
<text x="1120" y="443.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#7a8291">OSTEP 13, 14</text>
<path d="M666,456 C673,456 673,439 680,439" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<a href="w03/class-2/" class="cmap-link"><title>Address translation: base and bounds</title><rect x="680" y="459" width="448" height="30" rx="7" fill="#fbfcfe" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="691" y="478.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#1b2430">Address translation: base and bounds</text></a>
<text x="1120" y="478.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#7a8291">OSTEP 15</text>
<path d="M666,456 C673,456 673,474 680,474" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<path d="M424,546 C432,546 432,546 440,546" fill="none" stroke="#2f3e9e" stroke-width="1.6"/>
<a href="w04/" class="cmap-link"><title>Week 4 · Paging</title><rect x="440" y="513" width="226" height="65" rx="7" fill="#ffffff" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="451" y="528" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="12.5" font-weight="600" fill="#1b2430">Week 4 · Paging</text>
<text x="451" y="542" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10.5" fill="#5b6675">chopping the address space into pieces</text></a>
<a href="w04/class-1/" class="cmap-link"><title>Segments, and the holes they leave behind</title><rect x="680" y="513" width="448" height="30" rx="7" fill="#fbfcfe" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="691" y="532.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#1b2430">Segments, and the holes they leave behind</text></a>
<text x="1120" y="532.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#7a8291">OSTEP 16, 17</text>
<path d="M666,546 C673,546 673,528 680,528" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<a href="w04/class-2/" class="cmap-link"><title>Pages, and the TLB that makes them affordable</title><rect x="680" y="548" width="448" height="30" rx="7" fill="#fbfcfe" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="691" y="567.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#1b2430">Pages, and the TLB that makes them affordable</text></a>
<text x="1120" y="567.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#7a8291">OSTEP 18, 19</text>
<path d="M666,546 C673,546 673,563 680,563" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<path d="M424,546 C432,546 432,634 440,634" fill="none" stroke="#2f3e9e" stroke-width="1.6"/>
<a href="w05/" class="cmap-link"><title>Week 5 · Tables and swapping</title><rect x="440" y="602" width="226" height="65" rx="7" fill="#ffffff" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="451" y="617" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="12.5" font-weight="600" fill="#1b2430">Week 5 · Tables and swapping</text>
<text x="451" y="631" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10.5" fill="#5b6675">page-table trees; swapping</text></a>
<a href="w05/class-1/" class="cmap-link"><title>Multi-level page tables</title><rect x="680" y="602" width="448" height="30" rx="7" fill="#fbfcfe" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="691" y="621.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#1b2430">Multi-level page tables</text></a>
<text x="1120" y="621.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#7a8291">OSTEP 20</text>
<path d="M666,634 C673,634 673,617 680,617" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<a href="w05/class-2/" class="cmap-link"><title>Swapping and page replacement</title><rect x="680" y="637" width="448" height="30" rx="7" fill="#fbfcfe" stroke="#2f3e9e" stroke-width="1.4"/>
<text x="691" y="656.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#1b2430">Swapping and page replacement</text></a>
<text x="1120" y="656.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#7a8291">OSTEP 21, 22</text>
<path d="M666,634 C673,634 673,652 680,652" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<path d="M162,683 C171,683 171,826 180,826" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<rect x="180" y="804" width="156" height="44" rx="8" fill="#a0632a"/>
<text x="258.0" y="824" text-anchor="middle" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="13" font-weight="700" fill="#fff">CONCURRENCY</text>
<text x="258.0" y="838" text-anchor="middle" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="9.5" fill="#e6e9f2">many things at once, correctly</text>
<path d="M336,826 C388,826 388,738 440,738" fill="none" stroke="#a0632a" stroke-width="1.6"/>
<a href="w08/" class="cmap-link"><title>Week 8 · Threads and locks</title><rect x="440" y="705" width="226" height="65" rx="7" fill="#ffffff" stroke="#a0632a" stroke-width="1.4"/>
<text x="451" y="720" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="12.5" font-weight="600" fill="#1b2430">Week 8 · Threads and locks</text>
<text x="451" y="734" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10.5" fill="#5b6675">one address space, many threads</text></a>
<a href="w08/class-1/" class="cmap-link"><title>Threads and the thread API</title><rect x="680" y="705" width="448" height="30" rx="7" fill="#fbfcfe" stroke="#a0632a" stroke-width="1.4"/>
<text x="691" y="724.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#1b2430">Threads and the thread API</text></a>
<text x="1120" y="724.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#7a8291">OSTEP 26, 27</text>
<path d="M666,738 C673,738 673,720 680,720" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<a href="w08/class-2/" class="cmap-link"><title>Locks: building mutual exclusion</title><rect x="680" y="740" width="448" height="30" rx="7" fill="#fbfcfe" stroke="#a0632a" stroke-width="1.4"/>
<text x="691" y="759.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#1b2430">Locks: building mutual exclusion</text></a>
<text x="1120" y="759.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#7a8291">OSTEP 28</text>
<path d="M666,738 C673,738 673,755 680,755" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<path d="M336,826 C388,826 388,826 440,826" fill="none" stroke="#a0632a" stroke-width="1.6"/>
<g class="cmap-soon"><title>Week 9 · Coordination (coming later in the term)</title><rect x="440" y="794" width="226" height="65" rx="7" fill="#f3f4f6" stroke="#c9ced6" stroke-width="1.4"/>
<text x="451" y="809" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="12.5" font-weight="600" fill="#8a919c">Week 9 · Coordination</text>
<text x="451" y="823" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10.5" fill="#a3a9b3">condition variables; semaphores</text></g>
<g class="cmap-soon"><title>Locked data structures; condition variables (coming later in the term)</title><rect x="680" y="794" width="448" height="30" rx="7" fill="#f3f4f6" stroke="#c9ced6" stroke-width="1.4"/>
<text x="691" y="813.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#8a919c">Locked data structures; condition variables</text></g>
<text x="1120" y="813.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#b0b6bf">OSTEP 29, 30</text>
<path d="M666,826 C673,826 673,809 680,809" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<g class="cmap-soon"><title>Semaphores (coming later in the term)</title><rect x="680" y="829" width="448" height="30" rx="7" fill="#f3f4f6" stroke="#c9ced6" stroke-width="1.4"/>
<text x="691" y="848.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#8a919c">Semaphores</text></g>
<text x="1120" y="848.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#b0b6bf">OSTEP 31</text>
<path d="M666,826 C673,826 673,844 680,844" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<path d="M336,826 C388,826 388,916 440,916" fill="none" stroke="#a0632a" stroke-width="1.6"/>
<g class="cmap-soon"><title>Week 10 · Concurrency bugs (coming later in the term)</title><rect x="440" y="883" width="226" height="65" rx="7" fill="#f3f4f6" stroke="#c9ced6" stroke-width="1.4"/>
<text x="451" y="898" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="12.5" font-weight="600" fill="#8a919c">Week 10 · Concurrency bugs</text>
<text x="451" y="912" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10.5" fill="#a3a9b3">deadlock and how to avoid it</text></g>
<g class="cmap-soon"><title>Non-deadlock bugs; deadlock (coming later in the term)</title><rect x="680" y="883" width="448" height="30" rx="7" fill="#f3f4f6" stroke="#c9ced6" stroke-width="1.4"/>
<text x="691" y="902.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#8a919c">Non-deadlock bugs; deadlock</text></g>
<text x="1120" y="902.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#b0b6bf">OSTEP 32</text>
<path d="M666,916 C673,916 673,898 680,898" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<g class="cmap-soon"><title>Event-based concurrency (coming later in the term)</title><rect x="680" y="918" width="448" height="30" rx="7" fill="#f3f4f6" stroke="#c9ced6" stroke-width="1.4"/>
<text x="691" y="937.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#8a919c">Event-based concurrency</text></g>
<text x="1120" y="937.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#b0b6bf">OSTEP 33</text>
<path d="M666,916 C673,916 673,933 680,933" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<path d="M162,683 C171,683 171,1152 180,1152" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<rect x="180" y="1130" width="156" height="44" rx="8" fill="#2a7a6b"/>
<text x="258.0" y="1149" text-anchor="middle" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="13" font-weight="700" fill="#fff">PERSISTENCE</text>
<text x="258.0" y="1164" text-anchor="middle" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="9.5" fill="#e6e9f2">data that survives power loss</text>
<path d="M336,1152 C388,1152 388,1018 440,1018" fill="none" stroke="#2a7a6b" stroke-width="1.6"/>
<g class="cmap-soon"><title>Week 11 · Devices and disks (coming later in the term)</title><rect x="440" y="986" width="226" height="65" rx="7" fill="#f3f4f6" stroke="#c9ced6" stroke-width="1.4"/>
<text x="451" y="1001" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="12.5" font-weight="600" fill="#8a919c">Week 11 · Devices and disks</text>
<text x="451" y="1015" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10.5" fill="#a3a9b3">I/O devices; hard disk drives</text></g>
<g class="cmap-soon"><title>I/O devices and drivers (coming later in the term)</title><rect x="680" y="986" width="448" height="30" rx="7" fill="#f3f4f6" stroke="#c9ced6" stroke-width="1.4"/>
<text x="691" y="1005.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#8a919c">I/O devices and drivers</text></g>
<text x="1120" y="1005.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#b0b6bf">OSTEP 36</text>
<path d="M666,1018 C673,1018 673,1001 680,1001" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<g class="cmap-soon"><title>Hard disk drives (coming later in the term)</title><rect x="680" y="1021" width="448" height="30" rx="7" fill="#f3f4f6" stroke="#c9ced6" stroke-width="1.4"/>
<text x="691" y="1040.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#8a919c">Hard disk drives</text></g>
<text x="1120" y="1040.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#b0b6bf">OSTEP 37</text>
<path d="M666,1018 C673,1018 673,1036 680,1036" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<path d="M336,1152 C388,1152 388,1108 440,1108" fill="none" stroke="#2a7a6b" stroke-width="1.6"/>
<g class="cmap-soon"><title>Week 12 · Files (coming later in the term)</title><rect x="440" y="1075" width="226" height="65" rx="7" fill="#f3f4f6" stroke="#c9ced6" stroke-width="1.4"/>
<text x="451" y="1090" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="12.5" font-weight="600" fill="#8a919c">Week 12 · Files</text>
<text x="451" y="1104" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10.5" fill="#a3a9b3">files, directories, inodes</text></g>
<g class="cmap-soon"><title>Files and directories (coming later in the term)</title><rect x="680" y="1075" width="448" height="30" rx="7" fill="#f3f4f6" stroke="#c9ced6" stroke-width="1.4"/>
<text x="691" y="1094.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#8a919c">Files and directories</text></g>
<text x="1120" y="1094.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#b0b6bf">OSTEP 39</text>
<path d="M666,1108 C673,1108 673,1090 680,1090" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<g class="cmap-soon"><title>File-system implementation: inodes (coming later in the term)</title><rect x="680" y="1110" width="448" height="30" rx="7" fill="#f3f4f6" stroke="#c9ced6" stroke-width="1.4"/>
<text x="691" y="1129.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#8a919c">File-system implementation: inodes</text></g>
<text x="1120" y="1129.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#b0b6bf">OSTEP 40</text>
<path d="M666,1108 C673,1108 673,1125 680,1125" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<path d="M336,1152 C388,1152 388,1196 440,1196" fill="none" stroke="#2a7a6b" stroke-width="1.6"/>
<g class="cmap-soon"><title>Week 13 · Fast and safe (coming later in the term)</title><rect x="440" y="1164" width="226" height="65" rx="7" fill="#f3f4f6" stroke="#c9ced6" stroke-width="1.4"/>
<text x="451" y="1179" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="12.5" font-weight="600" fill="#8a919c">Week 13 · Fast and safe</text>
<text x="451" y="1193" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10.5" fill="#a3a9b3">locality; crash consistency</text></g>
<g class="cmap-soon"><title>The Fast File System (coming later in the term)</title><rect x="680" y="1164" width="448" height="30" rx="7" fill="#f3f4f6" stroke="#c9ced6" stroke-width="1.4"/>
<text x="691" y="1183.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#8a919c">The Fast File System</text></g>
<text x="1120" y="1183.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#b0b6bf">OSTEP 41</text>
<path d="M666,1196 C673,1196 673,1179 680,1179" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<g class="cmap-soon"><title>Crash consistency: fsck and journaling (coming later in the term)</title><rect x="680" y="1199" width="448" height="30" rx="7" fill="#f3f4f6" stroke="#c9ced6" stroke-width="1.4"/>
<text x="691" y="1218.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#8a919c">Crash consistency: fsck and journaling</text></g>
<text x="1120" y="1218.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#b0b6bf">OSTEP 42</text>
<path d="M666,1196 C673,1196 673,1214 680,1214" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<path d="M336,1152 C388,1152 388,1286 440,1286" fill="none" stroke="#2a7a6b" stroke-width="1.6"/>
<g class="cmap-soon"><title>Week 14 · Logs and flash (coming later in the term)</title><rect x="440" y="1253" width="226" height="65" rx="7" fill="#f3f4f6" stroke="#c9ced6" stroke-width="1.4"/>
<text x="451" y="1268" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="12.5" font-weight="600" fill="#8a919c">Week 14 · Logs and flash</text>
<text x="451" y="1282" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10.5" fill="#a3a9b3">LFS; SSDs; data integrity</text></g>
<g class="cmap-soon"><title>Log-structured file systems; flash SSDs (coming later in the term)</title><rect x="680" y="1253" width="448" height="30" rx="7" fill="#f3f4f6" stroke="#c9ced6" stroke-width="1.4"/>
<text x="691" y="1272.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#8a919c">Log-structured file systems; flash SSDs</text></g>
<text x="1120" y="1272.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#b0b6bf">OSTEP 43, 44</text>
<path d="M666,1286 C673,1286 673,1268 680,1268" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<g class="cmap-soon"><title>Data integrity and protection (coming later in the term)</title><rect x="680" y="1288" width="448" height="30" rx="7" fill="#f3f4f6" stroke="#c9ced6" stroke-width="1.4"/>
<text x="691" y="1307.5" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="11" font-weight="500" fill="#8a919c">Data integrity and protection</text></g>
<text x="1120" y="1307.0" text-anchor="end" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#b0b6bf">OSTEP 45</text>
<path d="M666,1286 C673,1286 673,1303 680,1303" fill="none" stroke="#9aa3b2" stroke-width="1.6"/>
<rect x="12" y="653" width="150" height="60" rx="10" fill="#1b2430"/>
<text x="87.0" y="679" text-anchor="middle" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="14" font-weight="700" fill="#fff">Operating Systems</text>
<text x="87.0" y="697" text-anchor="middle" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="10" fill="#c5ccd8">three easy pieces</text>
<text x="553.0" y="504" text-anchor="middle" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="9.5" font-style="italic" fill="#6b7482">↓ the empty middle still costs memory</text>
<text x="553.0" y="594" text-anchor="middle" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="9.5" font-style="italic" fill="#6b7482">↓ the table is too big; memory is too small</text>
<text x="553.0" y="232" text-anchor="middle" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="9.5" font-style="italic" fill="#6b7482">↓ which process runs next?</text>
<text x="553.0" y="320" text-anchor="middle" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="9.5" font-style="italic" fill="#6b7482">↓ fairness; more than one CPU</text>
<text x="553.0" y="786" text-anchor="middle" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="9.5" font-style="italic" fill="#6b7482">↓ waiting without spinning</text>
<text x="553.0" y="874" text-anchor="middle" font-family="Source Sans 3, Helvetica Neue, Arial, sans-serif" font-size="9.5" font-style="italic" fill="#6b7482">↓ what goes wrong</text>
</svg>

</div>

<a href="assets/coursemap.svg" target="_blank" rel="noopener">Open the map full size</a>

## Weeks

- [Week 1 · Introduction: three easy pieces](w01/index.md) (OSTEP 1, 2)
- [Week 2 · The process: fork, exec, wait, and how the OS stays in control](w02/index.md) (OSTEP 4, 5, 6)
- [Week 3 · Memory: the address space and the memory API](w03/index.md) (OSTEP 13, 14, 15)
- [Week 4 · Memory: chopping the address space into pieces](w04/index.md) (OSTEP 16 to 19)
- [Week 5 · Memory: smaller tables, and more memory than you have](w05/index.md) (OSTEP 20, 21, 22)
- [Week 6 · Scheduling: which process runs next, and for how long](w06/index.md) (OSTEP 7, 8)
- [Week 7 · Sharing the CPU: by share, and across many CPUs](w07/index.md) (OSTEP 9, 10)
- [Week 8 · Threads and locks: when one program has two points of execution](w08/index.md) (OSTEP 26, 27, 28)

## Labs

Follow-along steps on xv6 that run the ideas of the weeks above on a real kernel. Each step links back to the section of the weekly guide it proves.

- [Lab 1 · util: programs, processes and bytes](labs/lab1/index.md) (goes with Week 2)
- [Lab 2 · syscall: two new system calls, and a sandbox](labs/lab2/index.md) (goes with Weeks 2 to 4)

## How a week is laid out

Each week has the same five pages. **Start here** places the week in the course and re-defines the words from the previous weeks that the new material uses. **Class 1** and **Class 2** are the two classes of the week, each cut into chapters, and each chapter into labeled sections. **Exercises and answers** is the week's review. **Appendix A** holds the small arithmetic the week needs.

The label on a section says what kind of section it is:

- <span class="lbl lbl-problem">Problem</span> states what we have, where it breaks and what we need, before any fix.
- <span class="lbl lbl-concept">Concept</span> explains the idea that answers it.
- <span class="lbl lbl-example">Worked example</span> runs the idea on small numbers.
- <span class="lbl lbl-kernel">Real kernel</span> reads the xv6 code.
- <span class="lbl lbl-machine">Real machine</span> reads an output captured on a real computer.
- <span class="lbl lbl-check">Check yourself</span> and <span class="lbl lbl-check">Your turn</span> are for you to do before reading on.
- <span class="lbl lbl-deeper">Deeper</span> sections are optional and go deeper on a question already answered.

## Reading tips

The tabs at the top switch between weeks. The left sidebar lists the pages of the week you are in; the right-hand column lists the sections of the page you are on and follows you as you scroll. The search box at the top searches every week at once. Every "Section 3.5" or "Extra 4" in the text is a link. Each heading has a ¶ link you can copy to point someone at one section.

## Sources

The guides follow [*Operating Systems: Three Easy Pieces*](https://pages.cs.wisc.edu/~remzi/OSTEP/) by Remzi H. Arpaci-Dusseau and Andrea C. Arpaci-Dusseau, which the authors publish free; each week's "Where this guide comes from" links the chapters it uses. The code the guides read is [xv6](https://github.com/mit-pdos/xv6-riscv), the teaching operating system from MIT.
