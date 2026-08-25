// server/daily-cron.cjs
// AlphaPlaybook Daily Orchestrator
// Runs: narrative → crowd → quant → aggregate bullish assets →
//       compute model portfolio → fetch prices → calculate P&L →
//       write complete daily_snapshot to Supabase
//
// Schedule: 0 23 * * * (7pm ET = 23:00 UTC)
// Deploy: Render.com cron job

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// --- Config ---
// Finnhub: ALL current prices — the 17 holdings AND the SPY benchmark price.
//   /quote endpoint, free tier 60 calls/min, no daily cap.
// Twelve Data: SPY daily close *series* (free tier ~800/day, 8/min). Used ONLY to
//   compute RSI ourselves — TD's own RSI/SMA endpoints are premium; the raw
//   time_series is free. (Step 2 will reuse this for per-ticker 10/50/200 DMAs.)
// Alpha Vantage: REMOVED. It previously owned the SPY price *and* RSI, so any AV
//   rate-limit/premium hiccup froze the benchmark (Jun 3: portfolio -1.95% while SPY
//   showed flat). SPY price now rides the holdings' Finnhub feed, so the two can't
//   diverge by source; only RSI depends on Twelve Data, and it fails independently.
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY
const TWELVE_DATA_KEY = process.env.TWELVE_DATA_KEY
const FRED_API_KEY = process.env.FRED_API_KEY
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY. Check environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
// Date the snapshot by the US MARKET day (ET), not UTC. A 23:00 UTC scheduled run
// already maps to the same ET calendar day, but a manual trigger after ~8pm ET would
// roll into the next UTC day and spawn a phantom future-dated row (e.g. a duplicate
// Jun 5 created on the evening of Jun 4). en-CA → 'YYYY-MM-DD'; timeZone pins it to ET.
const TODAY = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' })

// ============================================================================
// PLAY 1: NARRATIVE PIPELINE
// ============================================================================

const SOURCES = [
  {
    name: 'visser',
    label: 'Jordi Visser',
    channels: [
      { id: 'UCevXpeL8cNyAnww-NqJ4m2w', name: 'Anthony Pompliano', filterGuest: 'Jordi Visser' },
    ],
  },
  {
    name: 'allin',
    label: 'All-In Podcast',
    channels: [
      { id: 'UCESLZhusAkFfsNsApnjF_Cg', name: 'All-In Podcast', filterGuest: null },
    ],
  },
  {
    name: 'moonshots',
    label: 'Moonshots (Peter Diamandis)',
    channels: [
      { id: 'UCvxm0qTrGN_1LMYgUaftWyQ', name: 'Peter H. Diamandis', filterGuest: null },
    ],
  },
]

const ASSET_KEYWORDS = {
  'bitcoin': { ticker: 'IBIT', asset: 'Bitcoin', category: 'crypto' },
  'btc': { ticker: 'IBIT', asset: 'Bitcoin', category: 'crypto', exact: true },
  'ethereum': { ticker: 'ETH', asset: 'Ethereum', category: 'crypto' },
  'crypto': { ticker: 'IBIT', asset: 'Crypto', category: 'crypto' },
  'digital asset': { ticker: 'IBIT', asset: 'Digital Assets', category: 'crypto' },
  'gold': { ticker: 'GLDM', asset: 'Gold', category: 'commodity', exact: true },
  'silver': { ticker: 'SLV', asset: 'Silver', category: 'commodity' },
  'copper': { ticker: 'COPX', asset: 'Copper', category: 'commodity' },
  'oil price': { ticker: 'XLE', asset: 'Oil', category: 'commodity' },
  'crude oil': { ticker: 'XLE', asset: 'Oil/Energy', category: 'commodity' },
  'energy sector': { ticker: 'XLE', asset: 'Energy', category: 'commodity' },
  'energy stocks': { ticker: 'XLE', asset: 'Energy', category: 'commodity' },
  'natural gas': { ticker: 'XLE', asset: 'Natural Gas', category: 'commodity' },
  'uranium': { ticker: 'URA', asset: 'Uranium', category: 'commodity' },
  'commodities': { ticker: 'COPX', asset: 'Commodities', category: 'commodity' },
  'semiconductor': { ticker: 'XSD', asset: 'Semiconductors', category: 'equity' },
  'semiconductors': { ticker: 'XSD', asset: 'Semiconductors', category: 'equity' },
  'chips': { ticker: 'XSD', asset: 'Semiconductors', category: 'equity' },
  'nvidia': { ticker: 'NVDA', asset: 'NVIDIA', category: 'equity' },
  'artificial intelligence': { ticker: 'XSD', asset: 'AI/Tech', category: 'equity' },
  'tech stocks': { ticker: 'QQQ', asset: 'Tech', category: 'equity' },
  'nasdaq': { ticker: 'QQQ', asset: 'Nasdaq', category: 'equity' },
  'small cap': { ticker: 'IWM', asset: 'Small Caps', category: 'equity' },
  'stock market': { ticker: 'SPY', asset: 'Stock Market', category: 'equity' },
  'equities': { ticker: 'SPY', asset: 'Equities', category: 'equity' },
  'cybersecurity': { ticker: 'CIBR', asset: 'Cybersecurity', category: 'equity' },
  'defense': { ticker: 'PPA', asset: 'Defense', category: 'equity' },
  'healthcare': { ticker: 'XLV', asset: 'Healthcare', category: 'equity' },
  'dividends': { ticker: 'SCHD', asset: 'Dividend Stocks', category: 'equity' },
  'international': { ticker: 'VEA', asset: 'International', category: 'equity' },
  'europe': { ticker: 'VEA', asset: 'Europe', category: 'equity' },
  'emerging market': { ticker: 'VWO', asset: 'Emerging Markets', category: 'equity' },
  'data center': { ticker: 'XSD', asset: 'Data Centers', category: 'equity' },
  'data centers': { ticker: 'XSD', asset: 'Data Centers', category: 'equity' },
  'infrastructure': { ticker: 'GRID', asset: 'Infrastructure', category: 'equity' },
  'power grid': { ticker: 'GRID', asset: 'Power Grid', category: 'equity' },
  'electric grid': { ticker: 'GRID', asset: 'Electric Grid', category: 'equity' },
  'bonds': { ticker: 'TLT', asset: 'Bonds', category: 'fixed_income' },
  'treasuries': { ticker: 'TLT', asset: 'Treasuries', category: 'fixed_income' },
  'treasury': { ticker: 'TLT', asset: 'Treasuries', category: 'fixed_income' },
  'cash': { ticker: 'SGOV', asset: 'Cash/T-Bills', category: 'fixed_income', exact: true },
  'recession': { ticker: 'SPY', asset: 'Recession Risk', category: 'macro_bearish' },
  'economic downturn': { ticker: 'SPY', asset: 'Economic Downturn', category: 'macro_bearish' },
  'hard landing': { ticker: 'SPY', asset: 'Hard Landing', category: 'macro_bearish' },
  'soft landing': { ticker: 'SPY', asset: 'Soft Landing', category: 'macro_bullish' },
  'inflation': { ticker: 'GLDM', asset: 'Inflation', category: 'macro' },
  'inflationary': { ticker: 'GLDM', asset: 'Inflation', category: 'macro' },
  'stagflation': { ticker: 'GLDM', asset: 'Stagflation', category: 'macro_bearish' },
  'deflation': { ticker: 'TLT', asset: 'Deflation', category: 'macro' },
  'interest rate': { ticker: 'TLT', asset: 'Interest Rates', category: 'macro' },
  'rate cut': { ticker: 'TLT', asset: 'Rate Cuts', category: 'macro_bullish' },
  'rate hike': { ticker: 'SGOV', asset: 'Rate Hikes', category: 'macro_bearish' },
  'federal reserve': { ticker: 'TLT', asset: 'Fed Policy', category: 'macro' },
  'the fed': { ticker: 'TLT', asset: 'Fed Policy', category: 'macro' },
  'quantitative easing': { ticker: 'SPY', asset: 'QE', category: 'macro_bullish' },
  'money printing': { ticker: 'GLDM', asset: 'Money Printing', category: 'macro' },
  'liquidity': { ticker: 'IBIT', asset: 'Global Liquidity', category: 'macro' },
  'dollar debasement': { ticker: 'GLDM', asset: 'Dollar Debasement', category: 'macro' },
  'scarcity': { ticker: 'GLDM', asset: 'Scarcity Trade', category: 'macro' },
  'abundance': { ticker: 'XSD', asset: 'Abundance Trade', category: 'macro' },
  'tariff': { ticker: 'VEA', asset: 'Tariffs/Trade', category: 'macro' },
  'trade war': { ticker: 'VEA', asset: 'Trade War', category: 'macro_bearish' },
  'sanctions': { ticker: 'XLE', asset: 'Sanctions', category: 'macro' },
  'war': { ticker: 'GLDM', asset: 'War/Conflict', category: 'geopolitical', exact: true },
  'military': { ticker: 'PPA', asset: 'Military/Defense', category: 'geopolitical' },
  'geopolitical': { ticker: 'GLDM', asset: 'Geopolitical Risk', category: 'geopolitical' },
  'iran': { ticker: 'XLE', asset: 'Iran Risk', category: 'geopolitical', exact: true },
  'china': { ticker: 'XSD', asset: 'China Risk', category: 'geopolitical', exact: true },
  'russia': { ticker: 'XLE', asset: 'Russia Risk', category: 'geopolitical' },
  'ukraine': { ticker: 'GLDM', asset: 'Ukraine Conflict', category: 'geopolitical' },
  'nuclear': { ticker: 'GLDM', asset: 'Nuclear Risk', category: 'geopolitical' },
}

