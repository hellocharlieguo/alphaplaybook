// server/crowd-pipeline.cjs
// Play 2: Fetches macro prediction markets from Polymarket's Gamma API,
// maps probabilities to asset class implications, and writes to Supabase.

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// --- Config ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing required environment variables. Check .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// --- Macro market search terms ---
// Broad enough to catch relevant markets, specific enough to filter noise
const SEARCH_TERMS = [
  // Monetary policy
  'Federal Reserve',
  'Fed funds rate',
  'interest rate cut',
  'interest rate hike',
  // Economy
  'recession',
  'inflation',
  'CPI',
  'GDP',
  'unemployment',
  // Trade
  'tariff',
  'trade war',
  'trade deal',
  // Asset prices
  'Bitcoin price',
  'BTC price',
  'oil price',
  'crude oil',
  'gold price',
  'S&P 500',
  // Geopolitical / conflict
  'war',
  'military',
  'conflict',
  'invasion',
  'ceasefire',
  'NATO',
  'nuclear',
  'sanctions',
  'Iran',
  'China Taiwan',
  'Russia Ukraine',
  'Israel',
  'North Korea',
]

// --- Asset mapping rules ---
// YOUR investment logic: what does each market outcome imply for assets?
function mapMarketToAssets(question, probability) {
  const q = question.toLowerCase()

  // ========== MONETARY POLICY ==========

  // Fed rate cuts
  if ((q.includes('fed') || q.includes('federal reserve')) && (q.includes('cut') || q.includes('lower') || q.includes('decrease'))) {
    if (probability > 0.70) {
      return { direction: 'bullish', mapped_assets: ['GLDM', 'TLT', 'XSD'], conviction: 'high' }
    } else if (probability > 0.50) {
      return { direction: 'bullish', mapped_assets: ['GLDM', 'TLT'], conviction: 'medium' }
    }
    return { direction: 'neutral', mapped_assets: ['SGOV'], conviction: 'low' }
  }

  // Fed rate hikes
  if ((q.includes('fed') || q.includes('federal reserve')) && (q.includes('hike') || q.includes('raise') || q.includes('increase'))) {
    if (probability > 0.50) {
      return { direction: 'bearish', mapped_assets: ['TLT', 'XSD', 'GLDM'], conviction: 'medium' }
    }
    return { direction: 'neutral', mapped_assets: ['SGOV'], conviction: 'low' }
  }

  // General Fed / interest rate
  if (q.includes('fed funds') || q.includes('federal reserve') || q.includes('fomc')) {
    return { direction: 'neutral', mapped_assets: ['SGOV', 'TLT'], conviction: 'low' }
  }

  // ========== ECONOMY ==========

  // Recession
  if (q.includes('recession')) {
    if (probability > 0.50) {
      return { direction: 'bearish', mapped_assets: ['SPY', 'XSD', 'COPX'], conviction: 'high' }
    } else if (probability > 0.35) {
      return { direction: 'neutral', mapped_assets: ['SGOV', 'GLDM'], conviction: 'medium' }
    }
    return { direction: 'bullish', mapped_assets: ['SPY', 'XSD', 'COPX'], conviction: 'medium' }
  }

  // Inflation / CPI
  if (q.includes('inflation') || q.includes('cpi')) {
    if (q.includes('above') || q.includes('over') || q.includes('high') || q.includes('rise')) {
      if (probability > 0.60) {
        return { direction: 'bullish', mapped_assets: ['GLDM', 'COPX', 'XLE', 'IBIT'], conviction: 'medium' }
      }
    }
    if (q.includes('below') || q.includes('under') || q.includes('fall') || q.includes('drop')) {
      if (probability > 0.60) {
        return { direction: 'bullish', mapped_assets: ['TLT', 'XSD', 'SPY'], conviction: 'medium' }
      }
    }
    return { direction: 'neutral', mapped_assets: ['SGOV'], conviction: 'low' }
  }

  // GDP
  if (q.includes('gdp')) {
    if (q.includes('negative') || q.includes('contraction') || q.includes('decline')) {
      if (probability > 0.40) {
        return { direction: 'bearish', mapped_assets: ['SPY', 'COPX', 'XSD'], conviction: 'medium' }
      }
    }
    if (q.includes('growth') || q.includes('positive') || q.includes('expand')) {
      if (probability > 0.60) {
        return { direction: 'bullish', mapped_assets: ['SPY', 'XSD', 'COPX'], conviction: 'medium' }
      }
    }
    return { direction: 'neutral', mapped_assets: ['SPY'], conviction: 'low' }
  }

  // Unemployment
  if (q.includes('unemployment') || q.includes('jobless') || q.includes('nonfarm') || q.includes('jobs report')) {
    if (q.includes('above') || q.includes('rise') || q.includes('increase') || q.includes('higher')) {
      if (probability > 0.50) {
        return { direction: 'bearish', mapped_assets: ['SPY', 'XSD'], conviction: 'medium' }
      }
    }
    if (q.includes('below') || q.includes('fall') || q.includes('decrease') || q.includes('lower')) {
      if (probability > 0.50) {
        return { direction: 'bullish', mapped_assets: ['SPY', 'XSD'], conviction: 'medium' }
      }
    }
    return { direction: 'neutral', mapped_assets: ['SPY'], conviction: 'low' }
  }

  // ========== TRADE / TARIFFS ==========

  if (q.includes('tariff') || q.includes('trade war') || q.includes('trade deal') || q.includes('trade agreement')) {
    if (q.includes('increase') || q.includes('impose') || q.includes('raise') || q.includes('new tariff') || q.includes('trade war')) {
      if (probability > 0.50) {
        return { direction: 'bearish', mapped_assets: ['VEA', 'SPY', 'COPX'], conviction: 'medium' }
      }
    }
    if (q.includes('deal') || q.includes('agreement') || q.includes('remove') || q.includes('reduce')) {
      if (probability > 0.50) {
        return { direction: 'bullish', mapped_assets: ['VEA', 'SPY', 'COPX'], conviction: 'medium' }
      }
    }
    return { direction: 'neutral', mapped_assets: ['SPY', 'VEA'], conviction: 'low' }
  }

  // ========== ASSET PRICES ==========

  // Bitcoin / BTC
  if (q.includes('bitcoin') || q.includes('btc')) {
    if (q.includes('above') || q.includes('over') || q.includes('all-time high') || q.includes('ath')) {
      if (probability > 0.60) {
        return { direction: 'bullish', mapped_assets: ['IBIT'], conviction: 'high' }
      } else if (probability > 0.40) {
        return { direction: 'bullish', mapped_assets: ['IBIT'], conviction: 'medium' }
      }
    }
    if (q.includes('below') || q.includes('under') || q.includes('crash') || q.includes('drop')) {
      if (probability > 0.50) {
        return { direction: 'bearish', mapped_assets: ['IBIT'], conviction: 'medium' }
      }
    }
    return { direction: 'neutral', mapped_assets: ['IBIT'], conviction: 'low' }
  }

  // Oil / crude
  if (q.includes('oil') || q.includes('crude') || q.includes('wti') || q.includes('brent')) {
    if (q.includes('above') || q.includes('over') || q.includes('rise') || q.includes('spike')) {
      if (probability > 0.50) {
        return { direction: 'bullish', mapped_assets: ['XLE'], conviction: 'medium' }
      }
    }
    if (q.includes('below') || q.includes('under') || q.includes('drop') || q.includes('fall')) {
      if (probability > 0.50) {
        return { direction: 'bearish', mapped_assets: ['XLE'], conviction: 'medium' }
      }
    }
    return { direction: 'neutral', mapped_assets: ['XLE'], conviction: 'low' }
  }

  // Gold
  if (q.includes('gold') || q.includes('xau')) {
    if (q.includes('above') || q.includes('over') || q.includes('all-time high') || q.includes('rise')) {
      if (probability > 0.50) {
        return { direction: 'bullish', mapped_assets: ['GLDM'], conviction: 'medium' }
      }
    }
    if (q.includes('below') || q.includes('under') || q.includes('drop') || q.includes('fall')) {
      if (probability > 0.50) {
        return { direction: 'bearish', mapped_assets: ['GLDM'], conviction: 'medium' }
      }
    }
    return { direction: 'neutral', mapped_assets: ['GLDM'], conviction: 'low' }
  }

  // S&P 500
  if (q.includes('s&p') || q.includes('s&p 500') || q.includes('spy')) {
    if (q.includes('above') || q.includes('over') || q.includes('all-time high')) {
      if (probability > 0.60) {
        return { direction: 'bullish', mapped_assets: ['SPY', 'QQQ', 'XSD'], conviction: 'medium' }
      }
    }
    if (q.includes('below') || q.includes('crash') || q.includes('drop') || q.includes('bear market')) {
      if (probability > 0.40) {
        return { direction: 'bearish', mapped_assets: ['SPY', 'QQQ'], conviction: 'medium' }
      }
    }
    return { direction: 'neutral', mapped_assets: ['SPY'], conviction: 'low' }
  }

  // ========== GEOPOLITICAL / WAR / CONFLICT ==========

  // Russia-Ukraine
  if (q.includes('russia') || q.includes('ukraine') || q.includes('putin') || q.includes('zelensky')) {
    if (q.includes('ceasefire') || q.includes('peace') || q.includes('deal') || q.includes('end')) {
      if (probability > 0.50) {
        return { direction: 'bullish', mapped_assets: ['VEA', 'SPY'], conviction: 'medium' }
      }
      return { direction: 'neutral', mapped_assets: ['XLE', 'GLDM'], conviction: 'low' }
    }
    if (q.includes('escalat') || q.includes('nuclear') || q.includes('nato') || q.includes('expand')) {
      if (probability > 0.30) {
        return { direction: 'bullish', mapped_assets: ['GLDM', 'XLE', 'SGOV'], conviction: 'high' }
      }
    }
    return { direction: 'neutral', mapped_assets: ['GLDM', 'XLE'], conviction: 'low' }
  }

  // China-Taiwan
  if (q.includes('china') && (q.includes('taiwan') || q.includes('invasion') || q.includes('military'))) {
    if (probability > 0.20) {
      return { direction: 'bearish', mapped_assets: ['XSD', 'VEA', 'SPY'], conviction: 'high' }
    }
    return { direction: 'neutral', mapped_assets: ['XSD', 'GLDM'], conviction: 'low' }
  }

  // Iran
  if (q.includes('iran') && (q.includes('war') || q.includes('strike') || q.includes('attack') || q.includes('nuclear') || q.includes('military'))) {
    if (probability > 0.30) {
      return { direction: 'bullish', mapped_assets: ['XLE', 'GLDM'], conviction: 'high' }
    }
    return { direction: 'neutral', mapped_assets: ['XLE', 'GLDM'], conviction: 'low' }
  }

  // Israel / Middle East
  if (q.includes('israel') || q.includes('gaza') || q.includes('hamas') || q.includes('hezbollah') || q.includes('middle east')) {
    if (q.includes('ceasefire') || q.includes('peace') || q.includes('deal')) {
      if (probability > 0.50) {
        return { direction: 'bearish', mapped_assets: ['XLE', 'GLDM'], conviction: 'low' }
      }
    }
    if (q.includes('escalat') || q.includes('war') || q.includes('invasion') || q.includes('expand')) {
      if (probability > 0.30) {
        return { direction: 'bullish', mapped_assets: ['XLE', 'GLDM', 'SGOV'], conviction: 'high' }
      }
    }
    return { direction: 'neutral', mapped_assets: ['XLE', 'GLDM'], conviction: 'low' }
  }

  // North Korea
  if (q.includes('north korea') || q.includes('kim jong') || q.includes('pyongyang')) {
    if (q.includes('nuclear') || q.includes('missile') || q.includes('test') || q.includes('launch')) {
      if (probability > 0.30) {
        return { direction: 'bullish', mapped_assets: ['GLDM', 'SGOV'], conviction: 'medium' }
      }
    }
    return { direction: 'neutral', mapped_assets: ['GLDM'], conviction: 'low' }
  }

  // General war / conflict / military (catch-all for any conflict market)
  if (q.includes('war') || q.includes('military') || q.includes('conflict') || q.includes('invasion') || q.includes('attack')) {
    if (q.includes('ceasefire') || q.includes('peace') || q.includes('end') || q.includes('withdraw')) {
      if (probability > 0.50) {
        return { direction: 'bullish', mapped_assets: ['VEA', 'SPY'], conviction: 'medium' }
      }
    }
    if (probability > 0.30) {
      return { direction: 'bullish', mapped_assets: ['GLDM', 'XLE', 'SGOV'], conviction: 'medium' }
    }
    return { direction: 'neutral', mapped_assets: ['GLDM', 'XLE'], conviction: 'low' }
  }

  // Sanctions
  if (q.includes('sanction')) {
    if (probability > 0.50) {
      return { direction: 'neutral', mapped_assets: ['XLE', 'GLDM', 'COPX'], conviction: 'medium' }
    }
    return { direction: 'neutral', mapped_assets: ['SPY'], conviction: 'low' }
  }

  // NATO
  if (q.includes('nato')) {
    return { direction: 'neutral', mapped_assets: ['VEA', 'GLDM'], conviction: 'low' }
  }

  // ========== DEFAULT ==========
  // If nothing matches, skip this market (don't pollute with noise)
  return null
}

