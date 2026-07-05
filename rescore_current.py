"""
rescore_current.py — CURRENT 13-name sleeve (AI Compute / AI Application / Tokenization /
Monetary Scarcity / Cash). Built 2026-07-03.
  - Technicals: live from pull_candidates.cjs (7/3 run).
  - lenses_pointing + voice_conviction: ledger-derived. NARROW vc — only names a voice
    ACTIVELY re-endorsed carry the floor (HOOD/AMZN via Camillo; LLY via Visser's loud
    June conviction). Passive book membership does NOT arm the floor.
  - s1/s2/s4/s6: FRESH June thesis (drafted — confirm/adjust). NOT the stale 6/9 scores.
"""
from signal_engine import SignalInput, score_ticker

CAPEX = 77.0   # GREEN regime (x1.0). CPI 3.9% < 4% -> below-4% (bullish), no negative tilt.

def S(t,ty,s1,s2,s4,s6,lens, price,d50,d200,rsi,ret1y, held=True,cw=None,etf=False,vc=False,mu=False,md=False):
    return SignalInput(t,ty,is_etf=etf,s1_bottleneck=s1,s2_timing=s2,s4_catalyst=s4,
        s6_valuation_risk=s6,lenses_pointing=lens,price=price,dma50=d50,dma200=d200,rsi=rsi,
        trailing_1y_pct=ret1y,mom_up=mu,mom_down=md,held=held,current_weight=cw,voice_conviction=vc)

BOOK = [
 # AI COMPUTE
 ("AI Compute", S("AIPO","company", 85,72,65,60, 1, 31.03,32.10,26.31,44.09,52.44, cw=18.0, etf=True)),
 ("AI Compute", S("SOXX","company", 70,60,55,55, 1, 566.32,545.63,376.37,47.30,133.88, cw=15.0, etf=True)),  # Visser TRIMMING parabolic chips
 ("AI Compute", S("GLW","company",  80,78,62,58, 1, 196.79,188.57,127.21,48.66,273.27, cw=9.0)),
 ("AI Compute", S("COPX","company", 78,70,58,60, 1, 77.05,83.48,75.16,40.88,71.22, cw=4.5, etf=True)),
 ("AI Compute", S("ASML","company", 88,70,62,55, 1, 1769.32,1647.15,1314.82,49.73,121.28, cw=4.0)),
 # AI APPLICATION
 ("AI Application", S("LLY","company",  48,90,78,60, 1, 1213.91,1054.92,985.02,67.44,55.77, cw=13.0, vc=True)),   # Visser #1 June conviction
 ("AI Application", S("AMZN","company", 42,75,62,55, 2, 242.67,255.42,232.98,48.70,10.34, cw=7.0, vc=True)),      # Visser+Camillo
 # TOKENIZATION
 ("Tokenization", S("HOOD","company", 55,78,68,55, 2, 112.73,86.58,102.37,67.01,15.05, cw=9.0, vc=True)),        # Visser+Camillo, HOT
 ("Tokenization", S("ETHA","macro_hardmoney", 55,75,72,60, 1, 12.86,14.99,20.59,45.84,-34.89, cw=2.5, etf=True)),
 # MONETARY SCARCITY
 ("Monetary Scarcity", S("SLV","macro_hardmoney",  90,80,78,62, 1, 55.02,65.02,62.50,38.17,65.52, cw=6.5, etf=True)),
 ("Monetary Scarcity", S("GLDM","macro_hardmoney", 85,78,72,65, 1, 81.54,87.60,88.28,42.14,22.67, cw=3.0, etf=True)),
 ("Monetary Scarcity", S("IBIT","macro_hardmoney", 88,75,80,62, 1, 34.87,40.28,47.89,41.51,-44.14, cw=3.0, etf=True)),
]
# SGOV = Cash residual (5.5%), not scored.

print(f"{'TKR':<6}{'theme':<18}{'lens':>4}{'Cv':>4}{'S1':>4}{'S2':>4}{'S4':>4}{'S5':>4}{'S6':>4}{'Comp':>7}{'WScr':>7}  action")
print("-"*92)
rows=[]
for theme,s in BOOK:
    r=score_ticker(s,CAPEX); ss=r['sub_scores']
    paused = " PAUSED<200" if r['technicals']['below_200'] else ""
    fl = " Sfloor" if r.get('s5_floored') else ""
    rows.append((theme,s,r))
    print(f"{s.ticker:<6}{theme:<18}{s.lenses_pointing:>4}{ss['convergence']:>4}{ss['S1']:>4}{ss['S2']:>4}{ss['S4']:>4}{ss['S5']:>4}{ss['S6']:>4}{r['composite']:>7}{r['weighting_score']:>7}  {r['action']}{paused}{fl}")
