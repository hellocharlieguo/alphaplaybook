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

const SEARCH_TERMS = [
  'Federal Reserve', 'Fed funds rate', 'interest rate cut', 'interest rate hike',
  'recession', 'inflation', 'CPI', 'GDP', 'unemployment',
  'tariff', 'trade war', 'trade deal',
  'Bitcoin price', 'BTC price', 'oil price', 'crude oil', 'gold price', 'S&P 500',
  'war', 'military', 'conflict', 'invasion', 'ceasefire', 'NATO', 'nuclear',
  'sanctions', 'Iran', 'China Taiwan', 'Russia Ukraine', 'Israel', 'North Korea',
]

function mapMarketToAssets(question, probability) {
  const q = question.toLowerCase()

  // Monetary policy
  if ((q.includes('fed') || q.includes('federal reserve')) && (q.includes('cut') || q.includes('lower') || q.includes('decrease'))) {
    if (probability > 0.70) return { direction: 'bullish', mapped_assets: ['GLDM', 'TLT', 'XSD'], conviction: 'high' }
    if (probability > 0.50) return { direction: 'bullish', mapped_assets: ['GLDM', 'TLT'], conviction: 'medium' }
    return { direction: 'neutral', mapped_assets: ['SGOV'], conviction: 'low' }
  }
  if ((q.includes('fed') || q.includes('federal reserve')) && (q.includes('hike') || q.includes('raise') || q.includes('increase'))) {
    if (probability > 0.50) return { direction: 'bearish', mapped_assets: ['TLT', 'XSD', 'GLDM'], conviction: 'medium' }
    return { direction: 'neutral', mapped_assets: ['SGOV'], conviction: 'low' }
  }
  if (q.includes('fed funds') || q.includes('federal reserve') || q.includes('fomc')) {
    return { direction: 'neutral', mapped_assets: ['SGOV', 'TLT'], conviction: 'low' }
  }

  // Recession
  if (q.includes('recession')) {
    if (probability > 0.50) return { direction: 'bearish', mapped_assets: ['SPY', 'XSD', 'COPX'], conviction: 'high' }
    if (probability > 0.35) return { direction: 'neutral', mapped_assets: ['SGOV', 'GLDM'], conviction: 'medium' }
    return { direction: 'bullish', mapped_assets: ['SPY', 'XSD', 'COPX'], conviction: 'medium' }
  }

  // Inflation / CPI
  if (q.includes('inflation') || q.includes('cpi')) {
    if ((q.includes('above') || q.includes('over') || q.includes('high') || q.includes('rise')) && probability > 0.60) {
      return { direction: 'bullish', mapped_assets: ['GLDM', 'COPX', 'XLE', 'IBIT'], conviction: 'medium' }
    }
    if ((q.includes('below') || q.includes('under') || q.includes('fall') || q.includes('drop')) && probability > 0.60) {
      return { direction: 'bullish', mapped_assets: ['TLT', 'XSD', 'SPY'], conviction: 'medium' }
    }
    return { direction: 'neutral', mapped_assets: ['SGOV'], conviction: 'low' }
  }

  // GDP
  if (q.includes('gdp')) {
    if ((q.includes('negative') || q.includes('contraction') || q.includes('decline')) && probability > 0.40) {
      return { direction: 'bearish', mapped_assets: ['SPY', 'COPX', 'XSD'], conviction: 'medium' }
    }
    if ((q.includes('growth') || q.includes('positive') || q.includes('expand')) && probability > 0.60) {
      return { direction: 'bullish', mapped_assets: ['SPY', 'XSD', 'COPX'], conviction: 'medium' }
    }
    return { direction: 'neutral', mapped_assets: ['SPY'], conviction: 'low' }
  }

  // Unemployment
  if (q.includes('unemployment') || q.includes('jobless') || q.includes('nonfarm') || q.includes('jobs report')) {
    if ((q.includes('above') || q.includes('rise') || q.includes('increase') || q.includes('higher')) && probability > 0.50) {
      return { direction: 'bearish', mapped_assets: ['SPY', 'XSD'], conviction: 'medium' }
    }
    if ((q.includes('below') || q.includes('fall') || q.includes('decrease') || q.includes('lower')) && probability > 0.50) {
      return { direction: 'bullish', mapped_assets: ['SPY', 'XSD'], conviction: 'medium' }
    }
    return { direction: 'neutral', mapped_assets: ['SPY'], conviction: 'low' }
  }

  // Trade / tariffs
  if (q.includes('tariff') || q.includes('trade war') || q.includes('trade deal') || q.includes('trade agreement')) {
    if ((q.includes('increase') || q.includes('impose') || q.includes('raise') || q.includes('new tariff') || q.includes('trade war')) && probability > 0.50) {
      return { direction: 'bearish', mapped_assets: ['VEA', 'SPY', 'COPX'], conviction: 'medium' }
    }
    if ((q.includes('deal') || q.includes('agreement') || q.includes('remove') || q.includes('reduce')) && probability > 0.50) {
      return { direction: 'bullish', mapped_assets: ['VEA', 'SPY', 'COPX'], conviction: 'medium' }
    }
    return { direction: 'neutral', mapped_assets: ['SPY', 'VEA'], conviction: 'low' }
  }

  // Bitcoin / BTC
  if (q.includes('bitcoin') || q.includes('btc')) {
    if (q.includes('above') || q.includes('over') || q.includes('all-time high') || q.includes('ath')) {
      if (probability > 0.60) return { direction: 'bullish', mapped_assets: ['IBIT'], conviction: 'high' }
      if (probability > 0.40) return { direction: 'bullish', mapped_assets: ['IBIT'], conviction: 'medium' }
    }
    if ((q.includes('below') || q.includes('under') || q.includes('crash') || q.includes('drop')) && probability > 0.50) {
      return { direction: 'bearish', mapped_assets: ['IBIT'], conviction: 'medium' }
    }
    return { direction: 'neutral', mapped_assets: ['IBIT'], conviction: 'low' }
  }

  // Oil / crude
  if (q.includes('oil') || q.includes('crude') || q.includes('wti') || q.includes('brent')) {
    if ((q.includes('above') || q.includes('over') || q.includes('rise') || q.includes('spike')) && probability > 0.50) {
      return { direction: 'bullish', mapped_assets: ['XLE'], conviction: 'medium' }
    }
    if ((q.includes('below') || q.includes('under') || q.includes('drop') || q.includes('fall')) && probability > 0.50) {
      return { direction: 'bearish', mapped_assets: ['XLE'], conviction: 'medium' }
    }
    return { direction: 'neutral', mapped_assets: ['XLE'], conviction: 'low' }
  }

  // Gold
  if (q.includes('gold') || q.includes('xau')) {
    if ((q.includes('above') || q.includes('over') || q.includes('all-time high') || q.includes('rise')) && probability > 0.50) {
      return { direction: 'bullish', mapped_assets: ['GLDM'], conviction: 'medium' }
    }
    if ((q.includes('below') || q.includes('under') || q.includes('drop') || q.includes('fall')) && probability > 0.50) {
      return { direction: 'bearish', mapped_assets: ['GLDM'], conviction: 'medium' }
    }
    return { direction: 'neutral', mapped_assets: ['GLDM'], conviction: 'low' }
  }

  // S&P 500
  if (q.includes('s&p') || q.includes('s&p 500') || q.includes('spy')) {
    if ((q.includes('above') || q.includes('over') || q.includes('all-time high')) && probability > 0.60) {
      return { direction: 'bullish', mapped_assets: ['SPY', 'QQQ', 'XSD'], conviction: 'medium' }
    }
    if ((q.includes('below') || q.includes('crash') || q.includes('drop') || q.includes('bear market')) && probability > 0.40) {
      return { direction: 'bearish', mapped_assets: ['SPY', 'QQQ'], conviction: 'medium' }
    }
    return { direction: 'neutral', mapped_assets: ['SPY'], conviction: 'low' }
  }

  // Russia-Ukraine
  if (q.includes('russia') || q.includes('ukraine') || q.includes('putin') || q.includes('zelensky')) {
    if (q.includes('ceasefire') || q.includes('peace') || q.includes('deal') || q.includes('end')) {
      if (probability > 0.50) return { direction: 'bullish', mapped_assets: ['VEA', 'SPY'], conviction: 'medium' }
      return { direction: 'neutral', mapped_assets: ['XLE', 'GLDM'], conviction: 'low' }
    }
    if ((q.includes('escalat') || q.includes('nuclear') || q.includes('nato') || q.includes('expand')) && probability > 0.30) {
      return { direction: 'bullish', mapped_assets: ['GLDM', 'XLE', 'SGOV'], conviction: 'high' }
    }
    return { direction: 'neutral', mapped_assets: ['GLDM', 'XLE'], conviction: 'low' }
  }

  // China-Taiwan
  if (q.includes('china') && (q.includes('taiwan') || q.includes('invasion') || q.includes('military'))) {
    if (probability > 0.20) return { direction: 'bearish', mapped_assets: ['XSD', 'VEA', 'SPY'], conviction: 'high' }
    return { direction: 'neutral', mapped_assets: ['XSD', 'GLDM'], conviction: 'low' }
  }

  // Iran
  if (q.includes('iran') && (q.includes('war') || q.includes('strike') || q.includes('attack') || q.includes('nuclear') || q.includes('military'))) {
    if (probability > 0.30) return { direction: 'bullish', mapped_assets: ['XLE', 'GLDM'], conviction: 'high' }
    return { direction: 'neutral', mapped_assets: ['XLE', 'GLDM'], conviction: 'low' }
  }

  // Israel / Middle East
  if (q.includes('israel') || q.includes('gaza') || q.includes('hamas') || q.includes('hezbollah') || q.includes('middle east')) {
    if (q.includes('ceasefire') || q.includes('peace') || q.includes('deal')) {
      if (probability > 0.50) return { direction: 'bearish', mapped_assets: ['XLE', 'GLDM'], conviction: 'low' }
    }
    if ((q.includes('escalat') || q.includes('war') || q.includes('invasion') || q.includes('expand')) && probability > 0.30) {
      return { direction: 'bullish', mapped_assets: ['XLE', 'GLDM', 'SGOV'], conviction: 'high' }
    }
    return { direction: 'neutral', mapped_assets: ['XLE', 'GLDM'], conviction: 'low' }
  }

  // North Korea
  if (q.includes('north korea') || q.includes('kim jong') || q.includes('pyongyang')) {
    if ((q.includes('nuclear') || q.includes('missile') || q.includes('test') || q.includes('launch')) && probability > 0.30) {
      return { direction: 'bullish', mapped_assets: ['GLDM', 'SGOV'], conviction: 'medium' }
    }
    return { direction: 'neutral', mapped_assets: ['GLDM'], conviction: 'low' }
  }

  // General war / conflict
  if (q.includes('war') || q.includes('military') || q.includes('conflict') || q.includes('invasion') || q.includes('attack')) {
    if (q.includes('ceasefire') || q.includes('peace') || q.includes('end') || q.includes('withdraw')) {
      if (probability > 0.50) return { direction: 'bullish', mapped_assets: ['VEA', 'SPY'], conviction: 'medium' }
    }
    if (probability > 0.30) return { direction: 'bullish', mapped_assets: ['GLDM', 'XLE', 'SGOV'], conviction: 'medium' }
    return { direction: 'neutral', mapped_assets: ['GLDM', 'XLE'], conviction: 'low' }
  }

  // Sanctions
  if (q.includes('sanction')) {
    if (probability > 0.50) return { direction: 'neutral', mapped_assets: ['XLE', 'GLDM', 'COPX'], conviction: 'medium' }
    return { direction: 'neutral', mapped_assets: ['SPY'], conviction: 'low' }
  }

  // NATO
  if (q.includes('nato')) return { direction: 'neutral', mapped_assets: ['VEA', 'GLDM'], conviction: 'low' }

  return null
}

