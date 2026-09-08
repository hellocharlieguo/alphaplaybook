#!/usr/bin/env python3
"""
patch_packet_pullfallback.py — cycle_packet.py section E hardening.

Two bugs:
  1. `sh()` merges stdout+stderr and drops the exit code, so a failed
     pull_candidates.cjs run (missing TWELVE_DATA_KEY exits 1) still gets
     written to packet/candidates_<date>.txt as if it were data. Next week's
     offline run then reports an error message as technicals.
  2. On failure there is no fallback to the previous good capture.

After this patch section E: checks the exit code, validates the output actually
contains technicals rows, writes the cache ONLY on success, and falls back to
the newest prior capture with a loud staleness warning otherwise.

Run from repo root.
"""
import shutil, sys, time

PATH = "cycle_packet.py"
src = open(PATH, encoding="utf-8").read()

if "_looks_like_technicals" in src:
    sys.exit("ABORT: patch already applied")

START = "def sec_tech(do_pull):"
END = "# ------------------------------------------------- F. correlations"
if src.count(START) != 1 or src.count(END) != 1:
    sys.exit(f"ABORT: anchors found {src.count(START)}/{src.count(END)} times, expected 1/1")

i, j = src.index(START), src.index(END)

NEW = '''def _looks_like_technicals(text):
    """A real capture has ticker rows with px= and d50=. An error message does not."""
    return sum(1 for ln in text.splitlines() if "px=" in ln and "d50=" in ln) >= 3


def _newest_cache():
    if not os.path.isdir(OUTDIR):
        return None, None
    prior = sorted(f for f in os.listdir(OUTDIR) if f.startswith("candidates_"))
    if not prior:
        return None, None
    last = prior[-1]
    return last, last.replace("candidates_", "").replace(".txt", "")


def _emit_cache(reason):
    last, age = _newest_cache()
    if not last:
        w(f"**NO TECHNICALS.** {reason}")
        w("\\nNo prior capture exists to fall back on. Re-run with `--pull`, or paste "
          "`node pull_candidates.cjs` output into the chat. **Do not score entry "
          "bands without technicals.**")
        return
    w(f"{reason}\\n")
    w(f"**Using cached capture from {age}** (`{last}`).")
    if age != TODAY:
        w(f"\\n**STALE: capture is from {age}, today is {TODAY}. "
          "Do not score entry bands on these.**")
    w("\\n```")
    w(read(os.path.join(OUTDIR, last)) or "")
    w("```")


def sec_tech(do_pull):
    if not do_pull:
        _emit_cache("Offline run — `pull_candidates.cjs` not executed.")
        return

    os.makedirs(OUTDIR, exist_ok=True)
    w("Ran `node pull_candidates.cjs` (network).\\n")
    try:
        r = subprocess.run("node pull_candidates.cjs", shell=True,
                           capture_output=True, text=True, timeout=600)
        code, out, err = r.returncode, r.stdout, r.stderr
    except Exception as e:
        code, out, err = -1, "", f"{type(e).__name__}: {e}"

    combined = (out + ("\\n" + err if err else "")).rstrip()

    # A non-zero exit OR output that does not look like technicals is a FAILED
    # pull. Never cache it — a cached error message becomes next week's data.
    if code != 0 or not _looks_like_technicals(out):
        w(f"**PULL FAILED — exit code {code}. Cache NOT written.**\\n")
        w("Stderr / partial output:\\n```")
        w(combined[:3000] or "(no output)")
        w("```\\n")
        if "No Twelve Data key" in combined:
            w("`TWELVE_DATA_KEY` not found. Run from the repo root so `.env.local` "
              "resolves, and confirm the variable name.\\n")
        _emit_cache("Falling back to the previous capture.")
        return

    open(CAND_CACHE, "w", encoding="utf-8").write(combined)
    w(f"Captured {datetime.now(timezone.utc):%Y-%m-%d %H:%M UTC} -> `{CAND_CACHE}`\\n")
    w("```")
    w(combined)
    w("```")

    # Partial failures: the pull succeeded overall but individual names errored.
    for bad in ("is not valid JSON", "Ledger read failed", "NO-DMA"):
        if bad in combined:
            w(f"\\n**Capture contains `{bad}` — some names are incomplete. "
              "Check before scoring those rows.**")
    if err.strip():
        w("\\n**Non-fatal stderr during pull:**\\n```")
        w(err.strip()[:1500])
        w("```")


'''

src = src[:i] + NEW + src[j:]

# console summary must reflect what actually happened
OLDMSG = '''    if not a.pull:
        print("      offline run — section E used the cached capture. "
              "Use --pull for fresh technicals.")'''
NEWMSG = '''    if not a.pull:
        last, age = _newest_cache()
        if last:
            print("      offline run — section E used cache %s. "
                  "Use --pull for fresh technicals." % last)
        else:
            print("      offline run — NO cached technicals exist. "
                  "Section E is empty; re-run with --pull.")'''
if src.count(OLDMSG) == 1:
    src = src.replace(OLDMSG, NEWMSG, 1)
    msg = "console summary also fixed"
else:
    msg = "console summary already patched or restructured — left alone"

bak = f"{PATH}.bak.{time.strftime('%Y%m%d-%H%M%S')}"
shutil.copy2(PATH, bak)
open(PATH, "w", encoding="utf-8").write(src)
print(f"OK  backup={bak}")
print(f"    section E rewritten; {msg}")
