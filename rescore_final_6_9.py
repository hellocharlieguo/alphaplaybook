# FINAL 6/9/26 aggressive rescore — all judgment items approved:
#  Rule C (accelerant + ETF theme coverage -> exit): CEG out
#  Conviction exits (logged rationale): TXN (thinnest Visser linkage, cooling), AMZN (evidence fail)
#  XSD kept (index-beta optionality, Charlie's call)
#  XLE replaces XOM+CVX (one-line energy hedge, Charlie's call)
#  Voice floor 3% approved. FLNC S2 70 / S4 65 per 6/7 reaffirmation. cw = 6/1 live weights.
# NOTE: Rule C is applied here by book removal; formalize in signal_engine.apply_gates +
#       signal_model_config.json "gates.rule_c" in the build session so future rescores fire it.
import portfolio_normalizer as pn
from signal_engine import SignalInput, score_ticker, apply_gates, compute_pause_caps, compute_voice_floors
import shutil; shutil.rmtree('composite_history', ignore_errors=True)
CAPEX=77.0
def S(t,ty,s1,s2,s4,s6,lens, price=None,d50=None,d200=None,rsi=None,ret1y=None,
      mu=False,md=False, held=False,cw=None, etf=False, vc=False, s5legacy=50):
    return SignalInput(t,ty,is_etf=etf,s1_bottleneck=s1,s2_timing=s2,s5_entry_quality=s5legacy,
        s4_catalyst=s4,s6_valuation_risk=s6,lenses_pointing=lens,price=price,dma50=d50,dma200=d200,
        rsi=rsi,trailing_1y_pct=ret1y,mom_up=mu,mom_down=md,held=held,current_weight=cw,voice_conviction=vc)
BOOK=[
 S("SLV","macro_hardmoney",92,95,88,65,2, 58.99,68.75,60.87,31.54,80.45, md=True, held=True,cw=18.0,etf=True),
 S("WGMI","company",85,70,65,55,1, 63.14,53.33,46.37,52.9,222.64, held=True,cw=10.5,etf=True),
 S("AIPO","company",78,65,60,62,2, 30.93,30.41,25.36,44.36,None, md=True, held=True,cw=10.5,etf=True),
 S("IBIT","macro_hardmoney",90,80,85,62,2, 35.15,42.07,50.18,27.62,-40.69, md=True, held=True,cw=7.0,etf=True),
 S("GLDM","macro_hardmoney",88,82,78,65,2, 84.25,91.4,87.32,30.68,28.45, md=True, held=True,cw=6.5,etf=True),
 S("GLW","company",88,85,65,60,2, 173.88,174.3,116.63,45.64,242.89, held=True,cw=6.0),
 S("FLNC","company",82,70,65,58,1, 23.47,17.41,17.49,54.97,397.14, mu=True, held=True,cw=4.5),
 S("BE","company",82,60,65,35,3, 259.44,241.88,146.3,46.55,1091.18, md=True, held=True,cw=2.5, vc=True),
 S("MRVL","company",85,82,60,50,1, 266.88,172.61,105.56,62.28,290.46, mu=True, held=True,cw=4.5),
 S("ETHA","macro_hardmoney",85,78,72,60,1, 12.51,16.35,22.28,26.41,-33.52, md=True, held=True,cw=3.0,etf=True),
 S("ENTG","company",80,68,55,58,1, 134.34,137.6,108.95,47.58,71.2, md=True, held=True,cw=3.0),
 S("COPX","company",80,70,55,60,1, 80.2,83.28,72.95,42.43,85.73, held=True,cw=2.5,etf=True),
 S("HOOD","company",55,75,65,55,3, 83.77,78.9,103.08,52.52,11.87, mu=True, held=True,cw=2.0),
 S("XSD","company",75,65,50,55,1, 577.17,493.3,371.84,52.02,145.29, held=True,cw=2.0,etf=True),
 S("LLY","company",45,90,72,60,2, s5legacy=80),
 S("XLE","company",50,70,75,75,2, etf=True, s5legacy=70),
]
PRIOR={"SLV":82.8,"WGMI":79.0,"AIPO":79.0,"IBIT":76.2,"GLDM":75.8,"GLW":74.8,
       "FLNC":72.8,"BE":72.4,"MRVL":72.4,"ETHA":69.5,"ENTG":69.2,"COPX":67.2,"HOOD":58.4,"XSD":51.2}
results=[score_ticker(s,CAPEX) for s in BOOK]
results,exits,log=apply_gates(results,PRIOR)
caps=compute_pause_caps(results,sleeve="aggressive",exit_overrides=exits)
vf=compute_voice_floors(results,sleeve="aggressive")
out=pn.normalize(results,sleeve="aggressive",manual_overrides=exits,paused_caps=caps,voice_floors=vf)
byt={r['ticker']:r for r in results}
print(f"=== FINAL AGGRESSIVE 6/9 (k={out['convexity_k']}, sum={out['total_pct']}%) ===")
for t,wt in sorted(out['weights_pct'].items(), key=lambda x:-x[1]):
    if t=="SGOV": print(f"SGOV   cash         {wt:>5.1f}"); continue
    r=byt[t]; g="PAUSED" if t in out['paused_capped'] else ""
    print(f"{t:6} comp {r['composite']:>5.1f}  {wt:>5.1f}  {g}")
print("gate log:", log)
import json; json.dump({t:round(w,1) for t,w in out['weights_pct'].items()}, open('agg_weights_final.json','w'))
