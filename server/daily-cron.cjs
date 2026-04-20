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
const ALPHA_VANTAGE_KEY = process.env.ALPHA_VANTAGE_KEY
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY. Check environment variables.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const TODAY = new Date().toISOString().split('T')[0]

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
  'gold': { ticker: 'GLD', asset: 'Gold', category: 'commodity', exact: true },
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
  'inflation': { ticker: 'GLD', asset: 'Inflation', category: 'macro' },
  'inflationary': { ticker: 'GLD', asset: 'Inflation', category: 'macro' },
  'stagflation': { ticker: 'GLD', asset: 'Stagflation', category: 'macro_bearish' },
  'deflation': { ticker: 'TLT', asset: 'Deflation', category: 'macro' },
  'interest rate': { ticker: 'TLT', asset: 'Interest Rates', category: 'macro' },
  'rate cut': { ticker: 'TLT', asset: 'Rate Cuts', category: 'macro_bullish' },
  'rate hike': { ticker: 'SGOV', asset: 'Rate Hikes', category: 'macro_bearish' },
  'federal reserve': { ticker: 'TLT', asset: 'Fed Policy', category: 'macro' },
  'the fed': { ticker: 'TLT', asset: 'Fed Policy', category: 'macro' },
  'quantitative easing': { ticker: 'SPY', asset: 'QE', category: 'macro_bullish' },
  'money printing': { ticker: 'GLD', asset: 'Money Printing', category: 'macro' },
  'liquidity': { ticker: 'IBIT', asset: 'Global Liquidity', category: 'macro' },
  'dollar debasement': { ticker: 'GLD', asset: 'Dollar Debasement', category: 'macro' },
  'scarcity': { ticker: 'GLD', asset: 'Scarcity Trade', category: 'macro' },
  'abundance': { ticker: 'XSD', asset: 'Abundance Trade', category: 'macro' },
  'tariff': { ticker: 'VEA', asset: 'Tariffs/Trade', category: 'macro' },
  'trade war': { ticker: 'VEA', asset: 'Trade War', category: 'macro_bearish' },
  'sanctions': { ticker: 'XLE', asset: 'Sanctions', category: 'macro' },
  'war': { ticker: 'GLD', asset: 'War/Conflict', category: 'geopolitical', exact: true },
  'military': { ticker: 'PPA', asset: 'Military/Defense', category: 'geopolitical' },
  'geopolitical': { ticker: 'GLD', asset: 'Geopolitical Risk', category: 'geopolitical' },
  'iran': { ticker: 'XLE', asset: 'Iran Risk', category: 'geopolitical', exact: true },
  'china': { ticker: 'XSD', asset: 'China Risk', category: 'geopolitical', exact: true },
  'russia': { ticker: 'XLE', asset: 'Russia Risk', category: 'geopolitical' },
  'ukraine': { ticker: 'GLD', asset: 'Ukraine Conflict', category: 'geopolitical' },
  'nuclear': { ticker: 'GLD', asset: 'Nuclear Risk', category: 'geopolitical' },
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
    if (probability > 0.70) return { direction: 'bullish', mapped_assets: ['GLD', 'TLT', 'XSD'], conviction: 'high' }
    if (probability > 0.50) return { direction: 'bullish', mapped_assets: ['GLD', 'TLT'], conviction: 'medium' }
    return { direction: 'neutral', mapped_assets: ['SGOV'], conviction: 'low' }
  }
  if ((q.includes('fed') || q.includes('federal reserve')) && (q.includes('hike') || q.includes('raise') || q.includes('increase'))) {
    if (probability > 0.50) return { direction: 'bearish', mapped_assets: ['TLT', 'XSD', 'GLD'], conviction: 'medium' }
    return { direction: 'neutral', mapped_assets: ['SGOV'], conviction: 'low' }
  }
  if (q.includes('fed funds') || q.includes('federal reserve') || q.includes('fomc')) {
    return { direction: 'neutral', mapped_assets: ['SGOV', 'TLT'], conviction: 'low' }
  }

  // Recession
  if (q.includes('recession')) {
    if (probability > 0.50) return { direction: 'bearish', mapped_assets: ['SPY', 'XSD', 'COPX'], conviction: 'high' }
    if (probability > 0.35) return { direction: 'neutral', mapped_assets: ['SGOV', 'GLD'], conviction: 'medium' }
    return { direction: 'bullish', mapped_assets: ['SPY', 'XSD', 'COPX'], conviction: 'medium' }
  }

  // Inflation / CPI
  if (q.includes('inflation') || q.includes('cpi')) {
    if ((q.includes('above') || q.includes('over') || q.includes('high') || q.includes('rise')) && probability > 0.60) {
      return { direction: 'bullish', mapped_assets: ['GLD', 'COPX', 'XLE', 'IBIT'], conviction: 'medium' }
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
      return { direction: 'bullish', mapped_assets: ['GLD'], conviction: 'medium' }
    }
    if ((q.includes('below') || q.includes('under') || q.includes('drop') || q.includes('fall')) && probability > 0.50) {
      return { direction: 'bearish', mapped_assets: ['GLD'], conviction: 'medium' }
    }
    return { direction: 'neutral', mapped_assets: ['GLD'], conviction: 'low' }
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
      return { direction: 'neutral', mapped_assets: ['XLE', 'GLD'], conviction: 'low' }
    }
    if ((q.includes('escalat') || q.includes('nuclear') || q.includes('nato') || q.includes('expand')) && probability > 0.30) {
      return { direction: 'bullish', mapped_assets: ['GLD', 'XLE', 'SGOV'], conviction: 'high' }
    }
    return { direction: 'neutral', mapped_assets: ['GLD', 'XLE'], conviction: 'low' }
  }

  // China-Taiwan
  if (q.includes('china') && (q.includes('taiwan') || q.includes('invasion') || q.includes('military'))) {
    if (probability > 0.20) return { direction: 'bearish', mapped_assets: ['XSD', 'VEA', 'SPY'], conviction: 'high' }
    return { direction: 'neutral', mapped_assets: ['XSD', 'GLD'], conviction: 'low' }
  }

  // Iran
  if (q.includes('iran') && (q.includes('war') || q.includes('strike') || q.includes('attack') || q.includes('nuclear') || q.includes('military'))) {
    if (probability > 0.30) return { direction: 'bullish', mapped_assets: ['XLE', 'GLD'], conviction: 'high' }
    return { direction: 'neutral', mapped_assets: ['XLE', 'GLD'], conviction: 'low' }
  }

  // Israel / Middle East
  if (q.includes('israel') || q.includes('gaza') || q.includes('hamas') || q.includes('hezbollah') || q.includes('middle east')) {
    if (q.includes('ceasefire') || q.includes('peace') || q.includes('deal')) {
      if (probability > 0.50) return { direction: 'bearish', mapped_assets: ['XLE', 'GLD'], conviction: 'low' }
    }
    if ((q.includes('escalat') || q.includes('war') || q.includes('invasion') || q.includes('expand')) && probability > 0.30) {
      return { direction: 'bullish', mapped_assets: ['XLE', 'GLD', 'SGOV'], conviction: 'high' }
    }
    return { direction: 'neutral', mapped_assets: ['XLE', 'GLD'], conviction: 'low' }
  }

  // North Korea
  if (q.includes('north korea') || q.includes('kim jong') || q.includes('pyongyang')) {
    if ((q.includes('nuclear') || q.includes('missile') || q.includes('test') || q.includes('launch')) && probability > 0.30) {
      return { direction: 'bullish', mapped_assets: ['GLD', 'SGOV'], conviction: 'medium' }
    }
    return { direction: 'neutral', mapped_assets: ['GLD'], conviction: 'low' }
  }

  // General war / conflict
  if (q.includes('war') || q.includes('military') || q.includes('conflict') || q.includes('invasion') || q.includes('attack')) {
    if (q.includes('ceasefire') || q.includes('peace') || q.includes('end') || q.includes('withdraw')) {
      if (probability > 0.50) return { direction: 'bullish', mapped_assets: ['VEA', 'SPY'], conviction: 'medium' }
    }
    if (probability > 0.30) return { direction: 'bullish', mapped_assets: ['GLD', 'XLE', 'SGOV'], conviction: 'medium' }
    return { direction: 'neutral', mapped_assets: ['GLD', 'XLE'], conviction: 'low' }
  }

  // Sanctions
  if (q.includes('sanction')) {
    if (probability > 0.50) return { direction: 'neutral', mapped_assets: ['XLE', 'GLD', 'COPX'], conviction: 'medium' }
    return { direction: 'neutral', mapped_assets: ['SPY'], conviction: 'low' }
  }

  // NATO
  if (q.includes('nato')) return { direction: 'neutral', mapped_assets: ['VEA', 'GLD'], conviction: 'low' }

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

