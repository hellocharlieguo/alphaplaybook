#!/usr/bin/env python3
"""
patch_voicecards_0907.py — voiceCards.ts, 2026-09-07 cycle.

Rewrites the four Visser theme editorials and the two ZaStocks editorials from
the 9/5 Pomp and 9/6 weekly transcripts plus the 9/1-9/7 ZaStocks Grok window.
Camillo is DELIBERATELY UNTOUCHED — no capture exists for 8/31-9/7, so its card
stays on the 8/24-8/30 window and the header records that it is one week stale.

Anchored on the opening fragment of each editorial, count==1, timestamped backup.
Run from repo root. Verify with `npm run build`, never `dev`.
"""
import shutil, sys, time

PATH = "src/data/voiceCards.ts"
src = open(PATH, encoding="utf-8").read()
hits = []

if "2026-09-07 cycle" in src:
    sys.exit("ABORT: patch already applied")


def sub(label, old, new):
    global src
    n = src.count(old)
    if n != 1:
        sys.exit(f"ABORT [{label}]: anchor found {n} times, expected 1")
    src = src.replace(old, new, 1)
    hits.append(label)


def swap_editorial(label, opening, body):
    """Replace a whole backtick-delimited editorial located by its opening words."""
    global src
    key = "editorial: `" + opening
    n = src.count(key)
    if n != 1:
        sys.exit(f"ABORT [{label}]: opening fragment found {n} times, expected 1")
    i = src.index(key) + len("editorial: `")
    j = src.index("`", i)
    src = src[:i] + body + src[j:]
    hits.append(label)


# ---------------------------------------------------------------- header
sub("header",
 "// Cycle 2026-08-31 — FROZEN as '2026-08-31-v3.4.1-stageflip'. 12 names, ticker\n"
 "// set unchanged from v3.4. Two stage flips: ETHA forward→working (Visser 8/29–8/30),\n"
 "// GLDM binding→working (Visser 8/30, relative de-rate). Three entry bands moved on\n"
 "// Friday 8/28 closes: LLY 0.85→0.95, GLDM 0.85→0.75, SLV 0.60→0.75. 4.06pp turnover.",

 "// Cycle 2026-09-07 — NOT FROZEN. The cron still runs '2026-08-31-v3.4.1-stageflip'.\n"
 "// No §5d criterion fired: ticker set unchanged at 12, no stage flip survived, no\n"
 "// candidate cleared the L2 gate. One input moved — the adoption wave, coding agents\n"
 "// → consumer agents (Visser 9/6). Canonical worksheet drift vs deployed is 3.13pp.\n"
 "//\n"
 "// ETHA working→binding was considered and REJECTED for a second week: the 8/31 flip\n"
 "// already consumed that evidence (Visser 8/30, 'this is the catalyst point'), and\n"
 "// the 9/6 language restates it rather than escalating. One rung at a time.\n"
 "//\n"
 "// CAMILLO IS STALE. No capture exists for 8/31-9/7; his card below still describes\n"
 "// the 8/24-8/30 window and asOf is unchanged on purpose. AMZN's lenses=2 convergence\n"
 "// flag is running on ≤120d ledger history, not on this week's evidence.\n"
 "//\n"
 "// SOL is a NAMED GAP, not a seat. Visser 9/5 splits crypto into three roles —\n"
 "// Bitcoin collateral, Ethereum trust, Solana speed — and the book expresses two.\n"
 "// BSOL/GSOL added to the correlation and candidate pulls 9/07; watch-not-seat until\n"
 "// measured. Seating SOL as a third Rails sub-theme would cost ETHA 3.3-4.3pp.")

# ---------------------------------------------------------------- Visser asOf
sub("visser_asof",
 "    subtitle: 'Jordi Visser — macro framework for the physical AI upgrade',\n"
 "    asOf: 'August 30, 2026',",
 "    subtitle: 'Jordi Visser — macro framework for the physical AI upgrade',\n"
 "    asOf: 'September 6, 2026',")