const BULLISH_WORDS = [
  'bullish', 'buy', 'buying', 'long', 'love', 'excited about', 'optimistic',
  'going higher', 'upside', 'opportunity', 'undervalued', 'accumulate',
  'all-time high', 'breakout', 'moon', 'ripping', 'outperform', 'overweight',
  'conviction', 'loading up', 'adding to', 'favorite', 'best trade',
  'massive opportunity', 'generational', 'secular bull', 'super cycle',
]

const BEARISH_WORDS = [
  'bearish', 'sell', 'selling', 'short', 'worried', 'concerned', 'overvalued',
  'going lower', 'downside', 'bubble', 'crash', 'dump', 'underperform',
  'underweight', 'avoid', 'stay away', 'risk', 'cautious', 'defensive',
  'top is in', 'correction', 'recession', 'stagflation',
]

const HIGH_CONVICTION_WORDS = [
  'highest conviction', 'most bullish', 'strongest', 'absolutely',
  'no doubt', 'best opportunity', 'generational', 'all-in', 'massive',
  'number one', 'top pick', 'favorite trade', 'pounding the table',
]

async function searchYouTube(channelId, channelName, maxResults = 3) {
  if (!YOUTUBE_API_KEY) {
    console.warn('  No YOUTUBE_API_KEY — skipping YouTube search')
    return []
  }
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=${maxResults}&type=video&key=${YOUTUBE_API_KEY}`
  const response = await fetch(url)
  const data = await response.json()
  if (data.error) {
    console.warn(`  YouTube API error for ${channelName}:`, data.error.message)
    return []
  }
  return (data.items || []).map((item) => ({
    videoId: item.id.videoId,
    title: item.snippet.title,
    description: item.snippet.description,
    publishedAt: item.snippet.publishedAt,
    channelName,
    url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
  }))
}

async function fetchTranscript(videoId) {
  const fs = require('fs')
  const path = require('path')
  const transcriptDir = path.join(__dirname, 'transcripts')
  const videoFile = path.join(transcriptDir, `${videoId}.txt`)
  if (fs.existsSync(videoFile)) {
    const text = fs.readFileSync(videoFile, 'utf-8').trim()
    if (text.length > 100) {
      console.log(`  Got transcript file (${text.length} chars)`)
      return { text: text.slice(0, 50000), source: 'manual-paste' }
    }
  }
  console.log(`  No transcript file for ${videoId}`)
  return { text: null, source: 'none' }
}

function extractSignals(text, source, videoTitle) {
  if (!text) text = videoTitle || ''
  const textLower = text.toLowerCase()
  const signals = []
  const seenTickers = new Set()

  for (const [keyword, assetInfo] of Object.entries(ASSET_KEYWORDS)) {
    const keywordLower = keyword.toLowerCase()
    let idx = -1
    if (assetInfo.exact) {
      const regex = new RegExp(`\\b${keywordLower}\\b`)
      const match = regex.exec(textLower)
      idx = match ? match.index : -1
    } else {
      idx = textLower.indexOf(keywordLower)
    }
    if (idx === -1) continue
    if (seenTickers.has(assetInfo.ticker)) continue
    seenTickers.add(assetInfo.ticker)

    const contextStart = Math.max(0, idx - 200)
    const contextEnd = Math.min(textLower.length, idx + keyword.length + 200)
    const context = textLower.slice(contextStart, contextEnd)

    let direction = 'neutral'
    let conviction = 'low'
    const hasBullish = BULLISH_WORDS.some((w) => context.includes(w))
    const hasBearish = BEARISH_WORDS.some((w) => context.includes(w))
    const hasHighConviction = HIGH_CONVICTION_WORDS.some((w) => context.includes(w))

    if (hasBullish && !hasBearish) {
      direction = 'bullish'
      conviction = hasHighConviction ? 'high' : 'medium'
    } else if (hasBearish && !hasBullish) {
      direction = 'bearish'
      conviction = hasHighConviction ? 'high' : 'medium'
    }

    if (assetInfo.category === 'macro_bearish' && direction === 'neutral') {
      direction = 'bearish'
      conviction = 'medium'
    }
    if (assetInfo.category === 'macro_bullish' && direction === 'neutral') {
      direction = 'bullish'
      conviction = 'medium'
    }

    const originalText = text.slice(contextStart, contextEnd).trim()
    const sentences = originalText.split(/[.!?]+/)
    const relevantSentence = sentences.find((s) => s.toLowerCase().includes(keywordLower)) || ''

    signals.push({
      ticker: assetInfo.ticker,
      asset: assetInfo.asset,
      category: assetInfo.category,
      direction,
      conviction,
      quote: relevantSentence.trim().slice(0, 150) || null,
      source,
    })
  }
  return signals
}

async function runNarrativePipeline() {
  console.log('\n========================================')
  console.log('PLAY 1: NARRATIVE PIPELINE')
  console.log('========================================')

  if (!YOUTUBE_API_KEY) {
    console.log('No YOUTUBE_API_KEY set — skipping narrative pipeline')
    return []
  }

  const allSignals = []

  for (const source of SOURCES) {
    console.log(`\n--- ${source.label} ---`)
    const allVideos = []

    for (const channel of source.channels) {
      console.log(`  Searching ${channel.name}...`)
      const videos = await searchYouTube(channel.id, channel.name)

      if (channel.filterGuest) {
        const titleMatches = []
        const needsDescCheck = []
        for (const v of videos) {
          const titleAndDesc = `${v.title} ${v.description}`.toLowerCase()
          if (titleAndDesc.includes(channel.filterGuest.toLowerCase())) {
            titleMatches.push(v)
          } else {
            needsDescCheck.push(v)
          }
        }
        for (const v of needsDescCheck) {
          try {
            const detailUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${v.videoId}&key=${YOUTUBE_API_KEY}`
            const detailResponse = await fetch(detailUrl)
            const detailData = await detailResponse.json()
            if (detailData.items && detailData.items[0]) {
              const fullDesc = detailData.items[0].snippet.description
              if (fullDesc.toLowerCase().includes(channel.filterGuest.toLowerCase())) {
                v.description = fullDesc
                titleMatches.push(v)
              }
            }
          } catch (e) { /* skip */ }
        }
        console.log(`  Found ${titleMatches.length} relevant videos`)
        allVideos.push(...titleMatches)
      } else {
        console.log(`  Found ${videos.length} videos`)
        allVideos.push(...videos)
      }
    }

    if (allVideos.length === 0) {
      console.log(`  No recent videos for ${source.label}`)
      continue
    }

    const latest = allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))[0]
    console.log(`  Latest: "${latest.title}" (${latest.publishedAt.split('T')[0]})`)

    // Fetch full description
    try {
      const detailUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${latest.videoId}&key=${YOUTUBE_API_KEY}`
      const detailResponse = await fetch(detailUrl)
      const detailData = await detailResponse.json()
      if (detailData.items && detailData.items[0]) {
        latest.description = detailData.items[0].snippet.description
      }
    } catch (e) { /* skip */ }

    const transcript = await fetchTranscript(latest.videoId)
    const textToAnalyze = transcript.text || `${latest.title} ${latest.description}`
    const signals = extractSignals(textToAnalyze, source.name, latest.title)
    console.log(`  Extracted ${signals.length} signals`)

    const withMeta = signals.map((s) => ({
      ...s,
      video_title: latest.title,
      video_url: latest.url,
      channel: latest.channelName,
      published_at: latest.publishedAt,
    }))
    allSignals.push(...withMeta)
  }

  // Write narrative signals to signals table
  for (const signal of allSignals) {
    await supabase.from('signals').insert({
      snapshot_date: TODAY,
      source: 'narrative',
      video_title: signal.video_title,
      video_url: signal.video_url,
      channel: signal.channel,
      direction: signal.direction,
      mapped_tickers: [signal.ticker],
      conviction: signal.conviction,
      raw_data: signal,
    })
  }

  console.log(`\n✓ Narrative: ${allSignals.length} signals written`)
  return allSignals
}

// ============================================================================
// PLAY 2: CROWD PIPELINE
// ============================================================================

// Curated Kalshi macro watchlist — replaces the old Polymarket title-search, which only
// surfaced geopolitical/political noise (NATO exit, elections, Starmer, etc.). Each entry
// is a single high-liquidity, on-thesis market. Public read, no auth (KALSHI_HOSTS lives
// in the macro block below; referenced at call time so declaration order is fine). The CPI
// row reuses fetchKalshiCPI() so the inflation leg has one source of truth. `read` is a
// function of the live probability, so the plain-language label can't contradict the
// number when a market reprices.
const KALSHI_WATCHLIST = [
  { label: 'Fed: zero cuts in 2026', series: 'KXRATECUTCOUNT', match: /exactly 0 cuts/i,
    read: (p) => (p >= 0.5 ? 'higher for longer' : 'cuts still expected'),
    direction: 'bearish', mapped_assets: ['TLT'] },
  { label: 'US recession in 2026', series: 'KXRECSSNBER', match: /^starts$/i,
    read: (p) => (p < 0.20 ? 'low near-term risk' : p < 0.40 ? 'rising risk' : 'elevated risk'),
    direction: 'bullish', mapped_assets: ['SPY'] },
  { label: 'CPI YoY above 4%', cpi: true,
    read: (p) => (p < 0.35 ? 'sub-4%, cooling' : p < 0.60 ? 'near the 4% line' : 'hot, above 4%'),
    direction: 'neutral', mapped_assets: ['GLDM', 'SLV', 'XLE'] },
  { label: 'Bitcoin tops $100k in 2026', series: 'KXBTCMAXY', match: /above \$?(99,?999|100,?000)/i,
    read: (p) => (p < 0.35 ? 'reclaim doubted' : p < 0.60 ? 'coin-flip on $100k' : 'reclaim favored'),
    direction: 'bearish', mapped_assets: ['IBIT', 'ETHA'] },
]

// Next S&P 500 additions — KXSP500ADDQ, one event per quarter. AUTO-ROLLS: picks the
// open event with the NEAREST close_time, so when Q3 (26SEP30) settles the Q4 event
// takes over with no code change. Probabilities are bid/ask MIDPOINTS — these strikes
// are thin (OI in the hundreds) and last-trade goes stale (RDDT printed 28% on zero
// 24h volume at build time). Display-only row: the caller sets direction 'neutral' and
// mapped_assets [] so it never feeds aggregateBullishAssets. Skip-safe -> null.
const KALSHI_SP500_SERIES = 'KXSP500ADDQ'
async function fetchSP500Additions() {
  for (const host of KALSHI_HOSTS) {
    try {
      const res = await fetch(`${host}/markets?series_ticker=${KALSHI_SP500_SERIES}&status=open&limit=200`,
        { headers: { 'User-Agent': 'Mozilla/5.0 (AlphaPlaybook cron)' } })
      if (!res.ok) continue
      const ms = ((await res.json()).markets) || []
      if (!ms.length) return null
      const events = {}
      for (const m of ms) {
        const ev = String(m.ticker || '').split('-').slice(0, -1).join('-')
        if (!ev) continue
        ;(events[ev] = events[ev] || []).push(m)
      }
      // Event selection corrected 2026-08-24. Several KXFEAR events run at once
      // and the earliest close is often a book nobody is making (26SEP18: zero
      // open interest, 17-point spreads, mids summing 1.095), which the sum
      // guard then correctly rejects -- silently dropping the tile to its
      // fallback. Walk candidates in close_time order, take the first event
      // that is actually being made. Guards below are unchanged in substance.
      const candidates = Object.entries(events)
        .map(([ev, list]) => ({
          ev,
          list,
          close: String(list[0].close_time || ''),
          oi: list.reduce((s, m) => s + (parseFloat(m.open_interest_fp ?? m.open_interest) || 0), 0),
        }))
        .sort((a, b) => a.close.localeCompare(b.close))
      let nearest = null
      let mids = null
      let sum = null
      for (const c of candidates) {
        if (!(c.oi > 0)) {
          console.warn(`  Fear & Greed: ${c.ev} has zero open interest - skipping`)
          continue
        }
        const cand = {}
        for (const m of c.list) {
          const name = String(m.yes_sub_title || m.subtitle || '').trim()
          if (FG_BANDS.indexOf(name) < 0) continue
          const b = parseFloat(m.yes_bid_dollars), a = parseFloat(m.yes_ask_dollars)
          if (isNaN(b) || isNaN(a) || a <= 0) continue
          cand[name] = (b + a) / 2
        }
        if (Object.keys(cand).length !== 5) {
          console.warn(`  Fear & Greed: ${c.ev} incomplete ladder (${Object.keys(cand).length}/5 bands) - skipping`)
          continue
        }
        const s = FG_BANDS.reduce((acc, k) => acc + cand[k], 0)
        if (s < 0.95 || s > 1.06) {
          console.warn(`  Fear & Greed: ${c.ev} mids sum ${s.toFixed(3)}, outside 0.95-1.06 - skipping`)
          continue
        }
        nearest = c; mids = cand; sum = s
        break
      }
      if (!nearest) {
        console.warn('  Fear & Greed: no coherent open event - skipping')
        return null
      }
      const norm = {}
      for (const k of FG_BANDS) norm[k] = mids[k] / sum
      let band = FG_BANDS[0]
      for (const k of FG_BANDS) if (norm[k] > norm[band]) band = k
      const sideProb =
        (band === 'Fear' || band === 'Extreme Fear') ? norm['Extreme Fear'] + norm['Fear']
        : (band === 'Greed' || band === 'Extreme Greed') ? norm['Greed'] + norm['Extreme Greed']
        : null
      const implied = FG_BANDS.reduce((s, k) => s + norm[k] * FG_MIDPOINTS[k], 0)
      const out = {
        band,
        prob: Math.round(norm[band] * 1000) / 1000,
        side_prob: sideProb === null ? null : Math.round(sideProb * 1000) / 1000,
        implied: Math.round(implied * 10) / 10,
        bands: FG_BANDS.reduce((o, k) => { o[k] = Math.round(norm[k] * 1000) / 1000; return o }, {}),
        close_time: nearest.list[0].close_time || null,
        as_of: new Date().toISOString(),
      }
      console.log(`  Fear & Greed (${nearest.ev}): ${band} ${Math.round(norm[band] * 100)}% · implied ${out.implied} · sum ${sum.toFixed(3)}`)
      return out
    } catch (e) { /* next host */ }
  }
  return null
}

function buildMacroSignals(quantResult, cpi, nowcast, kalshi, priorAbove, fearGreed) {
  const regime = computeRegime(cpi, nowcast, kalshi, priorAbove)
  return {
    spy: quantResult.spyPrice === null ? null : {
      price: quantResult.spyPrice, ath: quantResult.spyAth, pct_off_ath: quantResult.spyPctOffAth,
    },
    rsi: quantResult.rsi === null ? null : { value: quantResult.rsi, signal: quantResult.signal },
    cpi: cpi || null,
    nowcast: nowcast || null,
    regime,
    kalshi: kalshi || null, // Kalshi CPI YoY leg (point estimate + P>4%); 2-of-3 vote wired with gate
    fear_greed: fearGreed || null, // Kalshi KXFEAR band distribution; display-only, feeds no score
  }
}


// ============================================================================
// AGGREGATION: Bullish Assets Ranking
// ============================================================================

function aggregateBullishAssets(narrativeSignals, crowdSignals, quantResult) {
  console.log('\n========================================')
  console.log('AGGREGATING BULLISH ASSET RANKINGS')
  console.log('========================================')

  // Collect all bullish signals per ticker across all three sources
  const tickerScores = {}

  // Score weights: high conviction = 3, medium = 2, low = 1
  const convictionWeight = { high: 3, medium: 2, low: 1 }

  // Narrative signals
  for (const s of narrativeSignals) {
    if (s.direction !== 'bullish') continue
    const ticker = s.ticker
    if (!tickerScores[ticker]) tickerScores[ticker] = { sources: new Set(), score: 0, signals: [] }
    tickerScores[ticker].sources.add('narrative')
    tickerScores[ticker].score += convictionWeight[s.conviction] || 1
    tickerScores[ticker].signals.push({ source: 'narrative', asset: s.asset, conviction: s.conviction })
  }

  // Crowd signals
  for (const s of crowdSignals) {
    if (s.direction !== 'bullish') continue
    for (const ticker of s.mapped_assets) {
      if (!tickerScores[ticker]) tickerScores[ticker] = { sources: new Set(), score: 0, signals: [] }
      tickerScores[ticker].sources.add('crowd')
      tickerScores[ticker].score += convictionWeight[s.conviction] || 1
      tickerScores[ticker].signals.push({ source: 'crowd', market: s.market, conviction: s.conviction })
    }
  }

  // Quant signals
  if (quantResult.signal === 'oversold') {
    const tickers = getRSIMappedTickers('oversold')
    for (const ticker of tickers) {
      if (!tickerScores[ticker]) tickerScores[ticker] = { sources: new Set(), score: 0, signals: [] }
      tickerScores[ticker].sources.add('quant')
      tickerScores[ticker].score += 2
      tickerScores[ticker].signals.push({ source: 'quant', indicator: `RSI ${quantResult.rsi}`, conviction: 'medium' })
    }
  }

  // Convert to sorted array
  const ranked = Object.entries(tickerScores)
    .map(([ticker, data]) => ({
      ticker,
      convergence: `${data.sources.size}/3`,
      source_count: data.sources.size,
      score: data.score,
      sources: Array.from(data.sources),
      signals: data.signals,
    }))
    .sort((a, b) => {
      // Sort by source count first (convergence), then by total score
      if (b.source_count !== a.source_count) return b.source_count - a.source_count
      return b.score - a.score
    })

  console.log('\nBullish Asset Rankings:')
  for (const r of ranked) {
    console.log(`  ${r.ticker}: ${r.convergence} convergence, score ${r.score} (${r.sources.join(', ')})`)
  }

  return ranked
}

// ============================================================================
// MODEL PORTFOLIO COMPUTATION
// ============================================================================

// v3.4 TREND-FIRST — frozen 2026-08-24.
// Cascade: name = 55 x timing x quality x wave_demand x entry_band(S5);
//          trend = derived_timing x conviction x breadth(N_eff);
//          weight = trend_weight x (name score / sum in trend).
// Canonical: v34_worksheet_2026-08-24.html   Spec: Trend_First_Spec.md
// 12 holdings. No cash line. Hard-money sleeve cap OFF (GLDM+IBIT+SLV = 30.4%).
// Retired this freeze: SKHY (unscoreable, no SMA50 until ~Sept 18), SGOV (no cash
// row in the cascade), MU + WDC (dropped 8/23 on measured redundancy).
const BASE_PORTFOLIO = {
  LLY:   { base_weight: 13.4, theme: 'AI Applied',        min_weight:  6.7, action: 'Hold' },
  AMZN:  { base_weight: 13.3, theme: 'AI Applied',        min_weight:  6.7, action: 'Hold' },
  IBIT:  { base_weight: 12.5, theme: 'Monetary',          min_weight:  6.2, action: 'Add' },
  GLDM:  { base_weight: 11.5, theme: 'Monetary',          min_weight:  5.8, action: 'Add' },
  ETHA:  { base_weight:  9.6, theme: 'Tokenized Rails',   min_weight:  4.8, action: 'Add' },
  HOOD:  { base_weight:  8.3, theme: 'Tokenized Rails',   min_weight:  4.2, action: 'Add' },
  SLV:   { base_weight:  6.4, theme: 'Monetary',          min_weight:  3.2, action: 'Hold' },
  AIPO:  { base_weight:  6.3, theme: 'AI Buildout',       min_weight:  3.1, action: 'Trim' },
  GLW:   { base_weight:  5.0, theme: 'AI Buildout',       min_weight:  2.5, action: 'Hold' },
  ASML:  { base_weight:  5.0, theme: 'AI Buildout',       min_weight:  2.5, action: 'Trim' },
  SOXX:  { base_weight:  4.6, theme: 'AI Buildout',       min_weight:  2.3, action: 'Trim' },
  COPX:  { base_weight:  4.1, theme: 'AI Buildout',       min_weight:  2.0, action: 'Hold' },
}

// SGOV left the book 2026-08-24 (v3.4 has no cash row) but the momentum
// sleeve still settles its cash residual in SGOV, so it must stay PRICED.
// Without this the fetch list drops it, prices['SGOV'] is undefined, and
// the `?? 0` at the cash line silently pays 0% on the residual forever.
const PRICE_EXTRAS = ['SGOV']

// Bump this on ANY engine rescore or weight change. The P&L compares it to the version
// stored in yesterday's snapshot; a change forces a one-night rebalance-to-target.
// Between bumps (same tickers, same version) holdings DRIFT with price — winners gain
// weight, losers shed it. A ticker add/drop also forces a rebalance regardless.
const PORTFOLIO_VERSION = '2026-08-24-v3.4-trendfirst'

function computeModelPortfolio(bullishAssets, quantResult) {
  console.log('\n========================================')
  console.log('COMPUTING MODEL PORTFOLIO')
  console.log('========================================')

  // Start with base weights.
  // NOTE (2026-05-28): The nightly convergence-boost + RSI-trim logic is DISABLED.
  // base_weights are now FINAL Decision Engine v2.1 output. The old boost
  // (+1..+5% per converging ticker, -10% RSI trim) double-counted the very signals
  // the engine already prices into the weight, and made live weights drift from the
  // validated sleeve. Principle: "fix scores, not weights." The cron reports engine
  // weights and tracks P&L; it does not re-adjust them. (Re-enable only when T3 wires
  // the six sub-scores into a live composite that REPLACES base_weight.)
  // bullishAssets/quantResult stay in the signature (passed by main) for that future.
  const portfolio = {}
  for (const [ticker, config] of Object.entries(BASE_PORTFOLIO)) {
    portfolio[ticker] = { ...config, weight: config.base_weight, adjustments: [] }
  }

  // SGOV cash floor removed 2026-08-24: v3.4 has no cash row.

  // Normalize weights to 100%
  const totalRaw = Object.values(portfolio).reduce((sum, p) => sum + p.weight, 0)
  for (const [ticker, pos] of Object.entries(portfolio)) {
    pos.weight_pct = Math.round((pos.weight / totalRaw) * 10000) / 100 // 2 decimal %
  }

  // Log
  const sorted = Object.entries(portfolio).sort((a, b) => b[1].weight_pct - a[1].weight_pct)
  for (const [ticker, pos] of sorted) {
    console.log(`  ${ticker}: ${pos.weight_pct}% [${pos.action}]`)
  }

  return portfolio
}

// ============================================================================
// PRICE FETCHER
// ============================================================================

async function fetchCurrentPrices(tickers) {
  console.log('\n========================================')
  console.log('FETCHING CURRENT PRICES (Finnhub /quote)')
  console.log('========================================')

  if (!FINNHUB_API_KEY) {
    console.warn('No FINNHUB_API_KEY — using placeholder prices')
    return {}
  }

  const prices = {}

  // Finnhub free tier: 60 calls/min, no daily cap. At ~17 tickers we stay well under
  // 60/min, so no inter-call pacing is needed. SGOV/GLDM are fetched live like everything
  // else. The c<=0 guard lives in finnhubQuote, which returns null → we skip so the P&L
  // carries the position flat rather than cratering it to zero.
  for (const ticker of tickers) {
    try {
      const q = await finnhubQuote(ticker)
      if (!q) continue // null → no valid quote (already logged); skip, carry flat
      prices[ticker] = { price: q.price, change_pct: q.change_pct }
      console.log(`  ${ticker}: $${q.price.toFixed(2)} (${q.change_pct >= 0 ? '+' : ''}${q.change_pct.toFixed(2)}%)`)
    } catch (error) {
      console.warn(`  ${ticker}: fetch error — ${error.message}`)
    }
  }

  return prices
}

// ============================================================================
// P&L CALCULATION
// ============================================================================

async function calculatePnL(portfolio, prices, spyPrice) {
  console.log('\n========================================')
  console.log('CALCULATING P&L')
  console.log('========================================')

  const STARTING_VALUE = 100000 // Portfolio baseline

  // ============================================================
  // FIX #1: Read INCEPTION SPY price (first ever snapshot), not yesterday's
  // This makes spy_cumulative_return_pct an inception-to-date number
  // so alpha-vs-SPY is comparable to portfolio cumulative_return_pct.
  // ============================================================
  const { data: firstSnapshot } = await supabase
    .from('daily_snapshots')
    .select('snapshot_date, spy_value')
    .not('spy_value', 'is', null)
    .order('snapshot_date', { ascending: true })
    .limit(1)
    .single()

  // Yesterday's snapshot (for daily return baseline)
  const { data: prevSnapshot } = await supabase
    .from('daily_snapshots')
    .select('snapshot_date, portfolio_value, spy_value, cumulative_return_pct, spy_cumulative_return_pct, portfolio_version')
    .lt('snapshot_date', TODAY)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single()

  const prevPortfolioValue = prevSnapshot?.portfolio_value || STARTING_VALUE
  const isFirstRun = !prevSnapshot

  // Inception SPY price: from the very first snapshot. If today is the first run, lock today's SPY in.
  const spyInceptionValue = firstSnapshot?.spy_value || spyPrice

  // ============================================================
  // FIX #3: Get yesterday's portfolio_holdings to detect new tickers
  // A ticker counts as "new" if it has no row in portfolio_holdings yesterday.
  // New tickers contribute 0% to daily_return on their first day to avoid
  // a phantom "had it yesterday" return.
  // ============================================================
  let prevHoldingsByTicker = {}
  if (prevSnapshot?.snapshot_date) {
    const { data: prevHoldings } = await supabase
      .from('portfolio_holdings')
      .select('ticker, weight_pct, price, market_value')
      .eq('snapshot_date', prevSnapshot.snapshot_date)
    if (prevHoldings) {
      for (const h of prevHoldings) {
        prevHoldingsByTicker[h.ticker] = h
      }
    }
  }

  // ============================================================
  // REMOVED-TICKER GUARD + UNION MODEL (fixes the -16% spike on 5/11)
  //
  // Daily return is the PURE market move of yesterday's book, computed over the
  // UNION of yesterday's and today's tickers, with a sold-at-yesterday's-close
  // model for anything dropped:
  //   - HELD (both days):  prevMarketValue × (1 + today's % change)
  //   - REMOVED (yesterday only): carried FLAT at its yesterday market value.
  //       It simply stops compounding — it is NOT dropped from the sum. Dropping
  //       a removed position was what cratered the daily return by ~that
  //       position's weight (e.g. a removed ~16% holding => -16% phantom spike).
  //   - NEW (today only):  contributes nothing to the day's return (bought with
  //       rebalanced proceeds; no day-1 P&L).
  //
  // The equity point then COMPOUNDS off the stored prior portfolio_value using
  // that pure market-move return, so it's immune to any gap between yesterday's
  // summed holdings and the stored prior value (rounding, missing rows, etc.).
  // ============================================================

  let yesterdayInvested = 0   // Σ of yesterday's position market values (union basis)
  let heldPortfolioValue = 0  // yesterday's book carried to today's prices
  const newTickers = []
  const removedTickers = []

  if (isFirstRun) {
    // Day 1: there's nothing to "hold." Portfolio value = STARTING_VALUE.
    heldPortfolioValue = STARTING_VALUE
    yesterdayInvested = STARTING_VALUE
  } else {
    const unionTickers = new Set([
      ...Object.keys(prevHoldingsByTicker),
      ...Object.keys(portfolio),
    ])

    for (const ticker of unionTickers) {
      const prevHolding = prevHoldingsByTicker[ticker]
      const inToday = !!portfolio[ticker]

      if (!prevHolding) {
        // NEW ticker: no yesterday position → no day-1 return contribution.
        if (inToday) newTickers.push(ticker)
        continue
      }

      const prevMarketValue = prevHolding.market_value ?? ((prevHolding.weight_pct / 100) * prevPortfolioValue)
      yesterdayInvested += prevMarketValue

      if (inToday) {
        // HELD both days: apply today's market move.
        const dailyChangePct = prices[ticker]?.change_pct ?? 0
        heldPortfolioValue += prevMarketValue * (1 + dailyChangePct / 100)
      } else {
        // REMOVED: sold at yesterday's close → carried flat, never dropped.
        removedTickers.push(ticker)
        heldPortfolioValue += prevMarketValue
      }
    }

    if (newTickers.length > 0) {
      console.log(`  New tickers (no day-1 return): ${newTickers.join(', ')}`)
    }
    if (removedTickers.length > 0) {
      console.log(`  Removed tickers (sold at yesterday's close, carried flat): ${removedTickers.join(', ')}`)
    }

    // Fallback: holdings table empty for yesterday → carry prior value forward flat.
    if (yesterdayInvested === 0) {
      console.warn(`  No prior holdings found for ${prevSnapshot.snapshot_date}; carrying prev portfolio_value forward flat`)
      yesterdayInvested = prevPortfolioValue
      heldPortfolioValue = prevPortfolioValue
    }
  }

  // Daily return = pure market move of yesterday's book (immune to add/drop and
  // to any yesterday weight-sum / holdings-table gaps).
  const dailyReturnPct = isFirstRun
    ? 0
    : (yesterdayInvested > 0
        ? Math.round(((heldPortfolioValue - yesterdayInvested) / yesterdayInvested) * 10000) / 100
        : 0)

  // Equity point compounds off the trusted stored prior portfolio value.
  const portfolioValue = isFirstRun
    ? Math.round(heldPortfolioValue * 100) / 100
    : Math.round(prevPortfolioValue * (1 + dailyReturnPct / 100) * 100) / 100

  // Cumulative return = today's value vs starting value
  const cumulativeReturnPct = Math.round(((portfolioValue - STARTING_VALUE) / STARTING_VALUE) * 10000) / 100

  // SPY benchmark — inception-to-date
  const spyValue = spyPrice || prevSnapshot?.spy_value || spyInceptionValue
  // On the inception day there is no prior trading day, so SPY return is 0 by
  // definition (today's SPY IS the anchor). The guard is now belt-and-suspenders:
  // the reset's anchor and the cron's SPY price are BOTH Finnhub since this swap,
  // so the old AV-vs-Finnhub source mismatch (spurious day-1 SPY return / fake alpha)
  // can no longer occur. Kept as a defensive zero on first run.
  const spyCumulativeReturnPct = isFirstRun ? 0
    : spyInceptionValue && spyInceptionValue > 0
    ? Math.round(((spyValue - spyInceptionValue) / spyInceptionValue) * 10000) / 100
    : 0

  // ============================================================
  // DRIFT vs REBALANCE
  //   Rebalance day -> reset every position to its target weight (target x value).
  //     Triggers: first run, PORTFOLIO_VERSION changed (engine rescore), or any
  //     ticker add/drop. Matches the old behavior.
  //   Drift day -> each held position carries its OWN market value forward by its
  //     own move; weights float. Normalized so sum(weight)=100 and sum(mv)=value
  //     even if prior stored values had rounding gaps. Lets structural winners
  //     compound their weight instead of being trimmed back to target nightly.
  // ============================================================
  const prevTickerSet = new Set(Object.keys(prevHoldingsByTicker))
  const todayTickerSet = new Set(Object.keys(portfolio))
  const tickersChanged =
    prevTickerSet.size !== todayTickerSet.size ||
    [...todayTickerSet].some((tk) => !prevTickerSet.has(tk))
  const isRebalanceDay =
    isFirstRun ||
    (prevSnapshot?.portfolio_version ?? null) !== PORTFOLIO_VERSION ||
    tickersChanged

  console.log(`  ${isRebalanceDay ? 'REBALANCE' : 'DRIFT'} day` +
    (isRebalanceDay
      ? ` (${isFirstRun ? 'first run' : tickersChanged ? 'ticker set changed' : 'engine rescore'}) -> reset to target weights`
      : ' -> carrying drifted weights forward'))

  const holdings = []
  if (isRebalanceDay) {
    for (const [ticker, pos] of Object.entries(portfolio)) {
      const priceData = prices[ticker]
      const isNewTicker = newTickers.includes(ticker)
      holdings.push({
        ticker,
        weight_pct: pos.weight_pct, // target on a rebalance
        target_weight_pct: pos.weight_pct,
        price: priceData?.price ?? null,
        market_value: Math.round(((pos.weight_pct / 100) * portfolioValue) * 100) / 100,
        daily_change_pct: isNewTicker ? 0 : (priceData?.change_pct ?? 0),
        signal_sources: pos.adjustments,
        category: pos.theme,
        is_new_ticker: isNewTicker,
      })
    }
  } else {
    // Drift: mv_today = prevMv * (1 + move); weight floats off the drifted sum.
    const drifted = []
    let driftedSum = 0
    for (const [ticker, pos] of Object.entries(portfolio)) {
      const prevHolding = prevHoldingsByTicker[ticker]
      const priceData = prices[ticker]
      const dailyChangePct = priceData?.change_pct ?? 0
      const prevMv = prevHolding?.market_value ??
        (((prevHolding?.weight_pct ?? pos.weight_pct) / 100) * prevPortfolioValue)
      const mv = prevMv * (1 + dailyChangePct / 100)
      drifted.push({ ticker, pos, price: priceData?.price ?? null, dailyChangePct, mv })
      driftedSum += mv
    }
    for (const d of drifted) {
      const weightPct = driftedSum > 0 ? Math.round((d.mv / driftedSum) * 10000) / 100 : d.pos.weight_pct
      holdings.push({
        ticker: d.ticker,
        weight_pct: weightPct, // DRIFTED weight
        target_weight_pct: d.pos.weight_pct,
        price: d.price,
        market_value: Math.round(((weightPct / 100) * portfolioValue) * 100) / 100,
        daily_change_pct: d.dailyChangePct,
        signal_sources: d.pos.adjustments,
        category: d.pos.theme,
        is_new_ticker: false,
      })
    }
  }

  console.log(`  Portfolio Value: $${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`)
  console.log(`  Daily Return: ${dailyReturnPct >= 0 ? '+' : ''}${dailyReturnPct}%`)
  console.log(`  Cumulative Return: ${cumulativeReturnPct >= 0 ? '+' : ''}${cumulativeReturnPct}%`)
  console.log(`  SPY Inception: $${spyInceptionValue} → Today: $${spyValue}`)
  console.log(`  SPY Cumulative: ${spyCumulativeReturnPct >= 0 ? '+' : ''}${spyCumulativeReturnPct}%`)
  console.log(`  Alpha vs SPY: ${(cumulativeReturnPct - spyCumulativeReturnPct).toFixed(2)}%`)

  return {
    portfolio_value: portfolioValue,
    spy_value: spyValue,
    daily_return_pct: dailyReturnPct,
    cumulative_return_pct: cumulativeReturnPct,
    spy_cumulative_return_pct: spyCumulativeReturnPct,
    holdings,
  }
}

