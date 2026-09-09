#!/usr/bin/env node
/**
 * build_file_map.cjs — Tier C.
 *
 * Derives repo STATE for every path declared in src/data/systemMap.ts and
 * writes src/data/fileStatus.ts. systemMap.ts keeps the MEANING (which stage a
 * file serves, its role, and the judgment flags stale/orphan/proposed); this
 * script never guesses at those.
 *
 * LOCAL ONLY. Vercel builds from a fresh shallow clone: git status is always
 * clean there and untracked files are not in the checkout at all, so an
 * untracked file would read as "missing". Run it here, commit the output.
 *
 *   node build_file_map.cjs        (or: npm run map)
 *
 * Emits .ts rather than .json deliberately — no resolveJsonModule dependency,
 * and the shape is typed at the boundary.
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const REPO = __dirname
const SOURCE = path.join(REPO, 'src/data/systemMap.ts')
const OUT = path.join(REPO, 'src/data/fileStatus.ts')

const sh = (cmd) => {
  try { return execSync(cmd, { cwd: REPO, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }) }
  catch { return '' }
}

// ---------------------------------------------------------------- declared

function readDeclared() {
  if (!fs.existsSync(SOURCE)) fail(`not found: ${SOURCE}`)
  const src = fs.readFileSync(SOURCE, 'utf8')

  // Each SysFile literal. Constraint: declared paths must be single-quoted.
  const objects = src.match(/\{[^{}]*\bpath:\s*'[^']+'[^{}]*\}/g) || []
  const declared = []
  const seen = new Set()

  for (const o of objects) {
    const p = (o.match(/path:\s*'([^']+)'/) || [])[1]
    if (!p || seen.has(p)) continue
    seen.add(p)
    const kind = (o.match(/kind:\s*'([^']+)'/) || [])[1] || 'file'
    declared.push({ path: p, kind })
  }

  // Fail loudly rather than emitting an empty map.
  if (!declared.length) {
    fail('parsed 0 declared paths from systemMap.ts — check that paths are single-quoted string literals')
  }
  return declared
}

// ---------------------------------------------------------------- git state

function gitState() {
  const tracked = new Set(sh('git ls-files').split('\n').filter(Boolean))

  const dirty = new Set()
  const untrackedInRepo = new Set()
  // -uall: list untracked files individually. Without it git collapses a
  // directory to 'src/components/', which slips past the .bak filter below.
  for (const line of sh('git status --porcelain -uall').split('\n').filter(Boolean)) {
    const code = line.slice(0, 2)
    const p = line.slice(3).replace(/^"|"$/g, '').trim()
    if (code === '??') untrackedInRepo.add(p)
    else dirty.add(p)
  }

  const commit = sh('git rev-parse --short HEAD').trim()
  return { tracked, dirty, untrackedInRepo, commit }
}

// Deliberately gitignored (.env.local, generated output) is NOT the same as
// never-added. Batch one check-ignore rather than a call per path.
function ignoredSet(paths) {
  if (!paths.length) return new Set()
  const parse = (out) => new Set(String(out || '').split('\n').map((x) => x.trim()).filter(Boolean))
  try {
    return parse(execSync('git check-ignore --stdin', {
      cwd: REPO, input: paths.join('\n'), encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'],
    }))
  } catch (e) {
    // exit 1 means "none matched" but stdout still holds any that did
    return parse(e.stdout)
  }
}

function lastCommitFor(p) {
  const out = sh(`git log -1 --format=%cs%x1f%s -- "${p}"`).trim()
  if (!out) return {}
  const [date, message] = out.split('\x1f')
  return { lastCommit: date, lastMessage: (message || '').slice(0, 120) }
}

// ---------------------------------------------------------------- import graph

const SRC = path.join(REPO, 'src')
const EXTS = ['', '.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.js']
const IMPORT_RE = /(?:\bfrom|\bimport|\brequire)\s*\(?\s*['"]([^'"]+)['"]/g

function walkSrc(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const name of fs.readdirSync(dir)) {
    const abs = path.join(dir, name)
    const st = fs.statSync(abs)
    if (st.isDirectory()) { walkSrc(abs, out); continue }
    if (!/\.(tsx?|jsx?)$/.test(name)) continue
    if (/\.bak(\.|$)/.test(name)) continue           // backups are not source
    out.push(abs)
  }
  return out
}

const rel = (abs) => path.relative(REPO, abs).split(path.sep).join('/')

function resolveSpec(fromAbs, spec) {
  if (!spec.startsWith('.')) return null              // bare package import
  const base = path.resolve(path.dirname(fromAbs), spec)
  for (const ext of EXTS) {
    const cand = base + ext
    try { if (fs.statSync(cand).isFile()) return cand } catch { /* next */ }
  }
  return null
}

