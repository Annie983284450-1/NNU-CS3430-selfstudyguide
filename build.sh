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
python3 tools/guide2site.py W07 "$SLIDES/W07/W07_ProportionalShare_MultiCPU_SelfStudy.md" "$SLIDES/W07/W07_SelfStudy_figs"
python3 tools/guide2site.py W08 "$SLIDES/W08/W08_ThreadsAndLocks_SelfStudy.md"     "$SLIDES/W08/W08_SelfStudy_figs"

# Labs: one line per lab: overlay file, then the lab's session-guide MASTER. The lab folder
# COMP3430_labs_v2 sits in a different place on different computers, so look in both.
# If it is not found, the lab pages already in docs/labs/ are kept as they are.
LABS=""
for d in "../../COMP3430_labs_v2" "../../../../COMP3430_labs_v2"; do
  [ -d "$d/labs" ] && LABS="$d/labs" && break
done
if [ -n "$LABS" ]; then
  python3 tools/lab2site.py labs/lab1-util.yml    "$LABS/lab1-util-INSTRUCTOR/instructor-notes/LAB1_SESSION_MASTER_v6.md"
  python3 tools/lab2site.py labs/lab2-syscall.yml "$LABS/lab2-syscall-INSTRUCTOR/instructor-notes/LAB2_SESSION_MASTER_v2.md"
  python3 tools/lab2site.py labs/lab3-pgtbl.yml   "$LABS/lab3-pgtbl-INSTRUCTOR/instructor-notes/LAB3_SESSION_MASTER_v1.md"
else
  echo "COMP3430_labs_v2 not found next to the course folder: lab pages left as they are"
fi

if [ "${1:-}" = "serve" ]; then
  mkdocs serve
else
  mkdocs build --strict
fi
