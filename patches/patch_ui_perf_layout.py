#!/usr/bin/env python3
"""
patch_ui_perf_layout.py — Performance tab card restructure.

  - remove the top stat row entirely (Thematic Return / Alpha duplicate the
    header cards; Max Drawdown / Days Tracked move down), so the tab opens
    directly on the equity curve
  - replace the 2-up Best/Worst block with a 4-up row:
        Max Drawdown | Days Tracked | Best day | Worst day
  - Best/Worst now render through PnLStatCard for a uniform row. Their date
    subtitle is folded into the label ("Best day · Jul 30") since PnLStatCard
    takes no third line — keeps the date without touching a shared component.

Reuses the existing `ap-pnl-stats` class rather than introducing a second
layout primitive; it already renders 4 cards across with tested responsive
behaviour. `ap-bestworst` becomes an unused CSS class (harmless, no build
error) — delete it from the stylesheet at your leisure.

Usage:
    python3 patch_ui_perf_layout.py            # dry run
    python3 patch_ui_perf_layout.py --apply
"""
import re, sys, shutil, datetime, pathlib

TARGET = pathlib.Path("src/components/PnLTracker.tsx")
APPLY  = "--apply" in sys.argv

CARD_DD  = ('        <PnLStatCard label="Max Drawdown" value={`-${maxDrawdown.toFixed(2)}%`} '
            'color={t.negative} t={t} />')
CARD_DAYS = ('        <PnLStatCard label="Days Tracked" value={String(daysSinceInception)} '
             'color={t.textPrimary} t={t} />')

TOP_OLD = (
'      {/* Stat Cards */}\n'
'      <div className="ap-pnl-stats">\n'
'        <PnLStatCard label="Thematic Return" value={`${cumulativeReturn >= 0 ? \'+\' : \'\'}${cumulativeReturn.toFixed(2)}%`} color={cumulativeReturn >= 0 ? t.positive : t.negative} t={t} />\n'
'        <PnLStatCard label="Thematic Alpha" value={`${alpha >= 0 ? \'+\' : \'\'}${alpha.toFixed(2)}%`} color={alpha >= 0 ? t.positive : t.negative} t={t} />\n'
+ CARD_DD + '\n' + CARD_DAYS + '\n'
'      </div>\n\n')

def dfmt(v):
    return ("${new Date(" + v + ".date + 'T00:00:00').toLocaleDateString('en-US', "
            "{ month: 'short', day: 'numeric' })}")

BOT_NEW = (
'      {/* Summary stats — drawdown, tracking length, best/worst */}\n'
'      <div className="ap-pnl-stats">\n'
+ CARD_DD + '\n' + CARD_DAYS + '\n'
'        {bestDay && <PnLStatCard label={`Best day · ' + dfmt('bestDay') + '`} '
'value={`+${bestDay.ret.toFixed(2)}%`} color={t.positive} t={t} />}\n'
'        {worstDay && <PnLStatCard label={`Worst day · ' + dfmt('worstDay') + '`} '
'value={`${worstDay.ret.toFixed(2)}%`} color={t.negative} t={t} />}\n'
'      </div>\n')

def die(m):
    print(f"\nABORT: {m}\nNo files were written.")
    sys.exit(1)

if not TARGET.exists():
    die(f"{TARGET} not found — run from ~/Desktop/alphaplaybook")

src = TARGET.read_text()
out = src

# ---- 1. remove the top stat row ----------------------------------------
if out.count(TOP_OLD) != 1:
    die(f"top stat row not found verbatim (count {out.count(TOP_OLD)}).\n"
        "       Did an earlier patch already touch it? Paste sed -n '77,90p' and stop.")
out = out.replace(TOP_OLD, "", 1)
print("ok  removed top stat row (Return / Alpha / Drawdown / Days)")

# ---- 2. replace the Best/Worst block ------------------------------------
m = re.search(r"      \{/\* Best/Worst Days \*/\}\n"
              r"      \{bestDay && worstDay && \(\n"
              r'        <div className="ap-bestworst">\n'
              r"(?:.*?\n)*?      \)\}\n", out)
if not m:
    die("Best/Worst block not found in the expected shape")
blk = m.group(0)
if blk.count("<div") != blk.count("</div>"):
    die("Best/Worst block has unbalanced divs — refusing to replace")
if blk.count("ap-bestworst") != 1 or blk.count("bestDay.ret") != 1 or blk.count("worstDay.ret") != 1:
    die("Best/Worst block contents unexpected — inspect manually")
out = out[:m.start()] + BOT_NEW + out[m.end():]
print(f"ok  replaced Best/Worst 2-up block ({blk.count(chr(10))} lines) with 4-up row")

# ---- 3. invariants ------------------------------------------------------
if out.count("<PnLStatCard") != 4:
    die(f"expected 4 PnLStatCard usages, found {out.count('<PnLStatCard')}")
for lbl in ("Max Drawdown", "Days Tracked", "Best day", "Worst day"):
    if out.count(lbl) != 1:
        die(f"expected exactly 1 '{lbl}', found {out.count(lbl)}")
for gone in ("Thematic Return", "Thematic Alpha", "ap-bestworst"):
    if gone in out:
        die(f"'{gone}' should be gone but is still present")
if out.count('className="ap-pnl-stats"') != 1:
    die("expected exactly 1 ap-pnl-stats container")
if out.count("(") != out.count(")") or out.count("{") != out.count("}"):
    die("bracket balance changed — do not apply")

# ---- 4. TS6133 cascade forecast ----------------------------------------
print("\ncascade check (TS6133):")
for sym in ("cumulativeReturn", "alpha", "glass", "bestDay", "worstDay",
            "maxDrawdown", "daysSinceInception"):
    c = len(re.findall(rf"\b{sym}\b", out))
    decl = re.search(rf"^\s*(?:const|let|var)\s+{sym}\b", out, re.M)
    if c == 0:
        v = "gone entirely"
    elif c == 1 and decl:
        v = "ONLY the declaration remains -> will error next"
    else:
        v = f"{c} references, still used"
    print(f"  {sym:<20} {v}")

print(f"\nline count {src.count(chr(10))} -> {out.count(chr(10))}  ({out.count(chr(10)) - src.count(chr(10)):+d})")
print("layout: tabs -> equity curve -> daily returns -> [Drawdown | Days | Best | Worst]")

if not APPLY:
    print("\nDRY RUN — nothing written. Re-run with --apply")
    sys.exit(0)

bak = TARGET.with_suffix(TARGET.suffix + f".bak.{datetime.datetime.now():%Y%m%d-%H%M%S}")
shutil.copy2(TARGET, bak)
TARGET.write_text(out)
print(f"\nwrote {TARGET}\nbackup {bak}")
print("\nNEXT:\n  npm run build")