function buildGraph() {
  const files = walkSrc(SRC)
  const imports = {}      // rel -> [rel]
  const importedBy = {}   // rel -> [rel]

  for (const abs of files) {
    const r = rel(abs)
    imports[r] = imports[r] || []
    importedBy[r] = importedBy[r] || []
  }
  for (const abs of files) {
    const r = rel(abs)
    const text = fs.readFileSync(abs, 'utf8')
    const seen = new Set()
    let m
    IMPORT_RE.lastIndex = 0
    while ((m = IMPORT_RE.exec(text)) !== null) {
      const target = resolveSpec(abs, m[1])
      if (!target) continue
      const t = rel(target)
      if (t === r || seen.has(t)) continue
      seen.add(t)
      imports[r].push(t)
      ;(importedBy[t] = importedBy[t] || []).push(r)
    }
  }

  // reachability from the Vite entry point
  const entry = ['src/main.tsx', 'src/main.ts', 'src/index.tsx', 'src/index.ts']
    .find((e) => fs.existsSync(path.join(REPO, e)))
  const reachable = new Set()
  if (entry) {
    const queue = [entry]
    while (queue.length) {
      const cur = queue.shift()
      if (reachable.has(cur)) continue
      reachable.add(cur)
      for (const next of imports[cur] || []) queue.push(next)
    }
  }
  return { files: files.map(rel), imports, importedBy, reachable, entry }
}

// ---------------------------------------------------------------- book snapshot

// BASE_PORTFOLIO in server/daily-cron.cjs is the authority for holdings,
// weights and PORTFOLIO_VERSION. Extracted here so the System tab never keeps
// its own copy — that duplicate surface is what made systemMap.ts go stale.
const CRON = path.join(REPO, 'server/daily-cron.cjs')
const BOOK_OUT = path.join(REPO, 'src/data/bookSnapshot.ts')

