#!/usr/bin/env python3
"""
patch_voicecards_0914.py — voiceCards.ts + SignalRadar.tsx, 2026-09-14 freeze.

Sources: Visser 9/13 weekly ("Linear vs. Exponential: AGI Has Arrived But Oil,
Bonds and the Fed Oh My"), Visser 9/14 on Pomp ("Why Bitcoin Wins No Matter What
The Fed Does"), ZaStocks 9/7-9/14.

Camillo UNTOUCHED — no capture since 8/24-8/30, now a SECOND dark week.

Run from repo root, then npm run build.
"""
import shutil, sys, time

hits = []


def swap(path, label, opening, body):
    src = open(path, encoding="utf-8").read()
    key = "editorial: `" + opening
    if src.count(key) != 1:
        sys.exit(f"ABORT [{label}]: opening fragment found {src.count(key)} times")
    i = src.index(key) + len("editorial: `")
    j = src.index("`", i)
    open(path, "w", encoding="utf-8").write(src[:i] + body + src[j:])
    hits.append(label)


def sub(path, label, old, new):
    src = open(path, encoding="utf-8").read()
    if src.count(old) != 1:
        sys.exit(f"ABORT [{label}]: anchor found {src.count(old)} times")
    open(path, "w", encoding="utf-8").write(src.replace(old, new, 1))
    hits.append(label)


VC = "src/data/voiceCards.ts"
RD = "src/components/SignalRadar.tsx"

if "2026-09-14 freeze" in open(VC, encoding="utf-8").read():
    sys.exit("ABORT: patch already applied")

shutil.copy2(VC, f"{VC}.bak.{time.strftime('%Y%m%d-%H%M%S')}")
shutil.copy2(RD, f"{RD}.bak.{time.strftime('%Y%m%d-%H%M%S')}")

# ---------------------------------------------------------------- header
sub(VC, "header",
 "// Cycle 2026-09-07 — NOT FROZEN.",
 "// Cycle 2026-09-14 freeze — '2026-09-14-v3.5-asmlcut'. TICKER SET 12 -> 11.\n"
 "// ASML removed under Rule B: holding #17 in SOXX at 2.49% (34-name list dated\n"
 "// 2026-08-20), so the lithography seat sat inside the semis basket seat. GLW was\n"
 "// checked against the same list and is ABSENT — Corning is glass and optical, not\n"
 "// a semiconductor — so the optical seat is not redundant and stays. ASML also\n"
 "// carried a standing NO VOICE SUPPORT flag: zero mentions in over a month.\n"
 "//\n"
 "// AI Buildout trend weight OVERRIDDEN to 24.70 — a logged discretionary override\n"
 "// per workflow 5.1, not engine output. Breadth falls 1.7458 -> 1.6716 on the\n"
 "// removal, which would cut the sleeve to 24.43. +0.27pp. Derived timing RISES\n"
 "// 0.9040 -> 0.9300 because the removed name was `cooling`.\n"
 "//\n"
 "// No classification changed. Three entry bands moved on 9/11 closes: AIPO and GLW\n"
 "// both broke BELOW their 200-DMAs (band 0.95 -> 0.75, still `binding` — the rung\n"
 "// is the bottleneck, the band is the price), AMZN fell below its 50-DMA into base\n"
 "// 72 (0.85 -> 0.95). 26.9% of the book is now entry-paused, up from 16.9%.\n"
 "// Turnover 12.61pp, of which 5.0 is the ASML removal.\n"
 "//\n"
 "// CAMILLO IS STALE FOR A SECOND WEEK. No capture since 8/24-8/30. AMZN's lenses=2\n"
 "// convergence flag runs on <=120d ledger history, not current evidence.\n"
 "//\n"
 "// Superseded note from the 2026-09-07 cycle:")

sub(VC, "visser_asof",
 "    subtitle: 'Jordi Visser — macro framework for the physical AI upgrade',\n"
 "    asOf: 'September 6, 2026',",
 "    subtitle: 'Jordi Visser — macro framework for the physical AI upgrade',\n"
 "    asOf: 'September 13, 2026',")

sub(VC, "za_asof",
 "asOf: 'wk of Sep 1 – 7 · via Grok',",
 "asOf: 'wk of Sep 7 – 14 · via Grok',")