// --- Fetch markets from Polymarket Gamma API ---
async function fetchPolymarketData() {
  console.log('Fetching macro prediction markets from Polymarket...')

  const allMarkets = []

  for (const term of SEARCH_TERMS) {
    try {
      const url = `https://gamma-api.polymarket.com/events?closed=false&limit=10&title=${encodeURIComponent(term)}`
      const response = await fetch(url)

      if (!response.ok) {
        console.warn(`  Warning: Failed to fetch "${term}" (${response.status})`)
        continue
      }

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
              volume: volume,
              event_slug: event.slug,
            })
          }
        }
      }
    } catch (error) {
      console.warn(`  Warning: Error fetching "${term}":`, error.message)
    }
  }

  // Deduplicate by question
  const seen = new Set()
  const unique = allMarkets.filter((m) => {
    if (seen.has(m.question)) return false
    seen.add(m.question)
    return true
  })

  // Sort by volume (highest first)
  unique.sort((a, b) => b.volume - a.volume)

  console.log(`Found ${unique.length} unique macro markets.`)
  return unique
}

// --- Process markets and map to assets ---
function processMarkets(markets) {
  const results = []

  for (const market of markets) {
    const mapping = mapMarketToAssets(market.question, market.probability)

    // Skip markets that don't match any mapping rule
    if (mapping === null) {
      continue
    }

    results.push({
      market: market.question,
      probability: market.probability,
      volume: market.volume,
      direction: mapping.direction,
      mapped_assets: mapping.mapped_assets,
      conviction: mapping.conviction,
    })

    const probPct = (market.probability * 100).toFixed(0)
    console.log(`  ${market.question}`)
    console.log(`    ${probPct}% → ${mapping.direction} ${mapping.mapped_assets.join(', ')}`)
  }

  return results
}

