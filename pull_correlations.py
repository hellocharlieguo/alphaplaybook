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

BASE_SYMS = ["AIPO","SOXX","GLW","ASML","COPX","AMZN","LLY","HOOD","ETHA","GLDM","IBIT","SLV","GSOL",
             "MU","WDC","SNDK","COHR","LITE","AAOI"]   # book + standing screen

def theme_map_syms(path="theme_map.json"):
    """Derived vehicles (workflow 5.11): candidate / watch entries, no private names."""
    try:
        tm = json.load(open(path)).get("themes", {})
    except Exception as e:
        print(f"  theme_map.json not read ({e}) - base universe only"); return []
    return sorted({s for t in tm.values() for s, st in t.get("vehicles", {}).items()
                   if st in ("candidate", "watch") and not s.startswith("PRIV:")})

SYMS = list(dict.fromkeys(BASE_SYMS + theme_map_syms()))
MIN_PAIR = 200            # common sessions below this = flagged, still written
META = "corr_meta.json"   # sidecar: sessions per symbol and per pair
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
            print(f"  {s:<6}FAIL {type(e).__name__} - dropped")
        time.sleep(0.35)
    if len(D)<4: raise SystemExit("ABORT: too few symbols fetched")
    syms=list(D)

    # PAIRWISE alignment (queue 20): each pair on its own common dates. A short
    # history shortens only its own pairs, never the whole matrix.
    def pair_returns(a,b):
        common=sorted(set(D[a]) & set(D[b]))
        ra=[math.log(D[a][common[i]]/D[a][common[i-1]]) for i in range(1,len(common))]
        rb=[math.log(D[b][common[i]]/D[b][common[i-1]]) for i in range(1,len(common))]
        return ra,rb

    def corr(x,y):
        n=len(x)
        if n<3: return None
        mx,my=sum(x)/n,sum(y)/n
        dx=math.sqrt(sum((v-mx)**2 for v in x)); dy=math.sqrt(sum((v-my)**2 for v in y))
        return None if dx==0 or dy==0 else sum((x[i]-mx)*(y[i]-my) for i in range(n))/(dx*dy)

    out={lbl:{a:{} for a in syms} for lbl in WINDOWS}
    pairn={}; short=[]
    for i,a in enumerate(syms):
        for lbl in WINDOWS: out[lbl][a][a]=1.0
        for b in syms[i+1:]:
            ra,rb=pair_returns(a,b); pairn[f"{a}|{b}"]=len(ra)
            if len(ra)<MIN_PAIR: short.append((a,b,len(ra)))
            for lbl,w in WINDOWS.items():
                x,y=(ra[-w:],rb[-w:]) if w else (ra,rb)
                c=corr(x,y); c=0.0 if c is None else round(c,4)
                out[lbl][a][b]=c; out[lbl][b][a]=c
    json.dump(out, open(OUT,"w"))
    json.dump({"generated": time.strftime("%Y-%m-%d %H:%M"), "min_pair": MIN_PAIR,
               "closes": {s: len(D[s]) for s in syms}, "pair_sessions": pairn},
              open(META,"w"), indent=1)
    ns=sorted(pairn.values())
    print(f"\nwrote {OUT} - {len(syms)} symbols, pairwise sessions {ns[0]}..{ns[-1]}, windows {list(WINDOWS)}")
    print(f"wrote {META} - session counts per symbol and pair")
    if short:
        print(f"\n  {len(short)} pair(s) under {MIN_PAIR} common sessions (written, but read with care):")
        for a,b,n in sorted(short,key=lambda r:r[2])[:12]: print(f"    {a}-{b}: {n}")
    for lbl in out:
        print(f"  {lbl}: AIPO-SOXX {out[lbl]['AIPO']['SOXX']:.2f}  "
              f"AMZN-LLY {out[lbl]['AMZN']['LLY']:.2f}  GLDM-SLV {out[lbl]['GLDM']['SLV']:.2f}")
    print("\nNext: python3 inject_corr.py v34_worksheet.html  (the worksheet reads its embedded copy)")

if __name__=="__main__": main()
