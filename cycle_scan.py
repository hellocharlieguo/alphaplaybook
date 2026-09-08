#!/usr/bin/env python3
"""
cycle_scan.py — the nomination sweep. Queue item 17.

Every other step of the weekly cycle greps for things ALREADY IN THE BOOK, to
confirm or refute twelve existing seats. That direction is blind by construction
to anything L1 names that has no seat. On 2026-09-07 Visser split crypto into
three roles — Bitcoin collateral, Ethereum trust, Solana speed — and Solana was
invisible to the method because nothing pointed at it. This runs the other way.

    cd ~/Desktop/alphaplaybook
    python3 cycle_scan.py transcripts/9_5_26_Pomp_Visser_Podcast ...
    python3 cycle_scan.py --dir ~/Desktop/transcripts --since 9_1

Read-only. Prints a report; writes nothing.

Transcripts garble proper nouns, so grepping the correct spelling silently
returns zero: "Salana" for Solana, "Marll" for Marvell, "Dra Miller" for
Druckenmiller. ALIASES carries the garbled forms. Grow it every week — an alias
that is missing is a name that cannot be found.
"""
import argparse, os, re, sys
from collections import defaultdict

# ---- the book: names with a seat. Nothing here is a nomination. -------------
BOOK = {"AIPO", "SOXX", "GLW", "ASML", "COPX", "AMZN", "LLY",
        "HOOD", "ETHA", "GLDM", "IBIT", "SLV"}

# ---- already tracked as candidates: reported, but ranked below fresh names --
TRACKED = {"MU", "WDC", "SNDK", "SKHY", "NVDA", "MRVL", "SGOV", "BSOL", "GSOL",
           "COHR", "LITE", "AAOI", "MSTR", "TEM", "PLTR", "VST", "COIN", "CRCL",
           "DELL", "INTC", "RDDT", "SOFI", "ARM", "ABCL", "UPST", "BE", "FLNC",
           "SIL", "TTWO", "CRWV", "SPCX"}

# ---- alias table. LHS is a case-insensitive regex matched on cleaned text. --
# Include every garbling actually observed; a missing alias is a missed name.
ALIASES = [
    (r"\bsol[ao]na\b|\bsalana\b|\bsolona\b|\bsaul[ao]na\b", "SOL", "Solana"),
    (r"\bmarvell?\b|\bmarll\b|\bmarvel\b", "MRVL", "Marvell"),
    (r"\bmicron\b", "MU", "Micron"),
    (r"\bnvidia\b|\benvidia\b", "NVDA", "Nvidia"),
    (r"\bethereum\b|\bether\b(?!eal)", "ETHA", "Ethereum"),
    (r"\bbitcoin\b", "IBIT", "Bitcoin"),
    (r"\brobin ?hood\b", "HOOD", "Robinhood"),
    (r"\bamazon\b", "AMZN", "Amazon"),
    (r"\beli lilly\b|\blilly\b", "LLY", "Eli Lilly"),
    (r"\bcorning\b", "GLW", "Corning"),
    (r"\bcoinbase\b", "COIN", "Coinbase"),
    (r"\bcircle\b", "CRCL", "Circle"),
    (r"\bpalantir\b", "PLTR", "Palantir"),
    (r"\bvistra\b", "VST", "Vistra"),
    (r"\bcoreweave\b|\bcore weave\b", "CRWV", "CoreWeave"),
    (r"\bmicrostrategy\b|\bmicro strategy\b|\bstrategy inc\b", "MSTR", "MicroStrategy"),
    (r"\bbitmine\b", "BMNR", "Bitmine"),
    (r"\bbroadcom\b", "AVGO", "Broadcom"),
    (r"\bwestern digital\b", "WDC", "Western Digital"),
    (r"\bsandisk\b|\bsan disk\b", "SNDK", "SanDisk"),
    (r"\btake.?two\b", "TTWO", "Take-Two"),
    (r"\bcloudflare\b", "NET", "Cloudflare"),
    (r"\bcrowdstrike\b|\bcrowd strike\b", "CRWD", "CrowdStrike"),
    (r"\bmeta\b(?!l|phor|bolic)", "META", "Meta"),
    (r"\btesla\b", "TSLA", "Tesla"),
    (r"\bapple\b", "AAPL", "Apple"),
    (r"\bmicrosoft\b", "MSFT", "Microsoft"),
    (r"\bgoogle\b|\balphabet\b", "GOOGL", "Alphabet"),
    (r"\bstripe\b", "PRIV:STRIPE", "Stripe (private)"),
    (r"\bmoonpay\b|\bmoon pay\b", "PRIV:MOONPAY", "MoonPay (private)"),
    (r"\banthropic\b", "PRIV:ANTHROPIC", "Anthropic (private)"),
    (r"\bopen ?ai\b", "PRIV:OPENAI", "OpenAI (private)"),
    (r"\bxai\b|\bx\.ai\b|\bgrok\b", "PRIV:XAI", "xAI / Grok (private)"),
    (r"\bripple\b|\bxrp\b", "XRP", "XRP"),
    (r"\bchainlink\b", "LINK", "Chainlink"),
    (r"\bdogecoin\b|\bdoge\b", "DOGE", "Dogecoin"),
    (r"\bsilver\b", "SLV", "silver"),
    (r"\bgold\b(?!man)", "GLDM", "gold"),
    (r"\bcopper\b", "COPX", "copper"),
    (r"\buranium\b", "URA", "uranium"),
    (r"\bplatinum\b", "PPLT", "platinum"),
]

