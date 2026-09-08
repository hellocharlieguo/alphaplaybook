#!/usr/bin/env python3
"""
patch_ui_portfolio_input_fix.py — the input box always starts empty.

The previous patch seeded portfolioInput from localStorage, which does not work:
the useEffect on L92 writes 'ap-portfolio-value' on first mount, so the key
always exists from the second page load onward and the box re-renders "100,000".

Simpler and correct for the stated requirement: portfolioInput always starts as
'', so the box always shows the "Enter" placeholder. Sizing math is untouched —
portfolioValue still defaults to 100000 and still persists, so $ Alloc and
Shares render exactly as they do now.

Tradeoff, by design: if a user previously entered 80,000, the box reads "Enter"
on reload while allocations still compute off 80,000. Acceptable given the ask
("$ alloc and shares can assume a default of 100k, just make it subtle"). If you
want the box to remember an explicit entry, that needs a separate 'user set it'
flag written in onCommit — say so and I will build it.

Usage:
    python3 patch_ui_portfolio_input_fix.py            # dry run
    python3 patch_ui_portfolio_input_fix.py --apply
"""
import sys, shutil, datetime, pathlib

TARGET = pathlib.Path("src/components/Dashboard.tsx")
APPLY  = "--apply" in sys.argv

OLD = (
"  const [portfolioInput, setPortfolioInput] = useState(() => {\n"
"    // Show a number only if the user set one. Default sizing stays 100k; the\n"
"    // box just reads \"Enter\" so the basis is not mistaken for a real balance.\n"
"    try { return localStorage.getItem('ap-portfolio-value') ? portfolioValue.toLocaleString('en-US') : '' } catch { return '' }\n"
"  })")

NEW = (
"  // Always starts empty so the box reads \"Enter\". Sizing still defaults to\n"
"  // 100k via portfolioValue; the basis is deliberately not shown as a number.\n"
"  const [portfolioInput, setPortfolioInput] = useState('')")

MUST_KEEP = [
    "const [portfolioValue, setPortfolioValue] = useState<number>",
    "localStorage.setItem('ap-portfolio-value', String(portfolioValue))",
    "portfolioValue={portfolioValue}",
    'placeholder="Enter"',
    "else { setPortfolioInput('') }",
    "Sizing only",
]

def die(m):
    print(f"\nABORT: {m}\nNo files were written.")
    sys.exit(1)

if not TARGET.exists():
    die(f"{TARGET} not found — run from ~/Desktop/alphaplaybook")

src = TARGET.read_text()

n = src.count(OLD)
if n == 0:
    if "useState('')" in src and "portfolioInput" in src:
        die("already applied")
    die("previous initializer not found verbatim — run patch_ui_portfolio_input.py first,\n"
        "       or paste `sed -n '88,100p' src/components/Dashboard.tsx` and stop.")
if n != 1:
    die(f"initializer appears {n} times, expected 1")

out = src.replace(OLD, NEW, 1)

for a in MUST_KEEP:
    if out.count(a) < 1:
        die(f"structural anchor lost: {a!r}")
if out.count("useState") != src.count("useState"):
    die("useState count changed")
# the gate is the TERNARY, not the getItem itself — portfolioValue's own
# initializer legitimately reads the same key and must survive
if "? portfolioValue.toLocaleString" in out:
    die("the self-defeating ternary gate is still present")
if out.count("localStorage.getItem('ap-portfolio-value')") != 1:
    die(f"expected exactly 1 remaining getItem (portfolioValue's own initializer), "
        f"found {out.count(chr(34)+chr(34))}")

d = out.count("\n") - src.count("\n")
if d != -2:
    die(f"line delta {d:+d}, expected -2")

print("ok  portfolioInput now always starts empty")
print(f"line count {src.count(chr(10))} -> {out.count(chr(10))}  (-2, expected)")
print("sizing math unchanged: portfolioValue default 100000, persistence intact")

if not APPLY:
    print("\nDRY RUN — nothing written. Re-run with --apply")
    sys.exit(0)

bak = TARGET.with_suffix(TARGET.suffix + f".bak.{datetime.datetime.now():%Y%m%d-%H%M%S}")
shutil.copy2(TARGET, bak)
TARGET.write_text(out)
print(f"\nwrote {TARGET}\nbackup {bak}")
print("\nNEXT:\n  npm run build")