// ============================================================================
// WRITE COMPLETE DAILY SNAPSHOT
// ============================================================================

// --- Step 2: Technicals (10/20/50/200-day SMAs + a 20-DMA momentum flag per holding) ---
// SMAs from each holding's Twelve Data daily close series. Paced ~8s/call to stay
// under TD's 8/min free limit (~17 calls ≈ 2.5 min; free on GitHub Actions). Any
// ticker TD can't cover, or with too little history for a window, stores null for
// that field — queue item (b)'s entry-gate treats a null DMA as "no gate".
//   dma50/dma200 → the trend pill (Add / Hold / Watch).
//   dma20         → the momentum flag (Bollinger centerline; calmer than the 10).
//   dma10         → kept for optionality (a faster signal / future use).
function smaOf(closes, n) {
  if (closes.length < n) return null
  const slice = closes.slice(-n)
  return Math.round((slice.reduce((a, b) => a + b, 0) / n) * 100) / 100
}

// SMA of `n` closes ending at index `endIdx` (inclusive); null if not enough history.
function smaAt(closes, n, endIdx) {
  if (endIdx < n - 1 || endIdx >= closes.length) return null
  let sum = 0
  for (let i = endIdx - n + 1; i <= endIdx; i++) sum += closes[i]
  return sum / n
}

