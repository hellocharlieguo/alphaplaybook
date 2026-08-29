#!/usr/bin/env python3
"""
patch_mobile_ui.py — two mobile fixes:
  Dashboard.tsx: stat/pnl grids repeat(2,1fr) -> repeat(2, minmax(0,1fr)) so wide-content
                 cards (Portfolio Value input, Alpha) can shrink instead of overflowing the viewport.
  Portfolio.tsx: wrap Holdings table in overflow-x:auto (keeps all 10 cols, swipeable on mobile);
                 center the 3 TEXT headers (Ticker/Trend/Theme); numeric cols stay right-aligned.
Anchored, count==1 guards, .bak backup. Validate: npm run build
"""
import os, sys, shutil, time

def patch(path, edits, add=None):
    if not os.path.isfile(path):
        print(f"ABORT: {path} not found. Run from repo root."); sys.exit(1)
    src=open(path).read()
    for label, old, new in edits:
        n=src.count(old)
        if n!=1:
            print(f"ABORT [{path}]: '{label}' matched {n}x (need 1). No files written."); sys.exit(1)
    bak=f"{path}.bak.mobileui.{time.strftime('%Y%m%d-%H%M%S')}"; shutil.copy2(path,bak)
    for label, old, new in edits:
        src=src.replace(old,new,1); print(f"  [{os.path.basename(path)}] {label}")
    open(path,"w").write(src)
    return bak

# ---------- Dashboard.tsx ----------
D="src/components/Dashboard.tsx"
d_edits=[
 ("stat grid -> minmax(0,1fr)",
  "            .ap-stats { grid-template-columns: repeat(2, 1fr); }",
  "            .ap-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }"),
 ("pnl-stats grid -> minmax(0,1fr)",
  "            .ap-pnl-stats { grid-template-columns: repeat(2, 1fr); }",
  "            .ap-pnl-stats { grid-template-columns: repeat(2, minmax(0, 1fr)); }"),
]
bakD=patch(D, d_edits)

# ---------- Portfolio.tsx ----------
P="src/components/Portfolio.tsx"
psrc=open(P).read() if os.path.isfile(P) else ""
# center the three TEXT headers (Ticker, Trend, Theme); leave the 7 numeric right-aligned.
p_edits=[
 ("center Ticker header",
  "<th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Ticker</th>",
  "<th style={{ textAlign: 'center', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Ticker</th>"),
 ("center Trend header",
  "<th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Trend</th>",
  "<th style={{ textAlign: 'center', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Trend</th>"),
 ("center Theme header",
  "<th style={{ textAlign: 'left', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Theme</th>",
  "<th style={{ textAlign: 'center', padding: '8px 16px', fontWeight: 400, fontSize: 11, color: t.textTertiary }}>Theme</th>"),
]
for label, old, new in p_edits:
    if psrc.count(old)!=1:
        print(f"ABORT [{P}]: '{label}' matched {psrc.count(old)}x (need 1). No Portfolio changes written."); sys.exit(1)
bakP=f"{P}.bak.mobileui.{time.strftime('%Y%m%d-%H%M%S')}"; shutil.copy2(P,bakP)
for label, old, new in p_edits:
    psrc=psrc.replace(old,new,1); print(f"  [Portfolio.tsx] {label}")

# horizontal scroll: wrap the <table> in a scroll container. Anchor on the <thead> open to find the table start.
# We inject overflowX by wrapping — find "<table" and add a style, OR (safer) add inline style to the table tag.
import re
tbl=re.search(r"<table(\s[^>]*)?>", psrc)
if not tbl:
    print("ABORT [Portfolio.tsx]: <table> tag not found for scroll-wrap."); shutil.copy2(bakP,P); sys.exit(1)
tag=tbl.group(0)
if "minWidth" in tag or "display:'block'" in tag.replace(" ",""):
    print("  [Portfolio.tsx] table already has scroll styling — skipping wrap")
else:
    # give the table a min-width so it keeps its natural col widths, and wrap parent scrolls.
    # simplest robust approach: set the table to width:'100%' minWidth:640 and ensure a scroll parent via style on table's own container is unknown,
    # so we make the TABLE itself the scroll boundary by wrapping its style: display block + overflowX auto won't keep thead/tbody aligned.
    # Cleanest: add inline style to table for minWidth, and wrap in a div with overflowX. Do the wrap:
    new_tag = tag[:-1] + " style={{ width: '100%', minWidth: 720, borderCollapse: 'collapse' }}>"
    # if table already had a style={{...}}, merge instead
    if "style=" in tag:
        new_tag = re.sub(r"style=\{\{", "style={{ width: '100%', minWidth: 720, ", tag, count=1)
    psrc = psrc.replace(tag, "<div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>" + new_tag, 1)
    # close the wrapper div right after </table>
    if psrc.count("</table>")!=1:
        print(f"ABORT [Portfolio.tsx]: </table> matched {psrc.count('</table>')}x (need 1)."); shutil.copy2(bakP,P); sys.exit(1)
    psrc = psrc.replace("</table>", "</table></div>", 1)
    print("  [Portfolio.tsx] wrapped table in overflow-x scroll container (minWidth 720)")
open(P,"w").write(psrc)

print(f"\nOK. Backups: {bakD} , {bakP}")
print("VALIDATE:  npm run build   (strict TS — must pass before commit)")
