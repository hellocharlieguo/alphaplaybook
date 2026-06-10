# Compact conservative sleeve (sub-10): metals / BTC-proxy / oil / pharma / AI / cash
# Registers a 'conservative_compact' variant (target_top 16% — the 11% top was calibrated
# for 19 holdings and degenerates to flat weights at 9 names). MSTR manually pause-capped
# at current 4% (no cron technicals yet; BTC -50% / below 200-DMA — conservative unpause
# rule = reclaim_200dma). Remove that line once the data swap feeds MSTR DMAs.
import portfolio_normalizer as pn
pn.CFG["engine_variants"]["conservative_compact"] = {
    "target_top_pct": 16, "min_position_pct": 2.0, "cash_floor_pct": 12, "online": False,
    "note": "Sub-10 redesign 6/9/26."}
from signal_engine import SignalInput, score_ticker, apply_gates, compute_pause_caps, compute_voice_floors
import shutil; shutil.rmtree('composite_history', ignore_errors=True)
CAPEX = 77.0
def S(t,ty,s1,s2,s4,s6,lens, price=None,d50=None,d200=None,rsi=None,ret1y=None,
      mu=False,md=False, held=False,cw=None, etf=False, vc=False, s5legacy=50):
    return SignalInput(t,ty,is_etf=etf,s1_bottleneck=s1,s2_timing=s2,s5_entry_quality=s5legacy,
        s4_catalyst=s4,s6_valuation_risk=s6,lenses_pointing=lens,price=price,dma50=d50,dma200=d200,
        rsi=rsi,trailing_1y_pct=ret1y,mom_up=mu,mom_down=md,held=held,current_weight=cw,voice_conviction=vc)
BOOK=[
 S("SLV","macro_hardmoney",92,95,88,65,2, 58.99,68.75,60.87,31.54,80.45, md=True, held=True,cw=11.0,etf=True),
 S("GLDM","macro_hardmoney",88,82,78,65,2, 84.25,91.4,87.32,30.68,28.45, md=True, held=True,cw=6.0,etf=True),
 S("COPX","company",80,70,55,60,1, 80.2,83.28,72.95,42.43,85.73, held=True,cw=3.0,etf=True),
 S("GLW","company",88,85,65,60,2, 173.88,174.3,116.63,45.64,242.89, held=True,cw=5.5),
 S("MRVL","company",85,82,60,50,1, 266.88,172.61,105.56,62.28,290.46, mu=True, held=True,cw=4.5),
 S("LLY","company",45,90,72,60,2, s5legacy=80),
 S("XLE","company",50,70,75,75,2, held=True,cw=3.0,etf=True, s5legacy=70),
 S("MSTR","company",85,78,55,40,1, held=True,cw=4.0, s5legacy=38),
]
PRIOR={"SLV":82.8,"GLDM":75.8,"COPX":67.2,"GLW":74.8,"MRVL":72.4,"MSTR":71.8,"XLE":68.1}
results=[score_ticker(s,CAPEX) for s in BOOK]
results,exits,log=apply_gates(results,PRIOR)
caps=compute_pause_caps(results,sleeve="conservative_compact",exit_overrides=exits)
caps["MSTR"]=4.0   # manual pause-equivalent — delete after data swap
vf=compute_voice_floors(results,sleeve="conservative_compact")
out=pn.normalize(results,sleeve="conservative_compact",manual_overrides=exits,paused_caps=caps,voice_floors=vf)
byt={r['ticker']:r for r in results}
print(f"=== COMPACT CONSERVATIVE (k={out['convexity_k']}, sum={out['total_pct']}%) ===")
for t,wt in sorted(out['weights_pct'].items(), key=lambda x:-x[1]):
    if t=="SGOV": print(f"SGOV   cash       {wt:>5.1f}"); continue
    r=byt[t]; g="PAUSED" if t in out['paused_capped'] else ""
    print(f"{t:6} comp {r['composite']:>5.1f}  {wt:>5.1f}  {g}")
print("gate log:", log)
