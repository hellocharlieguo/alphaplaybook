"""
rescore_current_v3.py — THREE-AXIS S1 rescore (offline engine). Regenerates the book
under the bottleneck/monetary/physical axis design (S1_Three_Axis_Spec.md).
  - S1 per name from s1_axes.s1_for(name, regime, cfg); application names carry hand-set S1.
  - Silver = two rows SLV_M (monetary) + SLV_P (physical), summed for the book.
  - Monetary CAP-RELAX by CPI; physical UNCAP on CapEx trigger.
  - scarcity_sleeve_cap applied post-normalize (excess reflows to non-scarcity free names).
Run in-repo next to signal_engine.py + signal_model_config.json + portfolio_normalizer.py + s1_axes.py.
"""
import json
from signal_engine import SignalInput, score_ticker, compute_pause_caps, compute_voice_floors
from portfolio_normalizer import normalize
import s1_axes
CFG=json.load(open('signal_model_config.json')); CAPEX=77.0
MON=set(CFG['three_axes']['monetary_scarcity']['names']); PHY=set(CFG['three_axes']['physical_scarcity']['names'])
SCARC=MON|PHY
# non-S1 inputs (technicals + s2/s4/s6/lens/cw). hand_s1 used only for application names (axis=None).
# (ticker, type, s2,s4,s6,lens, price,d50,d200,rsi,ret1y, cw, etf, vc, hand_s1)
BOOK=[
 ("AIPO","company",72,65,60,1, 31.03,32.10,26.31,44.09,52.44, 18.0,True,False,None),
 ("SOXX","company",60,55,55,1, 566.32,545.63,376.37,47.30,133.88, 15.0,True,False,None),
 ("GLW","company", 78,62,58,1, 196.79,188.57,127.21,48.66,273.27, 9.0,False,False,None),
 ("ASML","company",70,62,55,1, 1769.32,1647.15,1314.82,49.73,121.28, 4.0,False,False,None),
 ("LLY","company", 90,78,60,1, 1213.91,1054.92,985.02,67.44,55.77, 13.0,False,True,48),
 ("AMZN","company",75,62,55,2, 242.67,255.42,232.98,48.70,10.34, 7.0,False,True,42),
 ("HOOD","company",78,68,55,2, 112.73,86.58,102.37,67.01,15.05, 9.0,False,True,55),
 ("IBIT","macro_hardmoney",75,80,62,1, 34.87,40.28,47.89,41.51,-44.14, 3.0,True,False,None),
 ("GLDM","macro_hardmoney",78,72,65,1, 81.54,87.60,88.28,42.14,22.67, 3.0,True,False,None),
 ("ETHA","macro_hardmoney",75,72,60,1, 12.86,14.99,20.59,45.84,-34.89, 2.5,True,False,None),
 ("COPX","company",70,58,60,1, 77.05,83.48,75.16,40.88,71.22, 4.5,True,False,None),
 # silver dual rows (same technicals, cw split 3.0 monetary / 3.5 physical = 6.5 total)
 ("SLV_M","macro_hardmoney",80,78,62,1, 55.02,65.02,62.50,38.17,65.52, 3.0,True,False,None),
 ("SLV_P","macro_hardmoney",78,60,62,1, 55.02,65.02,62.50,38.17,65.52, 3.5,True,False,None),
]
CURWT={r[0]:r[11] for r in BOOK}
def build(regime):
    res=[]
    for r in BOOK:
        name=r[0]; s1=s1_axes.s1_for(name,regime,CFG); s1=r[14] if s1 is None else s1
        res.append(score_ticker(SignalInput(name,r[1],is_etf=r[12],s1_bottleneck=s1,s2_timing=r[2],
            s4_catalyst=r[3],s6_valuation_risk=r[4],lenses_pointing=r[5],price=r[6],dma50=r[7],dma200=r[8],
            rsi=r[9],trailing_1y_pct=r[10],held=True,current_weight=r[11],voice_conviction=r[13]),CAPEX))
    caps=compute_pause_caps(res,"aggressive")
    # monetary cap-relax by CPI
    m=s1_axes.cap_relax_multiple(regime["cpi"],CFG)
    for n in MON:
        if m is None: caps.pop(n,None)
        elif n in caps: caps[n]=round(CURWT[n]*m,2)
    # physical uncap on CapEx trigger
    if regime["capex_on"]:
        for n in PHY: caps.pop(n,None)
    vf=compute_voice_floors(res,"aggressive")
    w=normalize(res,sleeve="aggressive",cash_ticker="SGOV",paused_caps=caps,voice_floors=vf)['weights_pct']
    # scarcity sleeve cap
    cap=CFG['three_axes']['scarcity_sleeve_cap_pct']; sc=sum(w.get(k,0) for k in SCARC)
    if sc>cap:
        scale=cap/sc; freed=sc-cap; nonsc=[k for k in w if k not in SCARC and k!='SGOV']; base=sum(w[k] for k in nonsc) or 1
        for k in list(w):
            if k in SCARC: w[k]=round(w[k]*scale,1)
            elif k in nonsc: w[k]=round(w[k]+freed*(w[k]/base),1)
    return w