# ---------------------------------------------------------------- AI Buildout
swap(VC, "th_buildout",
 "The tape got worse and his call got firmer",
 "The sleeve went quiet in the transcripts and loud in the tape, and those point the "
 "same way. Across both episodes AIPO, SOXX, GLW and COPX drew one alias-level mention "
 "each and no stage call — the buildout got almost none of his airtime in a week he "
 "spent on crypto and the Fed. Meanwhile AIPO broke below its 200-day at 27.43 against "
 "27.81, and GLW broke below its at 143.72 against 145.81. Both remain classified "
 "binding, because the rung describes the bottleneck and the entry band handles the "
 "price, but both now sit on the ×0.75 floor and 26.9% of the book is entry-paused. "
 "The structural change this week is a removal rather than a call: ASML is out. It is "
 "holding number seventeen inside SOXX at 2.49%, so the lithography seat was partly a "
 "second helping of the semis basket seat — the same reasoning that de-seated Micron "
 "and Marvell under Rule B back in v3.3. Corning was checked against the same 34-name "
 "list and is absent, which is why the optical seat survives the cut while the "
 "lithography one does not. ASML had also carried a NO VOICE SUPPORT flag for over a "
 "month, so nothing in the transcripts argued for keeping it. Where he did engage with "
 "hardware, it was Micron, and the framing was deliberately deflationary: he does not "
 "expect another five-bagger, he sketches 1,600 to 2,000 from roughly a thousand as the "
 "realistic range, and he notes he got out of it before the top last cycle. Memory "
 "remains the only maximum-demand sub-theme with no seat, and Rule B bars the one "
 "vehicle he actually names.")

# ---------------------------------------------------------------- AI Applied
swap(VC, "th_applied",
 "This is the week the adoption wave moved",
 "The wave did not move this week, and that is the finding. The structural-language "
 "sweep across both episodes turned up no role-assignment statement and no wave "
 "transition, so the book stays on consumer agents with the same demand table it "
 "carried last week. Neither Amazon nor Eli Lilly drew a Visser mention — AMZN appears "
 "six times and almost all of it is other people's context — so both seats continue to "
 "rest on prior weeks, and with Camillo dark for a second week AMZN's convergence flag "
 "is running on ledger history rather than current evidence. What moved was price. "
 "Amazon slipped below its 50-day at 253.57 against 255.47, which under the entry "
 "ladder raises its band from 0.85 to 0.95 and lifts it into a tie with Lilly at 13.2 "
 "— the first time the distribution seat has matched the proprietary-data one. That is "
 "the anti-momentum brake working as designed: the name got cheaper relative to its own "
 "trend and the engine bought more of it, with no change in what anyone said about it. "
 "His broader framing carried over intact from last week — agents force infrastructure, "
 "and the interesting agents are now personal and workflow rather than coding.")

# ---------------------------------------------------------------- Rails
swap(VC, "th_rails",
 "He gave the cleanest statement of the thesis he has produced",
 "This was the loudest sleeve of the week by a distance — Robinhood, Ethereum and "
 "Bitcoin together account for most of his airtime across both episodes — and the "
 "single most useful sentence is a stage marker rather than a price call. On what "
 "Robinhood has built: the chain running on Ethereum through Arbitrum is, in his words, "
 "literally saying we are at the beginning of tokenization. The beginning. That phrasing "
 "is why the settlement seat holds at working for a third consecutive week rather than "
 "advancing — a thesis restated, even emphatically, is not a rung, and he is explicitly "
 "describing an early stage rather than a binding constraint. He expects network effects "
 "to compound from here and spent the week researching a valuation framework for chains "
 "as ecosystems, borrowing the comparison to the internet itself, with a source who has "
 "worked on both the Ethereum and Solana foundations. Solana itself drew only two "
 "passing mentions, materially weaker than the three-horsemen framing of the prior week, "
 "so the speed role stays a named gap rather than a candidate — though GSOL now has "
 "clean correlation data whenever it is worth scoring. Robinhood ran into the week and "
 "then gave some back, stretch easing from 19.2% to 10.5%, which lifts nothing: the seat "
 "trims to 7.4 on the trend's fixed share.")

