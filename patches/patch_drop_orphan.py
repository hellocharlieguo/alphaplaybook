#!/usr/bin/env python3
"""
patch_drop_orphan.py — remove a declaration that TS6133 reports as unused.

TS6133 cascades: removing a consumer orphans its dependency, which orphans its
dependency, and each `npm run build` surfaces only the next link. This takes the
symbol tsc named and removes its declaration, then reports what it orphaned in
turn so you know whether to expect another round.

Handles single-line `const/let/var X = ...` and named imports. Refuses if the
symbol is referenced anywhere outside its own declaration.

Usage:
    python3 patch_drop_orphan.py <file> <SYMBOL>
    python3 patch_drop_orphan.py <file> <SYMBOL> --apply

Example:
    python3 patch_drop_orphan.py src/components/PnLTracker.tsx PORTFOLIO_BASE
"""
import re, sys, shutil, datetime, pathlib

args  = [a for a in sys.argv[1:] if not a.startswith("--")]
APPLY = "--apply" in sys.argv
if len(args) != 2:
    print(__doc__); sys.exit(2)
TARGET, SYM = pathlib.Path(args[0]), args[1]

def die(m):
    print(f"\nABORT: {m}\nNo files were written.")
    sys.exit(1)

if not TARGET.exists():
    die(f"{TARGET} not found — run from ~/Desktop/alphaplaybook")
if not re.fullmatch(r"[A-Za-z_$][\w$]*", SYM):
    die(f"{SYM!r} is not a plain identifier")

src = TARGET.read_text()
lines = src.splitlines(keepends=True)

# locate the declaration line
decl = [i for i, l in enumerate(lines)
        if re.match(rf"\s*(?:export\s+)?(?:const|let|var)\s+{re.escape(SYM)}\s*[:=]", l)]
imports = [i for i, l in enumerate(lines)
           if l.lstrip().startswith("import") and re.search(rf"\b{re.escape(SYM)}\b", l)]

if len(decl) + len(imports) == 0:
    die(f"no declaration or import of {SYM} found")
if len(decl) + len(imports) > 1:
    die(f"{SYM} declared in {len(decl) + len(imports)} places — resolve by hand")

if imports:
    die(f"{SYM} is an IMPORT on line {imports[0] + 1}:\n"
        f"       {lines[imports[0]].rstrip()}\n"
        f"       Removing one name from an import list needs care. Paste the line and stop.")

i = decl[0]
line = lines[i]
if line.count("{") != line.count("}") or line.count("(") != line.count(")"):
    die(f"declaration on line {i + 1} looks multi-line (unbalanced brackets):\n"
        f"       {line.rstrip()}\n       Paste the full span and stop.")

rest = "".join(lines[:i] + lines[i + 1:])
uses = len(re.findall(rf"\b{re.escape(SYM)}\b", rest))
if uses:
    where = [str(j + 1) for j, l in enumerate(lines)
             if j != i and re.search(rf"\b{re.escape(SYM)}\b", l)]
    die(f"{SYM} is still referenced {uses}x (lines {', '.join(where[:8])}) — "
        f"tsc is wrong or the symbol is shadowed. Do not remove.")

out = rest
if out.count("\n") != src.count("\n") - 1:
    die("line delta != -1")

print(f"ok  removing line {i + 1}: {line.rstrip()}")
print(f"line count {src.count(chr(10))} -> {out.count(chr(10))}  (-1, expected)")

# what did this orphan in turn?
deps = set(re.findall(r"\b[A-Za-z_$][\w$]*\b", line.split("=", 1)[1] if "=" in line else ""))
deps -= {"const", "let", "var", "export", "true", "false", "null", "undefined", "new"}
cascade = []
for d in sorted(deps):
    if not re.fullmatch(r"[A-Za-z_$][\w$]*", d) or d[0].isdigit():
        continue
    c = len(re.findall(rf"\b{re.escape(d)}\b", out))
    has_decl = re.search(rf"^\s*(?:export\s+)?(?:const|let|var|import).*\b{re.escape(d)}\b", out, re.M)
    if c == 1 and has_decl:
        cascade.append(d)
if cascade:
    print("\ncascade — these now have ONLY a declaration and will error next:")
    for d in cascade:
        print(f"   {d}   ->  python3 patch_drop_orphan.py {TARGET} {d}")
else:
    print("\ncascade: none — this should be the last link")

if not APPLY:
    print("\nDRY RUN — nothing written. Re-run with --apply")
    sys.exit(0)

bak = TARGET.with_suffix(TARGET.suffix + f".bak.{datetime.datetime.now():%Y%m%d-%H%M%S}")
shutil.copy2(TARGET, bak)
TARGET.write_text(out)
print(f"\nwrote {TARGET}\nbackup {bak}")
print("\nNEXT:\n  npm run build")
