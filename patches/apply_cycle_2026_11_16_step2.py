#!/usr/bin/env python3
"""
apply_cycle_2026_11_16_step2.py — weekly cycle 2026-11-16, STEP 2 (prices + header).

Reads packet/candidates_2026-11-16.txt (the 20:21 UTC Twelve Data capture), checks it
is the same capture Claude scored (every price within 0.5%), writes px / d50 / d200 / rsi
into each worksheet row, sets the h1 date and inserts the 11/16 cycle header.
Run STEP 1 first. Anchored edits, count==1 aborts, timestamped backup outside the repo.

    cd ~/Desktop/alphaplaybook
    python3 patches/apply_cycle_2026_11_16_step2.py
"""
import os, re, shutil, sys, time

WS = "v34_worksheet.html"
CACHE = "packet/candidates_2026-11-16.txt"
STAMP = time.strftime("%Y%m%d-%H%M%S")
BACKUP = os.path.join(os.path.expanduser("~"), "Desktop", "alphaplaybook_backups", STAMP)

# What Claude scored (packet E). Guard against a different capture.
EXPECT = {
    "GEV": 763.77, "VST": 127.87, "SOXX": 141.59, "MU": 721.63, "LITE": 543.19, "COHR": 203.27,
    "BE": 176.79, "ASML": 1416.31, "AMZN": 257.82, "LLY": 1435.82, "XBI": 146.34, "CIBR": 93.23,
    "HOOD": 72.11, "ETHA": 41.16, "COIN": 120.17, "IBIT": 36.78, "SLV": 42.48,
}

HEADER = (
    '<div class="sub" style="border-left:3px solid var(--pin);padding-left:10px;margin-top:10px;color:var(--dim)">'
    '<b style="color:var(--text)">2026-11-16 &mdash; CYCLE: CONFIRM THE BOOK. v3.16 unchanged, 7 names. No rung passed 5.4b; '
    'no ticker-set change. Engine drift 1.2pp one-way vs deployed (no entry band moved since 11/10).</b><br><br>'
    '<b>Transcripts</b> (first cycle from the private repo <code>alphaplaybook-transcripts</code>). Visser 11/14 (Pomp), 11/15 (solo, crypto); '
    'Camillo Grok 11/9&ndash;11/15 and the 11/4 Decoded Genius interview. Every held theme was described within 28 days. '
    '<b>Lexicon false positives:</b> the sweep credits Camillo 11/04 with health care, AI biology, sovereign AI, short friction and agent payments; '
    'all five are incidental words (&ldquo;health care&rdquo; about robots, &ldquo;guard rails&rdquo; about AI safety, Palantir named as a past trade). '
    'Health care was last really voiced by Visser 11/05, so the LLY / XBI removal review fires <b>12/03</b> if no voice describes it by then.<br><br>'
    '<b>Data check (5.4b).</b> Semis held <code>binding</code>: Jensen Huang resigned 11/11 (8-K; CFO Colette Kress interim CEO) &mdash; '
    'a governance event at ~7% of SOXX, not a bottleneck reading; supply still tight on 2 (TrendForce 11/11 Q4 conventional DRAM +10&ndash;15% q/q; '
    'server DRAM still climbing; SK hynix sold out through 2029). Memory held <code>binding</code> with a second-derivative WATCH on 2 reads '
    '(Visser: DRAM ~9x &rarr; ~3x y/y and falling; TrendForce Q4 PC DRAM +13&ndash;18% vs +18&ndash;23% in Q3). CIBR held <code>forward</code>: '
    'Visser 11/14 &ldquo;AI fighting with AI&rdquo;, Binance theft traced to a six-month campaign, Gartner AI-security spend $51.3B &rarr; ~$86B &mdash; '
    'demand reads, no scarcity indicator. IBIT held <code>binding</code>: largest weekly rise in 2-year yields since 2022, Waller 25bp (50bp if core &ge;0.3%) '
    '&mdash; liquidity is a price input, not a stage call; Visser thinks crypto bottomed. AMZN, LLY, XBI, HOOD held; no new second reads.<br><br>'
    '<b>Book changes (5.11).</b> ADD-WHEN, none triggered: MU (5.9% under its 200-DMA, trigger ~$767), BE (21% under, ~$224), SLV (31% under, ~$61.75). '
    'NOT WORTH IT: TEM / ABCL (engine ADD 5.4%, but AI biology was not voiced and 6.8pp comes out of LLY; Applied &minus;3.2); '
    'CRWD / PANW / HACK (8.0pp out of CIBR, same theme; Applied &minus;6.8); NVDA (5.3%, all out of SOXX &mdash; same seat). '
    'Logged, not acted on: PLTR 9.3% (sovereign AI not voiced), TLN 6.0% (power generation not voiced; C took power out), '
    'ZCSH PROVISIONAL (Visser 11/15 bought Zcash; Grayscale ZCSH on NYSE Arca since 8/25, correlations not measured), robotics (Camillo; not derived).<br><br>'
    '<b>Drift.</b> Weights as 11/10: XBI 14.6, CIBR 14.6, LLY 13.0, AMZN 10.9 vs deployed 13.4 / 15.0 / 13.4 / 11.2. '
    'IBIT fell under its 200-DMA (band 0.95 &rarr; 0.75; no effect, single seat). SOXX, IBIT and HOOD are all under their 200-DMA; '
    'LLY, AMZN, XBI and CIBR are above.<br><br>'
    '<b>Inputs.</b> Cycle packet 2026-11-16 20:21 UTC (Twelve Data). Correlations refreshed 11/16 (52 symbols) and injected this cycle; '
    'the figures above were scored on the 10/05 matrix and the page now recomputes on the new one. BBH (off row) is not in the capture. '
    'Comparison column = deployed v3.16.</div>\n'
)


