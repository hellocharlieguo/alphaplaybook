#!/usr/bin/env python3
"""
apply_cycle_2026_11_16.py — weekly cycle 2026-11-16, STEP 1 (no prices).

Touches four files. Every edit is an anchored find-replace with a count==1 abort,
a timestamped backup OUTSIDE the repo, and a line-count report.

  src/data/voiceCards.ts          Visser + Camillo cards (asOf 11/15, wk of 11/9-11/15)
  src/components/SignalRadar.tsx  THEME_META chips
  theme_map.json                  11/16 notes; ZCSH recorded on privacy (status none, see note)
  v34_worksheet.html              11/16 data-check notes on each row (prices come in STEP 2)

Idempotent: if a file already carries its 11/16 marker it is skipped.
Compiles under Python 3.11 (no same-quote reuse inside f-strings).

    cd ~/Desktop/alphaplaybook
    python3 patches/apply_cycle_2026_11_16.py
"""
import json, os, shutil, sys, time

ROOT = os.getcwd()
STAMP = time.strftime("%Y%m%d-%H%M%S")
BACKUP = os.path.join(os.path.expanduser("~"), "Desktop", "alphaplaybook_backups", STAMP)


def need(path):
    if not os.path.exists(path):
        sys.exit("ABORT: " + path + " not found - run from the repo root")


def backup(path):
    os.makedirs(BACKUP, exist_ok=True)
    dst = os.path.join(BACKUP, path.replace("/", "__") + ".bak." + STAMP)
    shutil.copy2(path, dst)
    return dst


def one(src, anchor, label):
    n = src.count(anchor)
    if n != 1:
        sys.exit("ABORT [" + label + "]: anchor found " + str(n) + " times, expected 1")
    return src.index(anchor)


def report(path, before, after):
    print("  %-34s lines %d -> %d" % (path, before.count("\n"), after.count("\n")))


# ---------------------------------------------------------------------------
# 1. voiceCards.ts
# ---------------------------------------------------------------------------
VC = "src/data/voiceCards.ts"

VC_COMMENT = """// 2026-11-16 weekly cycle — CONFIRM THE BOOK pending the 11/16 packet (v3.16).
// New transcripts (private repo alphaplaybook-transcripts): Visser 11/14 (Pomp), 11/15 (solo, crypto);
// Camillo: Grok 11/9-11/15 and the 11/4 Decoded Genius interview. Cards stay pure summaries.
//
"""