// 20-DMA momentum flags, mirror images of each other. Each is a two-part filter
// (price on one side of the 20-DMA for >=3 consecutive days AND the 20-DMA itself
// sloping that way over 5 days) so single-day noise doesn't trip it:
//   down — price below 20-DMA >=3d AND 20-DMA falling. Early "cracking" read; rendered
//          on the dashboard as the ↓ 20D tag, SEPARATE from the 50/200 trend pill.
//   up   — price above 20-DMA >=3d AND 20-DMA rising. Engine fuel ONLY (the entry-gate's
//          "un-pause / resume adds" trigger); deliberately NOT rendered on the dashboard.
// down/up are mutually exclusive. Needs >=25 closes (20 for the SMA + 5 for the slope).
function momentum20(closes) {
  if (closes.length < 25) return { down: false, up: false, below20_days: 0, above20_days: 0, dma20_chg5_pct: null }
  const last = closes.length - 1
  const dma20Now = smaAt(closes, 20, last)
  const dma20Prev = smaAt(closes, 20, last - 5) // 5 trading days ago
  let belowDays = 0
  for (let i = last; i >= 0; i--) {
    const m = smaAt(closes, 20, i)
    if (m === null || closes[i] >= m) break
    belowDays++
  }
  let aboveDays = 0
  for (let i = last; i >= 0; i--) {
    const m = smaAt(closes, 20, i)
    if (m === null || closes[i] <= m) break
    aboveDays++
  }
  const slopeDown = dma20Now !== null && dma20Prev !== null && dma20Now < dma20Prev
  const slopeUp   = dma20Now !== null && dma20Prev !== null && dma20Now > dma20Prev
  const chg5 = (dma20Now && dma20Prev) ? Math.round(((dma20Now - dma20Prev) / dma20Prev) * 10000) / 100 : null
  return {
    down: belowDays >= 3 && slopeDown,
    up:   aboveDays >= 3 && slopeUp,
    below20_days: belowDays,
    above20_days: aboveDays,
    dma20_chg5_pct: chg5,
  }
}