# ---------------------------------------------------------------- Monetary
swap(VC, "th_monetary",
 "Gold and silver got zero airtime across both episodes",
 "Third consecutive week with no Visser mention of gold or silver, which is now the "
 "most durable fact on this card. The 8/30 relative de-rate — higher, but not the "
 "fastest horse, and not in the top hundred, because gold will not be part of the "
 "economy going forward — still governs GLDM's working classification a month later, "
 "unrefreshed. Silver has not been named since 8/16. Neither absence is a stage call and "
 "neither moved anything; silence ages a classification rather than changing it. Both "
 "remain below their 200-day averages and entry-paused at ×0.75, together 16.9% of the "
 "book sitting on the floor. Bitcoin is where the conviction went. The Pomp episode ran "
 "under the title that crypto wins regardless of what the Fed does, and his argument is "
 "the same double-debasement structure he has been building: crypto takes a rising share "
 "of fiat assets because AI disrupts the earning power behind the old assets and because "
 "the government cannot let rates run ahead of the midterms. He adds an ecosystem "
 "argument — what matters most to him is the system as a whole, and Bitcoin can keep "
 "going higher and drag the rest along. IBIT's stretch eased from 18.8% to 14.5% without "
 "changing bands, so the seat holds flat at 12.2.")

# ---------------------------------------------------------------- ZaStocks
swap(VC, "za_hood",
 "Robinhood is again the only book name he touched",
 "A wide week with almost nothing in the book. His named tickers were META, GOOGL and "
 "TSLA, all logged Watching with chart levels and no stated position, plus Palantir on "
 "the framing that it wins whichever way the AI race resolves. None of that seats "
 "anything: he is corroboration-only, and corroboration requires Visser or Camillo "
 "pointing at the same name in the same window. Visser named none of them and Camillo "
 "is dark for a second week, so every one of them stays a nomination. Of the twelve "
 "names in the book before this freeze he touched essentially none with a chart. The "
 "watchlist names he did work through — Micron, Nvidia, Coinbase, Vistra, Circle — are "
 "already tracked and none cleared a gate. Worth recording that the unseated names he "
 "raises are increasingly the mega-cap application layer rather than the infrastructure "
 "layer, which is a different bet from the one this book expresses.")

swap(VC, "za_frame",
 "The week's dividing line is quality against speculation",
 "The framing he returned to is that it does not much matter who wins the AI race, "
 "because the infrastructure and application layers get paid either way — offered "
 "around Palantir and Alphabet rather than as a portfolio claim. On Alphabet "
 "specifically he reads a weekly triangle tightening under the 408.61 high with price "
 "near 338.50 at the apex, and notes that if OpenAI and its peers slow down it is not "
 "obviously bad for Google. Meta gets a bounce toward a descending trendline off the "
 "796.25 high. Tesla is filed under robotics, coiling under 498.83 with price around "
 "365 sitting on its 20-EMA. All Watching, no positions, no seats. His Sunday Substack "
 "remains paywalled and outside the capture, which continues to mean the portfolio and "
 "his stated favourite setup are not visible to this lens.")

# ---------------------------------------------------------------- SignalRadar
sub(RD, "chip_buildout",
 "  { name: 'AI Buildout',     tag: 'binding, crowded', blurb: 'Power and optical binding, semis cooling; SMH \\u221214% QTD and he says ignore it.', binding: true },",
 "  { name: 'AI Buildout',     tag: '11 names now',     blurb: 'ASML cut \\u2014 it sat inside SOXX at 2.49%. AIPO and GLW both broke their 200-DMAs.', binding: true },")

sub(RD, "chip_applied",
 "  { name: 'AI Applied',      tag: 'wave advanced',    blurb: 'Personal and workflow agents now; neither name mentioned by L1 this week.' },",
 "  { name: 'AI Applied',      tag: 'wave unchanged',   blurb: 'AMZN below its 50-DMA lifts its entry band; ties LLY at 13.2 for the first time.' },")

sub(RD, "chip_rails",
 "  { name: 'Tokenized Rails', tag: 'held at working',  blurb: 'ETHA working a second week; Solana named as the speed leg, unseated.' },",
 "  { name: 'Tokenized Rails', tag: 'third week working', blurb: '\\u201cWe\\u2019re at the beginning of tokenization\\u201d \\u2014 the beginning argues against escalating.' },")

sub(RD, "chip_monetary",
 "  { name: 'Monetary',        tag: 'third wave start', blurb: 'BTC third-wave start; gold and silver silent two weeks running.' },",
 "  { name: 'Monetary',        tag: 'BTC carries it',   blurb: 'Gold and silver silent three weeks; both entry-paused below their 200-DMAs.' },")

print("OK  edits: " + ", ".join(hits))
print("    Camillo untouched by design — second consecutive dark week.")
print("    VERIFY: grep -n asOf src/data/voiceCards.ts && npm run build")