def die(m):
    sys.exit("ABORT: " + m)


for f in (WS, CACHE):
    if not os.path.exists(f):
        die(f + " not found - run from the repo root after cycle_packet.py --pull")

cap = {}
pat = re.compile(r"^(\w+)\s+px=\s*([\d.]+)\s+d50=\s*([\d.]+|n/a)\s+d200=\s*([\d.]+|n/a)\s+rsi=\s*([\d.]+|n/a)")
for line in open(CACHE, encoding="utf-8"):
    m = pat.match(line.strip())
    if m and "n/a" not in m.group(0):
        cap[m.group(1)] = [float(m.group(i)) for i in (2, 3, 4, 5)]

for sym, px in EXPECT.items():
    if sym not in cap:
        die(sym + " missing from " + CACHE)
    if abs(cap[sym][0] - px) / px > 0.005:
        die(sym + " px " + str(cap[sym][0]) + " differs from the scored capture (" + str(px) + ")")

src = open(WS, encoding="utf-8").read()
if "2026-11-16 &mdash; CYCLE" in src:
    print("  " + WS + ": 11/16 header already present - skipped")
    sys.exit(0)
if "'11/16" not in src:
    die("STEP 1 has not been run (no 11/16 row notes)")

lines = src.split("\n")
arr = re.compile(r"\[(\d[\d.]*),(\d[\d.]*),(\d[\d.]*),(\d[\d.]*)\]")
done, missing = [], []
for i, l in enumerate(lines):
    m = re.match(r'\s*\["[^"]+","([A-Z]+)",', l)
    if not m:
        continue
    sym = m.group(1)
    if sym not in EXPECT:
        missing.append(sym)
        continue
    if len(arr.findall(l)) != 1:
        die("price array for " + sym + " found " + str(len(arr.findall(l))) + " times")
    p = cap[sym]
    new = "[%.2f,%.2f,%.2f,%.1f]" % (p[0], p[1], p[2], p[3])
    lines[i] = arr.sub(new, l, count=1)
    done.append(sym)
out = "\n".join(lines)

h1_old = "&middot; 2026-11-10 &middot; CONFIRM THE BOOK &middot; 7 names"
if out.count(h1_old) != 1:
    die("h1 anchor found " + str(out.count(h1_old)) + " times")
out = out.replace(h1_old, "&middot; 2026-11-16 &middot; CONFIRM THE BOOK &middot; 7 names")

anchor = ('<div class="sub" style="border-left:3px solid var(--pin);padding-left:10px;margin-top:10px;color:var(--dim)">'
          '<b style="color:var(--text)">2026-11-10 &mdash;')
if out.count(anchor) != 1:
    die("header anchor found " + str(out.count(anchor)) + " times")
out = out.replace(anchor, HEADER + anchor)

os.makedirs(BACKUP, exist_ok=True)
shutil.copy2(WS, os.path.join(BACKUP, WS + ".bak." + STAMP))
open(WS, "w", encoding="utf-8").write(out)
print("  prices written: " + " ".join(done))
print("  not in capture (left as is): " + (" ".join(missing) or "none"))
print("  %s lines %d -> %d   backup -> %s" % (WS, src.count("\n"), out.count("\n"), BACKUP))