async function fetchSPYPrices() {
  if (!ALPHA_VANTAGE_KEY) {
    console.warn('No ALPHA_VANTAGE_KEY — skipping quant pipeline')
    return null
  }
  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=SPY&outputsize=compact&apikey=${ALPHA_VANTAGE_KEY}`
  console.log('Fetching SPY daily prices...')
  const response = await fetch(url)
  const data = await response.json()

  if (data['Error Message']) throw new Error(`Alpha Vantage: ${data['Error Message']}`)
  if (data['Note']) throw new Error(`Alpha Vantage rate limit: ${data['Note']}`)

  const timeSeries = data['Time Series (Daily)']
  if (!timeSeries) throw new Error('No time series data returned')

  const prices = Object.entries(timeSeries)
    .map(([date, values]) => ({ date, close: parseFloat(values['4. close']) }))
    .sort((a, b) => new Date(a.date) - new Date(b.date))

  console.log(`Got ${prices.length} days. Latest: ${prices[prices.length - 1].date} @ $${prices[prices.length - 1].close}`)
  return prices
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
  if (signal === 'overbought') return ['SGOV', 'GLD']
  return ['SPY']
}

async function runQuantPipeline() {
  console.log('\n========================================')
  console.log('PLAY 3: QUANT PIPELINE')
  console.log('========================================')

  const prices = await fetchSPYPrices()
  if (!prices) return { rsi: null, signal: null, spyPrice: null }

  const rsi = calculateRSI(prices)
  const signal = getRSISignal(rsi)
  const latest = prices[prices.length - 1]
  const mappedTickers = getRSIMappedTickers(signal)

  console.log(`RSI (14): ${rsi} → ${signal}`)
  console.log(`SPY: $${latest.close} (${latest.date})`)

  // Write to signals table
  await supabase.from('signals').upsert({
    snapshot_date: TODAY,
    source: 'quant',
    indicator_name: 'SPY_RSI_14',
    indicator_value: rsi,
    direction: signal === 'oversold' ? 'bullish' : signal === 'overbought' ? 'bearish' : 'neutral',
    mapped_tickers: mappedTickers,
    conviction: signal === 'neutral' ? 'low' : 'medium',
    raw_data: { rsi, signal, latest_price: latest.close, latest_date: latest.date, period: 14 },
  }, { onConflict: 'snapshot_date,source', ignoreDuplicates: false })

  console.log(`\n✓ Quant: RSI ${rsi} (${signal}) written`)
  return { rsi, signal, spyPrice: latest.close }
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

// Charlie's core holdings and base weights
// ~$30-35K SGOV floor on $250K portfolio
const BASE_PORTFOLIO = {
  SGOV: { base_weight: 14, category: 'safety', min_weight: 12 },      // ~$30-35K floor on $250K
  GLD:  { base_weight: 12, category: 'conservative' },
  XLV:  { base_weight: 10, category: 'conservative' },
  SLV:  { base_weight: 6,  category: 'conservative' },
  GRID: { base_weight: 8,  category: 'conservative' },
  IBIT: { base_weight: 15, category: 'aggressive' },
  XSD:  { base_weight: 12, category: 'aggressive' },
  XLE:  { base_weight: 8,  category: 'aggressive' },
  COPX: { base_weight: 7,  category: 'aggressive' },
  PPA:  { base_weight: 8,  category: 'aggressive' },
}

function computeModelPortfolio(bullishAssets, quantResult) {
  console.log('\n========================================')
  console.log('COMPUTING MODEL PORTFOLIO')
  console.log('========================================')

  // Start with base weights
  const portfolio = {}
  for (const [ticker, config] of Object.entries(BASE_PORTFOLIO)) {
    portfolio[ticker] = { ...config, weight: config.base_weight, adjustments: [] }
  }

  // Apply signal-driven adjustments
  // Tickers with bullish convergence get a boost; max +5% per ticker
  for (const asset of bullishAssets) {
    const ticker = asset.ticker
    if (!portfolio[ticker]) continue

    let boost = 0
    if (asset.source_count >= 3) boost = 5        // 3/3 convergence: strong boost
    else if (asset.source_count >= 2) boost = 3    // 2/3 convergence: moderate boost
    else if (asset.score >= 3) boost = 2           // single source but high conviction
    else boost = 1                                  // single source, moderate

    portfolio[ticker].weight += boost
    portfolio[ticker].adjustments.push(`+${boost}% (${asset.convergence} convergence)`)
  }

  // If RSI is overbought, shift from aggressive to safety
  if (quantResult.signal === 'overbought') {
    for (const [ticker, pos] of Object.entries(portfolio)) {
      if (pos.category === 'aggressive') {
        const reduction = Math.round(pos.weight * 0.15) // Reduce aggressive by 15%
        portfolio[ticker].weight -= reduction
        portfolio[ticker].adjustments.push(`-${reduction}% (RSI overbought)`)
      }
    }
    portfolio['SGOV'].weight += 5
    portfolio['SGOV'].adjustments.push('+5% (RSI overbought → safety)')
  }

  // Enforce SGOV floor
  if (portfolio['SGOV'].weight < portfolio['SGOV'].min_weight) {
    portfolio['SGOV'].weight = portfolio['SGOV'].min_weight
  }

  // Normalize weights to 100%
  const totalRaw = Object.values(portfolio).reduce((sum, p) => sum + p.weight, 0)
  for (const [ticker, pos] of Object.entries(portfolio)) {
    pos.weight_pct = Math.round((pos.weight / totalRaw) * 10000) / 100 // 2 decimal %
  }

  // Log
  const sorted = Object.entries(portfolio).sort((a, b) => b[1].weight_pct - a[1].weight_pct)
  for (const [ticker, pos] of sorted) {
    const adj = pos.adjustments.length > 0 ? ` (${pos.adjustments.join(', ')})` : ''
    console.log(`  ${ticker}: ${pos.weight_pct}%${adj}`)
  }

  return portfolio
}

// ============================================================================
// PRICE FETCHER
// ============================================================================

async function fetchCurrentPrices(tickers) {
  console.log('\n========================================')
  console.log('FETCHING CURRENT PRICES')
  console.log('========================================')

  if (!ALPHA_VANTAGE_KEY) {
    console.warn('No ALPHA_VANTAGE_KEY — using placeholder prices')
    return {}
  }

  const prices = {}

  // SGOV barely moves — hardcode at $100.00 to save an API call
  prices['SGOV'] = { price: 100.00, change_pct: 0 }
  console.log(`  SGOV: $100.00 (hardcoded)`)

  // Alpha Vantage free tier: 25 calls/day, 5/min
  // Fetch the most important tickers first; skip if rate-limited
  for (const ticker of tickers) {
    if (ticker === 'SGOV') continue  // already hardcoded
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_KEY}`
      const response = await fetch(url)
      const data = await response.json()

      if (data['Note']) {
        console.warn(`  Rate limited at ${ticker} — stopping price fetches`)
        break
      }

      const quote = data['Global Quote']
      if (quote && quote['05. price']) {
        const price = parseFloat(quote['05. price'])
        const changePct = parseFloat(quote['10. change percent']?.replace('%', '') || '0')
        prices[ticker] = { price, change_pct: changePct }
        console.log(`  ${ticker}: $${price.toFixed(2)} (${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%)`)
      } else {
        console.warn(`  ${ticker}: no quote data`)
      }

      // Respect rate limit: wait 1.5s between calls
      await new Promise((r) => setTimeout(r, 1500))
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

  const STARTING_VALUE = 250000 // Charlie's portfolio baseline

  // Fetch yesterday's snapshot for daily return calculation
  const { data: prevSnapshot } = await supabase
    .from('daily_snapshots')
    .select('portfolio_value, spy_value, cumulative_return_pct, spy_cumulative_return_pct')
    .lt('snapshot_date', TODAY)
    .order('snapshot_date', { ascending: false })
    .limit(1)
    .single()

  const prevPortfolioValue = prevSnapshot?.portfolio_value || STARTING_VALUE
  const prevSpyValue = prevSnapshot?.spy_value || spyPrice // If first day, SPY base = today's price

  // Calculate current portfolio value using weights and prices
  let portfolioValue = 0
  const holdings = []

  for (const [ticker, pos] of Object.entries(portfolio)) {
    const priceData = prices[ticker]
    const allocation = (pos.weight_pct / 100) * STARTING_VALUE
    const currentPrice = priceData?.price || null
    const dailyChangePct = priceData?.change_pct || 0

    // If we have a price, calculate actual market value based on change
    // Otherwise use the allocation amount
    let marketValue = allocation
    if (currentPrice && prevPortfolioValue !== STARTING_VALUE) {
      // After first day: apply daily change to previous allocation
      const prevAllocation = (pos.weight_pct / 100) * prevPortfolioValue
      marketValue = prevAllocation * (1 + dailyChangePct / 100)
    }

    portfolioValue += marketValue

    holdings.push({
      ticker,
      weight_pct: pos.weight_pct,
      price: currentPrice,
      market_value: Math.round(marketValue * 100) / 100,
      daily_change_pct: dailyChangePct,
      signal_sources: pos.adjustments,
      category: pos.category,
    })
  }

  // If no prices fetched, use starting value
  if (Object.keys(prices).length === 0) {
    portfolioValue = prevPortfolioValue
  }

  // Daily return
  const dailyReturnPct = prevPortfolioValue > 0
    ? Math.round(((portfolioValue - prevPortfolioValue) / prevPortfolioValue) * 10000) / 100
    : 0

  // Cumulative return from inception
  const cumulativeReturnPct = Math.round(((portfolioValue - STARTING_VALUE) / STARTING_VALUE) * 10000) / 100

  // SPY benchmark
  const spyValue = spyPrice || prevSpyValue
  const spyBaseValue = prevSnapshot ? prevSpyValue : spyValue
  const spyCumulativeReturnPct = spyBaseValue && spyBaseValue > 0
    ? Math.round(((spyValue - spyBaseValue) / spyBaseValue) * 10000) / 100
    : 0

  console.log(`  Portfolio Value: $${portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`)
  console.log(`  Daily Return: ${dailyReturnPct >= 0 ? '+' : ''}${dailyReturnPct}%`)
  console.log(`  Cumulative Return: ${cumulativeReturnPct >= 0 ? '+' : ''}${cumulativeReturnPct}%`)
  console.log(`  SPY Cumulative: ${spyCumulativeReturnPct >= 0 ? '+' : ''}${spyCumulativeReturnPct}%`)
  console.log(`  Alpha vs SPY: ${(cumulativeReturnPct - spyCumulativeReturnPct).toFixed(2)}%`)

  return {
    portfolio_value: Math.round(portfolioValue * 100) / 100,
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

async function writeDailySnapshot(narrativeSignals, crowdSignals, quantResult, bullishAssets, portfolio, pnl) {
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
    category: pos.category,
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

  const startTime = Date.now()

  try {
    // Step 1: Run all three pipelines
    const narrativeSignals = await runNarrativePipeline()
    const crowdSignals = await runCrowdPipeline()
    const quantResult = await runQuantPipeline()

    // Step 2: Aggregate bullish assets across all sources
    const bullishAssets = aggregateBullishAssets(narrativeSignals, crowdSignals, quantResult)

    // Step 3: Compute model portfolio with signal-driven weight adjustments
    const portfolio = computeModelPortfolio(bullishAssets, quantResult)

    // Step 4: Fetch current prices for portfolio tickers
    const tickers = Object.keys(portfolio)
    const prices = await fetchCurrentPrices(tickers)

    // Step 5: Calculate P&L
    const pnl = await calculatePnL(portfolio, prices, quantResult.spyPrice)

    // Step 6: Write complete daily snapshot
    await writeDailySnapshot(narrativeSignals, crowdSignals, quantResult, bullishAssets, portfolio, pnl)

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

main()
