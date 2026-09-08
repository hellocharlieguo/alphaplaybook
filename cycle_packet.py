#!/usr/bin/env python3
"""
cycle_packet.py — gather one week's repo state into a single uploadable file.

Read-only against every existing repo file. The only thing it writes is its own
output under packet/. It NEVER calls pull_correlations.py: that script mutates
corr_matrix.json, and a "gather state" step must not change state.

    cd ~/Desktop/alphaplaybook
    python3 cycle_packet.py              # offline, uses the last cached capture
    python3 cycle_packet.py --pull       # also runs pull_candidates.cjs (network)

Every section is independently guarded. A missing or restructured file degrades
that section to a raw grep and a loud marker; it never aborts the packet.
"""
import argparse, json, os, re, subprocess, sys, time
from datetime import datetime, timezone

TODAY = datetime.now().strftime("%Y-%m-%d")
OUTDIR = "packet"
OUT = os.path.join(OUTDIR, f"cycle_{TODAY}.md")
CAND_CACHE = os.path.join(OUTDIR, f"candidates_{TODAY}.txt")

WORKSHEET = "v34_worksheet.html"
CRON = "server/daily-cron.cjs"
VOICECARDS = "src/data/voiceCards.ts"
RADAR = "src/components/SignalRadar.tsx"
SYSMAP = "src/data/systemMap.ts"
CORRJSON = "corr_matrix.json"

BOOK_TRENDS = {
    "1 AI buildout": ["AIPO", "SOXX", "GLW", "ASML", "COPX"],
    "2 AI applied": ["AMZN", "LLY"],
    "3 Tokenized rails": ["HOOD", "ETHA"],
    "4 Monetary": ["GLDM", "IBIT", "SLV"],
}

# Open queue items -> (label, file, pattern that means STILL OPEN)
QUEUE = [
    ("3  KXFEAR floor 0.95 too high", "probe_fear_guards.cjs", r"0\.95"),
    ("3b probe prints stale band", "probe_fear_guards.cjs", r"0\.97"),
    ("4  probe_source.cjs is a stub", "probe_source.cjs", r"(?i)stub|will not execute"),
    ("8  HistoryLog.tsx orphaned", "src/components/HistoryLog.tsx", r"."),
    ("9  actions/checkout not @v5", ".github/workflows", r"checkout@v[1-4]"),
    ("20 corr truncates to shortest", "pull_correlations.py", r"set\.intersection"),
    ("21 .bak files inside src/", "src/data", r"\.bak"),
    ("23 pull_candidates TICKERS stale", "pull_candidates.cjs", r"SKHY"),
]

buf = []
def w(s=""): buf.append(s)
def sh(cmd):
    try:
        r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=120)
        return (r.stdout + r.stderr).rstrip()
    except Exception as e:
        return f"[command failed: {e}]"
def read(p):
    try:
        return open(p, encoding="utf-8", errors="replace").read()
    except Exception:
        return None

def section(title, fn):
    w(f"\n## {title}\n")
    try:
        fn()
    except Exception as e:
        w(f"**SECTION FAILED — {type(e).__name__}: {e}**")
        w("Treat this section as unknown, not as absent data.")

# ------------------------------------------------------------------ A. git
def sec_git():
    br = sh("git rev-parse --abbrev-ref HEAD")
    w(f"Branch: `{br}`\n")
    sh("git fetch --quiet origin 2>/dev/null || true")
    ahead = sh("git rev-list --count origin/HEAD..HEAD 2>/dev/null")
    behind = sh("git rev-list --count HEAD..origin/HEAD 2>/dev/null")
    if ahead.isdigit() and behind.isdigit():
        a, b = int(ahead), int(behind)
        if a or b:
            w(f"### ⚠ LOCAL vs ORIGIN: {a} ahead, {b} behind")
            w("The deployed site serves origin. Unpushed commits mean the site is stale "
              "even when everything looks committed locally.\n")
            if a:
                w("```")
                w(sh("git log origin/HEAD..HEAD --oneline"))
                w("```")
        else:
            w("Local and origin are in sync.\n")
    else:
        w("_Could not compare to origin (no remote, or fetch blocked)._\n")
    w("```")
    w("$ git status --porcelain")
    w(sh("git status --porcelain") or "(clean)")
    w("\n$ git log --oneline -5")
    w(sh("git log --oneline -5"))
    w("```")