function computeDMAs(series) {
  const closes = series.map((p) => p.close)
  // Phase 2.5 velocity inputs: per-ticker RSI(14) + trailing 1-yr return, from the same series.
  let rsi14 = null
  try { rsi14 = calculateRSI(series) } catch (e) { rsi14 = null }
  let ret1y = null
  if (closes.length >= 253) {
    const past = closes[closes.length - 1 - 252]   // ~252 trading days = 1 year
    if (past) ret1y = Math.round(((closes[closes.length - 1] / past) - 1) * 10000) / 100
  }
  return {
    close: closes.length ? Math.round(closes[closes.length - 1] * 100) / 100 : null,
    dma10: smaOf(closes, 10),
    dma20: smaOf(closes, 20),
    dma50: smaOf(closes, 50),
    dma200: smaOf(closes, 200),
    rsi14,            // Phase 2.5: velocity-penalty input
    ret1y,            // Phase 2.5: 1-yr return %, parabola/blow-off input
    mom: momentum20(closes),
  }
}

async function computeTechnicals(tickers) {
  console.log('\n========================================')
  console.log('STEP 2: TECHNICALS (10/20/50/200 DMAs + momentum)')
  console.log('========================================')
  const technicals = {}
  for (let i = 0; i < tickers.length; i++) {
    const t = tickers[i]
    const series = await fetchTwelveDataSeries(t, 265)
    if (series) {
      technicals[t] = computeDMAs(series)
      const d = technicals[t]
      const mom = d.mom.down ? ` MOM↓ (${d.mom.below20_days}d, 20-DMA ${d.mom.dma20_chg5_pct}%)`
                : d.mom.up   ? ` MOM↑ (${d.mom.above20_days}d, 20-DMA ${d.mom.dma20_chg5_pct}%)`
                : ''
      console.log(`  ${t}: close ${d.close}  10/20/50/200 = ${d.dma10 ?? '—'} / ${d.dma20 ?? '—'} / ${d.dma50 ?? '—'} / ${d.dma200 ?? '—'}  RSI ${d.rsi14 ?? '—'}  1y ${d.ret1y ?? '—'}%${mom}`)
    } else {
      technicals[t] = null
      console.log(`  ${t}: no Twelve Data series — null`)
    }
    if (i < tickers.length - 1) await new Promise((r) => setTimeout(r, 8000)) // pace live calls
  }
  return technicals
}