VC_BLOCK = r"""export const VOICES: VoiceSection[] = [
  {
    name: 'Visser',
    headline: 'LONG SPEED, SHORT FRICTION',
    subtitle: 'Jordi Visser — macro framework for the AI and crypto economy',
    asOf: 'November 15, 2026',
    active: true,
    themes: [
      {
        name: 'The framework',
        editorial: `"AI is inevitable. Tokenization is inevitable. Agentic commerce is inevitable." In under a week Jensen Huang went from scandal to resignation at Nvidia, and Fed governor Christopher Waller floated a half-point hike that drove the largest weekly jump in two-year Treasury yields since 2022. The S&P 500 still finished about 2.5% from its record, and he reads a market that shrugs off bad news as a good sign. His lesson from 2007 to 2022: once the iPhone arrived, following the Fed and the daily macro news made no one money; exponential innovation carried everything. He sees a bottom forming. Over two days, safe "quality" stocks lagged riskier ones by about 16%, a swing he has seen only in March 2009, March and June 2020, and November 2022. Taiwan and Korea stepped in to support their stock markets, which need higher prices to raise money for AI. He calls the Democrats' sweep bullish because it takes away the risk of a bubble and pushes Asia to move faster. Next up: Anthropic's IPO, Nvidia's earnings and the December Fed meeting.`,
        tickers: [],
        curated: true,
      },
      {
        name: 'AI Buildout',
        editorial: `He compares Huang's exit to Steve Jobs, who was already ill when the iPhone launched; the product carried Apple regardless. Analysts cut their Nvidia price targets but "no one changed their earnings forecasts," and he expects the story to fade if the company keeps delivering. He had put "a good amount of money" into his chip names the week before. In his view the fall in AI stocks since the summer came from a flood of new shares hitting investors who were already fully invested — Google's roughly $80 billion sale, SpaceX, and now Anthropic coming at about $1.5 trillion, well below earlier talk of $2 to $3 trillion — not from a bubble bursting. If the U.S. slows data-center building, he says other countries will take it in exchange for access to the computing power. Memory chip prices are now about 250% above a year ago, down from about 900% earlier this year, and still falling.`,
        tickers: ['NVDA'],
        curated: true,
      },
      {
        name: 'AI Applied',
        editorial: `Hackers now use AI to get through layered defenses in days rather than months, so he expects "AI fighting with AI" to become the only workable defense, with swarms of AI agents hunting for breaches as they happen. He tied the $6 billion Binance theft to human error as much as to code. His bigger claim: AI will slow the growth of most public companies and make them more volatile. "There are no safe companies against AI." As agents move from writing code to personal assistants that shop and pay, he expects a "Mag Billion" of tokenized companies raising money on blockchains to take over from the Magnificent Seven.`,
        tickers: [],
        curated: true,
      },
      {
        name: 'Tokenized Rails',
        editorial: `"Tokenization is the most important thing for me for moving assets on chain." He calls AI and crypto "exactly the same trade": neither tokenization nor agent-driven commerce can grow without both. The question is how part of roughly $900 trillion in traditional assets moves into a $3 to $4 trillion crypto market, and his answer is a reason to use it, not demographics: pensions, insurers and fund managers putting assets on chain. Activity on Robinhood's blockchain is still growing, and he says more is coming. Andreessen Horowitz dropping "crypto" from its fund names fits his view that AI, crypto and traditional finance are merging. He bought Zcash, a privacy coin, on the dip.`,
        tickers: ['HOOD'],
        curated: true,
      },
      {
        name: 'Monetary',
        editorial: `Bitcoin fell to about $69,000. It has moved with gold since March, and both are held back by rising rates. He sees no need for a half-point Fed hike: oil is back where it was 175 days ago, livestock and crop futures have fallen since September, two-year inflation expectations are at the year's lows, and Goldman expects inflation to fall about 1.1 points next year. Markets give a half-point move only a 10% to 13% chance, so a quarter-point hike in December would count as good news. Japanese bond yields falling back to May levels tells him the worst of the rate pressure is passing. He still calls Bitcoin "the purest AI trade" and thinks crypto bottomed this week. Strategy's removal from some stock indexes matters for trading, not for the long run.`,
        tickers: ['BTC'],
        curated: true,
      },
    ],
  },
  {
    name: 'Camillo',
    headline: 'INFORMATION EDGE, NOT VIBES',
    subtitle: 'Chris Camillo — social arbitrage; a supporting voice that can point to ideas but not change themes',
    asOf: 'wk of Nov 9 – Nov 15 · via Grok + Nov 4 interview',
    active: true,
    themes: [
      {
        name: 'Amazon, Bloom and Robinhood',
        editorial: `Amazon is still his largest position, confirmed on November 10. His thesis is an "AI efficiency wave": once intelligence is nearly free, every company can use it to cut costs and grow, and the winners are the ones with distribution that takes decades to build, which is why he picks Amazon. He made more than $10 million over a couple of days on Amazon's earnings after months of work on AWS demand and pricing, and says he should have bet bigger. Bloom Energy is "the quickest way to provide energy to the data centers" now that operators are told to bring their own power, and he keeps buying its selloffs. Robinhood is "the best managed financial institution in the world," with a shot at becoming the largest within 20 years. He is still long Nvidia and holds a small Take-Two position that he will add to or short depending on how gamers react to GTA 6 gameplay.`,
        tickers: ['AMZN', 'BE', 'HOOD'],
        curated: true,
      },
      {
        name: 'Robots, Bitcoin and lessons',
        editorial: `He calls general-purpose robots the largest market he has ever seen, but expects deployment to move "meaningfully slower than anybody understands," because every warehouse and factory needs years of change. He expects a humanoid ready for commercial scale in 2027, scaling from 2028, and robots in homes in five to ten years. It will not be winner-take-all, and Tesla holds the pole position only if it executes. On Bitcoin he ignores the usual arguments: younger investors favor it and about $100 trillion will pass to them, so it has a strong tailwind unless security fears break trust. Lessons: keep a separate high-risk bucket for leverage and options, never get attached to a stock, buy irrational selloffs, and earn conviction through your own hours of work.`,
        tickers: [],
        curated: true,
      },
    ],
  },
]

export default VOICES"""