# ---------------------------------------------------------------- AI Buildout
swap_editorial("th_buildout",
 "Nvidia delivered the quarter and the stock did nothing",
 "The tape got worse and his call got firmer, and he is explicit that those are not "
 "in conflict. Semiconductors are down 14% quarter to date against the S&P up three "
 "and the Nasdaq down three; the SMH sits below its 50-day and the slope is pointed "
 "down. He states that as a fact rather than arguing with it, and then tells you to "
 "ignore the people reading it as a top: this stuff is bottoming after this, and what "
 "looks like a breakdown is a consolidation. His test for the bears is a consistency "
 "check rather than a chart — if a technician is bearish on semiconductors, go see "
 "whether they are also bearish on yields and on Bitcoin, because a single position "
 "wearing three costumes is an endgame bias, not three pieces of analysis. The "
 "structural argument is unchanged and now stated more sharply: interest rates are a "
 "rounding error on inference P&L, so the rate panic attached to this sleeve is "
 "misdirected. Three companies matter — Anthropic, OpenAI and Nvidia — and Nvidia is "
 "the head of the circular finance, selling to everyone whose revenue depends on "
 "compute, which is what lets Dell and Marvell and Micron stop worrying about "
 "hardware cost. Nvidia is approaching new all-time highs while the basket sits 14% "
 "down, and he uses that divergence as the argument: you do not call semiconductors a "
 "bubble while the name everything else follows is breaking out. Revisions are running "
 "at 88% and the PEG is at its lowest since the late nineties. The one risk he names "
 "explicitly is model price compression, and he says it is not happening yet. On the "
 "physical side, from 9/5: friction is good right now — not enough memory, data "
 "centres being pushed back — because the alternative is things moving faster than "
 "anyone can absorb. The bottleneck is intact; the tape is just unpleasant.")

# ---------------------------------------------------------------- AI Applied
swap_editorial("th_applied",
 "His mindset has evolved since June, and he says so directly",
 "This is the week the adoption wave moved, and he marks it in one sentence: we went "
 "to the coding agents, but now we are in the personal and the workflow agents. The "
 "example he gives is concrete rather than aspirational — a personal workflow agent "
 "that reads, summarises, compares, recommends and asks permission — and he notes the "
 "compute demand on that is massively larger than on what came before. The consequence "
 "he draws is the connective one for the whole book: that means we need financial "
 "agents, and that is what is beginning to happen now. The corroboration is shipped "
 "product rather than roadmap. Grok now lets users buy or lend crypto through a MoonPay "
 "integration; Stripe integrations keep arriving weekly; and he cites the Gavin Baker "
 "segment describing Grokbot-style agents as a new consumption shock. His own use has "
 "changed shape too — first typing, then chatting and collaborating, and now sending "
 "agents off to build things and come back for a staff meeting. From 9/5, the framing "
 "for why rates do not govern this: four years of model capability improvement is "
 "compressing into next year, and this is all about agents, consumer agents, "
 "enterprise adoption and profit margins rather than about the discount rate. He tells "
 "people working jobs who have not learned agentic workflows that the time is gone, "
 "and he means it as an urgency claim about the final four months of the year. Note "
 "what this card does NOT contain: no Visser mention of Amazon or Eli Lilly in either "
 "episode. Both seats rest on prior weeks — LLY on the 8/23 flag clearance, AMZN on "
 "Camillo's now-stale coverage.")

# ---------------------------------------------------------------- Tokenized Rails
swap_editorial("th_rails",
 "This is the week the dated Stage 4 became a started one",
 "He gave the cleanest statement of the thesis he has produced, and it is a split into "
 "three roles rather than one trade: Bitcoin as collateral and store of value, Ethereum "
 "for the trust that has to exist before people build on it, and Solana for the speed. "
 "That is where he has ended up, and he adds that other tokens will outperform and he "
 "does not care. He is more certain than ever that the financial guardrails are needed. "
 "The reason crypto is rallying, in his framing, is not liquidity — crypto did not lack "
 "a use case, it lacked a native user, and AI creates one. AI is the crypto killer app: "
 "the first phase of crypto was building something humans would embrace, but agents are "
 "what actually need digital payments, stablecoins and tokenization. On Robinhood he is "
 "specific in a way he has not been: it was upgraded by multiple shops partly on its new "
 "layer-2 chain, it is heavily involved in stock-token trades, and a billion and a half "
 "dollars of those trades cleared in six weeks — something that sounded like science "
 "fiction two years ago. The RWA market has grown eighteen times. He notes the shape "
 "looks like the token expansion curve in AI, and that Robinhood sits inside his 46-name "
 "crypto portfolio of six stocks and forty tokens. Ethereum's 200-day has turned up, "
 "matching Bitcoin, and ETH is up 56% quarter to date against Solana 38% and Bitcoin 36% "
 "— he still ranks Ethereum first. The gap this card records: the speed role has no seat "
 "in the book. Solana's 200-day has also turned up and it is consolidating higher, and "
 "he says he will show all three every week. Watch-not-seat until correlations exist.")