# ------------------------------------------------- B. voice surfaces
def sec_voices():
    w("Four surfaces carry voice/theme content. They drift independently; "
      "disagreement here is the bug.\n")
    rows = []
    vc = read(VOICECARDS)
    if vc:
        for m in re.finditer(r"asOf:\s*'([^']*)'", vc):
            rows.append((VOICECARDS, "asOf", m.group(1)))
    else:
        rows.append((VOICECARDS, "asOf", "**FILE NOT FOUND**"))
    rd = read(RADAR)
    if rd:
        for m in re.finditer(r"name:\s*'([^']+)',\s*tag:\s*'([^']*)'", rd):
            rows.append((RADAR, f"chip {m.group(1)}", m.group(2)))
    else:
        rows.append((RADAR, "THEME_META", "**FILE NOT FOUND**"))
    sm = read(SYSMAP)
    if sm:
        for m in re.finditer(r"'(\d{4}-\d\d-\d\d-v[\d.]+[-\w]*)'", sm):
            rows.append((SYSMAP, "freeze label", m.group(1)))
    cr = read(CRON)
    if cr:
        for m in re.finditer(r"'(\d{4}-\d\d-\d\d-v[\d.]+[-\w]*)'", cr):
            rows.append((CRON, "version", m.group(1)))
    w("| file | field | value |")
    w("|---|---|---|")
    seen = set()
    for f, k, v in rows:
        if (f, k, v) in seen:
            continue
        seen.add((f, k, v))
        w(f"| `{f}` | {k} | {v} |")
    w("\n```")
    w(sh(f"grep -n \"THEME_META\" -A6 {RADAR} 2>/dev/null | head -12"))
    w("```")

# ------------------------------------------------- C. deployed book
def sec_book():
    src = read(CRON)
    if not src:
        w(f"**{CRON} NOT FOUND.**")
        return
    lab = re.findall(r"'(\d{4}-\d\d-\d\d-v[\d.]+[-\w]*)'", src)
    w(f"Freeze label: **{lab[0] if lab else 'NOT FOUND'}**\n")
    # ticker + base_weight pairs; two-space formatting on sub-10 weights is real
    pairs = re.findall(r"ticker:\s*'([A-Z]+)'[^}]*?base_weight:\s+([0-9.]+)", src, re.S)
    if not pairs:
        pairs = re.findall(r"'([A-Z]{2,5})'[^\n]*?base_weight:\s+([0-9.]+)", src)
    if pairs:
        tot = sum(float(x[1]) for x in pairs)
        w(f"{len(pairs)} names, weights sum to **{tot:.1f}**\n")
        w("| ticker | weight |")
        w("|---|---|")
        for t, v in sorted(pairs, key=lambda r: -float(r[1])):
            w(f"| {t} | {v} |")
        if abs(tot - 100.0) > 0.15:
            w(f"\n**⚠ weights sum to {tot:.2f}, not 100.**")
    else:
        w("**COULD NOT PARSE BASE_PORTFOLIO — raw grep follows.**\n```")
        w(sh(f"grep -n 'base_weight' {CRON} | head -20"))
        w("```")

# ------------------------------------------------- D. worksheet as JSON
def _extract_js_literal(src, anchor):
    i = src.index(anchor)
    j = src.index("[" if "BASE" in anchor else "{", i)
    op, cl = ("[", "]") if src[j] == "[" else ("{", "}")
    d, k = 0, j
    while k < len(src):
        if src[k] == op: d += 1
        elif src[k] == cl:
            d -= 1
            if d == 0: break
        k += 1
    return src[j:k + 1]

