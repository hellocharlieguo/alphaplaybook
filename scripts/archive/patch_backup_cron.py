#!/usr/bin/env python3
"""
patch_backup_cron.py
===========================================================================
Adds a backup cron schedule and its early-exit guard.

WHY
  GitHub silently drops scheduled workflow runs under load. Two misses in
  three sessions (2026-08-26, 2026-08-28), both caught only by eye. The
  primary schedule itself is sound: 30 sessions of write timestamps show
  25-57 min of queue delay and ZERO date-stamping errors, because TODAY is
  ET-based. The runs that failed were never executed at all.

WHAT
  1. .github/workflows/<daily cron>.yml
     - corrects the stale schedule comment (says 23:00 UTC, expression is
       '17 23' = 23:17 UTC; this mismatch produced commit a3626dc's
       "17:00 UTC" claim)
     - adds  - cron: '47 0 * * 2-6'   (00:47 UTC Tue-Sat = 8:47pm ET Mon-Fri,
       the SAME ET trading day, so the ET weekday guard passes)
     - adds  BACKUP_RUN  env, set only when the backup schedule fired

  2. server/daily-cron.cjs
     - early exit for BACKUP_RUN when TODAY's snapshot already exists

WHY THE EARLY EXIT IS MANDATORY
  runNarrativePipeline and runCrowdPipeline do plain .insert() into `signals`
  (L355, L514) — NOT upserts. A full second run would duplicate every signal
  row on the days the primary succeeded, which is most days. Fixing a
  twice-in-three-months miss by corrupting the signal ledger daily is a bad
  trade. The guard runs before Step 1.

  The P&L path is already idempotent: daily_snapshots takes the update branch
  and portfolio_holdings upserts on (snapshot_date, ticker).

SAFETY
  - dry run by default; --apply to write
  - timestamped .bak.<ts> per file before any edit
  - every anchor asserted count == 1, abort otherwise
  - node --check on the .cjs after patching; auto-restores the .bak on failure

USAGE
  cd ~/Desktop/alphaplaybook
  python3 patch_backup_cron.py
  python3 patch_backup_cron.py --apply
"""

import glob
import os
import re
import shutil
import subprocess
import sys
import time

APPLY = "--apply" in sys.argv
TS = time.strftime("%Y%m%d-%H%M%S")

BACKUP_CRON = "47 0 * * 2-6"


def die(msg):
    print(f"\nABORT: {msg}")
    sys.exit(1)


def anchored(text, old, new, label, path):
    n = text.count(old)
    if n != 1:
        die(f"{path}: anchor '{label}' found {n} times, expected exactly 1.\n"
            f"  The file differs from what this patch was written against.\n"
            f"  Nothing modified. Inspect the file and update the anchor.")
    print(f"  anchor OK (1 match): {label}")
    return text.replace(old, new, 1)


# ---------------------------------------------------------------- locate yml
def find_workflow():
    cands = sorted(glob.glob(".github/workflows/*.yml") + glob.glob(".github/workflows/*.yaml"))
    if not cands:
        die("no .github/workflows/*.yml found. Run from the repo root.")
    hits = [p for p in cands if "daily-cron.cjs" in open(p, encoding="utf-8").read()]
    if len(hits) != 1:
        die(f"expected exactly 1 workflow invoking daily-cron.cjs, found {len(hits)}: {hits or cands}")
    return hits[0]


# ------------------------------------------------------------------- yml edit
YML_SCHED_OLD = """    # 23:00 UTC = 7pm ET (EDT) / 6pm ET (EST). 1-5 = Mon-Fri only, so it never fires
    # on weekends. The code also guards against weekend runs (e.g. manual triggers).
    - cron: '17 23 * * 1-5'
"""

YML_SCHED_NEW = """    # 23:17 UTC = 7:17pm ET (EDT) / 6:17pm ET (EST). 1-5 = Mon-Fri only, so it never
    # fires on weekends. The code also guards against weekend runs (e.g. manual
    # triggers). Observed queue delay is 25-57 min; harmless, since TODAY is ET-based.
    - cron: '17 23 * * 1-5'
    # Backup. GitHub silently DROPS scheduled runs under load — two misses in three
    # sessions (2026-08-26, 2026-08-28). 00:47 UTC Tue-Sat is 8:47pm ET Mon-Fri, the
    # SAME ET trading day as the primary, so the ET weekday guard passes. The run
    # exits before Step 1 unless TODAY's snapshot is genuinely missing (BACKUP_RUN).
    - cron: '47 0 * * 2-6'
"""

YML_ENV_OLD = """        env:
"""

YML_ENV_NEW = """        env:
          # Set only when the backup schedule fired, so daily-cron.cjs can exit
          # before Step 1 if the primary already wrote today's snapshot. Empty on
          # the primary schedule and on workflow_dispatch (full run).
          BACKUP_RUN: ${{ github.event.schedule == '47 0 * * 2-6' && '1' || '' }}
"""

# ------------------------------------------------------------------- cjs edit
CJS_ANCHOR = "  const startTime = Date.now()"