async function runCrowdPipeline() {
  console.log('\n========================================')
  console.log('PLAY 2: CROWD PIPELINE')
  console.log('========================================')

  const allMarkets = []

  for (const term of SEARCH_TERMS) {
    try {
      const url = `https://gamma-api.polymarket.com/events?closed=false&limit=10&title=${encodeURIComponent(term)}`
      const response = await fetch(url)
      if (!response.ok) continue
      const events = await response.json()

      for (const event of events) {
        if (!event.markets || event.markets.length === 0) continue
        for (const market of event.markets) {
          const volume = parseFloat(market.volume || '0')
          const outcomePrices = JSON.parse(market.outcomePrices || '[]')
          const probability = parseFloat(outcomePrices[0] || '0')
          if (probability > 0 && probability < 1) {
            allMarkets.push({
              question: market.question || event.title,
              probability: Math.round(probability * 100) / 100,
              volume,
              event_slug: event.slug,
            })
          }
        }
      }
    } catch (error) {
      // skip failed searches
    }
  }

  // Deduplicate and sort
  const seen = new Set()
  const unique = allMarkets.filter((m) => {
    if (seen.has(m.question)) return false
    seen.add(m.question)
    return true
  })
  unique.sort((a, b) => b.volume - a.volume)
  console.log(`Found ${unique.length} unique markets`)

  const signals = []
  for (const market of unique) {
    const mapping = mapMarketToAssets(market.question, market.probability)
    if (!mapping) continue
    signals.push({
      market: market.question,
      probability: market.probability,
      volume: market.volume,
      direction: mapping.direction,
      mapped_assets: mapping.mapped_assets,
      conviction: mapping.conviction,
    })
    console.log(`  ${market.question}: ${(market.probability * 100).toFixed(0)}% → ${mapping.direction} ${mapping.mapped_assets.join(', ')}`)
  }

  // Write crowd signals to signals table
  for (const signal of signals) {
    await supabase.from('signals').insert({
      snapshot_date: TODAY,
      source: 'crowd',
      market_question: signal.market,
      probability: signal.probability,
      direction: signal.direction,
      mapped_tickers: signal.mapped_assets,
      conviction: signal.conviction,
      raw_data: signal,
    })
  }

  console.log(`\n✓ Crowd: ${signals.length} signals written`)
  return signals
}

