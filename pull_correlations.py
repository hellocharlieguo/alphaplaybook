#!/usr/bin/env python3
"""
pull_correlations.py — refresh corr_matrix.json for the breadth term.

Breadth in rescore_trendfirst.py is N_eff, measured from these correlations
rather than counted as sqrt(n). That makes this file an INPUT to the book, not
a diagnostic: stale correlations mean stale trend weights.

Three windows are stored because correlations are regime-dependent and tighten
as the window shortens (measured 2026-08-23: AIPO-SOXX 0.86 at 1y, 0.91 at 3m;
GLDM-IBIT 0.28 at 1y, 0.59 at 3m). rescore_trendfirst.py reads "1y" by default.

Refresh cadence: monthly is enough. Correlations move slowly; a weekly refresh
would add noise to trend weights for no information.

Run:  cd ~/Desktop/alphaplaybook && python3 pull_correlations.py
"""
import json, math, ssl, time, urllib.request

SYMS = ["AIPO","SOXX","GLW","ASML","COPX","AMZN","LLY","HOOD","ETHA","GLDM","IBIT","SLV",
        "MU","WDC","SNDK","COHR","LITE","AAOI"]   # book + candidates worth screening
WINDOWS = {"1y": None, "6m": 125, "3m": 63}
OUT = "corr_matrix.json"

ctx = ssl.create_default_context(); ctx.check_hostname=False; ctx.verify_mode=ssl.CERT_NONE

def fetch(sym):
    url=f"https://query1.finance.yahoo.com/v8/finance/chart/{sym}?range=1y&interval=1d"
    req=urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=15, context=ctx) as r:
        j=json.load(r)
    res=j["chart"]["result"][0]
    return {t:c for t,c in zip(res["timestamp"], res["indicators"]["quote"][0]["close"]) if c is not None}

def main():
    D={}
    for s in SYMS:
        try:
            D[s]=fetch(s); print(f"  {s:<6}{len(D[s]):>5} closes")
        except Exception as e:
            print(f"  {s:<6}FAIL {type(e).__name__} — dropped")
        time.sleep(0.35)
    if len(D)<4: raise SystemExit("ABORT: too few symbols fetched")
    common=sorted(set.intersection(*[set(v) for v in D.values()]))
    R={s:[math.log(p[i]/p[i-1]) for p in [[D[s][t] for t in common]] for i in range(1,len(p))] for s in D}

    def corr(a,b,w):
        x,y=(R[a][-w:],R[b][-w:]) if w else (R[a],R[b])
        n=len(x); mx,my=sum(x)/n,sum(y)/n
        dx=math.sqrt(sum((v-mx)**2 for v in x)); dy=math.sqrt(sum((v-my)**2 for v in y))
        return sum((x[i]-mx)*(y[i]-my) for i in range(n))/(dx*dy)

    out={lbl:{a:{b:round(corr(a,b,w),4) for b in D} for a in D} for lbl,w in WINDOWS.items()}
    json.dump(out, open(OUT,"w"))
    print(f"\nwrote {OUT} — {len(D)} symbols, {len(common)} sessions, windows {list(WINDOWS)}")
    for lbl in out:
        print(f"  {lbl}: AIPO-SOXX {out[lbl]['AIPO']['SOXX']:.2f}  "
              f"AMZN-LLY {out[lbl]['AMZN']['LLY']:.2f}  GLDM-SLV {out[lbl]['GLDM']['SLV']:.2f}")

if __name__=="__main__": main()
