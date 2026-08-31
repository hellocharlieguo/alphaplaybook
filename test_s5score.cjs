// test_s5score.cjs — verify pull_candidates.cjs s5score() matches the v3.4 method.
// Extracts the function by source slice (no require, no exports needed).
//   cd ~/Desktop/alphaplaybook && node test_s5score.cjs
const fs = require('fs')
const src = fs.readFileSync('pull_candidates.cjs', 'utf8')

const a = src.indexOf('function s5score')
const b = src.indexOf('async function pull')
if (a === -1 || b === -1 || b < a) {
  console.error('could not locate s5score() — inspect the file manually'); process.exit(1)
}
if (/rsi\s*>=\s*70/.test(src.slice(a, b))) {
  console.error('FAIL: retired RSI term still present in s5score()'); process.exit(1)
}
eval(src.slice(a, b))

// [name, price, d50, d200, rsi, expected S5]   expected = base - rp*0.5, RSI excluded
const CASES = [
  ['ETHA', 18.61,   14.51,   17.41,   76.7, 54],  // was 39 with retired RSI term
  ['IBIT', 44.37,   37.25,   42.58,   72.1, 56],  // was 41
  ['PLTR', 186.19,  144.90,  151.35,  69.2, 54],  // was 47
  ['MSTR', 128.75,  100.56,  140.53,  63.8, 41],  // was 34
  ['SGOV', 100.69,  100.57,  100.53,  69.8, 58],  // was 51
  ['GLDM', 87.70,   83.34,   89.40,   52.9, 45],  // below 200-DMA
  ['SLV',  59.83,   55.63,   65.07,   53.7, 45],  // below 200-DMA
  ['LLY',  1156.75, 1188.00, 1060.62, 42.6, 72],  // below 50, above 200
  ['AIPO', 27.76,   30.24,   27.53,   37.5, 72],  // RSI<=35 boundary, no bonus now
  ['COPX', 92.48,   82.16,   80.17,   59.4, 56],  // above both, 12.6% stretch
  ['AMZN', 261.44,  252.00,  238.74,  51.4, 58],  // above both, low stretch
]

let fails = 0
for (const [n, p, d50, d200, rsi, exp] of CASES) {
  const got = s5score(p, d50, d200, rsi).s5
  if (got !== exp) { console.log(`FAIL ${n}: got ${got}, expected ${exp}`); fails++ }
  else console.log(`  ok  ${n.padEnd(5)} S5=${String(exp).padStart(2)}`)
}

const nd = s5score(163.31, null, null, 52.4)
if (nd.no_dma !== true || nd.s5 !== null) { console.log('FAIL SKHY null-guard'); fails++ }
else console.log('  ok  SKHY  null-guard (no_dma)')

// RSI must no longer move the result at all
const spread = new Set([10, 35, 50, 65, 75, 90].map(r => s5score(44.37, 37.25, 42.58, r).s5))
if (spread.size !== 1) { console.log('FAIL: S5 still varies with RSI:', [...spread]); fails++ }
else console.log('  ok  S5 invariant across RSI 10..90')

console.log(fails === 0 ? '\nSELF-TEST PASS' : `\nSELF-TEST FAIL (${fails})`)
process.exit(fails === 0 ? 0 : 1)