DEPLOY={"AIPO":18.0,"SOXX":15.0,"LLY":13.0,"GLW":9.0,"HOOD":9.0,"AMZN":7.0,"SLV":6.5,"SGOV":5.5,"COPX":4.5,"ASML":4.0,"GLDM":3.0,"IBIT":3.0,"ETHA":2.5}
# ---- H2 base case (primary output) ----
base={"cpi":3.9,"capex_on":False,"stages":{"AIPO":"binding","SOXX":"cooling","GLW":"cooling","ASML":"cooling"}}
w=build(base); slv=w.get('SLV_M',0)+w.get('SLV_P',0)
print("THREE-AXIS S1 — H2 2026 BASE CASE (CPI 3.9 dormant, buildout plateaued, chips cooling)\n")
print(f"{'TKR':<7}{'axis':<12}{'target':>8}{'deployed':>10}")
print("-"*40)
disp={"AIPO":"bottleneck","SOXX":"bottleneck","GLW":"bottleneck","ASML":"bottleneck","LLY":"applic.","AMZN":"applic.","HOOD":"tokeniz.","COPX":"physical","SLV_P":"physical","IBIT":"monetary","GLDM":"monetary","SLV_M":"monetary","ETHA":"monetary"}
for t in ["AIPO","GLW","ASML","SOXX","LLY","AMZN","HOOD","COPX","IBIT","GLDM","SLV_M","SLV_P","ETHA"]:
    dep = "6.5(SLVtot)" if t in ("SLV_M","SLV_P") else f"{DEPLOY.get(t,0):.1f}%"
    print(f"{t:<7}{disp[t]:<12}{w.get(t,0):>7.1f}%{dep:>10}")
print(f"{'SGOV':<7}{'cash':<12}{w.get('SGOV',0):>7.1f}%{DEPLOY['SGOV']:>9.1f}%")
print("-"*40)
print(f"SILVER total {slv:.1f}%   sum {sum(w.values()):.1f}%")
print(f"sleeves: scarcity {sum(w.get(k,0) for k in SCARC):.1f}%  AI-compute {sum(w.get(k,0) for k in ['AIPO','SOXX','GLW','ASML']):.1f}%  app/token {sum(w.get(k,0) for k in ['LLY','AMZN','HOOD']):.1f}%  cash {w.get('SGOV',0):.1f}%")
# ---- regime validation ----
print("\nregime validation (scarcity sleeve % / cap applied?):")
for lab,reg in [("base (neither)",base),
                ("CPI debasement (6%)",{"cpi":6.0,"capex_on":False,"stages":base["stages"]}),
                ("CapEx surge",{"cpi":3.9,"capex_on":True,"stages":base["stages"]}),
                ("BOTH fire",{"cpi":6.0,"capex_on":True,"stages":base["stages"]})]:
    ww=build(reg); sc=sum(ww.get(k,0) for k in SCARC)
    capped=" (capped 45)" if sc<=45.5 and (reg["cpi"]>=6 and reg["capex_on"]) else ""
    print(f"  {lab:<22} scarcity {sc:.1f}%   BTC {ww.get('IBIT',0):.1f}  gold {ww.get('GLDM',0):.1f}  SLV_P {ww.get('SLV_P',0):.1f}  COPX {ww.get('COPX',0):.1f}{capped}")
