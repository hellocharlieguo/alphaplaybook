#!/usr/bin/env python3
"""Retheme the four SignalRadar cards for v3.4 and teach Portfolio.tsx the new
theme keys.

The 2026-08-24 freeze renamed the `theme` strings in BASE_PORTFOLIO:
    AI Compute        -> AI Buildout
    AI Application    -> AI Applied
    Tokenization      -> Tokenized Rails
    Monetary Scarcity -> Monetary

SignalRadar matches cards to holdings with `h.category !== name`, so every card's
ticker-chip row went empty the moment the new snapshot landed. Portfolio's
themeColor() falls through to slate grey for all twelve names.

Old keys are KEPT as legacy aliases in Portfolio.tsx (following the existing
`// legacy theme labels (older snapshots)` convention) so historical snapshots
still colour correctly.

Anchored, count==1 abort, .bak.<ts>. Validate with `tsc -b` then `npm run build`.
"""
import sys, os, re, shutil, datetime

RADAR = "src/components/SignalRadar.tsx"
PORT = "src/components/Portfolio.tsx"

NEW_CARDS = """const THEME_META: { name: string; tag: string; blurb: string; binding?: boolean }[] = [
  { name: 'AI Buildout',     tag: 'binding, crowded', blurb: 'Power and litho binding, semis cooling; everyone is long it.', binding: true },
  { name: 'AI Applied',      tag: 'up the stack',     blurb: 'LLY and AMZN \\u2014 the only uncorrelated pair in the book.' },
  { name: 'Tokenized Rails', tag: 'conviction up',    blurb: 'Upgraded 8/24: weekly crypto research began ahead of September.' },
  { name: 'Monetary',        tag: 'binding now',      blurb: 'BTC reclaimed its 200-DMA on a 7-sigma week; silver still below.' },
]"""

NEW_COLORS = """  'AI Buildout':                       { color: '#06b6d4' },
  'AI Applied':                        { color: '#3b82f6' },
  'Tokenized Rails':                   { color: '#8b5cf6' },
  'Monetary':                          { color: '#eab308' },
  // legacy theme labels (older snapshots)
  'AI Compute':                        { color: '#06b6d4' },
  'AI Application':                    { color: '#3b82f6' },
  'Tokenization':                      { color: '#8b5cf6' },
  'Monetary Scarcity':                 { color: '#eab308' },"""


def edit(path, pattern, repl, label, flags=re.S):
    if not os.path.exists(path):
        sys.exit(f"ABORT: {path} not found. Run from the repo root.")
    src = open(path, encoding="utf-8").read()
    hits = re.findall(pattern, src, flags)
    if len(hits) != 1:
        sys.exit(f"ABORT: anchor for '{label}' matched {len(hits)} times in "
                 f"{path}, expected 1. Nothing written.")
    out = re.sub(pattern, lambda m: repl, src, count=1, flags=flags)
    if out == src:
        sys.exit(f"ABORT: '{label}' produced no change. Nothing written.")
    bak = f"{path}.bak.{datetime.datetime.now():%Y%m%d%H%M%S}"
    shutil.copy2(path, bak)
    open(path, "w", encoding="utf-8").write(out)
    print(f"  ok  {label}  ({path}, backup {os.path.basename(bak)})")


def main():
    edit(RADAR,
         r"const THEME_META: \{ name: string;.*?\n\]",
         NEW_CARDS.replace("\\\\u2014", "\u2014"),
         "SignalRadar card copy + v3.4 names")

    # Replace the four renamed keys in Portfolio's colour map, keeping the rest.
    edit(PORT,
         r"  'Tokenization': +\{ color: '#8b5cf6' \},\n"
         r"  'AI Application': +\{ color: '#3b82f6' \},\n"
         r"  'Monetary Scarcity': +\{ color: '#eab308' \},\n"
         r"  'AI Compute': +\{ color: '#06b6d4' \},",
         NEW_COLORS,
         "Portfolio theme colours + legacy aliases")

    print("\nNEXT:")
    print("  npx tsc -b")
    print("  npm run build")


if __name__ == "__main__":
    main()
