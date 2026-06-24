import signal_engine as se   # s5_ladder.enabled already True in config
from signal_engine import SignalInput, score_ticker, apply_gates, compute_pause_caps, compute_voice_floors, save_composites
from portfolio_normalizer import normalize
import shutil; shutil.rmtree('composite_history', ignore_errors=True)
CAPEX = 77.0

# Phase 2.5 rescore. S1/S2/S4/S6/lenses = transcript-derived (carry from draft).
# S5 = auto from the DMA ladder on REAL 6/9 technicals. BE voice_conviction=True.
# fields: t,ty, s1,s2,s4,s6,lens,vc, price,d50,d200,rsi,ret1y, mu,md, held,cw, etf, s5legacy
def S(t,ty,s1,s2,s4,s6,lens, price=None,d50=None,d200=None,rsi=None,ret1y=None,
      mu=False,md=False, held=False,cw=None, etf=False, vc=False, s5legacy=50):
    return SignalInput(t,ty,is_etf=etf,s1_bottleneck=s1,s2_timing=s2,s5_entry_quality=s5legacy,
        s4_catalyst=s4,s6_valuation_risk=s6,lenses_pointing=lens,price=price,dma50=d50,dma200=d200,
        rsi=rsi,trailing_1y_pct=ret1y,mom_up=mu,mom_down=md,held=held,current_weight=cw,voice_conviction=vc)

BOOK=[
 S("SLV","macro_hardmoney",92,95,88,65,2, 58.99,68.75,60.87,31.54,80.45, md=True, held=True,cw=18.0,etf=True),
 S("CEG","company",        90,62,60,60,2, 251.61,287.4,321.15,35.44,-15.79, md=True, held=True,cw=12.0),
 S("WGMI","company",       85,70,65,55,1, 63.14,53.33,46.37,52.9,222.64, held=True,cw=10.0,etf=True),
 S("AIPO","company",       78,65,60,62,2, 30.93,30.41,25.36,44.36,None, md=True, held=True,cw=10.0,etf=True),
 S("IBIT","macro_hardmoney",90,80,85,62,2, 35.15,42.07,50.18,27.62,-40.69, md=True, held=True,cw=6.5,etf=True),
 S("GLDM","macro_hardmoney",88,82,78,65,2, 84.25,91.4,87.32,30.68,28.45, md=True, held=True,cw=6.0,etf=True),
 S("GLW","company",        88,85,65,60,2, 173.88,174.3,116.63,45.64,242.89, held=True,cw=5.0),
 S("TXN","company",        80,60,55,58,1, 288.64,266.73,206.83,48.42,50.01, held=True,cw=4.0),
 S("FLNC","company",       82,60,60,58,1, 23.47,17.41,17.49,54.97,397.14, mu=True, held=True,cw=4.0),
 S("BE","company",         82,60,65,35,3, 259.44,241.88,146.3,46.55,1091.18, md=True, held=True,cw=4.0, vc=True),
 S("MRVL","company",       85,82,60,50,1, 266.88,172.61,105.56,62.28,290.46, mu=True, held=True,cw=4.0),
 S("ETHA","macro_hardmoney",85,78,72,60,1, 12.51,16.35,22.28,26.41,-33.52, md=True, held=True,cw=3.0,etf=True),
 S("ENTG","company",       80,68,55,58,1, 134.34,137.6,108.95,47.58,71.2, md=True, held=True,cw=2.5),
 S("COPX","company",       80,70,55,60,1, 80.2,83.28,72.95,42.43,85.73, held=True,cw=2.5,etf=True),
 S("HOOD","company",       55,75,65,55,3, 83.77,78.9,103.08,52.52,11.87, mu=True, held=True,cw=2.0),
 S("XSD","company",        75,65,50,55,1, 577.17,493.3,371.84,52.02,145.29, held=True,cw=2.0,etf=True),
 # new application satellites — NO technicals in cron yet -> legacy hand-set S5
 S("LLY","company",        45,90,72,60,2, s5legacy=80),
 S("AMZN","company",       40,75,60,55,2, s5legacy=50),
]
PRIOR={"SLV":82.8,"CEG":83.9,"WGMI":79.0,"AIPO":79.0,"IBIT":76.2,"GLDM":75.8,"GLW":74.8,
       "TXN":73.1,"FLNC":72.8,"BE":72.4,"MRVL":72.4,"ETHA":69.5,"ENTG":69.2,"COPX":67.2,
       "HOOD":58.4,"XSD":51.2}

results=[score_ticker(s,CAPEX) for s in BOOK]
results,exits,log=apply_gates(results,PRIOR)
caps=compute_pause_caps(results,sleeve="aggressive",exit_overrides=exits)
vf=compute_voice_floors(results,sleeve="aggressive")
out=normalize(results,sleeve="aggressive",manual_overrides=exits,paused_caps=caps,voice_floors=vf)

CUR={"SLV":18,"CEG":12,"WGMI":10,"AIPO":10,"IBIT":6.5,"GLDM":6,"GLW":5,"TXN":4,"FLNC":4,
     "BE":4,"MRVL":4,"ETHA":3,"ENTG":2.5,"COPX":2.5,"HOOD":2,"XSD":2,"SGOV":4.5}
byt={r['ticker']:r for r in results}
print(f"\n=== PHASE 2.5 AGGRESSIVE (k={out['convexity_k']}, sum={out['total_pct']}%) ===")
print(f"{'TKR':5}{'comp':>6}{'S5':>5}{'cur':>6}{'new':>7}  gate")
for t,wt in out['weights_pct'].items():
    if t=="SGOV":
        print(f"{'SGOV':5}{'':>6}{'':>5}{CUR.get('SGOV',0):>6}{wt:>7.1f}  cash"); continue
    r=byt.get(t); cur=CUR.get(t,'—')
    g=""
    if t in exits: g="EXIT"
    elif t in out['paused_capped']: g="PAUSED(below-200)"
    if t in out.get('voice_floor_bound',[]): g=(g+" VOICE-FLOOR").strip()
    s5=r['sub_scores']['S5'] if r else 0
    print(f"{t:5}{r['composite']:>6.1f}{s5:>5.0f}{str(cur):>6}{wt:>7.1f}  {g}")
print("dropped:",out['dropped_avoid_exit']," paused:",out['paused_capped']," voicefloor:",out['voice_floored'],"(bound:",out.get('voice_floor_bound',[]),")")
import json; json.dump({t:round(w,1) for t,w in out['weights_pct'].items()}, open('agg_weights.json','w'))
