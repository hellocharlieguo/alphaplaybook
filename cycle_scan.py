#!/usr/bin/env python3
"""
cycle_scan.py v2 — theme-first sweep. Weekly Workflow 5.2 / 5.11. Revised 2026-09-29.

Any voice may name a THEME or TREND. Tickers are DERIVED from themes via
theme_map.json, never taken from a voice directly. ZaStocks' tickers are
ignored entirely (they change too often); his themes still count. Visser and
Camillo name-mentions are reported as HINTS for derivation, not as inputs.

    cd ~/Desktop/alphaplaybook
    python3 cycle_scan.py --dir ~/Desktop/transcripts                # full history -> staleness
    python3 cycle_scan.py --dir ~/Desktop/transcripts --window 7     # this week's report

Read-only. Prints a report; writes nothing.

Voice is taken from the file name: 'Visser' or 'Pomp' -> Visser; 'Camillo' ->
Camillo; 'ZaStocks' or 'Za' -> ZaStocks. Date is the LAST m_d(_yy) in the name,
so a '9_21-9_27' window dates to 9/27. Unparseable names are reported, not guessed.

Blocks:
  1. THEMES THIS WINDOW   by voice, with a quote each; multi-voice convergence flagged
  2. DERIVED CANDIDATES   vehicles for every voiced theme, with held / in-ETF / candidate status
  3. REMOVAL REVIEW       held names whose themes no voice has described for >= --stale days
  4. UNMAPPED LANGUAGE    structural statements matching no theme -> derive a new theme
  5. NAME HINTS           Visser/Camillo only; pointers for derivation, never seats
"""
import argparse, json, os, re, sys
from collections import defaultdict
from datetime import date

HERE = os.path.dirname(os.path.abspath(__file__))

# The book as of 2026-09-30-v3.8-coinamzn. ASML removed 9/14; COIN added 9/30.
BOOK = {"AIPO", "SOXX", "MU", "COPX", "AMZN", "LLY", "HOOD", "ETHA", "COIN", "GLDM", "IBIT", "SLV"}   # v3.9: GLW -> MU 10/01

# Name aliases: HINTS only (Visser/Camillo). Garbled forms observed in transcripts.
ALIASES = [
    (r"\bsol[ao]na\b|\bsalana\b|\bsolona\b|\bsaul[ao]na\b", "SOL", "Solana"),
    (r"\bmarvell?\b|\bmarll\b|\bmarvel\b", "MRVL", "Marvell"),
    (r"\bmicron\b", "MU", "Micron"),
    (r"\bnvidia\b|\benvidia\b", "NVDA", "Nvidia"),
    (r"\bintel\b", "INTC", "Intel"),
    (r"\bAMD\b", "AMD", "AMD"),
    (r"\bcoinbase\b", "COIN", "Coinbase"),
    (r"\bcircle\b", "CRCL", "Circle"),
    (r"\bhyper ?liquid\b|\bhyperlquid\b", "HYPE", "Hyperliquid (token)"),
    (r"\bondo\b|\bando finance\b", "ONDO", "Ondo (token)"),
    (r"\bmeta\b(?!l|phor|bolic)", "META", "Meta"),
    (r"\bsalesforce\b", "CRM", "Salesforce"),
    (r"\bvisa\b", "V", "Visa"),
    (r"\bmastercard\b", "MA", "Mastercard"),
    (r"\bblue ?owl\b|\bblue al\b", "OWL", "Blue Owl"),
    (r"\binsilico\b|\bsilico medicine\b", "PRIV:INSILICO", "Insilico Medicine"),
    (r"\bstripe\b", "PRIV:STRIPE", "Stripe (private)"),
    (r"\bblack ?rock\b", "BLK", "BlackRock"),
]