def patch_voicecards():
    need(VC)
    src = open(VC, encoding="utf-8").read()
    if "asOf: 'November 15, 2026'" in src:
        print("  " + VC + ": already at 11/15 - skipped")
        return
    a = one(src, "// 2026-11-10 weekly cycle — CONFIRM THE BOOK (v3.16 unchanged).", "VC comment")
    out = src[:a] + VC_COMMENT + src[a:]
    s = one(out, "export const VOICES: VoiceSection[] = [", "VC start")
    e = one(out, "]\n\nexport default VOICES", "VC end")
    e += len("]\n\nexport default VOICES")
    if e <= s:
        sys.exit("ABORT [VC]: end anchor precedes start anchor")
    out = out[:s] + VC_BLOCK + out[e:]
    for bad in ("${",):
        if bad in VC_BLOCK:
            sys.exit("ABORT [VC]: template-literal hazard in new text")
    backup(VC)
    open(VC, "w", encoding="utf-8").write(out)
    report(VC, src, out)


# ---------------------------------------------------------------------------
# 2. SignalRadar.tsx THEME_META
# ---------------------------------------------------------------------------
RD = "src/components/SignalRadar.tsx"

RD_ROWS = [
    ("AI Buildout", "AI is inevitable",
     "Jensen Huang resigned from Nvidia. Visser says analysts cut price targets, not earnings forecasts, and blames the AI selloff on a wave of new share sales, not a bubble. Camillo keeps buying Bloom Energy for data-center power."),
    ("AI Applied", "AI versus AI",
     "Visser: hackers now break in within days, so defense becomes “AI fighting with AI.” Camillo: companies with distribution, led by Amazon, win once intelligence is nearly free."),
    ("Tokenized Rails", "Same trade as AI",
     "Visser calls tokenization the most important theme and AI and crypto “exactly the same trade.” Camillo calls Robinhood the best-run financial institution in the world."),
    ("Monetary", "Bottom forming",
     "Bitcoin fell to about $69,000 alongside gold as rate fears rose. Visser sees inflation pressures fading and a bottom signal in stocks; Camillo sees a $100 trillion wealth transfer to younger investors as Bitcoin’s tailwind."),
]


def js_str(s):
    s = s.replace("\\", "\\\\").replace("'", "\\u2019")
    out = []
    for ch in s:
        out.append(ch if ord(ch) < 128 else "\\u%04x" % ord(ch))
    return "'" + "".join(out) + "'"


def patch_radar():
    need(RD)
    src = open(RD, encoding="utf-8").read()
    if "tag: 'AI is inevitable'" in src:
        print("  " + RD + ": already at 11/16 - skipped")
        return
    head = "const THEME_META: { name: string; tag: string; blurb: string; binding?: boolean }[] = ["
    s = one(src, head, "RD start")
    e = src.index("\n]\n", s)
    lines = [head]
    for name, tag, blurb in RD_ROWS:
        pad = " " * (16 - len(name))
        lines.append("  { name: " + js_str(name) + "," + pad + "tag: " + js_str(tag) + ", blurb: " + js_str(blurb) + " },")
    new = "\n".join(lines)
    out = src[:s] + new + src[e:]
    backup(RD)
    open(RD, "w", encoding="utf-8").write(out)
    report(RD, src, out)


# ---------------------------------------------------------------------------
# 3. theme_map.json  (format: json.dumps(indent=1, ensure_ascii=False) + "\n")
# ---------------------------------------------------------------------------
TM = "theme_map.json"

