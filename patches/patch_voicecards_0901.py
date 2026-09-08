#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
patch_voicecards_0901.py — AlphaPlaybook
Weekly voice-card refresh for the CURRENT round (as of Mon Sep 1, 2026).

SUPERSEDES the Aug 17-24 refresh, which HAS already been applied
to this file (backup voiceCards.ts.bak.20260824-143448). Anchors below target
that applied state, not the pre-8/24 original.

TARGET: src/data/voiceCards.ts

Sources:
  Visser   — 8/29 Pomp ("Bitcoin to $1 Million?!")
             8/30 weekly ("Bessent Gets Drucked: Bitcoin, AI, and the New Macro Clock")
  Camillo  — 8/24-8/30 Grok run  (first Camillo signal since 8/9)
  ZaStocks — 8/24-8/31 Grok run

Edits (17):
   3  asOf stamps       Visser Aug 16 -> Aug 30 ; Camillo Aug 9 -> Aug 30 ;
                        ZaStocks wk Aug 10-17 -> wk Aug 24-31
   4  Visser editorials
   2  Camillo editorials
   3  ZaStocks editorials
   3  ZaStocks theme headings
   3  ZaStocks ticker arrays

Visser ticker arrays untouched (wholeBucket:true, render off live snapshot).
Camillo ticker arrays untouched: TTWO is named in copy but NOT chipped, since a
chip reads as candidacy and TTWO has no pillar fit (consumer product cycle).

