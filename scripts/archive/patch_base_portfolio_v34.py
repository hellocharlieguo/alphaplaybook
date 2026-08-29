#!/usr/bin/env python3
"""Freeze v3.4 trend-first into server/daily-cron.cjs.

  version   2026-07-15-v3.3-coresat  ->  2026-08-24-v3.4-trendfirst
  holdings  14 -> 12   (SKHY and SGOV retired)
  weights   from v34_worksheet_2026-08-24.html, Tokenized rails conviction = strong

TWO SETTINGS SHIPPED AS-IS, both one line to reverse:
  * hard-money sleeve cap OFF  -> GLDM+IBIT+SLV = 30.4%
  * no cash line               -> SGOV 6.0% retired, cash floor guard removed

Technicals: Friday 2026-08-21 closes. IBIT is +0.9% over its 200-DMA,
GLDM +1.6%, ETHA +1.7% — 30.3% of the book is one session from an S5 band change.

Discipline: anchored find-replace, count==1 abort, .bak.<ts>, structure-preserving.
Writes nothing unless every anchor resolves uniquely. Run `node --check` after.
"""
import sys, os, re, shutil, datetime

PATH = sys.argv[1] if len(sys.argv) > 1 else "server/daily-cron.cjs"
OLD_VERSION = "2026-07-15-v3.3-coresat"
NEW_VERSION = "2026-08-24-v3.4-trendfirst"

# ticker -> (weight, theme, min_weight, action)
BOOK = [
    ("LLY",  13.4, "AI Applied",      "Hold"),
    ("AMZN", 13.3, "AI Applied",      "Hold"),
    ("IBIT", 12.5, "Monetary",        "Add"),
    ("GLDM", 11.5, "Monetary",        "Add"),
    ("ETHA",  9.6, "Tokenized Rails", "Add"),
    ("HOOD",  8.3, "Tokenized Rails", "Add"),
    ("SLV",   6.4, "Monetary",        "Hold"),
    ("AIPO",  6.3, "AI Buildout",     "Trim"),
    ("GLW",   5.0, "AI Buildout",     "Hold"),
    ("ASML",  5.0, "AI Buildout",     "Trim"),
    ("SOXX",  4.6, "AI Buildout",     "Trim"),
    ("COPX",  4.1, "AI Buildout",     "Hold"),
]

HEADER = f"""// v3.4 TREND-FIRST — frozen {datetime.date.today()}.
// Cascade: name = 55 x timing x quality x wave_demand x entry_band(S5);
//          trend = derived_timing x conviction x breadth(N_eff);
//          weight = trend_weight x (name score / sum in trend).
// Canonical: v34_worksheet_2026-08-24.html   Spec: Trend_First_Spec.md
// 12 holdings. No cash line. Hard-money sleeve cap OFF (GLDM+IBIT+SLV = 30.4%).
// Retired this freeze: SKHY (unscoreable, no SMA50 until ~Sept 18), SGOV (no cash
// row in the cascade), MU + WDC (dropped 8/23 on measured redundancy).
"""


def build_block():
    w = max(len(t) for t, *_ in BOOK)
    lines = [HEADER + "const BASE_PORTFOLIO = {"]
    for tkr, wt, theme, action in BOOK:
        mn = round(wt * 0.5, 1)
        th = f"'{theme}',"
        lines.append(
            f"  {tkr + ':':<{w+2}} {{ base_weight: {wt:>4}, "
            f"theme: {th:<20} min_weight: {mn:>4}, "
            f"action: '{action}' }},"
        )
    lines.append("}")
    lines.append("")
    lines.append("// SGOV left the book 2026-08-24 (v3.4 has no cash row) but the momentum")
    lines.append("// sleeve still settles its cash residual in SGOV, so it must stay PRICED.")
    lines.append("// Without this the fetch list drops it, prices['SGOV'] is undefined, and")
    lines.append("// the `?? 0` at the cash line silently pays 0% on the residual forever.")
    lines.append("const PRICE_EXTRAS = ['SGOV']")
    return "\n".join(lines)