// ============================================================================
// PLAY 3: QUANT PIPELINE
// ============================================================================

// Single Finnhub /quote — used for every holding AND for SPY. Returns null on any
// failure (caller decides how to degrade). Shape: { c, d, dp, h, l, o, pc, t }.
async function finnhubQuote(symbol) {
  if (!FINNHUB_API_KEY) {
    console.warn(`  No FINNHUB_API_KEY — cannot fetch ${symbol}`)
    return null
  }
  const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`
  let response = await fetch(url)
  if (response.status === 429) {
    console.warn(`  Finnhub rate limited (429) at ${symbol} — backing off 60s once`)
    await new Promise((r) => setTimeout(r, 60000))
    response = await fetch(url) // single retry
  }
  if (!response.ok) {
    console.warn(`  ${symbol}: HTTP ${response.status}`)
    return null
  }
  const data = await response.json()
  const c = Number(data?.c)
  const pc = Number(data?.pc)
  // Finnhub returns c=0 (pc=0) for unknown/unsupported symbols — never trust a $0.
  if (!c || c <= 0) {
    console.warn(`  ${symbol}: no valid quote (c=${data?.c})`)
    return null
  }
  // Compute % change from c/pc (deterministic); fall back to Finnhub's dp.
  let changePct
  if (pc && pc > 0) changePct = ((c - pc) / pc) * 100
  else if (data?.dp != null && !Number.isNaN(Number(data.dp))) changePct = Number(data.dp)
  else changePct = 0
  changePct = Math.round(changePct * 100) / 100
  return { price: c, change_pct: changePct, prev_close: pc > 0 ? pc : null }
}

// Twelve Data daily close series (ascending). Free tier: ~800/day, 8/min, 1 credit
// per single-symbol call. Used here for SPY RSI; reused in Step 2 for per-ticker DMAs.
// Skip-safe: returns null on missing key / 429 / error status / too few rows.
async function fetchTwelveDataSeries(symbol, outputsize = 250) {
  if (!TWELVE_DATA_KEY) {
    console.warn(`  No TWELVE_DATA_KEY — cannot fetch ${symbol} series`)
    return null
  }
  try {
    const url = `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1day&outputsize=${outputsize}&apikey=${TWELVE_DATA_KEY}`
    let res = await fetch(url)
    if (res.status === 429) {
      console.warn(`  Twelve Data rate limited (429) at ${symbol} — backing off 60s once`)
      await new Promise((r) => setTimeout(r, 60000))
      res = await fetch(url) // single retry
    }
    if (!res.ok) {
      console.warn(`  Twelve Data ${symbol}: HTTP ${res.status} — skipping`)
      return null
    }
    const data = await res.json()
    // Error payload shape: { code, message, status:"error" }. Success: { meta, values, status:"ok" }.
    if (data?.status && data.status !== 'ok') {
      console.warn(`  Twelve Data ${symbol}: status=${data.status} (${data.message || 'no message'}) — skipping`)
      return null
    }
    const values = data?.values
    if (!Array.isArray(values) || values.length === 0) {
      console.warn(`  Twelve Data ${symbol}: no values returned — skipping`)
      return null
    }
    // values come newest-first; reverse to ascending and parse closes.
    const series = values
      .map((v) => ({ date: v.datetime, close: parseFloat(v.close) }))
      .filter((p) => p.date && Number.isFinite(p.close))
      .reverse()
    if (series.length < 15) {
      console.warn(`  Twelve Data ${symbol}: only ${series.length} valid rows (<15 for RSI) — skipping`)
      return null
    }
    console.log(`  Twelve Data ${symbol}: ${series.length} days. Latest: ${series[series.length - 1].date} @ $${series[series.length - 1].close}`)
    return series
  } catch (e) {
    console.warn(`  Twelve Data ${symbol}: fetch error — ${e.message}`)
    return null
  }
}

function calculateRSI(prices, period = 14) {
  if (prices.length < period + 1) throw new Error(`Need ${period + 1}+ prices for RSI`)
  const changes = []
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i].close - prices[i - 1].close)
  }
  let avgGain = 0, avgLoss = 0
  for (let i = 0; i < period; i++) {
    if (changes[i] >= 0) avgGain += changes[i]
    else avgLoss += Math.abs(changes[i])
  }
  avgGain /= period
  avgLoss /= period
  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] >= 0 ? changes[i] : 0
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0
    avgGain = (avgGain * (period - 1) + gain) / period
    avgLoss = (avgLoss * (period - 1) + loss) / period
  }
  if (avgLoss === 0) return 100
  return Math.round((100 - 100 / (1 + avgGain / avgLoss)) * 100) / 100
}

function getRSISignal(rsi) {
  if (rsi < 25) return 'oversold'
  if (rsi > 70) return 'overbought'
  return 'neutral'
}

function getRSIMappedTickers(signal) {
  if (signal === 'oversold') return ['SPY', 'QQQ', 'XSD']
  if (signal === 'overbought') return ['SGOV', 'GLDM']
  return ['SPY']
}

async function runQuantPipeline() {
  console.log('\n========================================')
  console.log('PLAY 3: QUANT PIPELINE')
  console.log('========================================')

  // SPY price + daily change from Finnhub — the SAME feed as the holdings, so the
  // benchmark and the portfolio can never diverge by data source again.
  const spyQuote = await finnhubQuote('SPY')
  const spyPrice = spyQuote?.price ?? null
  const spyChangePct = spyQuote?.change_pct ?? null

  // SPY daily close series from Twelve Data — used ONLY for RSI + recent-high.
  // If this fails, RSI goes null but spyPrice above is unaffected. THIS is the Jun 3 fix:
  // an RSI-source failure no longer freezes the SPY benchmark.
  const series = await fetchTwelveDataSeries('SPY', 250)

  let rsi = null
  let signal = null
  if (series) {
    rsi = calculateRSI(series)
    signal = getRSISignal(rsi)
  } else {
    console.warn('SPY RSI unavailable (Twelve Data) — SPY price still set from Finnhub.')
  }

  // All-time high: running max carried across snapshots, seeded from the TD series
  // recent-high and bounded below by today's LIVE Finnhub price so %off-ATH stays
  // consistent with the SPY price we actually display.
  let priorAth = 0
  try {
    const { data: prev } = await supabase
      .from('daily_snapshots')
      .select('macro_signals')
      .not('macro_signals', 'is', null)
      .order('snapshot_date', { ascending: false })
      .limit(1)
    priorAth = prev?.[0]?.macro_signals?.spy?.ath || 0
  } catch (e) {
    console.warn(`Prior ATH lookup failed (${e.message}) — seeding from series/price`)
  }
  const seriesHigh = series ? Math.max(...series.map((p) => p.close)) : 0
  const athCandidates = [seriesHigh, priorAth, spyPrice || 0].filter((x) => x > 0)
  const ath = athCandidates.length ? Math.round(Math.max(...athCandidates) * 100) / 100 : null
  const pctOffAth = (ath && spyPrice) ? Math.round(((spyPrice - ath) / ath) * 10000) / 100 : null

  if (spyPrice !== null) {
    const chg = spyChangePct ?? 0
    console.log(`SPY: $${spyPrice} (${chg >= 0 ? '+' : ''}${chg}% today)  ATH $${ath}  (${pctOffAth}% off)`)
  } else {
    console.warn('SPY price unavailable from Finnhub — benchmark will carry forward (check FINNHUB_API_KEY).')
  }
  if (rsi !== null) console.log(`RSI (14): ${rsi} → ${signal}`)

  // Write the quant signal row only when RSI exists (preserves prior behavior).
  if (rsi !== null) {
    const mappedTickers = getRSIMappedTickers(signal)
    await supabase.from('signals').upsert({
      snapshot_date: TODAY,
      source: 'quant',
      indicator_name: 'SPY_RSI_14',
      indicator_value: rsi,
      direction: signal === 'oversold' ? 'bullish' : signal === 'overbought' ? 'bearish' : 'neutral',
      mapped_tickers: mappedTickers,
      conviction: signal === 'neutral' ? 'low' : 'medium',
      raw_data: { rsi, signal, spy_price: spyPrice, latest_date: series[series.length - 1].date, period: 14 },
    }, { onConflict: 'snapshot_date,source', ignoreDuplicates: false })
    console.log(`\n✓ Quant: RSI ${rsi} (${signal}) written`)
  } else {
    console.log('\n✓ Quant: SPY price set from Finnhub; RSI row skipped (no series).')
  }

  return { rsi, signal, spyPrice, spyChangePct, spyAth: ath, spyPctOffAth: pctOffAth }
}

// ============================================================================
// MACRO: CPI (BLS via FRED) + Cleveland Fed nowcast + 4% regime
// Display-first. All values stored as RAW NUMBERS (engine-ready for future T3).
// Every fetch is skip-safe: missing key / endpoint / data => null => panel "—".
// ============================================================================

const REGIME_THRESHOLD = 4.0 // CPI YoY %. >= 4% historically bearish for S&P.

// CPI-U headline, Not Seasonally Adjusted — the YoY most commentators quote.
async function fetchFredCPI() {
  if (!FRED_API_KEY) {
    console.warn('No FRED_API_KEY — skipping CPI (panel will show "—")')
    return null
  }
  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=CPIAUCNS&api_key=${FRED_API_KEY}&file_type=json&sort_order=desc&limit=25`
    const res = await fetch(url)
    if (!res.ok) { console.warn(`FRED CPI: HTTP ${res.status} — skipping`); return null }
    const data = await res.json()
    const obs = (data?.observations || []).filter((o) => o.value && o.value !== '.')
    if (obs.length < 13) { console.warn(`FRED CPI: only ${obs.length} valid obs, need 13 for YoY — skipping`); return null }
    const latest = obs[0]            // most recent released month
    // Year-ago value: match by year-month (robust to gaps/missing months), fall back to index 12.
    const ld = new Date(latest.date)
    const targetYM = `${ld.getFullYear() - 1}-${String(ld.getMonth() + 1).padStart(2, '0')}`
    const yearAgo = obs.find((o) => o.date.slice(0, 7) === targetYM) || obs[12]
    const yoy = Math.round(((parseFloat(latest.value) - parseFloat(yearAgo.value)) / parseFloat(yearAgo.value)) * 1000) / 10
    const dataMonth = latest.date.slice(0, 7) // YYYY-MM (FRED obs date = 1st of data month)
    // BLS releases CPI ~mid the following month. Approximate (labeled ~ in UI).
    const d = new Date(latest.date); d.setMonth(d.getMonth() + 1); d.setDate(13)
    const releaseApprox = d.toISOString().split('T')[0]
    console.log(`CPI (CPIAUCNS): ${yoy}% YoY · data month ${dataMonth}`)
    return { yoy, data_month: dataMonth, release_date: releaseApprox, release_approx: true, source: 'BLS/FRED CPIAUCNS' }
  } catch (e) {
    console.warn(`FRED CPI: fetch error — ${e.message}`); return null
  }
}

