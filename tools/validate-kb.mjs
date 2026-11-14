import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(process.cwd(), 'src/data/raw')
const REQUIRED = [
  'entry_id',
  'entry_no',
  'entry_type',
  'title',
  'subtitle',
  'region',
  'coordinates',
  'summary',
  'claims',
  'sources',
  'traceability',
  'notes',
]

const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.json'))
let all = []
let problems = 0
const ids = new Set()

const warn = (m) => {
  problems++
  console.log(`  ✗ ${m}`)
}

const batchOf = (f) => (/batch([ABC])/i.exec(f)?.[1] || '?').toUpperCase()

for (const f of files) {
  const p = path.join(ROOT, f)
  let data
  try {
    data = JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''))
  } catch (e) {
    console.log(`\n${f}: JSON 解析失败 — ${e.message}`)
    problems++
    continue
  }
  if (!Array.isArray(data)) {
    console.log(`\n${f}: 顶层不是数组`)
    problems++
    continue
  }
  const batch = batchOf(f)
  console.log(`\n${f}: ${data.length} 条`)
  for (const e of data) {
    if (typeof e.entry_no !== 'string') {
      e.entry_no = `${batch}${e.entry_no}`
      console.log(`  · ${f} entry_no 归一为 ${e.entry_no}`)
    }
    const tag = `${e.entry_no || '?'} ${e.entry_id || '?'}`
    for (const k of REQUIRED) if (e[k] === undefined) warn(`${tag} 缺字段 ${k}`)
    if (ids.has(e.entry_id)) warn(`${tag} entry_id 重复`)
    ids.add(e.entry_id)

    const srcIds = new Set((e.sources || []).map((s) => s.id))
    if (srcIds.size < 2) warn(`${tag} 来源少于 2 条`)
    for (const s of e.sources || []) {
      if (!/^https?:\/\//.test(s.url || '')) warn(`${tag} 来源 ${s.id} 无有效 url`)
      if (!s.excerpt) warn(`${tag} 来源 ${s.id} 缺 excerpt`)
      if (!['A', 'B', 'C'].includes(s.tier)) warn(`${tag} 来源 ${s.id} tier 非法: ${s.tier}`)
    }
    const checkClaims = (claims, where) => {
      if (!claims || !claims.length) warn(`${tag} ${where} 无 claims`)
      ;(claims || []).forEach((c, i) => {
        if (!c.text) warn(`${tag} ${where}#${i} 无 text`)
        if (!c.source_ids?.length) warn(`${tag} ${where}#${i} 无 source_ids`)
        ;(c.source_ids || []).forEach((sid) => {
          if (!srcIds.has(sid)) warn(`${tag} ${where}#${i} 引用不存在的 ${sid}`)
        })
        if (!c.variant) warn(`${tag} ${where}#${i} 无 variant`)
      })
    }
    checkClaims(e.claims, 'claims')
    ;(e.subitems || []).forEach((s) => checkClaims(s.claims, `subitem:${s.name}`))

    if (!['A', 'A/B', 'B', 'C'].includes(e.traceability)) warn(`${tag} traceability 非法: ${e.traceability}`)
    if (!e.coordinates || typeof e.coordinates.lat !== 'number') warn(`${tag} coordinates 非法`)

    if (e.entry_type === 'route') {
      if (!e.route_points?.length) warn(`${tag} route 无 route_points`)
      ;(e.route_points || []).forEach((r) => {
        if (typeof r.coordinates?.lat !== 'number') warn(`${tag} route_point ${r.name} 坐标非法`)
      })
    }
    const len = (e.summary || '').length
    if (len < 80) warn(`${tag} summary 偏短 ${len} 字`)
    if (len > 260) warn(`${tag} summary 偏长 ${len} 字`)
  }
  all = all.concat(data)
}

console.log(`\n──── 汇总 ────`)
console.log(`条目总数: ${all.length} / 36`)
const groups = { A: 0, B: 0, C: 0 }
all.forEach((e) => {
  const g = e.entry_no?.[0]
  if (groups[g] !== undefined) groups[g]++
})
console.log(`A 组: ${groups.A} (应 13) | B 组: ${groups.B} (应 7) | C 组: ${groups.C} (应 16)`)
const tiers = {}
all.forEach((e) => (tiers[e.traceability] = (tiers[e.traceability] || 0) + 1))
console.log('等级分布:', tiers)
console.log(`来源总数: ${all.reduce((n, e) => n + (e.sources?.length || 0), 0)}`)
console.log(`断言总数: ${all.reduce((n, e) => n + (e.claims?.length || 0) + (e.subitems || []).reduce((m, s) => m + s.claims.length, 0), 0)}`)
console.log(problems ? `\n发现 ${problems} 处问题` : '\n✓ 全部通过')
process.exit(problems ? 1 : 0)