TM_NOTES = {
    "semis_compute": "2026-11-16: Jensen Huang resigned 11/11 (8-K; CFO Colette Kress interim CEO, board searching). Visser 11/14: targets cut, earnings forecasts not; he bought his chip names the week before. Camillo 11/04: owns Japanese chip-test equipment makers (Advantest-type; not US-listed, not derived). NVDA in SOXX 7.29% x 16.8% = 1.2% of book (< 1.5%): same seat as SOXX, not proposed (10/05 precedent).",
    "memory": "2026-11-16: second-derivative WATCH on 2 reads - Visser 11/14-15 DRAM y/y ~9x -> ~3x and falling; TrendForce 11/11 Q4 conventional DRAM +10-15% q/q, PC DRAM +13-18% vs +18-23% in Q3; DDR4 spot -0.09%, 512Gb TLC wafer spot -4.33% (11/04). Levels still rising: binding held. Step to working if Q1'27 contract guidance goes flat.",
    "power_grid": "2026-11-16: Camillo 11/04 (Decoded Genius): Bloom is 'the quickest way to provide energy to the data centers' now that operators must bring their own energy; Grok 11/9-11/15 ~4% of his book, still buying dips. Power evidence (GEV Q3 10/28) STALE after 11/25.",
    "distribution": "2026-11-16: Camillo 11/04 'AI efficiency wave' - once intelligence is free, companies with distribution moats win; Amazon has 'the biggest distribution moat'. #1 position confirmed 11/10 (Grok). Visser 11/15 counter: 'There are no safe companies against AI.'",
    "cybersecurity": "2026-11-16: Visser 11/14 (with CZ): AI compresses a months-long layered intrusion into days; 'that's going to take AI fighting with AI'; defense needs agent swarms. Binance traced the $6.3B theft to a six-month campaign (11/03-04); ~72.5% of 2026 crypto hack losses (DefiLlama 11/04). Gartner AI-security spend $51.3B (2026) -> ~$86B (2027). Demand reads, no scarcity indicator.",
    "tokenization": "2026-11-16: Visser 11/14 'I believe tokenization is the most important theme'; 11/15 Robinhood Chain activity still going, 'more is to come'. Camillo 11/04: Robinhood 'the best managed financial institution in the world'.",
    "bitcoin": "2026-11-16: Visser 11/15 'Bitcoin is the purest AI trade'; thinks crypto bottomed this week (quality vs beta 2-day flip). Camillo 11/04: Bitcoin tailwind = ~$100T wealth transfer to younger investors.",
    "robotics": "2026-11-16: Camillo 11/04: generalized robotics 'the largest TAM market on Earth' but deployment slow; commercially scalable humanoid template in 2027, scaling 2028, homes in 5-10 yrs; not winner-take-all; Tesla in pole position if it executes; Apptronik, Figure private. Still not derived.",
    "privacy": "2026-11-16: Visser 11/15 bought Zcash ('mainly in Zcash'). Vehicle now exists: Grayscale Zcash ETF ZCSH on NYSE Arca since 2026-08-25 (converted 2017 OTC trust; 2.5% fee). Kept at status 'none' so pull_correlations.py does not truncate every series to ZCSH's ~58 exchange sessions (queue 20). PROVISIONAL until measured.",
}


def patch_theme_map():
    need(TM)
    src = open(TM, encoding="utf-8").read()
    d = json.loads(src)
    if json.dumps(d, indent=1, ensure_ascii=False) + "\n" != src:
        sys.exit("ABORT [TM]: theme_map.json formatting differs from indent=1 - not rewriting")
    if d.get("_revised") == "2026-11-16":
        print("  " + TM + ": already 2026-11-16 - skipped")
        return
    th = d["themes"]
    for k, note in TM_NOTES.items():
        if k not in th:
            sys.exit("ABORT [TM]: theme " + k + " missing")
        old = th[k].get("note", "")
        th[k]["note"] = note + (" " + old if old else "")
    th["privacy"]["vehicles"]["ZCSH"] = "none"
    d["_revised"] = "2026-11-16"
    out = json.dumps(d, indent=1, ensure_ascii=False) + "\n"
    backup(TM)
    open(TM, "w", encoding="utf-8").write(out)
    report(TM, src, out)


# ---------------------------------------------------------------------------
# 4. v34_worksheet.html row notes (prepended to each row's note)
# ---------------------------------------------------------------------------
WS = "v34_worksheet.html"