# ---- language that signals a STRUCTURAL statement, not a passing mention ----
# These are where Visser's taxonomy changes. Noun-based greps miss them entirely.
ROLE_PATTERNS = [
    (r"you'?ve got \w+ (?:as|for)\b", "role assignment"),
    (r"that'?s where I(?:'ve| have)? kind of ended up", "conclusion"),
    (r"\bthe (?:three|four|two) (?:horsemen|companies|things|pillars)\b", "taxonomy"),
    (r"what (?:matters|matter) (?:the )?most\b", "ranking"),
    (r"\bthe (?:only|biggest|most important) (?:thing|way|one)\b", "superlative"),
    (r"\bI (?:am |'m )?(?:long|buying|bought|own|adding)\b", "stated position"),
    (r"\bI have more \w+ than I(?:'ve| have) ever\b", "stated position"),
    (r"\bmy (?:third|second|first) wave\b", "cycle stage"),
    (r"\bnow we'?re in\b|\bwe went to\b|\bwe'?re moving to\b", "wave transition"),
    (r"\bfastest horse\b|\bnot going to be the\b", "relative de-rate"),
]

TS = re.compile(r"[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]+")
WS = re.compile(r"\s+")
CASHTAG = re.compile(r"\$([A-Z]{1,5})\b")
BARETICK = re.compile(r"\b([A-Z]{2,5})\b")
STOP = {"AI", "US", "USA", "GDP", "CPI", "ETF", "ETFS", "CEO", "CFO", "IPO", "API",
        "OK", "TV", "PM", "AM", "UK", "EU", "FED", "SEC", "IRS", "GPU", "CPU",
        "LLM", "RSI", "DMA", "YTD", "MTD", "QTD", "YOY", "NFT", "DEFI", "TGA",
        "AND", "THE", "FOR", "BUT", "NOT", "YOU", "ALL", "NEW", "NOW", "ONE",
        "TWO", "AGI", "RWA", "L1", "L2", "PE", "PEG", "SP", "GLP"}


def clean(path):
    raw = open(path, encoding="utf-8", errors="replace").read()
    return WS.sub(" ", TS.sub("", raw))


