#!/usr/bin/env python3
"""AlphaPlaybook — fix as_of date-clock mismatch in fetchKalshiCPI.

The crowd rows stamp as_of with TODAY (America/New_York); the Kalshi CPI leg
stamps UTC via toISOString(). Any cron run at/after 8pm EDT (= midnight UTC)
splits the two by a day ("as of Jul 8" left card vs "as of Jul 9" right card).
Same run, same instant — cosmetic only. This aligns the CPI leg to TODAY.

Run from repo root. Creates a .bak, aborts if the anchor count != 1.
"""
import shutil, sys

PATH = 'server/daily-cron.cjs'
OLD = "      as_of: new Date().toISOString().slice(0, 10),"
NEW = "      as_of: TODAY, // ET, matching the crowd rows — UTC stamp split by a day past 8pm EDT"

def main():
    src = open(PATH, encoding='utf-8').read()
    n = src.count(OLD)
    if n != 1:
        sys.exit(f'ABORT: anchor count {n} != 1')
    shutil.copy(PATH, PATH + '.bak.asof')
    open(PATH, 'w', encoding='utf-8').write(src.replace(OLD, NEW, 1))
    print(f'✓ patched {PATH} (1 edit) — backup at {PATH}.bak.asof')
    print('  next: node --check server/daily-cron.cjs')

if __name__ == '__main__':
    main()