// ============================================================
// MOMENTUM SLEEVE P&L — the above-200-DMA subset of the Thematic book,
// renormalized to 100%, tracked as its own $100k-based equity curve.
// Mirrors calculatePnL's union/drift model, restricted to today's members:
//   members = portfolio tickers with price >= dma200, plus SGOV (cash always in).
//   - HELD member (both days):      prev mv x (1 + today's % move)
//   - DROPPED below 200 (gone today): carried FLAT (sold at prior close);
//       value redistributes to survivors via next-day renorm.
//   - RECLAIMED 200 (new today):     no day-1 return.
// Value compounds off the stored prior momentum_value. members are stored so the
// next night can tell a membership change from a plain drift day.
// ============================================================
async function calculateMomentumPnL(portfolio, prices, technicals, today) {
  const START = 100000
  const r2 = (x) => Math.round(x * 100) / 100

  const CAP = 12  // single-ticker cap, applied to ALL names incl. ETFs; excess -> cash
  const isMember = (tk) => {
    if (tk === 'SGOV') return false  // cash bucket, handled as the residual
    const p = prices[tk]?.price
    const d50 = technicals?.[tk]?.dma50
    const d200 = technicals?.[tk]?.dma200
    return p != null && d50 != null && d200 != null && p >= d50 && p >= d200
  }
  const todayMembers = Object.keys(portfolio).filter(isMember)

  // Renorm a member set's Thematic weights -> 100%, cap each at CAP, residual -> cash.
  const buildBook = (members, wMap) => {
    const denom = members.reduce((s, tk) => s + (wMap[tk] ?? 0), 0)
    const weights = {}
    let capped = 0
    if (denom > 0) for (const tk of members) {
      const w = Math.min((wMap[tk] ?? 0) / denom * 100, CAP)
      weights[tk] = w
      capped += w
    }
    return { weights, cash: Math.max(0, 100 - capped) }
  }

  const { data: prev } = await supabase
    .from('daily_snapshots')
    .select('snapshot_date, momentum_value, momentum_members')
    .lt('snapshot_date', today)
    .not('portfolio_value', 'is', null)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single()

  // Inception (or first run after the column was added): anchor at START, flat.
  if (!prev || prev.momentum_value == null) {
    console.log(`  Momentum: inception -> $${START} (${todayMembers.length} members)`)
    return { momentum_value: START, momentum_cumulative_return_pct: 0, momentum_daily_return_pct: 0, momentum_members: todayMembers }
  }

  const prevValue = prev.momentum_value
  const prevMembers = Array.isArray(prev.momentum_members) ? prev.momentum_members : todayMembers

  // Yesterday's Thematic weights -> reconstruct yesterday's CAPPED momentum book.
  const { data: prevHoldings } = await supabase
    .from('portfolio_holdings')
    .select('ticker, weight_pct')
    .eq('snapshot_date', prev.snapshot_date)
  const prevW = {}
  for (const h of (prevHoldings || [])) prevW[h.ticker] = h.weight_pct

  const book = buildBook(prevMembers, prevW)

  // Daily return = move of yesterday's held book. Every held member gets today's
  // move (a name crossing out tonight was still held through today, sold at tonight's
  // close); membership changes only affect TONIGHT's rebalance. Cash sits in SGOV.
  let dailyRet = 0
  for (const tk of prevMembers) dailyRet += (book.weights[tk] ?? 0) / 100 * (prices[tk]?.change_pct ?? 0)
  dailyRet += book.cash / 100 * (prices['SGOV']?.change_pct ?? 0)
  dailyRet = r2(dailyRet)

  const value = r2(prevValue * (1 + dailyRet / 100))
  const cum = r2(((value - START) / START) * 100)
  const todayW = {}
  for (const [tk, pos] of Object.entries(portfolio)) todayW[tk] = pos.weight_pct
  console.log(`  Momentum: ${dailyRet >= 0 ? '+' : ''}${dailyRet}% -> $${value} (cum ${cum >= 0 ? '+' : ''}${cum}%, ${todayMembers.length} members, cash ${r2(buildBook(todayMembers, todayW).cash)}%)`)
  return { momentum_value: value, momentum_cumulative_return_pct: cum, momentum_daily_return_pct: dailyRet, momentum_members: todayMembers }
}