def quote_for(text, pat, width=170):
    m = re.search(pat, text, re.I)
    if not m:
        return None
    a = max(0, m.start() - width // 2)
    return "..." + text[a:m.end() + width].strip() + "..."


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="*")
    ap.add_argument("--dir", help="scan a directory instead of listing files")
    ap.add_argument("--since", help="only files whose name contains this (e.g. 9_1)")
    ap.add_argument("--min", type=int, default=2,
                    help="mentions needed to report an untracked name (default 2)")
    a = ap.parse_args()

    files = list(a.files)
    if a.dir:
        for f in sorted(os.listdir(a.dir)):
            p = os.path.join(a.dir, f)
            if os.path.isfile(p) and (not a.since or a.since in f):
                files.append(p)
    if not files:
        sys.exit("No transcript files given. Use file paths or --dir.")

    hits = defaultdict(lambda: {"n": 0, "files": set(), "name": "", "quote": None})
    roles = []

    for path in files:
        base = os.path.basename(path)
        text = clean(path)

        for pat, tkr, label in ALIASES:
            n = len(re.findall(pat, text, re.I))
            if n:
                h = hits[tkr]
                h["n"] += n
                h["files"].add(base)
                h["name"] = label
                if not h["quote"]:
                    h["quote"] = quote_for(text, pat)

        for m in CASHTAG.finditer(text):
            t = m.group(1)
            if t not in STOP:
                h = hits[t]; h["n"] += 1; h["files"].add(base); h["name"] = h["name"] or t
        for m in BARETICK.finditer(text):
            t = m.group(1)
            if t in STOP or t in hits:
                continue
            if t in BOOK or t in TRACKED:
                h = hits[t]; h["n"] += 1; h["files"].add(base); h["name"] = h["name"] or t

        for pat, kind in ROLE_PATTERNS:
            for m in re.finditer(pat, text, re.I):
                a0 = max(0, m.start() - 90)
                roles.append((base, kind, "..." + text[a0:m.end() + 210].strip() + "..."))

    unseated = {k: v for k, v in hits.items()
                if k not in BOOK and v["n"] >= (1 if k in TRACKED else a.min)}
    fresh = {k: v for k, v in unseated.items() if k not in TRACKED}
    known = {k: v for k, v in unseated.items() if k in TRACKED}
    seated = {k: v for k, v in hits.items() if k in BOOK}

    print("=" * 74)
    print(f"NOMINATION SWEEP — {len(files)} file(s)")
    print("=" * 74)

    print(f"\n### NAMED BUT UNSEATED — not in the book, not tracked ({len(fresh)})")
    print("    These are the ones a book-first grep cannot see.\n")
    for t, v in sorted(fresh.items(), key=lambda r: -r[1]["n"]):
        print(f"  {t:<16} {v['n']:>3} mentions   {v['name']}")
        print(f"                   files: {', '.join(sorted(v['files']))}")
        if v["quote"]:
            print(f"                   {v['quote'][:230]}")
        print()
    if not fresh:
        print("  (none)\n")

    print(f"### NAMED, ALREADY ON THE WATCHLIST ({len(known)})\n")
    for t, v in sorted(known.items(), key=lambda r: -r[1]["n"]):
        print(f"  {t:<8} {v['n']:>3}   {v['name']}")

    print(f"\n### BOOK NAMES — mention counts, ZERO IS THE SIGNAL ({len(BOOK)})\n")
    for t in sorted(BOOK):
        n = seated.get(t, {}).get("n", 0)
        flag = "   <-- NO MENTION THIS WINDOW" if n == 0 else ""
        print(f"  {t:<8} {n:>3}{flag}")

    print(f"\n### STRUCTURAL LANGUAGE — {len(roles)} hit(s)")
    print("    Taxonomy and ranking statements. Noun greps miss these.\n")
    for f, kind, q in roles[:24]:
        print(f"  [{kind}] {f}")
        print(f"    {q[:250]}\n")
    if len(roles) > 24:
        print(f"  ... {len(roles)-24} more\n")


if __name__ == "__main__":
    main()