def main():
    if not os.path.exists(PATH):
        sys.exit(f"ABORT: {PATH} not found. Run from the repo root.")
    src = open(PATH, encoding="utf-8").read()

    total = sum(w for _, w, _, _ in BOOK)
    if abs(total - 100.0) > 0.05:
        sys.exit(f"ABORT: weights sum to {total}, not 100.0")

    # --- 1. BASE_PORTFOLIO block -------------------------------------------
    m = re.search(r"(?:^//[^\n]*\n)*const BASE_PORTFOLIO = \{.*?\n\}", src,
                  re.S | re.M)
    if not m:
        sys.exit("ABORT: could not locate the BASE_PORTFOLIO block.")
    if len(re.findall(r"const BASE_PORTFOLIO = \{", src)) != 1:
        sys.exit("ABORT: BASE_PORTFOLIO declared more than once.")
    old_block = m.group(0)
    held = re.findall(r"^\s{2}([A-Z]{2,5}):\s*\{", old_block, re.M)
    print(f"  found {len(held)} existing holdings: {', '.join(held)}")
    src = src.replace(old_block, build_block(), 1)

    # --- 2. PORTFOLIO_VERSION ----------------------------------------------
    n = src.count(OLD_VERSION)
    if n < 1:
        sys.exit(f"ABORT: version string '{OLD_VERSION}' not present. "
                 "Already frozen, or the deployed version differs.")
    src = src.replace(OLD_VERSION, NEW_VERSION)
    print(f"  version bumped in {n} place(s) -> {NEW_VERSION}")

    # --- 3. SGOV cash-floor guard ------------------------------------------
    # Leaving this in place dereferences undefined once SGOV leaves the book
    # and kills the 7pm run outright.
    guard = re.search(
        r"\n[^\n]*//[^\n]*[Ee]nforce SGOV floor[^\n]*\n"
        r"\s*if \(portfolio\['SGOV'\][^\n]*\n[^\n]*\n\s*\}", src)
    if guard:
        src = src.replace(guard.group(0),
                          "\n  // SGOV cash floor removed 2026-08-24: v3.4 has no cash row.", 1)
        print("  ok  SGOV cash-floor guard removed")
    else:
        stray = [i + 1 for i, l in enumerate(src.split("\n"))
                 if "SGOV" in l and "portfolio[" in l]
        if stray:
            sys.exit(f"ABORT: SGOV floor guard not matched, but SGOV is still "
                     f"dereferenced at line(s) {stray}. Patch by hand — shipping "
                     f"this would crash the nightly run.")
        print("  ok  no SGOV cash-floor guard found")

    # --- 4. residual SGOV / SKHY references --------------------------------
    resid = [i + 1 for i, l in enumerate(src.split("\n"))
             if re.search(r"\bSKHY\b", l) and not l.lstrip().startswith("//")]
    if resid:
        print(f"  WARN: SKHY still referenced at line(s) {resid} — review before push.")

    # --- 4. keep SGOV priced -----------------------------------------------
    fetch_old = re.search(
        r"( *)const tickers = Object\.keys\(portfolio\)\n(\s*)const prices = "
        r"await fetchCurrentPrices\(tickers\)", src)
    if not fetch_old:
        sys.exit("ABORT: price-fetch anchor not found. Without it SGOV stops being "
                 "priced and the momentum cash residual silently earns 0%.")
    if len(re.findall(r"const tickers = Object\.keys\(portfolio\)", src)) != 1:
        sys.exit("ABORT: price-fetch anchor is not unique.")
    ind = fetch_old.group(1)
    src = src.replace(fetch_old.group(0),
        f"{ind}// PRICE_EXTRAS keeps SGOV priced after it left BASE_PORTFOLIO (2026-08-24).\n"
        f"{ind}const tickers = [...new Set([...Object.keys(portfolio), ...PRICE_EXTRAS])]\n"
        f"{fetch_old.group(2)}const prices = await fetchCurrentPrices(tickers)", 1)
    print("  ok  SGOV kept in the price fetch via PRICE_EXTRAS")

    # sanity: the cash line must still be able to resolve a price
    if "prices['SGOV']" in src and "PRICE_EXTRAS" not in src:
        sys.exit("ABORT: SGOV still read from prices but PRICE_EXTRAS missing.")

    bak = f"{PATH}.bak.{datetime.datetime.now():%Y%m%d%H%M%S}"
    shutil.copy2(PATH, bak)
    open(PATH, "w", encoding="utf-8").write(src)
    print(f"\n  backup: {bak}")
    print(f"  wrote:  {PATH}")
    print("\nNEXT:  node --check server/daily-cron.cjs")


if __name__ == "__main__":
    main()