// \s+ not a single space: sub-10 weights are padded to align the column
const HOLDING_RE = /(\w+):\s*\{\s*base_weight:\s+([\d.]+),\s*theme:\s*'([^']+)',\s*min_weight:\s+([\d.]+),\s*action:\s*'([^']+)'/g

function buildBook() {
  if (!fs.existsSync(CRON)) return null
  const src = fs.readFileSync(CRON, 'utf8')

  const start = src.indexOf('const BASE_PORTFOLIO')
  if (start === -1) fail('BASE_PORTFOLIO not found in server/daily-cron.cjs')
  const end = src.indexOf('\n}', start)
  const blockText = src.slice(start, end)

  const holdings = []
  let m
  HOLDING_RE.lastIndex = 0
  while ((m = HOLDING_RE.exec(blockText)) !== null) {
    holdings.push({
      ticker: m[1], weight: parseFloat(m[2]), theme: m[3],
      minWeight: parseFloat(m[4]), action: m[5],
    })
  }
  if (!holdings.length) fail('parsed 0 holdings from BASE_PORTFOLIO — check the literal format')

  const version = (src.match(/const PORTFOLIO_VERSION\s*=\s*'([^']+)'/) || [])[1]
  if (!version) fail('PORTFOLIO_VERSION not found')

  const sleeveMap = {}
  for (const h of holdings) sleeveMap[h.theme] = (sleeveMap[h.theme] || 0) + h.weight
  const sleeves = Object.entries(sleeveMap)
    .map(([name, weight]) => ({ name, weight: Math.round(weight * 10) / 10 }))
    .sort((a, b) => b.weight - a.weight)

  const total = Math.round(holdings.reduce((a, h) => a + h.weight, 0) * 10) / 10
  return { holdings, sleeves, version, total, count: holdings.length }
}

function writeBook(book) {
  if (!book) return
  fs.writeFileSync(BOOK_OUT, `// GENERATED by build_file_map.cjs — do not edit by hand.
// Extracted from BASE_PORTFOLIO + PORTFOLIO_VERSION in server/daily-cron.cjs,
// which is the authority. Regenerate with: npm run map

export interface Holding {
  ticker: string
  weight: number
  theme: string
  minWeight: number
  action: string
}

export interface Sleeve { name: string; weight: number }

export const BOOK = {
  version: ${JSON.stringify(book.version)},
  count: ${book.count},
  total: ${book.total},
  generatedAt: ${JSON.stringify(new Date().toISOString())},
  sleeves: ${JSON.stringify(book.sleeves, null, 2)} as Sleeve[],
  holdings: ${JSON.stringify(book.holdings, null, 2)} as Holding[],
}
`)
}

// ---------------------------------------------------------------- build

function fail(msg) {
  console.error(`\nABORT: ${msg}\n`)
  process.exit(1)
}

function main() {
  if (!fs.existsSync(path.join(REPO, '.git'))) fail('not a git repo — run from the repo root')

  const declared = readDeclared()
  const { tracked, dirty, untrackedInRepo, commit } = gitState()
  const G = buildGraph()
  const ignored = ignoredSet(declared.filter((d) => d.kind !== 'table').map((d) => d.path))
  if (!G.entry) console.warn('  warn: no src/main.tsx entry found — reachability skipped')

  const files = {}
  const missing = []

  for (const { path: p, kind } of declared) {
    if (kind === 'table') {
      // Supabase table, not a path. Nothing on disk to check.
      files[p] = { exists: false, tracked: false, dirty: false, kind: 'table' }
      continue
    }

    const abs = path.join(REPO, p)
    const exists = fs.existsSync(abs)
    const rec = {
      exists,
      tracked: tracked.has(p),
      dirty: dirty.has(p),
      ignored: ignored.has(p),
      kind,
    }

    if (exists) {
      const st = fs.statSync(abs)
      if (kind === 'dir' || st.isDirectory()) {
        rec.kind = 'dir'
        try { rec.childCount = fs.readdirSync(abs).length } catch { /* unreadable */ }
      } else {
        rec.sizeBytes = st.size
        rec.mtime = st.mtime.toISOString().slice(0, 10)
      }
      // A directory is "tracked" if git knows any child.
      if (rec.kind === 'dir' && !rec.tracked) {
        rec.tracked = [...tracked].some((t) => t.startsWith(p.replace(/\/$/, '') + '/'))
      }
    } else {
      missing.push(p)
    }

    // import-graph facts, source files only
    if (G.imports[p]) {
      rec.imports = G.imports[p].length
      rec.importedBy = G.importedBy[p] || []
      rec.reachable = G.reachable.has(p)
    }

    Object.assign(rec, lastCommitFor(p))
    files[p] = rec
  }

  // Drift in the other direction: in the repo, absent from the map.
  const declaredSet = new Set(declared.map((d) => d.path))
  const undeclared = [...untrackedInRepo]
    .filter((p) => !declaredSet.has(p))
    .filter((p) => !/\.bak(\.|$)/.test(p))
    .sort()

  // source files that exist but nothing reaches from the entry point
  const orphanedSource = G.files
    .filter((f) => !G.reachable.has(f))
    .sort()
  // source files reachable at runtime that the map has never heard of
  const undeclaredSource = G.files
    .filter((f) => G.reachable.has(f) && !declared.some((d) => d.path === f))
    .sort()

  const summary = {
    declared: declared.length,
    missing: missing.length,
    untracked: Object.values(files).filter((f) => f.exists && !f.tracked && !f.ignored).length,
    ignored: Object.values(files).filter((f) => f.ignored).length,
    modified: Object.values(files).filter((f) => f.dirty).length,
    undeclared: undeclared.length,
    orphanedSource: orphanedSource.length,
    undeclaredSource: undeclaredSource.length,
  }

  const body = `// GENERATED by build_file_map.cjs — do not edit by hand.
// Regenerate with:  npm run map
//
// State only. Meaning (stage mapping, roles, stale/orphan/proposed judgments)
// lives in systemMap.ts and is never derived here.

export interface FileState {
  exists: boolean
  tracked: boolean
  dirty: boolean
  /** matched by .gitignore — excluded on purpose, not by neglect */
  ignored?: boolean
  kind?: string
  sizeBytes?: number
  mtime?: string
  childCount?: number
  lastCommit?: string
  lastMessage?: string
  /** source files only — count of modules this one imports */
  imports?: number
  /** source files only — modules that import this one */
  importedBy?: string[]
  /** source files only — reachable from the Vite entry point */
  reachable?: boolean
}

export const MAP_META = ${JSON.stringify({ generatedAt: new Date().toISOString(), commit, ...summary }, null, 2)} as const

export const FILE_STATUS: Record<string, FileState> = ${JSON.stringify(files, null, 2)}

export const DECLARED_BUT_MISSING: string[] = ${JSON.stringify(missing, null, 2)}

export const UNDECLARED_UNTRACKED: string[] = ${JSON.stringify(undeclared, null, 2)}

/** exists under src/ but nothing reaches it from the entry point — dead code */
export const ORPHANED_SOURCE: string[] = ${JSON.stringify(orphanedSource, null, 2)}

/** reachable at runtime but absent from systemMap.ts — the map has a blind spot */
export const UNDECLARED_SOURCE: string[] = ${JSON.stringify(undeclaredSource, null, 2)}
`

  fs.writeFileSync(OUT, body)

  const book = buildBook()
  writeBook(book)

  console.log(`\nwrote ${path.relative(REPO, OUT)}  @ ${commit}`)
  console.log(`  declared   ${summary.declared}`)
  console.log(`  missing    ${summary.missing}${missing.length ? '  → ' + missing.join(', ') : ''}`)
  console.log(`  untracked  ${summary.untracked}`)
  console.log(`  ignored    ${summary.ignored}  (gitignored by design)`)
  console.log(`  modified   ${summary.modified}`)
  console.log(`  undeclared ${summary.undeclared}${undeclared.length ? '  → ' + undeclared.slice(0, 6).join(', ') + (undeclared.length > 6 ? ' …' : '') : ''}`)
  console.log(`\n  source files    ${G.files.length}${G.entry ? '  (entry ' + G.entry + ')' : ''}`)
  console.log(`  orphaned src    ${orphanedSource.length}${orphanedSource.length ? '  → ' + orphanedSource.join(', ') : ''}`)
  console.log(`  undeclared src  ${undeclaredSource.length}${undeclaredSource.length ? '  → ' + undeclaredSource.join(', ') : ''}`)
  if (book) {
    console.log(`\n  book            ${book.count} holdings @ ${book.version}`)
    console.log(`  sleeves         ${book.sleeves.map((x) => x.name + ' ' + x.weight).join(' · ')}`)
    if (Math.abs(book.total - 100) > 0.05) console.log(`  WARNING         weights sum to ${book.total}, not 100`)
    console.log('  wrote           src/data/bookSnapshot.ts')
  }

  console.log('\ncommit the generated files so the deployed tab matches this snapshot.\n')
}

main()
