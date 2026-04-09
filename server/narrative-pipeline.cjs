// server/narrative-pipeline.cjs
// Play 1: Fetches latest videos from Visser/Pomp, All-In, and Moonshots,
// retrieves transcripts, extracts asset calls via keyword matching,
// and writes structured results to Supabase.

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// --- Config ---
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!YOUTUBE_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required environment variables. Check .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// --- Podcast Sources ---
const SOURCES = [
  {
    name: 'visser',
    label: 'Jordi Visser',
    channels: [
      { id: 'UCGAhWqzVgKytS0NcKz9bxDA', name: 'Anthony Pompliano Clips', filterGuest: 'Jordi Visser' },
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

// --- Asset keyword dictionary ---
// Maps keywords found in transcripts to structured asset signals
const ASSET_KEYWORDS = {
  // Crypto (whole words only - marked with _exact flag)
  'bitcoin': { ticker: 'IBIT', asset: 'Bitcoin', category: 'crypto' },
  'btc': { ticker: 'IBIT', asset: 'Bitcoin', category: 'crypto', exact: true },
  'ethereum': { ticker: 'ETH', asset: 'Ethereum', category: 'crypto' },
  'crypto': { ticker: 'IBIT', asset: 'Crypto', category: 'crypto' },
  'digital asset': { ticker: 'IBIT', asset: 'Digital Assets', category: 'crypto' },

  // Commodities
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

  // Equities / Sectors
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

  // Fixed Income / Safety
  'bonds': { ticker: 'TLT', asset: 'Bonds', category: 'fixed_income' },
  'treasuries': { ticker: 'TLT', asset: 'Treasuries', category: 'fixed_income' },
  'treasury': { ticker: 'TLT', asset: 'Treasuries', category: 'fixed_income' },
  'cash': { ticker: 'SGOV', asset: 'Cash/T-Bills', category: 'fixed_income', exact: true },

  // Macro themes → these map to the ASSETS they imply
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

  // War / Geopolitics → maps to safety assets
  'war': { ticker: 'GLDM', asset: 'War/Conflict', category: 'geopolitical', exact: true },
  'military': { ticker: 'PPA', asset: 'Military/Defense', category: 'geopolitical' },
  'geopolitical': { ticker: 'GLDM', asset: 'Geopolitical Risk', category: 'geopolitical' },
  'iran': { ticker: 'XLE', asset: 'Iran Risk', category: 'geopolitical', exact: true },
  'china': { ticker: 'XSD', asset: 'China Risk', category: 'geopolitical', exact: true },
  'russia': { ticker: 'XLE', asset: 'Russia Risk', category: 'geopolitical' },
  'ukraine': { ticker: 'GLDM', asset: 'Ukraine Conflict', category: 'geopolitical' },
  'nuclear': { ticker: 'GLDM', asset: 'Nuclear Risk', category: 'geopolitical' },
}

// --- Bullish/bearish signal words ---
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

// --- YouTube API: Search for latest videos ---
async function searchYouTube(channelId, channelName, maxResults = 3) {
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


// --- Fetch transcript directly from YouTube's timedtext API ---
async function fetchTranscript(videoId, title) {
  try {
    // Step 1: Fetch the video page to extract the captions URL
    const pageUrl = `https://www.youtube.com/watch?v=${videoId}`
    const pageResponse = await fetch(pageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(15000),
    })
    const html = await pageResponse.text()

    // Step 2: Extract captions URL from the page source
    const captionMatch = html.match(/"captionTracks":\[\{"baseUrl":"(.*?)"/);
    if (!captionMatch) {
      console.log(`  No captions found in page source`)
      return { text: null, source: 'none' }
    }

   const captionUrl = captionMatch[1].replace(/\\u0026/g, '&').replace(/\\u0025/g, '%')

    // Step 3: Fetch the actual captions XML
    const captionResponse = await fetch(captionUrl, {
      signal: AbortSignal.timeout(10000),
    })
    const xml = await captionResponse.text()

    // Step 4: Extract text from XML caption elements
  const textMatches = xml.match(/<text[^>]*>([^<]*)<\/text>/gs)
    if (!textMatches || textMatches.length === 0) {
      console.log(`  No text found in captions XML`)
      return { text: null, source: 'none' }
    }

    const text = textMatches
      .map(t => t.replace(/<[^>]*>/g, ''))
      .map(t => t.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'"))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (text.length > 100) {
      console.log(`  Got ${text.length} chars of transcript`)
      return { text: text.slice(0, 30000), source: 'youtube-captions' }
    }
  } catch (e) {
    console.log(`  Transcript fetch failed: ${e.message}`)
  }

  return { text: null, source: 'none' }
}

// --- Extract asset signals from transcript text ---
function extractSignals(text, source, videoTitle) {
  if (!text) {
    // If no transcript, try to extract from video title + description
    text = videoTitle || ''
  }

  const textLower = text.toLowerCase()
  const signals = []
  const seenTickers = new Set()

  // Scan for each asset keyword
  for (const [keyword, assetInfo] of Object.entries(ASSET_KEYWORDS)) {
    // Check if keyword appears in text
  const keywordLower = keyword.toLowerCase()
    // Use word boundary matching for short/ambiguous keywords
    let idx = -1
    if (assetInfo.exact) {
      const regex = new RegExp(`\\b${keywordLower}\\b`)
      const match = regex.exec(textLower)
      idx = match ? match.index : -1
    } else {
      idx = textLower.indexOf(keywordLower)
    }
    if (idx === -1) continue

    // Skip if we already found this ticker
    if (seenTickers.has(assetInfo.ticker)) continue
    seenTickers.add(assetInfo.ticker)

    // Get surrounding context (200 chars before and after)
    const contextStart = Math.max(0, idx - 200)
    const contextEnd = Math.min(textLower.length, idx + keyword.length + 200)
    const context = textLower.slice(contextStart, contextEnd)

    // Determine direction from context
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
    } else if (hasBullish && hasBearish) {
      direction = 'neutral'
      conviction = 'low'
    }

    // Override direction for inherently directional macro categories
    if (assetInfo.category === 'macro_bearish' && direction === 'neutral') {
      direction = 'bearish'
      conviction = 'medium'
    }
    if (assetInfo.category === 'macro_bullish' && direction === 'neutral') {
      direction = 'bullish'
      conviction = 'medium'
    }

    // Extract a quote snippet (the sentence containing the keyword)
    const originalText = text.slice(contextStart, contextEnd).trim()
    const sentences = originalText.split(/[.!?]+/)
    const relevantSentence = sentences.find((s) => s.toLowerCase().includes(keywordLower)) || ''
    const quote = relevantSentence.trim().slice(0, 150)

    signals.push({
      ticker: assetInfo.ticker,
      asset: assetInfo.asset,
      category: assetInfo.category,
      direction,
      conviction,
      quote: quote || null,
      source,
    })
  }

  return signals
}

// --- Main pipeline for a single source ---
async function processSource(source) {
  console.log(`\n--- ${source.label} ---`)
  const allVideos = []

  for (const channel of source.channels) {
    console.log(`  Searching ${channel.name}...`)
    const videos = await searchYouTube(channel.id, channel.name)

    // Filter by guest if needed (e.g., only Pomp episodes with Jordi)
    const filtered = channel.filterGuest
      ? videos.filter((v) =>
          v.title.toLowerCase().includes(channel.filterGuest.toLowerCase()) ||
          v.description.toLowerCase().includes(channel.filterGuest.toLowerCase())
        )
      : videos

    console.log(`  Found ${filtered.length} relevant videos`)
    allVideos.push(...filtered)
  }

  if (allVideos.length === 0) {
    console.log(`  No recent videos found for ${source.label}`)
    return []
  }

  // Take the most recent video only (for daily cron efficiency)
  const latest = allVideos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))[0]
  console.log(`  Latest: "${latest.title}" (${latest.publishedAt.split('T')[0]})`)
// Fetch full video details (search API truncates description)
  try {
    const detailUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${latest.videoId}&key=${YOUTUBE_API_KEY}`
    const detailResponse = await fetch(detailUrl)
    const detailData = await detailResponse.json()
    if (detailData.items && detailData.items[0]) {
      latest.description = detailData.items[0].snippet.description
      console.log(`  Got full description (${latest.description.length} chars)`)
    }
  } catch (e) {
    console.log(`  Could not fetch full description`)
  }
  // Fetch transcript
  console.log(`  Fetching transcript...`)
  const transcript = await fetchTranscript(latest.videoId, latest.title)

  if (transcript.text) {
    console.log(`  Transcript obtained from ${transcript.source} (${transcript.text.length} chars)`)
  } else {
    console.log(`  No transcript available — using title/description only`)
  }

  // Extract signals
  const textToAnalyze = transcript.text || `${latest.title} ${latest.description}`
  const signals = extractSignals(textToAnalyze, source.name, latest.title)
  console.log(`  Extracted ${signals.length} asset signals`)

  // Add video metadata to each signal
  return signals.map((s) => ({
    ...s,
    video_title: latest.title,
    video_url: latest.url,
    channel: latest.channelName,
    published_at: latest.publishedAt,
  }))
}

// --- Write to Supabase ---
async function writeToSupabase(allSignals) {
  const today = new Date().toISOString().split('T')[0]

  // Write individual signals to signals table
  for (const signal of allSignals) {
    await supabase.from('signals').insert({
      snapshot_date: today,
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
  console.log(`\nWritten ${allSignals.length} narrative signals to signals table`)

  // Format for daily_snapshots
  const narrativeData = allSignals.map((s) => ({
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

  // Update daily_snapshots
  const { data: existing } = await supabase
    .from('daily_snapshots')
    .select('id')
    .eq('snapshot_date', today)
    .single()

  if (existing) {
    const { error: updateError } = await supabase
      .from('daily_snapshots')
      .update({ narrative_signals: narrativeData })
      .eq('snapshot_date', today)

    if (updateError) {
      console.error('Error updating daily_snapshot:', updateError)
    } else {
      console.log('Updated daily_snapshot with narrative data')
    }
  } else {
    const { error: insertError } = await supabase
      .from('daily_snapshots')
      .insert({
        snapshot_date: today,
        narrative_signals: narrativeData,
      })

    if (insertError) {
      console.error('Error creating daily_snapshot:', insertError)
    } else {
      console.log('Created new daily_snapshot with narrative data')
    }
  }
}

// --- Main ---
async function main() {
  console.log('=== AlphaPlaybook: Narrative Pipeline (Play 1) ===')
  console.log(`Date: ${new Date().toISOString().split('T')[0]}`)

  try {
    const allSignals = []

    for (const source of SOURCES) {
      const signals = await processSource(source)
      allSignals.push(...signals)
    }

    if (allSignals.length === 0) {
      console.log('\nNo signals extracted from any source.')
      console.log('This can happen if no recent videos have transcripts available.')
      console.log('Signals will improve as the pipeline runs daily and catches new uploads.')
      return
    }

    // Summary
    console.log('\n=== Signal Summary ===')
    const bySource = {}
    for (const s of allSignals) {
      if (!bySource[s.source]) bySource[s.source] = []
      bySource[s.source].push(s)
    }
    for (const [src, signals] of Object.entries(bySource)) {
      console.log(`  ${src}: ${signals.length} signals`)
      for (const s of signals) {
        console.log(`    ${s.ticker} (${s.asset}) → ${s.direction} [${s.conviction}]`)
      }
    }

    // Write to Supabase
    await writeToSupabase(allSignals)

    console.log('\n✓ Narrative pipeline complete!')
  } catch (error) {
    console.error('Pipeline error:', error.message)
    process.exit(1)
  }
}

main()