# ---------------------------------------------------------------- Monetary
swap_editorial("th_monetary",
 "The most consequential sentence for this sleeve is a relative one",
 "Gold and silver got zero airtime across both episodes for a second consecutive week, "
 "which is the most important thing this card can record. The 8/30 relative de-rate — "
 "gold higher but not the fastest horse, not in the top hundred, because gold will not "
 "be part of the economy going forward — stands unrefreshed and continues to govern "
 "GLDM's working classification. Silver has not been named since 8/16. Neither absence "
 "is a stage call, and neither moved anything: no quote, no timing change. Bitcoin is "
 "where the week's conviction went. He puts it in Elliott terms — a great trade "
 "starting before consensus is his third wave start, the most powerful wave in crypto — "
 "and the evidence he wants for it is the doubt itself. That is the silent IPO thesis: "
 "he needs believers to stop believing, and he is getting it, from dinner conversations "
 "with people who were major winners and have reduced significantly, and from Mark Cuban "
 "saying on television that he is pretty much done with it. The ideologues have bailed "
 "and the people who missed the move are waiting for a retest to the sixties that he "
 "does not think arrives. The tape supports rather than merely accompanies it: the "
 "200-day has turned up, and the pattern is a large advance followed by sideways action "
 "he reads as bullish consolidation. The macro frame is the double debasement story — "
 "crypto takes a rising share of fiat assets over five years because of AI disruption "
 "and because the government cannot let rates run. He is candid about the ceiling: "
 "earnings are growing 30% a year and these are growing at half that, so this is a "
 "flows-and-adoption argument, not an earnings one.")

# ---------------------------------------------------------------- ZaStocks: HOOD card
swap_editorial("za_hood",
 "Robinhood is the only book name he is actively constructive on",
 "Robinhood is again the only book name he touched, and this week it is fundamental "
 "rather than technical: Robinhood is releasing more products and innovating faster "
 "than just about any non-AI company in the market. No chart, no moving averages, no "
 "level, no stated position — so it stays Mentioned. It does not corroborate, either: "
 "his leg only counts when Visser or Camillo point at the same name, Visser did not "
 "name it in either episode, and no Camillo capture exists for this window. HOOD then "
 "ran 19.1% on the week to 122.11, which pushed stretch from 1.3% to 19.2% and moved "
 "S5 from 58 to 56 — the entry brake engaging on this name for the first time, trimming "
 "it 8.0 to 7.4. Worth noticing that the brake is currently working against the leg "
 "carrying the freshest independent evidence. That is the design behaving correctly, "
 "not a fault. Nothing else from the book appeared: he explicitly did not name AIPO, "
 "SOXX, GLW, COPX, ASML, LLY, AMZN, ETHA, SLV, GLDM or IBIT.")

# ---------------------------------------------------------------- ZaStocks: framing card
swap_editorial("za_frame",
 "His framing rule this week, offered alongside Palantir",
 "The week's dividing line is quality against speculation: a lot of speculative AI has "
 "topped permanently, while quality AI still looks good and earnings show no slowdown — "
 "only price pays. Early week was exhausted chop and poor sentiment; midweek he said "
 "today felt different and that the Nasdaq's chart is something. He holds Dell from the "
 "$150s and frames it as a multi-month swing rather than an investment, and he is in "
 "Marvell with no level given. Those are the only two carried positions. The rest is "
 "chart work on names outside the book — Nvidia near highs as the king, Intel basing "
 "around 88–90 on a US-manufacturing overlay, CoreWeave working under a descending "
 "trendline on its customer list, and Vistra flagged for its buyers rather than his own "
 "fill. Vistra is the one that would tempt: tracked name, dedicated weekly chart, "
 "notable holders. It fails twice — AIPO is already the book's power bet, and at 149.30 "
 "against a 157.76 200-day it is entry-paused at S5 45 with zero lenses pointing. The "
 "psychology he repeated is worth keeping: the best trade is often the one you are "
 "already in that is working, boredom is why people overtrade, and selling every 10% "
 "move means never catching a multi-bagger. His Sunday Substack remains paywalled and "
 "outside the capture.")

# ---------------------------------------------------------------- write
bak = f"{PATH}.bak.{time.strftime('%Y%m%d-%H%M%S')}"
shutil.copy2(PATH, bak)
before = open(PATH, encoding="utf-8").read().count("\n")
open(PATH, "w", encoding="utf-8").write(src)
print("OK  backup=" + bak)
print("    edits: " + ", ".join(hits))
print(f"    lines {before} -> {src.count(chr(10))}")
print("    Camillo untouched by design — no 8/31-9/7 capture.")