WS_NOTES = {
    ("semis basket", "SOXX"): "11/16 data check: HOLD binding. Proposal: Visser 11/14 “AI is inevitable”; Jensen Huang resigned 11/11 (8-K: CFO Colette Kress interim CEO, board search under way); Wall Street cut price targets but “no one changed their earnings forecasts”; Visser put “a good amount of money” into his chip names the prior week. A: still tight on 2 - TrendForce 11/11 conventional DRAM contracts +10-15% q/q in Q4 (slower than Q3, still rising); server DRAM contracts still climbing (TrendForce 10/30); SK hynix sold out through 2029 (10/28, carried). The CEO change is a governance event at a ~7% SOXX holding, not a reading on the bottleneck; quality basket unchanged. WATCH: Nvidia FQ3 on 11/17, the first print without Huang. ",
    ("memory", "MU"): "11/16: HOLD binding; second-derivative WATCH now on 2 reads - Visser 11/14-15: DRAM prices ~9x -> ~3x year over year and still falling; TrendForce 11/11: Q4 PC DRAM +13-18% vs +18-23% in Q3, DDR4 spot -0.09% and 512Gb TLC wafer spot -4.33% (11/04). Levels still rising, so not easing. Step to working if Q1'27 contract guidance goes flat. Camillo still holds a small MU position (Grok 11/9-11/15). ",
    ("power/grid", "BE"): "11/16: Camillo 11/04 (Decoded Genius): Bloom is “the quickest way to provide energy to the data centers” now that operators must bring their own power; Grok 11/9-11/15 ~4% of his book, still buying dips. Camillo-only -> forward. Power evidence (GEV Q3 10/28) goes STALE after 11/25. ",
    ("power/grid", "GEV"): "11/16: power evidence (10/28) goes STALE after 11/25 - rotating review due next cycle. ",
    ("distribution", "AMZN"): "11/16: HOLD working/contested. Camillo: Amazon confirmed as his #1 position 11/10 (Grok); 11/04 “AI efficiency wave” - once intelligence is free, distribution moats win, and he rates Amazon's moat the biggest. Visser 11/15: AI will hurt the growth of most public companies - “There are no safe companies against AI.” Proposals still conflict; no rung move. ",
    ("proprietary data", "LLY"): "11/16: HOLD working. Not described this window (last Visser 11/05, inside 28 days). Still one data read since Q3; the rule needs two. ",
    ("biotech basket", "XBI"): "11/16: HOLD forward. Not described this window (health care last voiced Visser 11/05). ",
    ("cybersecurity", "CIBR"): "11/16: HOLD forward. Proposal: Visser 11/14 (with CZ): AI compresses a months-long layered intrusion into days; “that's going to take AI fighting with AI. There's just no other way around it”; defense needs agent swarms. Data: Binance traced the $6.3B theft to a six-month multi-stage campaign (11/03-04), ~72.5% of 2026 recorded crypto-hack losses (DefiLlama 11/04); Gartner AI-security spend $51.3B (2026) -> ~$86B (2027). Demand reads, not a scarcity indicator: rung held. CRWD -10%, PANW -9.6% in the 11/05 rout. ",
    ("brokerage rails", "HOOD"): "11/16: HOLD working. Camillo 11/04: Robinhood is “the best managed financial institution in the world”, with a shot at the largest in 20 years; ~8% of his book (Grok). Visser 11/15: Robinhood Chain activity is still going, “more is to come”. Q3 release (10/27): October net deposits >$13B month to date incl. $6B Dell family contribution to Trump Accounts. Still one indicator family for on-chain activity; rwa.xyz read still owed. ",
    ("settlement layer", "ETHA"): "11/16: Visser 11/15: “Bitcoin over gold synthetically is Ethereum” - ETH has tracked BTC/gold all year. rwa.xyz recheck still owed. ",
    ("agent payments", "COIN"): "11/16: no new agent-payments read. Visser 11/14-15: “agentic commerce is inevitable”. ",
    ("bitcoin", "IBIT"): "11/16: HOLD binding. Proposal: Visser 11/15 thinks crypto bottomed this week - quality lagged beta ~16% over two days, seen only Mar 2009, Mar/Jun 2020, Nov 2022; 11/14 BTC ~$69k, falling with gold on the largest weekly rise in 2-year yields since 2022 (~35bp). Data: October CPI above forecast (11/10); Waller backs a 25bp December hike, 50bp if core >= 0.3% m/m; 50bp odds ~13.6-14.7% (CME 11/10); 10-year back to 5.02% (11/11). Liquidity is a price input (entry band), not a stage call. Strategy index removals: trading impact only (Visser). ",
    ("silver", "SLV"): "11/16: silver not described this window; gold described only as Bitcoin's liquidity twin. ",
}


def patch_worksheet():
    need(WS)
    src = open(WS, encoding="utf-8").read()
    if "'11/16" in src:
        print("  " + WS + ": already carries 11/16 notes - skipped")
        return
    lines = src.split("\n")
    for (sub, tkr), note in WS_NOTES.items():
        key = '["' + sub + '","' + tkr + '",'
        idx = [i for i, l in enumerate(lines) if key in l]
        if len(idx) != 1:
            sys.exit("ABORT [WS " + tkr + "]: row anchor found " + str(len(idx)) + " times")
        l = lines[idx[0]]
        n = l.count(",'11/10")
        if n != 1:
            sys.exit("ABORT [WS " + tkr + "]: note anchor found " + str(n) + " times")
        if "'" in note.replace("\\'", ""):
            note = note.replace("'", "\\u2019")
        lines[idx[0]] = l.replace(",'11/10", ",'" + note + "11/10", 1)
    out = "\n".join(lines)
    backup(WS)
    open(WS, "w", encoding="utf-8").write(out)
    report(WS, src, out)


if __name__ == "__main__":
    for f in (VC, RD, TM, WS):
        need(f)
    print("Cycle 2026-11-16 STEP 1. Backups -> " + BACKUP)
    patch_voicecards()
    patch_radar()
    patch_theme_map()
    patch_worksheet()
    print("Done. Next: npm run build, then STEP 2 (prices) after the packet.")