ROLE_PATTERNS = [
    (r"you'?ve got \w+ (?:as|for)\b", "role assignment"),
    (r"\bthe (?:three|four|two) (?:horsemen|companies|things|pillars)\b", "taxonomy"),
    (r"\blong \w+,? short \w+\b|\byou want to be (?:long|short)\b", "long/short framing"),
    (r"\bthe (?:only|biggest|most important) (?:thing|way|one|story)\b", "superlative"),
    (r"\bI (?:am |'m )?(?:long|buying|bought|own|adding|moving)\b", "stated position"),
    (r"\bwe'?re at the \w+ (?:stage|point)\b|\bwe'?ve entered\b|\bnow we'?re in\b", "stage transition"),
    (r"\bfastest horse\b|\bdoesn'?t fit\b|\bnot what you watch\b", "relative de-rate"),
    (r"\bis a group to watch\b|\bnobody'?s talking about\b|\bneglected\b", "theme nomination"),
    (r"\bbear market (?:with)?in(?:side)? a bull\b", "regime framing"),
]

TS = re.compile(r"[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+")
WS = re.compile(r"\s+")
DATE = re.compile(r"(\d{1,2})[_/.-](\d{1,2})(?:[_/.-](\d{2,4}))?")


def voice_of(name):
    n = name.lower()
    if "zastocks" in n or re.search(r"(^|[^a-z])za([^a-z]|$)", n): return "ZaStocks"
    if "camillo" in n: return "Camillo"
    if "visser" in n or "pomp" in n: return "Visser"
    return None


def date_of(name, year):
    ms = DATE.findall(name)
    if not ms: return None
    m, d, y = ms[-1]
    y = int(y) if y else year
    if y < 100: y += 2000
    try: return date(y, int(m), int(d))
    except ValueError: return None


def clean(path):
    raw = open(path, encoding="utf-8", errors="replace").read()
    return WS.sub(" ", TS.sub("", raw))