// ============================================================
// TRADING TAB CANDLES (Step 5d) — daily OHLCV per Trading-tab ticker, upserted
// to trading_candles (one row per ticker, full array in jsonb). DISPLAY-ONLY:
// nothing here feeds the engine, the book, the P&L, or the rebalance trigger.
// +1 Twelve Data call per ticker per night; 8s pacing keeps the free tier's
// 8/min limit safe after computeTechnicals' burst. Skip-safe: any failure logs
// and leaves the existing trading_candles row untouched. Phase 1 = BTC/USD.
// ============================================================
// Each ticker may name a preferred exchange so the crypto feed returns real volume
// (the aggregate BTC/USD symbol reports volume=0, which disables Volume Profile/VWAP).
const TRADING_TAB_TICKERS = [{ symbol: 'BTC/USD', exchange: 'Coinbase Pro' }]

async function fetchTwelveDataOHLCV(symbol, outputsize = 400, exchange = null) {
  if (!TWELVE_DATA_KEY) { console.warn(`  No TWELVE_DATA_KEY — cannot fetch ${symbol} OHLCV`); return null }
  try {
    const exParam = exchange ? `&exchange=${encodeURIComponent(exchange)}` : ''
    const url = `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=1day&outputsize=${outputsize}${exParam}&apikey=${TWELVE_DATA_KEY}`
    let res = await fetch(url)
    if (res.status === 429) {
      console.warn(`  Twelve Data ${symbol} OHLCV: rate limited (429) — backing off 60s once`)
      await new Promise((r) => setTimeout(r, 60000))
      res = await fetch(url)
    }
    if (!res.ok) { console.warn(`  Twelve Data ${symbol} OHLCV: HTTP ${res.status} — skipping`); return null }
    const data = await res.json()
    if (data?.status && data.status !== 'ok') {
      console.warn(`  Twelve Data ${symbol} OHLCV: status=${data.status} (${data.message || 'no message'}) — skipping`)
      return null
    }
    const rows = (data?.values || [])
      .map((v) => ({
        d: v.datetime,
        o: parseFloat(v.open), h: parseFloat(v.high), l: parseFloat(v.low), c: parseFloat(v.close),
        v: v.volume != null ? parseFloat(v.volume) : 0,
      }))
      .filter((r) => r.d && [r.o, r.h, r.l, r.c].every(Number.isFinite))
      .reverse() // newest-first from TD -> ascending
    if (rows.length < 220) { console.warn(`  Twelve Data ${symbol} OHLCV: only ${rows.length} rows (<220 for a 200-DMA window) — skipping`); return null }
    return rows
  } catch (e) {
    console.warn(`  Twelve Data ${symbol} OHLCV: fetch error — ${e.message} — skipping`); return null
  }
}

async function updateTradingCandles() {
  console.log('\n========================================')
  console.log('STEP 5d: TRADING TAB CANDLES (Twelve Data OHLCV)')
  console.log('========================================')
  for (const t of TRADING_TAB_TICKERS) {
    const sym = typeof t === 'string' ? t : t.symbol
    const exchange = typeof t === 'string' ? null : t.exchange
    await new Promise((r) => setTimeout(r, 8000)) // pace after computeTechnicals' TD burst
    // Exchange feed first (real volume); fall back to the aggregate on empty/zero-volume.
    let candles = exchange ? await fetchTwelveDataOHLCV(sym, 400, exchange) : null
    const hasVol = candles && candles.some((c) => c.v > 0)
    if (!candles || !hasVol) {
      if (exchange) {
        await new Promise((r) => setTimeout(r, 8000))
        console.warn(`  ${sym}: ${exchange} feed ${candles ? 'had no volume' : 'failed'} — falling back to aggregate`)
      }
      candles = await fetchTwelveDataOHLCV(sym, 400) || candles
    }
    if (!candles) { console.warn(`  ${sym}: no candles — trading_candles row left as-is`); continue }
    const volNote = candles.some((c) => c.v > 0) ? 'with volume' : 'NO volume (VP/VWAP will be hidden)'
    const { error } = await supabase.from('trading_candles').upsert(
      { ticker: sym, candles, updated_at: new Date().toISOString() },
      { onConflict: 'ticker', ignoreDuplicates: false }
    )
    if (error) console.error(`  ${sym}: upsert error — ${error.message}`)
    else console.log(`  ${sym}: ${candles.length} candles upserted, ${volNote} (latest ${candles[candles.length - 1].d})`)
  }
}