// Cleveland Fed daily CPI inflation nowcast (current-month YoY estimate).
// NOTE: the live data endpoint is NOT on FRED (FRED only has long-horizon
// expected-inflation series). It's published on clevelandfed.org. The exact
// data URL must be confirmed on first run — it's isolated here as ONE constant.
// Until confirmed, this returns null and the panel shows "—" for the nowcast;
// CPI + regime still render off the FRED value above.
const CLEVELAND_NOWCAST_URL = '' // TODO: pin exact CSV/JSON endpoint, then this is the only change.

async function fetchClevelandNowcast() {
  if (!CLEVELAND_NOWCAST_URL) {
    console.warn('Cleveland nowcast URL not yet pinned — skipping (panel shows "—" for nowcast). Verify endpoint, set CLEVELAND_NOWCAST_URL.')
    return null
  }
  try {
    const res = await fetch(CLEVELAND_NOWCAST_URL)
    if (!res.ok) { console.warn(`Cleveland nowcast: HTTP ${res.status} — skipping. Re-verify CLEVELAND_NOWCAST_URL.`); return null }
    const raw = await res.text()
    // Parsing depends on the confirmed payload shape (CSV vs JSON). Once the URL
    // is pinned, parse here -> { yoy, data_month, as_of }. Log raw on first run.
    console.warn('Cleveland nowcast: endpoint returned data but parser not yet wired. Raw head:', raw.slice(0, 200))
    return null
  } catch (e) {
    console.warn(`Cleveland nowcast: fetch error — ${e.message}`); return null
  }
}