def quote(text, m, width=200):
    a = max(0, m.start() - width // 2)
    return "..." + text[a:m.end() + width].strip() + "..."


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="*")
    ap.add_argument("--dir")
    ap.add_argument("--map", default=os.path.join(HERE, "theme_map.json"))
    ap.add_argument("--window", type=int, default=7, help="days back from newest file = 'this window'")
    ap.add_argument("--stale", type=int, default=28, help="days of theme silence before a removal review")
    ap.add_argument("--year", type=int, default=date.today().year)
    a = ap.parse_args()

    files = list(a.files)
    if a.dir:
        files += [os.path.join(a.dir, f) for f in sorted(os.listdir(a.dir))
                  if os.path.isfile(os.path.join(a.dir, f))]
    if not files: sys.exit("No transcript files. Use paths or --dir.")
    TM = json.load(open(a.map))["themes"]
    LEX = {k: re.compile(v["lex"], re.I) for k, v in TM.items()}

    docs, skipped = [], []
    for p in files:
        b = os.path.basename(p); v = voice_of(b); d = date_of(b, a.year)
        if not v or not d: skipped.append((b, "no voice" if not v else "no date")); continue
        docs.append((p, b, v, d))
    if not docs: sys.exit("No file had both a recognisable voice and date in its name.")
    newest = max(d for *_, d in docs)
    wstart = date.fromordinal(newest.toordinal() - a.window)

    last_voiced = defaultdict(dict)            # theme -> voice -> latest date
    window_hits = defaultdict(lambda: defaultdict(lambda: {"n": 0, "q": None, "f": None}))
    hints = defaultdict(lambda: {"n": 0, "q": None, "v": set(), "label": ""})
    roles = []

    for p, b, v, d in docs:
        text = clean(p)
        inwin = d > wstart
        for k, rx in LEX.items():
            ms = list(rx.finditer(text))
            if not ms: continue
            if d > last_voiced[k].get(v, date.min): last_voiced[k][v] = d
            if inwin:
                h = window_hits[k][v]; h["n"] += len(ms)
                if not h["q"]: h["q"], h["f"] = quote(text, ms[0]), b
        if not inwin: continue
        if v != "ZaStocks":                     # ZaStocks tickers are never inputs
            for pat, t, label in ALIASES:
                ms = list(re.finditer(pat, text, re.I))
                if ms:
                    h = hints[t]; h["n"] += len(ms); h["v"].add(v); h["label"] = h["label"] or label
                    if not h["q"]: h["q"] = quote(text, ms[0])
            for m in re.finditer(r"\$([A-Z]{1,5})\b", text):   # cashtags (Grok captures)
                t = m.group(1); h = hints[t]; h["n"] += 1; h["v"].add(v); h["label"] = h["label"] or t
                if not h["q"]: h["q"] = quote(text, m)
        for pat, kind in ROLE_PATTERNS:
            for m in re.finditer(pat, text, re.I):
                q = quote(text, m, 260)
                mapped = [k for k, rx in LEX.items() if rx.search(q)]
                roles.append((b, v, kind, q, mapped))

    bar = "=" * 78
    print(bar); print(f"THEME SWEEP — {len(docs)} file(s), newest {newest}, window {wstart} .. {newest}"); print(bar)
    if skipped:
        print("\nSKIPPED (fix the file name):")
        for b, why in skipped: print(f"  {b}  [{why}]")

    print("\n### 1 · THEMES THIS WINDOW\n")
    for k in sorted(window_hits, key=lambda k: -len(window_hits[k])):
        vs = window_hits[k]; t = TM[k]
        conv = "  ** CONVERGENCE: " + " + ".join(sorted(vs)) if len(vs) > 1 else ""
        print(f"  {k:<24} trend: {t['trend'] or 'UNASSIGNED'}{conv}")
        for v, h in sorted(vs.items()):
            print(f"     {v:<9} {h['n']:>3}x  {h['f']}")
            print(f"               {h['q'][:260]}")
        print()
    silent = [k for k in TM if k not in window_hits]
    if silent: print("  silent this window: " + ", ".join(silent) + "\n")

    print("### 2 · DERIVED CANDIDATES — engine decides whether and how much (5.11 step 4)\n")
    for k in window_hits:
        veh = TM[k]["vehicles"]
        if TM[k].get("long_only_skip"):
            print(f"  {k:<24} long-only book: avoided, not shorted — no vehicles"); continue
        if not veh:
            print(f"  {k:<24} VEHICLES NOT YET DERIVED — research this cycle ({TM[k].get('note','')[:80]})"); continue
        row = []
        for t, s in veh.items():
            if s == "held" or t in BOOK: row.append(f"{t}=HELD")
            elif s.startswith("in_etf"):
                _, etf, pct, asof = s.split(":"); row.append(f"{t}=in {etf} {pct}% ({asof})")
            else: row.append(f"{t}={s}")
        print(f"  {k:<24} " + " | ".join(row))
    print()

    print(f"### 3 · REMOVAL REVIEW — held names whose themes are silent >= {a.stale} days\n")
    flagged = False
    for t in sorted(BOOK):
        ks = [k for k, v in TM.items() if v["vehicles"].get(t) == "held"]
        if not ks: print(f"  {t:<6} NOT IN theme_map.json — map it"); flagged = True; continue
        best = max((max(last_voiced[k].values()) for k in ks if last_voiced[k]), default=None)
        age = (newest - best).days if best else None
        if best is None or age >= a.stale:
            flagged = True
            print(f"  {t:<6} themes {ks}: last voiced {best or 'NEVER in scanned files'}"
                  f"{'' if best is None else f' ({age}d)'}  <-- REVIEW")
    if not flagged: print("  (none — every held name's theme was described within the limit)")
    print("\n  last voiced, by theme and voice:")
    for k in TM:
        lv = last_voiced.get(k, {})
        print(f"    {k:<24} " + ("  ".join(f"{v}:{d}" for v, d in sorted(lv.items())) or "never"))

    print("\n### 4 · STRUCTURAL LANGUAGE — unmapped first (candidates for a NEW theme)\n")
    for b, v, kind, q, mapped in sorted(roles, key=lambda r: bool(r[4])):
        tag = "UNMAPPED" if not mapped else "maps: " + ",".join(mapped[:3])
        print(f"  [{kind}] {v} · {b} · {tag}\n    {q[:280]}\n")

    print("### 5 · NAME HINTS (Visser, Camillo) — pointers for derivation, never inputs\n")
    for t, h in sorted(hints.items(), key=lambda r: -r[1]["n"]):
        st = "HELD" if t in BOOK else "hint"
        print(f"  {t:<14} {h['n']:>3}x  {st:<5} {h['label']:<22} voices: {','.join(sorted(h['v']))}")


if __name__ == "__main__":
    main()
