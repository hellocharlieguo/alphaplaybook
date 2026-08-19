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
    untracked: Object.values(files).filter((f) => f.exists && !f.tracked).length,
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

  console.log(`\nwrote ${path.relative(REPO, OUT)}  @ ${commit}`)
  console.log(`  declared   ${summary.declared}`)
  console.log(`  missing    ${summary.missing}${missing.length ? '  → ' + missing.join(', ') : ''}`)
  console.log(`  untracked  ${summary.untracked}`)
  console.log(`  modified   ${summary.modified}`)
  console.log(`  undeclared ${summary.undeclared}${undeclared.length ? '  → ' + undeclared.slice(0, 6).join(', ') + (undeclared.length > 6 ? ' …' : '') : ''}`)
  console.log(`\n  source files    ${G.files.length}${G.entry ? '  (entry ' + G.entry + ')' : ''}`)
  console.log(`  orphaned src    ${orphanedSource.length}${orphanedSource.length ? '  → ' + orphanedSource.join(', ') : ''}`)
  console.log(`  undeclared src  ${undeclaredSource.length}${undeclaredSource.length ? '  → ' + undeclaredSource.join(', ') : ''}`)
  console.log('\ncommit the generated file so the deployed tab matches this snapshot.\n')
}

main()
