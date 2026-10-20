#!/usr/bin/env bash
# Rebuild the site from the guide .md files. Run from this folder.
#   ./build.sh            -> regenerate docs/ and build site/
#   ./build.sh serve      -> same, then preview at http://127.0.0.1:8000
set -euo pipefail
cd "$(dirname "$0")"
SLIDES="../Slides"          # Theory/Slides, where W0N/W0N_*_SelfStudy.md live

# One line per week: week  guide.md  figures folder. Add a line for each new week.
python3 tools/guide2site.py W01 "$SLIDES/W01/W01_Intro_SelfStudy.md"          "$SLIDES/W01/W01_SelfStudy_figs"
python3 tools/guide2site.py W02 "$SLIDES/W02/W02_Processes_SelfStudy.md"      "$SLIDES/W02/W02_SelfStudy_figs"
python3 tools/guide2site.py W03 "$SLIDES/W03/W03_AddressSpaces_SelfStudy.md"  "$SLIDES/W03/W03_SelfStudy_figs"
python3 tools/guide2site.py W04 "$SLIDES/W04/W04_Paging_SelfStudy.md"         "$SLIDES/W04/W04_SelfStudy_figs" \
        --qa "$SLIDES/W04/W04_Paging_QA.md" "$SLIDES/W04/W04_Paging_QA_figs"
python3 tools/guide2site.py W05 "$SLIDES/W05/W05_MultiLevelSwapping_SelfStudy.md" "$SLIDES/W05/W05_SelfStudy_figs"
python3 tools/guide2site.py W06 "$SLIDES/W06/W06_Scheduling_SelfStudy.md"         "$SLIDES/W06/W06_SelfStudy_figs"

if [ "${1:-}" = "serve" ]; then
  mkdocs serve
else
  mkdocs build --strict
fi
