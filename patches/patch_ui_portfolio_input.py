#!/usr/bin/env python3
"""
patch_ui_portfolio_input.py — Portfolio tab: show "Enter" instead of "100,000".

Sizing math is UNCHANGED. portfolioValue still defaults to 100000 and still
persists to localStorage, so $ Alloc and Shares render exactly as they do now.
Only the input's *display* changes:

  L91  portfolioInput no longer seeds itself from portfolioValue. It seeds from
       localStorage only — i.e. it shows a number only if the user actually set
       one. First-time visitors get an empty box.
  L96  the blur handler no longer re-formats portfolioValue back into the box on
       an empty/invalid entry; it leaves it empty so the placeholder returns.
  L265 adds placeholder="Enter".

Usage:
    python3 patch_ui_portfolio_input.py            # dry run
    python3 patch_ui_portfolio_input.py --apply
"""
import sys, shutil, datetime, pathlib

TARGET = pathlib.Path("src/components/Dashboard.tsx")
APPLY  = "--apply" in sys.argv
KEY    = "ap-portfolio-value"

EDITS = [
 ("seed input from localStorage only",
  "  const [portfolioInput, setPortfolioInput] = useState(() => portfolioValue.toLocaleString('en-US'))",
  "  const [portfolioInput, setPortfolioInput] = useState(() => {\n"
  "    // Show a number only if the user set one. Default sizing stays 100k; the\n"
  "    // box just reads \"Enter\" so the basis is not mistaken for a real balance.\n"
  f"    try {{ return localStorage.getItem('{KEY}') ? portfolioValue.toLocaleString('en-US') : '' }} catch {{ return '' }}\n"
  "  })"),
 ("blur leaves box empty rather than restoring the number",
  "    else { setPortfolioInput(portfolioValue.toLocaleString('en-US')) }",
  "    else { setPortfolioInput('') }"),
 ("add placeholder",
  '<input type="text" inputMode="numeric" value={input}',
  '<input type="text" inputMode="numeric" placeholder="Enter" value={input}'),
]

# anchors that must survive untouched
MUST_KEEP = [
    "const [portfolioValue, setPortfolioValue] = useState<number>",
    f"localStorage.setItem('{KEY}', String(portfolioValue))",
    "portfolioValue={portfolioValue}",
    "onBlur={onCommit}",
    "Sizing only",
]

def die(m):
    print(f"\nABORT: {m}\nNo files were written.")
    sys.exit(1)

if not TARGET.exists():
    die(f"{TARGET} not found — run from ~/Desktop/alphaplaybook")

src = TARGET.read_text()
out = src

for label, old, new in EDITS:
    n = out.count(old)
    if n == 0:
        if new.split("\n")[0] in out:
            die(f"[{label}] already applied — nothing to do")
        die(f"[{label}] anchor not found verbatim:\n       {old.strip()[:90]}")
    if n != 1:
        die(f"[{label}] anchor appears {n} times, expected 1")
    out = out.replace(old, new, 1)
    print(f"ok  {label}")

for a in MUST_KEEP:
    if out.count(a) < 1:
        die(f"structural anchor lost: {a!r}")

if out.count("useState") != src.count("useState"):
    die("useState count changed — edit escaped its span")

delta = out.count("\n") - src.count("\n")
if delta != 4:
    die(f"line delta {delta:+d}, expected +4 (multi-line initializer)")

print(f"\nline count {src.count(chr(10))} -> {out.count(chr(10))}  (+4, expected)")
print("sizing math unchanged: portfolioValue default 100000, localStorage persistence intact")

if not APPLY:
    print("\nDRY RUN — nothing written. Re-run with --apply")
    sys.exit(0)

bak = TARGET.with_suffix(TARGET.suffix + f".bak.{datetime.datetime.now():%Y%m%d-%H%M%S}")
shutil.copy2(TARGET, bak)
TARGET.write_text(out)
print(f"\nwrote {TARGET}\nbackup {bak}")
print("\nNEXT:\n  npm run build")
