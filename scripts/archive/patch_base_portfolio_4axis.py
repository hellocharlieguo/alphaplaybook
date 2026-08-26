#!/usr/bin/env python3
"""
patch_base_portfolio_4axis.py — freeze the four-axis book into server/daily-cron.cjs BASE_PORTFOLIO.
WEIGHT-ONLY, STRUCTURE-PRESERVING (updates only the weight number per ticker; theme/action untouched).
SAFE: dry-run by default; --apply writes with .bak, all-13-matched guard, node --check, auto-restore.
Run from repo root:
  cd ~/Desktop/alphaplaybook && python3 ~/Downloads/patch_base_portfolio_4axis.py          (dry-run)
  cd ~/Desktop/alphaplaybook && python3 ~/Downloads/patch_base_portfolio_4axis.py --apply   (write)
"""
import re, os, sys, shutil, time, subprocess
CRON="server/daily-cron.cjs"
NEW={"AIPO":18.0,"GLW":7.5,"ASML":7.0,"SOXX":4.0,"LLY":13.5,"AMZN":12.5,"HOOD":9.0,
     "COPX":7.5,"SLV":6.5,"IBIT":3.0,"GLDM":3.0,"ETHA":2.5,"SGOV":6.0}
APPLY = "--apply" in sys.argv
if not os.path.isfile(CRON):
    print(f"ABORT: {CRON} not found. Run from repo root (cd ~/Desktop/alphaplaybook)."); sys.exit(1)
src=open(CRON).read()
m=re.search(r"const BASE_PORTFOLIO\s*=\s*\{", src)
if not m: print("ABORT: BASE_PORTFOLIO not found."); sys.exit(1)
start=m.start(); rest=src[m.end():]
endrel=re.search(r"\n\}", rest); block=rest[:endrel.start()]
new_block=block; changes=[]; missing=[]
for tkr,wt in NEW.items():
    pat=re.compile(r"(\b"+re.escape(tkr)+r"\s*:\s*\{[^}]*?\b(?:base_weight|weight)\s*:\s*)([\d.]+)")
    if not pat.search(new_block): missing.append(tkr); continue
    if len(pat.findall(new_block))!=1: print(f"ABORT: {tkr} matched {len(pat.findall(new_block))}x (need 1)."); sys.exit(1)
    old=pat.search(new_block).group(2)
    new_block=pat.sub(lambda x: x.group(1)+str(wt), new_block, count=1)
    changes.append((tkr,old,wt))
print(f"{'TKR':<6}{'old':>8}{'new':>8}"); print("-"*22)
for t,o,n in changes: print(f"{t:<6}{o:>8}{n:>8.1f}")
if missing: print("\nNOT FOUND (paste me the BASE_PORTFOLIO block):", missing); sys.exit(1)
print(f"\nall {len(changes)}/13 tickers matched. sum={sum(NEW.values()):.1f}%")
vm=re.search(r"(PORTFOLIO_VERSION\s*=\s*['\"]?)([\w.\-]+)(['\"]?)", src)
print(f"PORTFOLIO_VERSION = {vm.group(2) if vm else 'NOT FOUND'}")
if not APPLY:
    print("\nDRY-RUN only. Re-run with --apply to write."); sys.exit(0)
out=src[:m.end()]+new_block+rest[endrel.start():]
if vm:
    d=vm.group(2)
    nd=(d+".1" if re.search(r"v[\d.]+$",d) is None else re.sub(r"(v)([\d.]+)$",
        lambda x:x.group(1)+str(round(float(x.group(2))+0.1,1)), d))
    out=out.replace(f"PORTFOLIO_VERSION = '{d}'", f"PORTFOLIO_VERSION = '{nd}'",1) \
           .replace(f'PORTFOLIO_VERSION = "{d}"', f'PORTFOLIO_VERSION = "{nd}"',1)
    print(f"PORTFOLIO_VERSION bump: {d} -> {nd}")
bak=f"{CRON}.bak.4axis.{time.strftime('%Y%m%d-%H%M%S')}"; shutil.copy2(CRON,bak)
# validate on a .cjs-extension temp so node --check accepts it (Node v24 rejects .tmp)
chk=CRON+".check.cjs"; open(chk,"w").write(out)
r=subprocess.run(["node","--check",chk],capture_output=True,text=True)
os.remove(chk)
if r.returncode!=0:
    print("ABORT: node --check failed, live file untouched.\n",r.stderr); sys.exit(1)
open(CRON,"w").write(out)
print(f"\nOK: BASE_PORTFOLIO frozen to four-axis book (backup {bak}). node --check passed.")
print("Verify:  git diff server/daily-cron.cjs   then commit + push. Cron applies at 7pm ET.")