// Assemble the macro_signals blob (spec §4). Regime keys off the nowcast when
// available (the live read), else falls back to official CPI.
function buildMacroSignals(quantResult, cpi, nowcast) {
  const regimeBasis = (nowcast && typeof nowcast.yoy === 'number') ? nowcast.yoy
    : (cpi && typeof cpi.yoy === 'number') ? cpi.yoy : null
  const regime = regimeBasis === null ? null : {
    threshold: REGIME_THRESHOLD,
    basis: (nowcast && typeof nowcast.yoy === 'number') ? 'nowcast' : 'cpi',
    value: regimeBasis,
    above: regimeBasis >= REGIME_THRESHOLD,
    note: regimeBasis >= REGIME_THRESHOLD
      ? 'Above 4% — S&P historically negative (1928–present)'
      : 'Below 4% — S&P historically ~+12% annual',
  }
  return {
    spy: quantResult.spyPrice === null ? null : {
      price: quantResult.spyPrice, ath: quantResult.spyAth, pct_off_ath: quantResult.spyPctOffAth,
    },
    rsi: quantResult.rsi === null ? null : { value: quantResult.rsi, signal: quantResult.signal },
    cpi: cpi || null,
    nowcast: nowcast || null,
    regime,
    kalshi: null, // reserved for Kalshi Tier 2/3 (inflation/Fed odds) — code-only add later
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

// AlphaPlaybook model portfolio — 17 tickers across 6 themes + cash
// North star: "Long scarcity, short abundance"
// AlphaPlaybook AGGRESSIVE sleeve — Decision Engine v2.2 (RESCORED 2026-05-28, REWEIGHTED 2026-06-01)
// Source: AlphaPlaybook_Sleeves_5_28_26.md + "Portfolio Construction" session (Rule B).
// v2.2 change (2026-06-01): SINGLE-NAME REDUNDANCY DISCOUNT ("Rule B").
//   A single stock whose THEME is already held via a thematic ETF takes an
//   idiosyncratic-risk haircut on its WEIGHTING SCORE only:
//     weighting_score = 45 + (composite - 45) * lambda,  lambda = 0.814
//   composite/tier labels are UNCHANGED (raw scores still drive trim/exit logic).
//   Redundant names (inside AIPO): CEG (~3.5% of AIPO) + BE (~6% of AIPO).
//   Exempt: ETFs, and optical single names GLW/MRVL (no thematic ETF covers optical;
//   trivial XSD membership does NOT count as theme coverage).
//   This REPLACES the old ad-hoc 12% single-stock cap on CEG — the scoring rule
//   now does that job. Effect: CEG 12.0 -> 7.5, AIPO 10.0 -> 10.5 (theme now
//   outweighs the single name), BE 4.0 -> 2.5; freed weight lifts GLW/MRVL/ETFs.
// Params: 17 holdings, top weight 18%, cash floor ~5% (SGOV 5.5%), k=6.03. NO single-stock cap.
// These are FINAL engine output and ship as-is — the nightly boost is DISABLED below.
// `action` = composite-tier label for the Portfolio tab Action column
//   (>=80 Strong Entry | 73-79.9 Enter | 67-72.9 Starter/Watch | COPX/BE structural & cash = Hold).
// Comments after each line are the engine composite scores (UNDISCOUNTED).
const BASE_PORTFOLIO = {
  SLV:  { base_weight: 18,  theme: 'Monetary Scarcity & Tokenization', action: 'Strong Entry' },   // 79.7  below-200, held (no add)
  GLW:  { base_weight: 9,   theme: 'Compute',                          action: 'Enter' },          // 71.2
  LLY:  { base_weight: 7,   theme: 'AI Application',                   action: 'Enter' },          // 68.0
  IBIT: { base_weight: 6.5, theme: 'Monetary Scarcity & Tokenization', action: 'Enter' },          // 75.5  PAUSED below-200
  HOOD: { base_weight: 6,   theme: 'Monetary Scarcity & Tokenization', action: 'Enter' },          // 66.0
  GLDM: { base_weight: 6,   theme: 'Monetary Scarcity & Tokenization', action: 'Enter' },          // 74.6  PAUSED below-200
  AIPO: { base_weight: 5.5, theme: 'Power & Infrastructure',           action: 'Enter' },          // 65.3
  ENTG: { base_weight: 5,   theme: 'Compute',                          action: 'Starter / Watch' },// 64.0
  BE:   { base_weight: 4.5, theme: 'Power & Infrastructure',           action: 'Starter / Watch' },// 63.4  voice-floor (Camillo)
  COPX: { base_weight: 4.5, theme: 'Power & Infrastructure',           action: 'Starter / Watch' },// 62.6
  SGOV: { base_weight: 4.5, theme: 'Cash', min_weight: 3,              action: 'Hold' },           // cash floor
  WGMI: { base_weight: 3.5, theme: 'Power & Infrastructure',           action: 'Starter / Watch' },// 60.1
  TXN:  { base_weight: 3.5, theme: 'Power & Infrastructure',           action: 'Starter / Watch' },// 59.7
  MRVL: { base_weight: 3.5, theme: 'Compute',                          action: 'Starter / Watch' },// 59.9
  ETHA: { base_weight: 3,   theme: 'Monetary Scarcity & Tokenization', action: 'Enter' },          // 67.7  PAUSED below-200
  CEG:  { base_weight: 2.5, theme: 'Power & Infrastructure',           action: 'Enter' },          // 67.9  cooling + accel
  FLNC: { base_weight: 2.5, theme: 'Power & Infrastructure',           action: 'Starter / Watch' },// 56.9
  XSD:  { base_weight: 2.5, theme: 'Compute',                          action: 'Starter / Watch' },// 56.4
  AMZN: { base_weight: 2.5, theme: 'AI Application',                   action: 'Starter / Watch' },// 55.5
}

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

  // Enforce SGOV floor (cash floor still applies as a guardrail).
  if (portfolio['SGOV'].weight < (portfolio['SGOV'].min_weight || 3)) {
    portfolio['SGOV'].weight = portfolio['SGOV'].min_weight || 3
  }

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
    .select('snapshot_date, portfolio_value, spy_value, cumulative_return_pct, spy_cumulative_return_pct')
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

  // Build today's holdings rows using TODAY's target weights.
  // Market value reflects the rebalanced amount applied to today's portfolioValue.
  const holdings = []
  for (const [ticker, pos] of Object.entries(portfolio)) {
    const priceData = prices[ticker]
    const currentPrice = priceData?.price ?? null
    const dailyChangePct = priceData?.change_pct ?? 0
    const isNewTicker = newTickers.includes(ticker)

    // Today's allocation for this position based on today's target weight
    const marketValue = Math.round(((pos.weight_pct / 100) * portfolioValue) * 100) / 100

    // Per-ticker daily change shown in the table is the asset's actual move.
    // For new tickers, mark as 0 since we didn't hold them yesterday.
    const reportedDailyChange = isNewTicker ? 0 : dailyChangePct

    holdings.push({
      ticker,
      weight_pct: pos.weight_pct,
      price: currentPrice,
      market_value: marketValue,
      daily_change_pct: reportedDailyChange,
      signal_sources: pos.adjustments,
      category: pos.theme,
      is_new_ticker: isNewTicker,
    })
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

async function writeDailySnapshot(narrativeSignals, crowdSignals, quantResult, bullishAssets, portfolio, pnl, macroSignals, technicals) {
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
    direction: s.direction,
    mapped_assets: s.mapped_assets,
    conviction: s.conviction,
  }))

  const portfolioData = Object.entries(portfolio).map(([ticker, pos]) => ({
    ticker,
    weight_pct: pos.weight_pct,
    category: pos.theme,
    adjustments: pos.adjustments,
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

    // Step 1b: Macro signals — CPI (FRED) + Cleveland nowcast + 4% regime.
    // Both skip-safe; macroSignals always returns a blob (fields null if missing).
    const cpi = await fetchFredCPI()
    const nowcast = await fetchClevelandNowcast()
    const macroSignals = buildMacroSignals(quantResult, cpi, nowcast)

    // Step 2: Aggregate bullish assets across all sources
    const bullishAssets = aggregateBullishAssets(narrativeSignals, crowdSignals, quantResult)

    // Step 3: Compute model portfolio with signal-driven weight adjustments
    const portfolio = computeModelPortfolio(bullishAssets, quantResult)

    // Step 4: Fetch current prices for portfolio tickers
    const tickers = Object.keys(portfolio)
    const prices = await fetchCurrentPrices(tickers)

    // Step 5: Calculate P&L
    const pnl = await calculatePnL(portfolio, prices, quantResult.spyPrice)

    // Step 5b: Technicals — 10/50/200 DMAs per holding (feeds Step 3 action pill + (b) entry-gate)
    const technicals = await computeTechnicals(tickers)

    // Step 6: Write complete daily snapshot
    await writeDailySnapshot(narrativeSignals, crowdSignals, quantResult, bullishAssets, portfolio, pnl, macroSignals, technicals)

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log('\n╔══════════════════════════════════════════╗')
    console.log('║   ✓ Daily cron complete!                 ║')
    console.log(`║   Signals: ${(narrativeSignals.length + crowdSignals.length + (quantResult.rsi ? 1 : 0)).toString().padEnd(29)}║`)
    console.log(`║   Bullish tickers: ${bullishAssets.length.toString().padEnd(21)}║`)
    console.log(`║   Portfolio value: $${pnl.portfolio_value.toLocaleString().padEnd(19)}║`)
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
}