// --- Write to Supabase ---
async function writeToSupabase(signals) {
  const today = new Date().toISOString().split('T')[0]

  // Write individual signals to signals table
  for (const signal of signals) {
    await supabase.from('signals').insert({
      snapshot_date: today,
      source: 'crowd',
      market_question: signal.market,
      probability: signal.probability,
      direction: signal.direction,
      mapped_tickers: signal.mapped_assets,
      conviction: signal.conviction,
      raw_data: signal,
    })
  }
  console.log(`Written ${signals.length} crowd signals to signals table`)

  // Update daily_snapshots with polymarket data
  const polymarketData = signals.map((s) => ({
    market: s.market,
    probability: s.probability,
    direction: s.direction,
    mapped_assets: s.mapped_assets,
    conviction: s.conviction,
  }))

  const { data: existing } = await supabase
    .from('daily_snapshots')
    .select('id')
    .eq('snapshot_date', today)
    .single()

  if (existing) {
    const { error: updateError } = await supabase
      .from('daily_snapshots')
      .update({ polymarket_signals: polymarketData })
      .eq('snapshot_date', today)

    if (updateError) {
      console.error('Error updating daily_snapshot:', updateError)
    } else {
      console.log('Updated daily_snapshot with Polymarket data')
    }
  } else {
    const { error: insertError } = await supabase
      .from('daily_snapshots')
      .insert({
        snapshot_date: today,
        polymarket_signals: polymarketData,
      })

    if (insertError) {
      console.error('Error creating daily_snapshot:', insertError)
    } else {
      console.log('Created new daily_snapshot with Polymarket data')
    }
  }
}

// --- Main ---
async function main() {
  console.log('=== AlphaPlaybook: Crowd Pipeline (Play 2) ===')
  console.log(`Date: ${new Date().toISOString().split('T')[0]}`)
  console.log('')

  try {
    // 1. Fetch markets
    const markets = await fetchPolymarketData()

    if (markets.length === 0) {
      console.log('No relevant macro markets found. Skipping.')
      return
    }

    console.log('')

    // 2. Process and map to assets
    const signals = processMarkets(markets)

    if (signals.length === 0) {
      console.log('No markets matched mapping rules. Skipping write.')
      return
    }

    console.log('')

    // 3. Write to Supabase
    await writeToSupabase(signals)

    console.log('')
    console.log('✓ Crowd pipeline complete!')
  } catch (error) {
    console.error('Pipeline error:', error.message)
    process.exit(1)
  }
}

main()