CJS_NEW = """  // Backup-run early exit. The 00:47 UTC schedule is a safety net for GitHub
  // dropping the primary 23:17 UTC run (misses: 2026-08-26, 2026-08-28).
  // runNarrativePipeline / runCrowdPipeline do plain .insert() into `signals`
  // (see ~L355, ~L514), NOT upserts — so a full second run would duplicate every
  // signal row on the days the primary succeeded. Exit before Step 1 unless
  // TODAY is genuinely missing. .limit(1) not .single(): single() throws on zero
  // rows, which is exactly the case being tested for.
  if (process.env.BACKUP_RUN) {
    const { data: already } = await supabase
      .from('daily_snapshots')
      .select('snapshot_date')
      .eq('snapshot_date', TODAY)
      .limit(1)
    if (already && already.length) {
      console.log(`\\nBackup run: ${TODAY} snapshot already present — exiting before Step 1. Nothing written.`)
      return
    }
    console.log(`\\nBackup run: no ${TODAY} snapshot — primary appears dropped. Proceeding with full run.`)
  }

  const startTime = Date.now()"""


def main():
    if not os.path.isdir(".git"):
        die("no .git here. cd ~/Desktop/alphaplaybook first.")

    print("=" * 74)
    print(f"PATCH backup cron schedule   {'APPLY' if APPLY else 'DRY RUN (no writes)'}")
    print("=" * 74)

    yml_path = find_workflow()
    cjs_path = "server/daily-cron.cjs"
    if not os.path.exists(cjs_path):
        die(f"{cjs_path} not found")

    yml = open(yml_path, encoding="utf-8").read()
    cjs = open(cjs_path, encoding="utf-8").read()

    # idempotence
    if BACKUP_CRON in yml:
        die(f"{yml_path} already contains the backup cron '{BACKUP_CRON}'. Already patched — nothing to do.")
    if "BACKUP_RUN" in cjs:
        die(f"{cjs_path} already references BACKUP_RUN. Already patched — nothing to do.")

    print(f"\nTargets:\n  {yml_path}\n  {cjs_path}")

    print(f"\nChecking anchors in {yml_path}:")
    yml_new = anchored(yml, YML_SCHED_OLD, YML_SCHED_NEW, "schedule block", yml_path)
    yml_new = anchored(yml_new, YML_ENV_OLD, YML_ENV_NEW, "env block", yml_path)

    print(f"\nChecking anchors in {cjs_path}:")
    cjs_new = anchored(cjs, CJS_ANCHOR, CJS_NEW, "const startTime = Date.now()", cjs_path)

    added_yml = len(yml_new.splitlines()) - len(yml.splitlines())
    added_cjs = len(cjs_new.splitlines()) - len(cjs.splitlines())
    print(f"\nLine delta:  {yml_path} +{added_yml}   {cjs_path} +{added_cjs}")
    if added_cjs < 0 or added_yml < 0:
        die("a patch REMOVED lines. Refusing to write. (cf. the patch_kxfear_selection.py incident.)")

    if not APPLY:
        print("\n--- preview: yml schedule block ---")
        print(YML_SCHED_NEW.rstrip())
        print("\n--- preview: yml env addition ---")
        print(YML_ENV_NEW.rstrip())
        print("\n--- preview: cjs insertion ---")
        print(CJS_NEW.rstrip())
        print("\nDRY RUN — nothing written. Re-run with --apply.")
        return

    for path, content in ((yml_path, yml_new), (cjs_path, cjs_new)):
        bak = f"{path}.bak.{TS}"
        shutil.copy2(path, bak)
        print(f"\nbackup: {bak}")
        with open(path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"wrote:  {path}")

    print(f"\nnode --check {cjs_path}")
    r = subprocess.run(["node", "--check", cjs_path], capture_output=True, text=True)
    if r.returncode != 0:
        print(r.stderr)
        shutil.copy2(f"{cjs_path}.bak.{TS}", cjs_path)
        die(f"node --check FAILED. {cjs_path} restored from backup. The .yml edit stands — revert it by hand or with git checkout.")
    print("node --check OK")

    print(f"\nGrep verification:")
    for path, needle in ((yml_path, BACKUP_CRON), (cjs_path, "BACKUP_RUN")):
        found = needle in open(path, encoding="utf-8").read()
        print(f"  {path}: '{needle}' {'PRESENT' if found else 'MISSING'}")
        if not found:
            die("post-write grep failed — patch did not land as expected.")

    print(f"""
Done. Next:

  cd ~/Desktop/alphaplaybook
  git diff {yml_path} {cjs_path}
  npm run build
  git add {yml_path} {cjs_path}
  git commit -m "Add backup cron schedule with early-exit guard"
  git push

The backup only takes effect once pushed — GitHub reads schedules from the
default branch. Verify Tuesday: the 00:47 UTC run should log
"snapshot already present — exiting before Step 1" on any day the primary
succeeded.

Backups left in place ({TS}); .gitignore covers **/*.bak* if that widening
landed, otherwise delete them before any git add -A.
""")


if __name__ == "__main__":
    main()