Guards: every anchor exactly once; editorial spans must sit behind `editorial:`;
no backticks or ${ in inserted copy; backtick parity checked. Timestamped .bak.
"""

import os
import shutil
import sys
import time

PATH = "src/data/voiceCards.ts"

SIMPLE = [
    ("asOf: 'August 23, 2026',", "asOf: 'August 30, 2026',", "Visser stamp"),
    ("asOf: 'August 9, 2026',", "asOf: 'August 30, 2026',", "Camillo stamp"),
    ("asOf: 'wk of Aug 17 \u2013 24 \u00b7 via Grok',",
     "asOf: 'wk of Aug 24 \u2013 31 \u00b7 via Grok',", "ZaStocks stamp"),
    ("name: 'AI healthcare \u2014 the new defining theme',",
     "name: 'AI Compute \u2014 the quarter and the mudstorm',", "Za heading 1"),
    ("name: 'Crypto re-rates \u2014 and he names a holding',",
     "name: 'Fintech tightens \u2014 and he is long one of ours',", "Za heading 2"),
    ("name: 'The king still bases',",
     "name: 'Expensive stocks are often the best',", "Za heading 3"),
    ("tickers: ['TEM', 'PSNL'],", "tickers: ['NVDA', 'SMCI', 'SPCX'],", "Za chips 1"),
    ("tickers: ['HOOD', 'COIN', 'CRCL'],", "tickers: ['HOOD', 'SOFI', 'COIN'],", "Za chips 2"),
    ("tickers: ['NVDA', 'SOFI', 'FIG'],", "tickers: ['META', 'PLTR', 'NET'],", "Za chips 3"),
]

# ------------------------------------------------------------------ Visser --
V_COMPUTE = (
    "Nvidia delivered the quarter and the stock did nothing, and he treats that gap as the whole lesson. "
    "The print was a blowout \u2014 revenue running past a billion dollars a day, guidance for roughly 70% "
    "growth next year against a street looking for 44%, and 2028 estimates now near $20 of earnings on a "
    "$220 stock, which he contrasts directly with Cisco at 100 times earnings in the dot-com comparison "
    "people keep reaching for. The stock is up about 25% over a year. He calls this the Nvidia mudstorm: "
    "up 9% one day, back down 4-5% the next, with the multiple compressing faster than the earnings rise, "
    "and he says plainly it is going to happen to a lot of the AI semiconductor names because they are "
    "over-owned in the hedge fund world by people who have already made their money. Marvell reported "
    "into the same tape, ran from 180 to 240 on a good number and guidance better than expected, then "
    "gave it back. The demand case is unchanged and he leans on the Dwarkesh Patel and Dylan Patel "
    "conversation to make it: OpenAI and Anthropic are centralising global compute because their margins "
    "let them outbid everyone, open source does not commoditise compute when compute itself is scarce, "
    "and neither of them treats open source as a competitive threat at all. Hyperscaler issuance is now "
    "about 9% of all investment-grade supply, double last year, with Broadcom alone bringing a $70B deal "
    "and triple-C spreads starting to widen underneath. The sentence that governs the sleeve\u2019s size "
    "rather than its direction: he still expects these names to beat the S&P over twelve months, but "
    "\u201cI don\u2019t think you\u2019re getting 10 and 20 baggers from those in a year anymore \u2014 the firework show is "
    "over.\u201d Breadth says the same thing. Only 29% of his thematic names sit above their 50-day, the slope "
    "of the 50-day is turning down, the book is 25% off its highs, and tech momentum made new lows. He "
    "expects the mud to last until the midterms."
)

V_APP = (
    "The framing shift he has been building toward since June is now stated outright, and it lands on "
    "this sleeve: \u201cmy mindset has evolved since June and I\u2019ve been more focused on the application side "
    "and the rise of agent applications, and the fact that I believe the next year is all about software "
    "that uses agents \u2014 applications, and including things like Eli Lilly that need agents.\u201d That is the "
    "first time he has named Lilly as an agent-consuming application rather than a defensive pharma "
    "holding, and it strengthens the seat on his own logic rather than on price. Palantir moved from "
    "commentary to confirmed ownership: \u201cPalantir is part of the thematic portfolio. It\u2019s what I\u2019ve "
    "written about. It\u2019s what I own,\u201d named as part of the software complex that has recovered toward "
    "its highs, led out by Bitcoin miners. The rotation logic underneath is unflattering to the "
    "infrastructure names and favourable here: software was destroyed in the first quarter, nobody owned "
    "it, the July momentum unwind forced shorts to cover in software while longs came out of semis, and "
    "that flow has not finished. Amazon drew no direct commentary again. The structural bear case is "
    "unchanged and he keeps restating it as the reason multiples compress rather than as a market call \u2014 "
    "competition arrives three years out for everything, terminal value keeps shortening, and there will "
    "never be a bull market that feels like one. He also expects higher corporate taxes eventually, on "
    "the argument that humanoids and exploding profit margins are where the government will have to go "
    "for revenue when the consumer tax base stops working."
)

V_TOKEN = (
    "This is now his largest conviction and he said so in allocation terms: given $100 to invest, \u201cI have "
    "more money focused on crypto right now, and it\u2019s not just Bitcoin. It\u2019s Ethereum. It\u2019s Solana.\u201d "
    "Solana enters the picture for the first time \u2014 up 46% month to date, outperforming Ethereum "
    "recently, and back to where it stood against semiconductors in early February, which is his "
    "illustration of how fast this can travel. He also disclosed a new holding: BitMine, owned "
    "specifically as an Ethereum expression after Tom Lee\u2019s argument that Ethereum is the institutional "
    "settlement layer, won on liquidity, trust, standards and path dependence rather than on speed. His "
    "own ranking is explicit \u2014 Ethereum should outperform Bitcoin, and Ethereum has already broken out "
    "against it. The thesis is that tokenization turns assets into software, which only becomes useful "
    "once agents are the users of those markets, and that is the catalyst that has arrived. Evidence he "
    "stacked this week: Japan announced stock and bond tokenization plans, Korea is racing alongside, "
    "Coinbase and Better launched Bitcoin-backed mortgages, and his 46-name tokenized index broke out "
    "again and is positive on the year while Bitcoin is still down. The tell he keeps returning to is "
    "that nobody has done the work \u2014 in a week when Solana rose 40%, the only thing macro people asked "
    "him about was gold. He compares the setup directly to Micron a year ago at 60 before it went to "
    "1,300, and puts the big part of the move from January through roughly August of next year."
)

V_MONETARY = (
    "The reclaim held and consolidated \u2014 Bitcoin around 80,000 with 82,000 the natural resistance and "
    "74,000 the support that matters, and the structural signal he cares about is that the 200-day slope "
    "has now turned up on both Bitcoin and Ethereum. He ran the history: four prior instances of the "
    "200-day pointing down for at least 100 days and then breaking back above, and in every case the "
    "prior lows were never revisited, which would put roughly 58,000 as the floor if history holds. The "
    "macro chain continued in the same direction \u2014 Bessent floated tapping the $1T TGA, following the "
    "yen intervention, the refunding language change, the buyback framework and then larger buybacks, "
    "which he reads as a pattern of intent rather than a series of one-offs. Warsh at Jackson Hole said "
    "nothing new but moved September hike odds from 35% to about 60%; Visser thinks he will not hike, "
    "because doing so would offset everything the Treasury is attempting and because nobody wants the "
    "long end breaking ahead of the midterms. Ten-year yields did not fall on hawkish talk, which he "
    "takes as evidence the pressure is coming from AI capital needs rather than from policy. The item "
    "that matters most for how this sleeve is weighted is a demotion, and it is unambiguous: \u201cif gold is "
    "the big trade and people are saying, well, I think it\u2019s going to go up \u2014 I do too. Gold\u2019s not going "
    "to be the fastest horse in the race. I don\u2019t even think it\u2019s going to finish in the top hundred of "
    "the fastest things.\u201d He is not bearish gold; he is explicit that it sits outside the economy being "
    "built, where the tokenized rails and stablecoins sit inside it. Store of value remains good, and "
    "ranks last among the things he wants to own."
)

# ----------------------------------------------------------------- Camillo --
C_APP = (
    "First signal from him since 8/9, and Amazon is unchanged as the core, high-conviction mega-position "
    "\u2014 unofficial trackers still put it at a large majority of his estimated public exposure. The one "
    "thing he said about macro is the useful part for us, because it is a discipline statement rather "
    "than a view: a possible rate hike is a known short-term risk that \u201cchanges nothing about my larger "
    "$AMZN thesis.\u201d Known macro noise is not a thesis change. The thesis itself is the long-running one, "
    "that the market underestimates Amazon\u2019s role in the AI infrastructure buildout. The new idea of the "
    "week is Take-Two, bought after leaked GTA VI gameplay on 8/21 \u2014 unpolished footage showing a leap "
    "in world density, NPC behaviour and systemic depth, which he reads as a possible generational leap "
    "rather than a graphics update, and he has traded this franchise\u2019s cycles since 1999. We are logging "
    "it, not seating it: it is a consumer product-cycle bet with no pillar fit, and he frames it as "
    "speculative himself \u2014 if the gameplay does not excite players it fails. Robinhood and Bloom still "
    "appear in his estimated holdings but were not this week\u2019s focus. The process note is the most "
    "quotable thing he published and it is aimed straight at people sizing into Nvidia earnings on "
    "feel: \u201cconviction without an information edge is just confidence dressed up as research.\u201d"
)

C_COMPUTE = (
    "No fresh Bloom commentary this window \u2014 it appears in estimated-holdings discussion alongside "
    "Robinhood, AMD, Micron and a handful of older names, but it was not part of what he actually posted "
    "about, and the week\u2019s two active ideas were Amazon and Take-Two. So this seat carries forward on "
    "prior conviction rather than on anything new, and the aging is worth stating plainly rather than "
    "papering over: the last substantive Bloom thesis work from him predates this window by several "
    "weeks. What did carry over is the sizing philosophy that governs how he holds it \u2014 concentrated "
    "bets when the signal is real, sized down when it is not, with Amazon as the concentrated multi-year "
    "thesis and Take-Two explicitly framed as the high-upside speculative one. His method note applies "
    "directly to any power-and-datacenter name: go to primary sources, small accounts and people who "
    "actually use the product, because \u201cyou\u2019ll never get to ground truth by lazily relying on what "
    "algorithms surface.\u201d Treat the Bloom conviction as held and quiet, not re-affirmed."
)

# ---------------------------------------------------------------- ZaStocks --
Z_COMPUTE = (
    "Nvidia is now Adding-Holding rather than admired from a distance \u2014 \u201canother monster $NVDA quarter "
    "proving that demand isn\u2019t slowing down and AI is accelerating,\u201d with the note that he has been bull "
    "posting it for weeks and that the muted initial reaction is typical. No new chart this window, so "
    "it is conviction without a fresh level. Super Micro is the genuinely new name and it comes back on "
    "his radar through earnings rather than price: a monthly big-picture base near 37.08 against a "
    "20-EMA around 36.4 and a 50-SMA of 35.41, with a descending trendline arriving at current price "
    "after the long fall from 122.9, and his framing is that \u201cif the fraud and accounting issues didn\u2019t "
    "exist this stock would be 3x higher.\u201d SpaceX keeps the narrative slot with no chart and no level, "
    "argued as a full AI stack across compute, models, Cursor distribution, Grok consumer and "
    "connectivity, with insiders not selling \u2014 \u201cif you thought $SPCX was expensive at $105 wait until "
    "how expensive it looks when it\u2019s $200.\u201d It stays where we put it: off-thesis, no pillar fit, no "
    "gateable technicals. His stance on the sleeve overall is the same caution Visser is expressing from "
    "the breadth side \u2014 the Nasdaq has chopped sideways for four months, NVDA earnings and Jackson Hole "
    "both proved nothing burgers, and \u201cpressing in tech when conditions are choppy is how you end up "
    "blowing up.\u201d"
)

Z_FINTECH = (
    "Robinhood is the second consecutive window in which he has named a seat we hold and stated he is "
    "long it, which under our rules is the strongest thing an L2 voice can do for an existing position. "
    "The setup is now specific: a weekly triangle tightening against a descending trendline near 104-110 "
    "after reclaiming every key moving average in the 95-101 area, with the old high marked at 153.86, "
    "and the reason attached is crypto \u2014 \u201cgetting tight, reclaimed all key moving averages just as "
    "crypto gets going again,\u201d alongside \u201cbeen a longtime $HOOD bull. Love the company.\u201d That is a "
    "second independent leg beside Camillo, who still carries HOOD in his holdings, and it arrives in "
    "the same week Visser moved crypto to his largest allocation \u2014 three voices pointing at the same "
    "transmission mechanism from different directions. SoFi is the pattern-match again and he sharpened "
    "it: still forming a mini base against the $20 level with price near 18.06, a 20-EMA of 18.03 and a "
    "rising 200-SMA at 12.84, and \u201ceventually you have to think the wall comes down\u2026 looks a bit like "
    "$HOOD did.\u201d Coinbase carries over from 8/24 unchanged \u2014 multi-month base near 186.49 with the $150 "
    "level and the 200-week moving average flagged as the two that matter. Neither SOFI nor COIN has a "
    "stated position, so both stay candidates to verify."
)

Z_QUALITY = (
    "The framing of the week is a valuation stance rather than a setup: \u201cexpensive stocks are often the "
    "best. $PLTR $CRWD $NET etc. the list goes on.\u201d Palantir appears only inside that list \u2014 no chart, "
    "no level, second consecutive window as a reference rather than a setup \u2014 so its ZaStocks leg keeps "
    "aging even as Visser has just confirmed he owns it outright. Meta is the one he actually argued "
    "for, on vertical integration: \u201cvertical integration in AI is becoming more important, Meta is "
    "perfectly positioned. The demise of Zuck is being greatly exaggerated,\u201d with price near 578 above "
    "longer-term support in the 460-530 band and a prior high at 796.25, framed as a fear campaign of "
    "the kind that historically resolved higher for prior hyperscalers. No book holding appears in this "
    "block. Of our tracked list he named only HOOD, COIN and PLTR all window; nothing on AIPO, SOXX, "
    "GLW, COPX, ASML, LLY, AMZN, ETHA, SLV, GLDM, IBIT, MRVL, DELL, WDC, MSTR, FLNC, RDDT, TEM or CRCL, "
    "and TEM and CRCL both dropped out after carrying dedicated charts last week. His risk note is the "
    "one to hold against a week when three voices turned bullish at once: \u201cif you\u2019re waiting for a stock "
    "to be all over your feed before buying, it\u2019s probably late and the best entry is gone.\u201d"
)

EDITORIALS = [
    ("He is still long this sleeve and no longer leaning on it", V_COMPUTE, "Visser / AI Compute"),
    ("Lilly is now one of three names he describes himself as having rotated into", V_APP, "Visser / AI Application"),
    ("Two things changed here and both are firsts", V_TOKEN, "Visser / Tokenization"),
    ("This is the week the discipline rule fired", V_MONETARY, "Visser / Monetary"),
    ("He has concentrated down, and the sentence is the whole card", C_APP, "Camillo / AI Application"),
    ("This is the window where Bloom", C_COMPUTE, "Camillo / AI Compute"),
    ("The defining call of his window is that AI healthcare", Z_COMPUTE, "ZaStocks / AI Compute"),
    ("The ledger event of the window, and the first in six windows", Z_FINTECH, "ZaStocks / fintech"),
    ("Nvidia stays the anchor and the argument is fundamental", Z_QUALITY, "ZaStocks / quality"),
]


def fail(msg):
    print("ABORT: " + msg)
    sys.exit(1)


def main():
    dry = "--dry-run" in sys.argv
    path = PATH
    for a in sys.argv[1:]:
        if a.startswith("--path="):
            path = a.split("=", 1)[1]

    if not os.path.exists(path):
        fail("file not found: " + path + "  (run from repo root)")

    with open(path, "r", encoding="utf-8") as f:
        src = f.read()
    original = src

    for anchor, body, label in EDITORIALS:
        if "`" in body or "${" in body:
            fail("illegal character in replacement text for " + label)

    for old, new, label in SIMPLE:
        n = src.count(old)
        if n != 1:
            fail("anchor count==%d (expected 1) for %s :: %s" % (n, label, old))
        src = src.replace(old, new, 1)
        print("  %-16s ok" % label)

    for anchor, body, label in EDITORIALS:
        n = src.count(anchor)
        if n != 1:
            fail("editorial anchor count==%d (expected 1) for %s" % (n, label))
        i = src.index(anchor)
        start = src.rfind("`", 0, i)
        end = src.find("`", i)
        if start == -1 or end == -1:
            fail("could not bracket template literal for " + label)
        if not src[:start].rstrip().endswith("editorial:"):
            fail("span for %s is not an editorial field" % label)
        old_len = end - start - 1
        src = src[:start + 1] + body + src[end:]
        print("  %-28s %5d -> %5d chars" % (label, old_len, len(body)))

    if src == original:
        fail("no change produced")
    if src.count("`") % 2 != 0:
        fail("unbalanced backticks after patch")

    if dry:
        print("\nDRY RUN - no files written. %d -> %d bytes" % (len(original), len(src)))
        return

    stamp = time.strftime("%Y%m%d-%H%M%S")
    bak = "%s.bak.%s" % (path, stamp)
    shutil.copy2(path, bak)
    with open(path, "w", encoding="utf-8") as f:
        f.write(src)

    print("\nbackup : " + bak)
    print("patched: %s  (%d -> %d bytes)" % (path, len(original), len(src)))


if __name__ == "__main__":
    main()