async function writeDailySnapshot(narrativeSignals, crowdSignals, quantResult, bullishAssets, portfolio, pnl, macroSignals, technicals, momentum) {
  console.log('\n========================================')
  console.log('WRITING DAILY SNAPSHOT')
  console.log('========================================')

  const narrativeData = narrativeSignals.map((s) => ({
    source: s.source,
    ticker: s.ticker,
    asset: s.asset,
    direction: s.direction,
    conviction: s.conviction,
    quote: s.quote,
    video_title: s.video_title,
    video_url: s.video_url,
    channel: s.channel,
  }))

  const polymarketData = crowdSignals.map((s) => ({
    market: s.market,
    probability: s.probability,
    read: s.read,
    close_time: s.close_time,
    as_of: s.as_of,
    direction: s.direction,
    mapped_assets: s.mapped_assets,
    conviction: s.conviction,
    sp500_add: s.sp500_add ?? null,
  }))

  const portfolioData = pnl.holdings.map((h) => ({
    ticker: h.ticker,
    weight_pct: h.weight_pct,   // drifted on drift days, target on rebalance days
    target_weight_pct: h.target_weight_pct,
    category: h.category,
    adjustments: h.signal_sources,
  }))

  const snapshotRow = {
    snapshot_date: TODAY,
    spy_rsi: quantResult.rsi,
    rsi_signal: quantResult.signal,
    polymarket_signals: polymarketData,
    narrative_signals: narrativeData,
    bullish_assets: bullishAssets,
    portfolio: portfolioData,
    portfolio_value: pnl.portfolio_value,
    spy_value: pnl.spy_value,
    daily_return_pct: pnl.daily_return_pct,
    cumulative_return_pct: pnl.cumulative_return_pct,
    spy_cumulative_return_pct: pnl.spy_cumulative_return_pct,
    macro_signals: macroSignals || null,
    technicals: technicals || null,
    portfolio_version: PORTFOLIO_VERSION,
    momentum_value: momentum?.momentum_value ?? null,
    momentum_cumulative_return_pct: momentum?.momentum_cumulative_return_pct ?? null,
    momentum_daily_return_pct: momentum?.momentum_daily_return_pct ?? null,
    momentum_members: momentum?.momentum_members ?? null,
  }

  // Upsert into daily_snapshots
  const { data: existing } = await supabase
    .from('daily_snapshots')
    .select('id')
    .eq('snapshot_date', TODAY)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('daily_snapshots')
      .update(snapshotRow)
      .eq('snapshot_date', TODAY)
    if (error) console.error('Error updating snapshot:', error)
    else console.log('Updated existing daily_snapshot')
  } else {
    const { error } = await supabase
      .from('daily_snapshots')
      .insert(snapshotRow)
    if (error) console.error('Error inserting snapshot:', error)
    else console.log('Created new daily_snapshot')
  }

  // Write to portfolio_holdings table
  for (const holding of pnl.holdings) {
    await supabase.from('portfolio_holdings').upsert({
      snapshot_date: TODAY,
      ticker: holding.ticker,
      weight_pct: holding.weight_pct,
      price: holding.price,
      market_value: holding.market_value,
      daily_change_pct: holding.daily_change_pct,
      signal_sources: holding.signal_sources,
    }, { onConflict: 'snapshot_date,ticker', ignoreDuplicates: false })
  }

  console.log(`Written ${pnl.holdings.length} holdings to portfolio_holdings table`)
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

async function main() {
  console.log('╔══════════════════════════════════════════╗')
  console.log('║   AlphaPlaybook — Daily Orchestrator     ║')
  console.log('╚══════════════════════════════════════════╝')
  console.log(`Date: ${TODAY}`)
  console.log(`Time: ${new Date().toISOString()}`)

  // Trading-day guard. The cron fires nightly, but US markets trade Mon-Fri. On a
  // weekend run there's no new close, so the P&L pipeline would re-apply the prior
  // trading day's move and compound the cumulative wrongly (the Jun 6 Saturday
  // phantom: SPY/RSI identical to Friday, cumulative double-counted). Skip cleanly
  // on Sat/Sun (ET). Holidays are a rarer edge — handle with a calendar later if needed.
  const etDow = new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'short' })
  if (etDow === 'Sat' || etDow === 'Sun') {
    console.log(`\nNon-trading day (${etDow} ET, ${TODAY}) — skipping daily run. No snapshot written.`)
    return
  }

  const startTime = Date.now()

  try {
    // Step 1: Run all three pipelines
    const narrativeSignals = await runNarrativePipeline()
    const crowdSignals = await runCrowdPipeline()
    const quantResult = await runQuantPipeline()

    // Step 1b: Macro signals — CPI (FRED) + Cleveland nowcast + Kalshi YoY + 4% regime.
    // All skip-safe; macroSignals always returns a blob (fields null if missing).
    const cpi = await fetchFredCPI()
    const nowcast = await fetchClevelandNowcast()
    const kalshi = await fetchKalshiCPI()
    const { data: priorRows } = await supabase
      .from('daily_snapshots')
      .select('macro_signals')
      .order('snapshot_date', { ascending: false })
      .limit(1)
    const priorAbove = priorRows?.[0]?.macro_signals?.regime?.above ?? false
    const fearGreed = await fetchFearGreed()
    const macroSignals = buildMacroSignals(quantResult, cpi, nowcast, kalshi, priorAbove, fearGreed)

    // Step 2: Aggregate bullish assets across all sources
    const bullishAssets = aggregateBullishAssets(narrativeSignals, crowdSignals, quantResult)

    // Step 3: Compute model portfolio with signal-driven weight adjustments
    const portfolio = computeModelPortfolio(bullishAssets, quantResult)

    // Market-open guard: if SPY's last session date isn't TODAY (NY calendar), the
    // market was closed (weekend already excluded by the schedule; this catches weekday
    // holidays like Juneteenth). Skip the P&L + snapshot so we never write a phantom day
    // off stale prices. Fails OPEN: if spyDate is null (series hiccup), we still write.
    let pnl = null // hoisted so the completion banner can read it after the guard
    if (quantResult.spyDate && quantResult.spyDate !== TODAY) {
      console.log(`\n⏭  Market closed — last SPY session ${quantResult.spyDate} ≠ ${TODAY}.`)
      console.log('   Skipping P&L + daily snapshot. Narrative/crowd signals already written stand.')
    } else {
      // Step 4: Fetch current prices for portfolio tickers
      // PRICE_EXTRAS keeps SGOV priced after it left BASE_PORTFOLIO (2026-08-24).
      const tickers = [...new Set([...Object.keys(portfolio), ...PRICE_EXTRAS])]
      const prices = await fetchCurrentPrices(tickers)

      // Step 5: Calculate P&L
      pnl = await calculatePnL(portfolio, prices, quantResult.spyPrice)

      // Step 5b: Technicals — 10/50/200 DMAs per holding (feeds Step 3 action pill + (b) entry-gate)
      const technicals = await computeTechnicals(tickers)

      // Step 5c: Momentum sleeve P&L (above-200-DMA subset of Thematic)
      const momentum = await calculateMomentumPnL(portfolio, prices, technicals, TODAY)

      // Step 5d: Trading tab candle cache (display-only; never feeds engine/P&L)
      await updateTradingCandles()

      // Step 6: Write complete daily snapshot
      await writeDailySnapshot(narrativeSignals, crowdSignals, quantResult, bullishAssets, portfolio, pnl, macroSignals, technicals, momentum)
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log('\n╔══════════════════════════════════════════╗')
    console.log('║   ✓ Daily cron complete!                 ║')
    console.log(`║   Signals: ${(narrativeSignals.length + crowdSignals.length + (quantResult.rsi ? 1 : 0)).toString().padEnd(29)}║`)
    console.log(`║   Bullish tickers: ${bullishAssets.length.toString().padEnd(21)}║`)
    console.log(`║   Portfolio value: $${(pnl ? pnl.portfolio_value.toLocaleString() : 'skipped').padEnd(19)}║`)
    console.log(`║   Elapsed: ${elapsed}s${' '.repeat(Math.max(0, 28 - elapsed.length - 1))}║`)
    console.log('╚══════════════════════════════════════════╝')

  } catch (error) {
    console.error('\n🚨 ORCHESTRATOR ERROR:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run the full orchestrator only when invoked directly (e.g. `node server/daily-cron.cjs`
// or the Render cron). When this file is `require()`d by a test harness, main() does NOT
// fire — so the harness can call individual functions (finnhubQuote, fetchTwelveDataSeries,
// calculateRSI, ...) against live keys without writing anything to Supabase.
if (require.main === module) {
  main()
}

module.exports = {
  finnhubQuote,
  fetchTwelveDataSeries,
  calculateRSI,
  getRSISignal,
  runQuantPipeline,
  computeDMAs,
  computeTechnicals,
  fetchClevelandNowcast,
  fetchKalshiCPI,
  updateTradingCandles,
}
