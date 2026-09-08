#!/usr/bin/env python3
"""
patch_fear_greed_fallback.py — fetchFearGreed(): try every open KXFEAR event,
nearest expiry first, instead of only the nearest.

Problem observed 2026-09-01: the tile went dark and the header fell through to
"Active signals". The cron evaluates ONLY the nearest event and returns null if
it fails a guard. That night:

    26SEP04   sum 1.5400   OI  4,930   <- cron used this, correctly rejected
    26SEP11   sum 1.0200   OI 16,377   <- valid and 3x more liquid, never tried
    26SEP18   sum 1.0400   OI    664   <- valid
    26SEP25   sum 0.9850   OI      8   <- valid but a dead book

The 1.54 rejection is right (five mutually exclusive bands cannot sum to 1.54).
The bug is that one bad event kills the tile while three usable ones sit behind
it. This walks the list in expiry order and takes the first that clears both the
ladder-completeness and sum guards, plus a new open-interest floor so a book like
26SEP25 (8 contracts, mids are noise) cannot win by default.

The sum band (0.95-1.06) is UNCHANGED. That is a separate open question.

Output gains `event` and `total_oi` so the UI can name which Friday it is
reading — without that the horizon shifts silently between days.

Usage:
    python3 patch_fear_greed_fallback.py            # dry run
    python3 patch_fear_greed_fallback.py --apply
"""
import re, sys, shutil, datetime, pathlib

TARGET = pathlib.Path("server/daily-cron.cjs")
APPLY  = "--apply" in sys.argv

START = "      const nearest = Object.entries(events)"
END   = "      return out"

NEW = '''      // Walk candidates in expiry order and take the first that clears the
      // guards. Previously this evaluated ONLY the nearest event and returned
      // null on failure, so a single incoherent ladder (26SEP04: sum 1.540)
      // blanked the tile while 26SEP11 (sum 1.020, 16,377 OI) sat unused.
      const candidates = Object.entries(events)
        .map(([ev, list]) => ({ ev, list, close: String(list[0].close_time || '') }))
        .sort((a, b) => a.close.localeCompare(b.close))
      if (!candidates.length) return null
      const FG_MIN_OI = 500
      const skipped = []
      for (const nearest of candidates) {
        const mids = {}
        for (const m of nearest.list) {
          const name = String(m.yes_sub_title || m.subtitle || '').trim()
          if (FG_BANDS.indexOf(name) < 0) continue
          const b = parseFloat(m.yes_bid_dollars), a = parseFloat(m.yes_ask_dollars)
          if (isNaN(b) || isNaN(a) || a <= 0) continue
          mids[name] = (b + a) / 2
        }
        if (Object.keys(mids).length !== 5) {
          skipped.push(`${nearest.ev} ladder ${Object.keys(mids).length}/5`)
          continue
        }
        const sum = FG_BANDS.reduce((s, k) => s + mids[k], 0)
        // Band widened 0.97-1.03 -> 0.95-1.06 on 2026-08-03. The old ceiling was
        // rejecting the nearest and MOST liquid event (AUG07: sum 1.045, 3797 OI)
        // over an ordinary 4.5% overround that the normalization below divides out,
        // while admitting a near-empty book (AUG14: 895 OI, 9 contracts on Extreme
        // Fear). 1.06 still rejects a genuinely unmade ladder (AUG21: sum 1.385,
        // identical mids across unrelated bands).
        if (sum < 0.95 || sum > 1.06) {
          skipped.push(`${nearest.ev} sum ${sum.toFixed(3)}`)
          continue
        }
        // Open-interest floor. Field name varies across Kalshi payloads; if none
        // parse we get 0 and skip the check rather than reject everything on a
        // rename — the sum guard still applies.
        const totalOi = nearest.list.reduce((s, m) =>
          s + (Number(m.open_interest ?? m.openInterest ?? m.oi) || 0), 0)
        if (totalOi > 0 && totalOi < FG_MIN_OI) {
          skipped.push(`${nearest.ev} OI ${totalOi}`)
          continue
        }
        const norm = {}
        for (const k of FG_BANDS) norm[k] = mids[k] / sum
        let band = FG_BANDS[0]
        for (const k of FG_BANDS) if (norm[k] > norm[band]) band = k
        const sideProb =
          (band === 'Fear' || band === 'Extreme Fear') ? norm['Extreme Fear'] + norm['Fear']
          : (band === 'Greed' || band === 'Extreme Greed') ? norm['Greed'] + norm['Extreme Greed']
          : null
        const implied = FG_BANDS.reduce((s, k) => s + norm[k] * FG_MIDPOINTS[k], 0)
        const out = {
          band,
          prob: Math.round(norm[band] * 1000) / 1000,
          side_prob: sideProb === null ? null : Math.round(sideProb * 1000) / 1000,
          implied: Math.round(implied * 10) / 10,
          bands: FG_BANDS.reduce((o, k) => { o[k] = Math.round(norm[k] * 1000) / 1000; return o }, {}),
          event: nearest.ev,
          total_oi: totalOi || null,
          close_time: nearest.list[0].close_time || null,
          as_of: new Date().toISOString(),
        }
        if (skipped.length) console.warn(`  Fear & Greed: skipped ${skipped.join(', ')}`)
        console.log(`  Fear & Greed (${nearest.ev}): ${band} ${Math.round(norm[band] * 100)}% · implied ${out.implied} · sum ${sum.toFixed(3)} · OI ${totalOi}`)
        return out
      }
      console.warn(`  Fear & Greed: no candidate cleared guards (${skipped.join(', ')})`)
      return null'''

