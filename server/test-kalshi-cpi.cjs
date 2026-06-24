// Standalone validation harness for fetchKalshiCPI() before wiring into daily-cron.cjs.
// Mirrors the fetchFredCPI / fetchClevelandNowcast idioms (CommonJS async, UA header,
// returns a flat object or null, never throws).

const KALSHI_HOSTS = [
  'https://api.elections.kalshi.com/trade-api/v2', // verified-working (api.kalshi.com returns 000)
  'https://api.kalshi.com/trade-api/v2',           // forward-looking canonical, not yet live
];
const KALSHI_CPI_SERIES = 'KXCPIYOY'; // YoY CPI ladder ("Above X%"); MoM is KXCPI
const REGIME_THRESHOLD = 4.0;
const UA = 'Mozilla/5.0 (AlphaPlaybook cron)';

const MONTHS = { JAN:'01',FEB:'02',MAR:'03',APR:'04',MAY:'05',JUN:'06',
                 JUL:'07',AUG:'08',SEP:'09',OCT:'10',NOV:'11',DEC:'12' };

async function fetchKalshiCPI() {
  // Try canonical host, fall back to the verified one on network/HTTP failure.
  async function getJSON(path) {
    for (const host of KALSHI_HOSTS) {
      try {
        const res = await fetch(host + path, { headers: { 'User-Agent': UA } });
        if (!res.ok) { continue; }
        return { json: await res.json(), host };
      } catch (e) { /* try next host */ }
    }
    return null;
  }

  try {
    const got = await getJSON(
      `/events?series_ticker=${KALSHI_CPI_SERIES}&status=open&with_nested_markets=true`
    );
    if (!got) { console.warn('Kalshi CPI: all hosts failed — skipping.'); return null; }
    const events = (got.json && got.json.events) || [];
    if (!events.length) { console.warn('Kalshi CPI: no open events — skipping.'); return null; }

    // Front month = open event whose ladder closes earliest (the next BLS print).
    const eventClose = (e) => {
      const cts = (e.markets || []).map(m => m.close_time).filter(Boolean).sort();
      return cts[0] || '9999';
    };
    events.sort((a, b) => eventClose(a) < eventClose(b) ? -1 : 1);
    const ev = events[0];
    const markets = (ev.markets || []).filter(m => m.status === 'active' || m.status === 'open' || true);

    // Build the strike ladder: [{ strike, prob }] from "Above X%" cumulative markets.
    const px = (m) => {
      const last = parseFloat(m.last_price_dollars);
      if (!isNaN(last) && last > 0 && last < 1) return last;       // deep ladder: last is reliable
      const b = parseFloat(m.yes_bid_dollars), a = parseFloat(m.yes_ask_dollars);
      if (!isNaN(b) && !isNaN(a) && a > 0) return (b + a) / 2;     // fallback: mid
      return null;
    };
    const strikeOf = (m) => {
      if (typeof m.floor_strike === 'number') return m.floor_strike;
      const mt = String(m.yes_sub_title || '').match(/([\d.]+)/);
      return mt ? parseFloat(mt[1]) : null;
    };

    const ladder = [];
    let probAbove4 = null;
    for (const m of markets) {
      const s = strikeOf(m), p = px(m);
      if (s === null || p === null) continue;
      ladder.push({ strike: s, prob: p });
      if (Math.abs(s - REGIME_THRESHOLD) < 1e-9) probAbove4 = p;
    }
    if (ladder.length < 2) { console.warn('Kalshi CPI: ladder too sparse — skipping.'); return null; }

    // Median (point estimate) = where cumulative P(>strike) crosses 0.50.
    ladder.sort((x, y) => x.strike - y.strike);
    let pointEstimate = null;
    for (let i = 0; i < ladder.length - 1; i++) {
      const lo = ladder[i], hi = ladder[i + 1];
      if (lo.prob >= 0.5 && hi.prob < 0.5) {
        const frac = (lo.prob - 0.5) / (lo.prob - hi.prob); // 0..1 across the bracket
        pointEstimate = lo.strike + frac * (hi.strike - lo.strike);
        break;
      }
    }
    if (pointEstimate === null) {
      // No crossing: whole distribution sits above or below the ladder.
      pointEstimate = ladder[0].prob < 0.5 ? ladder[0].strike : ladder[ladder.length - 1].strike;
    }

    // data_month from event_ticker, e.g. KXCPIYOY-26JUN -> "2026-06"
    let data_month = null;
    const em = String(ev.event_ticker || '').match(/-(\d{2})([A-Z]{3})/);
    if (em) data_month = `20${em[1]}-${MONTHS[em[2]] || '01'}`;

    const out = {
      point_estimate: Math.round(pointEstimate * 100) / 100,
      prob_above_4: probAbove4 === null ? null : Math.round(probAbove4 * 100) / 100,
      data_month,
      event_ticker: ev.event_ticker || null,
      close_time: eventClose(ev),
      as_of: new Date().toISOString().slice(0, 10),
      source: 'Kalshi',
    };
    console.log(`Kalshi CPI: ${out.point_estimate}% YoY pt-est · P(>4%)=${out.prob_above_4} · ` +
                `${out.data_month} · ${out.event_ticker} · via ${got.host}`);
    return out;
  } catch (e) {
    console.warn(`Kalshi CPI: fetch error — ${e.message} — skipping.`);
    return null;
  }
}

(async () => {
  const r = await fetchKalshiCPI();
  console.log('\nRETURN OBJECT:\n', JSON.stringify(r, null, 2));
})();