def sec_worksheet():
    src = read(WORKSHEET)
    if not src:
        w(f"**{WORKSHEET} NOT FOUND — canonical worksheet missing.**")
        return
    wave = re.search(r'let\s+WAVE\s*=\s*"([^"]+)"', src)
    w(f"Canonical: `{WORKSHEET}` · {src.count(chr(10))} lines")
    w(f"Adoption wave: **{wave.group(1) if wave else 'NOT FOUND'}**\n")
    try:
        base = _extract_js_literal(src, "const BASE")
        w("`BASE` array (trend, override, conviction, then sub-theme rows):\n")
        w("```json")
        w(base if len(base) < 20000 else base[:20000] + "\n... TRUNCATED ...")
        w("```")
    except Exception as e:
        w(f"**COULD NOT EXTRACT BASE ({type(e).__name__}).** Raw:\n```")
        w(sh(f"grep -n 'const BASE' -A14 {WORKSHEET} | cut -c1-200"))
        w("```")

# ------------------------------------------------- E. technicals
def sec_tech(do_pull):
    if do_pull:
        w("Ran `node pull_candidates.cjs` (network).\n")
        os.makedirs(OUTDIR, exist_ok=True)
        out = sh("node pull_candidates.cjs")
        open(CAND_CACHE, "w", encoding="utf-8").write(out)
        w(f"Captured {datetime.now(timezone.utc):%Y-%m-%d %H:%M UTC} -> `{CAND_CACHE}`\n")
        w("```")
        w(out)
        w("```")
        for bad in ("is not valid JSON", "No Twelve Data key", "Ledger read failed"):
            if bad in out:
                w(f"\n**⚠ capture contains `{bad}` — some names failed.**")
    else:
        prior = sorted(f for f in os.listdir(OUTDIR)) if os.path.isdir(OUTDIR) else []
        prior = [f for f in prior if f.startswith("candidates_")]
        if not prior:
            w("**NO TECHNICALS.** Run `python3 cycle_packet.py --pull`, or paste "
              "`node pull_candidates.cjs` output into the chat.")
            return
        last = prior[-1]
        age = last.replace("candidates_", "").replace(".txt", "")
        w(f"**CACHED capture from {age}** — not re-pulled this run.")
        if age != TODAY:
            w(f"\n**⚠ STALE: capture is from {age}, today is {TODAY}. "
              "Do not score entry bands on these.**")
        w("\n```")
        w(read(os.path.join(OUTDIR, last)) or "")
        w("```")

# ------------------------------------------------- F. correlations
def neff(C, syms):
    S = [s for s in syms if s in C]
    if len(S) < 2:
        return float(len(S) or 1), S
    # N_eff = n^2 / sum(a_ij^2) for unit-diagonal symmetric C  (trace identity)
    return len(S) ** 2 / sum(C[a][b] ** 2 for a in S for b in S), S