def die(m):
    print(f"\nABORT: {m}\nNo files were written.")
    sys.exit(1)

if not TARGET.exists():
    die(f"{TARGET} not found — run from ~/Desktop/alphaplaybook")

src = TARGET.read_text()

if "const candidates = Object.entries(events)" in src:
    die("already applied")
# Scope to fetchFearGreed only. `const nearest = Object.entries(events)` also
# appears in fetchSP500Additions (L419), so a file-wide search is ambiguous.
FN = "async function fetchFearGreed() {"
if src.count(FN) != 1:
    die(f"found {src.count(FN)} definitions of fetchFearGreed, expected 1")
fn_start = src.index(FN)
depth, k = 0, src.index("{", fn_start)
fn_end = None
while k < len(src):
    if src[k] == "{": depth += 1
    elif src[k] == "}":
        depth -= 1
        if depth == 0:
            fn_end = k + 1
            break
    k += 1
if fn_end is None:
    die("could not brace-match the end of fetchFearGreed")
window = src[fn_start:fn_end]
print(f"fetchFearGreed spans {window.count(chr(10)) + 1} lines")
if window.count(START) != 1:
    die(f"start anchor found {window.count(START)}x inside fetchFearGreed, expected 1")
i = fn_start + window.index(START)
j = src.find(END, i)
if j != -1 and j > fn_end:
    die("end anchor lies outside fetchFearGreed — refusing")
if j == -1:
    die("end anchor `return out` not found after the start anchor")
j += len(END)
old = src[i:j]

# span sanity — this must stay inside fetchFearGreed
if old.count("\n") > 60:
    die(f"span is {old.count(chr(10))} lines, expected ~46 — refusing")
for req in ("if (sum < 0.95 || sum > 1.06)", "const implied = FG_BANDS.reduce", "close_time"):
    if req not in old:
        die(f"span is missing {req!r} — wrong region")
for forbidden in ("function ", "async ", "KALSHI_HOSTS"):
    if forbidden in old:
        die(f"span contains {forbidden!r} — it has escaped fetchFearGreed")
if old.count("{") != old.count("}") or old.count("(") != old.count(")"):
    die("span has unbalanced brackets — refusing")

out = src[:i] + NEW + src[j:]

if out.count("function ") != src.count("function "):
    die("function count changed")
if out.count("fetchFearGreed") != src.count("fetchFearGreed"):
    die("fetchFearGreed reference count changed")
if "if (sum < 0.95 || sum > 1.06)" not in out:
    die("sum guard lost — band must be unchanged by this patch")
if out.count("{") != out.count("}") or out.count("(") != out.count(")"):
    die("bracket balance changed across the file")

print(f"ok  replaced {old.count(chr(10)) + 1} lines with {NEW.count(chr(10)) + 1}")
print(f"line count {src.count(chr(10))} -> {out.count(chr(10))}  ({out.count(chr(10)) - src.count(chr(10)):+d})")
print("\nsum band 0.95-1.06 UNCHANGED (separate open question)")
print("new: iterate by expiry · FG_MIN_OI 500 · logs skipped events · emits event + total_oi")
print("\non last night's data this would pick 26SEP11 (sum 1.020, OI 16,377),")
print("skipping 26SEP04 (sum 1.540)")

if not APPLY:
    print("\nDRY RUN — nothing written. Re-run with --apply")
    sys.exit(0)

bak = TARGET.with_suffix(TARGET.suffix + f".bak.{datetime.datetime.now():%Y%m%d-%H%M%S}")
shutil.copy2(TARGET, bak)
TARGET.write_text(out)
print(f"\nwrote {TARGET}\nbackup {bak}")
print("\nNEXT:\n  node --check server/daily-cron.cjs")
