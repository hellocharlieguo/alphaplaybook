#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
patch_voicecards_0824.py — AlphaPlaybook
Weekly voice-card refresh for the Aug 17-24, 2026 round.

TARGET: src/data/voiceCards.ts   (NOT SignalRecap.tsx — cards were extracted 8/17)

Sources:
  Visser   — 8/22 Pomp ("Bitcoin Just Had Its Biggest Week In History")
             8/23 weekly ("The AI Crypto Macro Nexus Point")
  ZaStocks — 8/17-8/24 Grok run

Edits (13 total):
  2  asOf stamps      Visser Aug 16 -> Aug 23 ; ZaStocks wk 10-17 -> wk 17-24
  4  Visser editorials  (AI Compute / AI Application / Tokenization / Monetary)
  3  ZaStocks editorials
  3  ZaStocks theme headings   (re-cut: healthcare / crypto / NVDA-base)
  1  ZaStocks ticker arrays x3

NOT TOUCHED: Camillo (no new transcript since 8/9 — restamping would imply
fresh sponsorship that does not exist). Visser ticker arrays are wholeBucket:true
and render off the live snapshot; the fallback arrays are left alone pending
confirmation of the deployed v3.4 ticker set.

Guards: every anchor exactly once; editorial spans must sit behind `editorial:`;
no backticks or ${ in inserted copy. Timestamped .bak before write.
"""

import os
import shutil
import sys
import time

PATH = "src/data/voiceCards.ts"

SIMPLE = [
    ("asOf: 'August 16, 2026',", "asOf: 'August 23, 2026',", "Visser stamp"),
    ("asOf: 'wk of Aug 10 \u2013 17 \u00b7 via Grok',",
     "asOf: 'wk of Aug 17 \u2013 24 \u00b7 via Grok',", "ZaStocks stamp"),
    ("name: 'AI Compute \u2014 memory & the new leaders',",
     "name: 'AI healthcare \u2014 the new defining theme',", "Za heading 1"),
    ("name: 'Software & data',",
     "name: 'Crypto re-rates \u2014 and he names a holding',", "Za heading 2"),
    ("name: 'Off-thesis: SpaceX & robotics',",
     "name: 'The king still bases',", "Za heading 3"),
    ("tickers: ['MU', 'CRWV', 'NBIS'],", "tickers: ['TEM', 'PSNL'],", "Za chips 1"),
    ("tickers: ['RDDT', 'FIG'],", "tickers: ['HOOD', 'COIN', 'CRCL'],", "Za chips 2"),
    ("tickers: ['SPCX', 'OUST'],", "tickers: ['NVDA', 'SOFI', 'FIG'],", "Za chips 3"),
]

# ----------------------------------------------------------------- Visser ---
V_COMPUTE = (
    "He is still long this sleeve and no longer leaning on it, and he said so plainly: the AI "
    "infrastructure trade will still outperform the S&P and is still where you want a lot of your money "
    "in the stock world, but \u201cmy overweights are towards the scarcity trade.\u201d The position detail is "
    "the most specific he has given in months. Marvell is a decent sized position he is explicitly "
    "sticking with \u2014 \u201cI still love it\u2026 I still think there\u2019s a triple quadruple from here\u201d \u2014 and it is "
    "the largest name he identifies inside the thematic portfolio once Lilly, silver and Bitcoin are set "
    "aside as not really counting. Micron is only a little bit, bought into the down move. Fluence is "
    "down roughly 50% from his own highest purchase and is a tiny position, with EOS smaller and worse. "
    "The mechanism he keeps returning to is multiple compression rather than demand: Nvidia has gone from "
    "a 40-50 forward multiple to about 19, a fourteen-bagger since 2022 with a PEG below one, and yet "
    "roughly 80% of its gain since June 2024 arrived in four of twenty-four months. He calls that the "
    "Nvidia mud trap and says it is the AI trade going forward. On the shortage itself he called balls "
    "and strikes against his own book: Warren Pies flagged early cracks in GPU availability data, and "
    "Visser\u2019s read is that GPU pricing stops rising and goes sideways at a high level, which is ordinary "
    "depreciation rather than damage \u2014 \u201cthe fireworks show is over.\u201d The volatility numbers underneath "
    "are the ones worth keeping: Micron\u2019s 60-day realised vol printed near 120 against Bitcoin\u2019s 24, "
    "Micron and IBM 90-day vol has spiked while S&P 90-day vol has not moved at all, which he says has "
    "never happened since 2009, and Morgan Stanley tech momentum has had 57 five-percent days this year "
    "against zero in the whole post-crisis period. His conclusion is a sizing conclusion: \u201cyou can\u2019t own "
    "as much Micron as you can Bitcoin right now cuz it\u2019s less volatile.\u201d"
)

V_APP = (
    "Lilly is now one of three names he describes himself as having rotated into, which is the strongest "
    "framing this seat has ever had from him: \u201cright now, I think crypto, Eli Lilly, silver, those are "
    "the places that I rotated into and reduced all those other things,\u201d and it made new all-time highs "
    "this week. He is aware nobody wants to hear it \u2014 a company growing revenue 50% year over year draws "
    "no interest unless it moves 100 to 300% \u2014 which is precisely why he keeps it. The wider thesis is "
    "the reason: he has written since November that pharmaceuticals will be the biggest winners from AI "
    "on the application side, healthcare has outperformed the S&P by roughly 7-8% this year and made new "
    "multi-year relative highs while still far below absolute highs, and Moderna\u2019s melanoma result "
    "doubling the stock in a day is the proof he points at, with AI taking assets over the stage-two "
    "hurdle where they usually die. Palantir got its first substantive mention in a while, on 8/22 and "
    "for a structural reason rather than a chart: \u201cthe orchestration layer becomes much much more "
    "important,\u201d with AI sovereignty an issue that also constrains Anthropic and OpenAI. Amazon drew no "
    "direct commentary, so that seat carries on prior conviction. The offsetting pressure is unchanged "
    "and got louder: S&P forward multiples are down 20% while earnings rose, which he reads as the market "
    "pricing the end of terminal value rather than a bubble, and \u201cI\u2019m actually the most bearish person I "
    "know on public equities. It\u2019s just not today.\u201d"
)

V_TOKEN = (
    "Two things changed here and both are firsts. The gate opened \u2014 Ethereum broke its 200-day alongside "
    "Bitcoin and, more importantly, its 200-day turned up, which he called a very powerful signal \u2014 and "
    "he disclosed a new position: \u201cI have a good amount of Ethereum. I didn\u2019t have any Ethereum until "
    "really recently.\u201d The ranking that comes with it inverts the usual order and speaks directly to how "
    "this sleeve is sized: \u201cI believe beta is going to lead in crypto and Bitcoin will not be the "
    "leader\u2026 Ethereum should lead because this is about the ecosystem being invested in.\u201d Asked what "
    "outperforms his infrastructure names, he answered silver, Bitcoin, Ethereum and MicroStrategy, all "
    "yes. The structural evidence arrived in the same week. Stripe bought OpenRouter and published the "
    "reasoning \u2014 tokens are the new dollars, an agent-economy stack running money into compute into "
    "tokens into output \u2014 with first-half signups up 50% year over year. The White House crypto event "
    "put Trump on record that the US proceeds with or without the Clarity Act, and Treasury opened Genius "
    "Act rulemaking for comment on 8/17. His own 46-name equal-weight tokenized index is now positive on "
    "the year and outperforming Bitcoin, with two of ten verticals up \u2014 digital monetary assets and "
    "AI-agents-in-the-machine-economy. The September framing is restated and sharpened: \u201cthe next "
    "constraint is financial. It\u2019s not physical.\u201d He expects hedge funds to arrive before year-end, and "
    "notes the one thing still missing is agentic commerce infrastructure, which is why the crypto leg "
    "has not shown up in revenue yet."
)

V_MONETARY = (
    "This is the week the discipline rule fired. Bitcoin broke above its 200-day on three consecutive "
    "large candles, up 22-23% on the week, which he measures as a seven-sigma move \u2014 60-day vol of 23 "
    "divided by the root of 52 gives a 3% one-sigma week against a 22% print. Only three weeks in the "
    "past decade exceeded five sigma; the prior two were April 2019 and January 2023, both also broke the "
    "200-day, both held it, and both roughly doubled inside two months. His standing condition was "
    "explicit and is now met: below the 200-day he would buy quietly and not talk about it, above it "
    "\u201cI am going to be pounding my hands on the table.\u201d Gold is back above its own 200-day after a "
    "multi-sigma move and silver was up big. The disclosure that matters most for how this sleeve is "
    "built: \u201cI am long SLV and I am long SIL. SIL is much bigger. I like the miners because\u2026 the miners "
    "are just trading way too cheap relative to where the metal is.\u201d His silver expression is majority "
    "miners, not metal. The macro chain behind it is Treasury-driven rather than Fed-driven \u2014 increased "
    "nominal buyback sizes announced this week following the yen intervention and the refunding language "
    "change, Bessent publicly calling yields mispriced and leaning on the Fed over FIMA, and Druckenmiller"
    "\u2019s filing adding Bitcoin miners while exiting Intel and Micron, which Visser identified as \u201cthe "
    "exact same trade that I make.\u201d He has never sold a Bitcoin in his life and frames the asset as the "
    "hedge against abundance, since hyper-competition destroys terminal value everywhere else."
)

# --------------------------------------------------------------- ZaStocks ---
Z_HEALTH = (
    "The defining call of his window is that AI healthcare may be the biggest theme in the market, with "
    "Moderna\u2019s cancer vaccine as the first domino and AI accelerating treatments and cures from here \u2014 "
    "and he ties it to a broader point that AI needs to deliver something ordinary people can feel while "
    "the anti-datacenter noise builds. Tempus AI is the expression and it returns to the sheet after "
    "aging out: last affirmed in the Jun 26 - Jul 2 window and past the 45-day decay, now re-affirmed "
    "with a chart breaking out off its base near 72.69 against a 50-day around 61.7 and a prior high at "
    "104, on rising volume. His framing is deliberately offhand \u2014 \u201csomething about a cure for cancer? I "
    "heard Tempus does some AI in healthcare stuff\u201d \u2014 but it is a dedicated chart, which under our "
    "rules is what separates a setup from an aside. TEM reconnects with our own AI Application "
    "second-seat watch, though it remains a candidate to verify rather than a seat. Personalis is "
    "situational rather than a setup: trading above its buyout price on the same newsflow, with his only "
    "concern being that the buyout gets nixed as a result."
)

Z_CRYPTO = (
    "The ledger event of the window, and the first in six windows: he named a name we actually hold, and "
    "stated he owns it. On Robinhood \u2014 \u201cdegens are gonna see crypto ripping, hear we\u2019re curing cancer, "
    "and probably start trading like crazy on Robinhood again. Seems bullish $HOOD,\u201d with the follow-up "
    "that if he had not already been long beforehand he would have bought that day. That gives HOOD a "
    "second independent leg alongside Camillo, who carries it as one of his two high-conviction holds, "
    "and it lands on a seat already held rather than on a candidate. Coinbase is the base trade \u2014 \u201cmulti "
    "month base and crypto is cool again,\u201d with the $150 level and the 200-week moving average called "
    "out as the two that matter, price around 186. Circle is the one carrying a hard date: the CLARITY "
    "Act vote on 9/15, holding above its IPO-week lows near 49.9 and recovered toward 88, with a buy-the-"
    "rumour move flagged as the setup. That date is the useful cross-reference of the week, because "
    "Visser independently put the financial-guardrail constraint in September without naming a vote, and "
    "the White House signalled the US proceeds either way. Two voices, two routes, one month."
)

Z_NVDA = (
    "Nvidia stays the anchor and the argument is fundamental rather than technical this time: it is "
    "raising prices by about 15% into accelerating demand, and has spent nearly an entire year basing "
    "while earnings explode, trading around 214-215 against a prior high near 236. That is the same "
    "observation Visser makes from the multiple side, arrived at from the tape. SoFi is the new "
    "pattern-match and it is explicitly framed off names that already worked \u2014 a multi-month "
    "consolidation near 18.91 under resistance around 19-20 with a rising 200-day, which \u201clooks a lot "
    "like $PLTR $HOOD $SHOP did before their recent big moves higher.\u201d Note what that does to Palantir: "
    "it appears this window only as a comparison, with no chart and no setup, so its ZaStocks leg is now "
    "aging even though Visser\u2019s leg is fresh. Figma carries forward from 8/17 on the same structure as "
    "before \u2014 post-IPO base near 25.4 down from 143, 40% short interest, OpenAI and Anthropic "
    "partnerships. Nothing appeared this window on MU, CRWV, NBIS, RDDT, SPCX or OUST, all of which "
    "carried dedicated charts last week; that rotation away is itself worth logging. His risk note is "
    "the one to keep next to Visser\u2019s table-pounding: \u201coversizing leads to more ruin than almost "
    "anything else.\u201d"
)

EDITORIALS = [
    ("The scarcity argument hardened into a supply schedule", V_COMPUTE, "Visser / AI Compute"),
    ("Neither Lilly nor Amazon drew direct commentary for the second straight window", V_APP, "Visser / AI Application"),
    ("He put a date on it for the first time", V_TOKEN, "Visser / Tokenization"),
    ("The most explicit hard-money instruction he has given this quarter", V_MONETARY, "Visser / Monetary"),
    ("Micron is the convergence of the window and the only one", Z_HEALTH, "ZaStocks / healthcare"),
    ("Reddit is his most-repeated name of the window", Z_CRYPTO, "ZaStocks / crypto"),
    ("SpaceX draws his strongest institutional language of the window", Z_NVDA, "ZaStocks / NVDA base"),
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
        print("  %-26s %5d -> %5d chars" % (label, old_len, len(body)))

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