def sec_corr():
    raw = read(CORRJSON)
    if not raw:
        w(f"**{CORRJSON} NOT FOUND.**")
        return
    M = json.loads(raw)
    wins = list(M)
    n = len(M[wins[0]])
    w(f"`{CORRJSON}`: **{n} symbols**, windows {wins}")
    w("Session count is NOT stored in this file — it exists only in "
      "`pull_correlations.py` stdout at pull time. See queue item 20.\n")
    w("### N_eff per trend (1y)\n")
    w("| trend | names | N_eff | sqrt(n) |")
    w("|---|---|---|---|")
    for t, syms in BOOK_TRENDS.items():
        v, S = neff(M["1y"], syms)
        w(f"| {t} | {len(S)} | {v:.4f} | {len(S) ** 0.5:.4f} |")
    w("\n### Key pairs across windows\n")
    pairs = [("AIPO", "SOXX"), ("GLDM", "SLV"), ("GLDM", "IBIT"),
             ("ETHA", "IBIT"), ("HOOD", "ETHA"), ("AMZN", "LLY"), ("GSOL", "ETHA")]
    w("| pair | " + " | ".join(wins) + " |")
    w("|---|" + "---|" * len(wins))
    for a, b in pairs:
        vals = []
        for win in wins:
            try:
                vals.append(f"{M[win][a][b]:.4f}")
            except KeyError:
                vals.append("—")
        w(f"| {a}–{b} | " + " | ".join(vals) + " |")
    # drift vs the worksheet's embedded copy
    ws = read(WORKSHEET)
    if ws and "const CORR=" in ws:
        try:
            emb = json.loads(_extract_js_literal(ws, "const CORR="))
            diffs = [(a, b, emb["1y"][a][b], M["1y"][a][b])
                     for tr in BOOK_TRENDS.values() for a in tr for b in tr
                     if a < b and a in emb["1y"] and b in emb["1y"]
                     and abs(emb["1y"][a][b] - M["1y"][a][b]) > 1e-6]
            if diffs:
                w(f"\n### ⚠ WORKSHEET DRIFT — {len(diffs)} held pairs disagree\n")
                w("The worksheet computes N_eff from its own embedded copy. "
                  "Run `python3 inject_corr.py v34_worksheet.html`.\n")
                w("| pair | worksheet | corr_matrix.json |")
                w("|---|---|---|")
                for a, b, o, nn in sorted(diffs, key=lambda r: -abs(r[3] - r[2]))[:8]:
                    w(f"| {a}–{b} | {o} | {nn} |")
            else:
                w("\nWorksheet `CORR` matches `corr_matrix.json` on all held pairs.")
        except Exception as e:
            w(f"\n_Could not diff worksheet CORR ({type(e).__name__})._")

# ------------------------------------------------- G. queue
def sec_queue():
    w("| item | target | state |")
    w("|---|---|---|")
    for label, path, pat in QUEUE:
        if not os.path.exists(path):
            w(f"| {label} | `{path}` | file absent — likely CLOSED |")
            continue
        hit = sh(f"grep -rEl '{pat}' {path} 2>/dev/null")
        w(f"| {label} | `{path}` | {'STILL OPEN' if hit else 'appears closed'} |")
    w("\nUntracked files:\n```")
    w(sh("git status --porcelain | grep '^??' || echo '(none)'"))
    w("```")

# ------------------------------------------------------------------ main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pull", action="store_true",
                    help="also run pull_candidates.cjs (network, ~1 call/ticker)")
    a = ap.parse_args()

    if not os.path.exists(CRON) or not os.path.exists(WORKSHEET):
        sys.exit("ABORT: run from the repo root (server/daily-cron.cjs "
                 "and v34_worksheet.html not found here)")
    os.makedirs(OUTDIR, exist_ok=True)

    w(f"# AlphaPlaybook cycle packet — {TODAY}")
    w(f"\nGenerated {datetime.now(timezone.utc):%Y-%m-%d %H:%M UTC} by `cycle_packet.py`. "
      "Read-only; `pull_correlations.py` deliberately NOT run.")
    w("\nUpload this with the week's transcript files.")

    section("A · Git state", sec_git)
    section("B · Voice surfaces", sec_voices)
    section("C · Deployed book", sec_book)
    section("D · Canonical worksheet", sec_worksheet)
    section("E · Technicals", lambda: sec_tech(a.pull))
    section("F · Correlations", sec_corr)
    section("G · Queue checks", sec_queue)

    body = "\n".join(buf) + "\n"
    open(OUT, "w", encoding="utf-8").write(body)
    print("WROTE %s  (%s bytes)" % (OUT, format(len(body), ",")))
    if not a.pull:
        cached = [f for f in os.listdir(OUTDIR) if f.startswith("candidates_")]
        if cached:
            print("      offline run — section E used cache %s. "
                  "Use --pull for fresh technicals." % sorted(cached)[-1])
        else:
            print("      offline run — NO cached technicals exist. "
                  "Section E is empty; re-run with --pull.")

if __name__ == "__main__":
    main()
