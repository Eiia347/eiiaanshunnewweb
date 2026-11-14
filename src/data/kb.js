import batchA from './raw/batchA.json'
import batchB from './raw/batchB.json'
import batchC from './raw/batchC.json'

/** 镇宁专栏九锚点（顺序即滚动章节顺序） */
export const CHAPTERS = [
  { key: 'stone', no: 0, label: '石', title: '石', sub: '石板房与四落腔', note: '以石为墙、以石为瓦' },
  { key: 'silver', no: 1, label: '银', title: '银', sub: '马厂村的锤声', note: '苗银的手工谱系' },
  { key: 'wax', no: 2, label: '蜡', title: '蜡', sub: '凹子寨的靛蓝', note: '蜡染与扁担山' },
  { key: 'opera', no: 3, label: '戏', title: '戏', sub: '脸子与地戏村落', note: '新苑、窑上、长脚、东窑' },
  { key: 'sugar', no: 4, label: '糖', title: '糖', sub: '波波糖的两种起源', note: '并置，不裁决' },
  { key: 'plum', no: 5, label: '李', title: '李', sub: '蜂糖李与它的两个名字', note: '传说与科研记载并列' },
  { key: 'food', no: 6, label: '食', title: '食', sub: '染饭、鸡八块、油团粑', note: '节令与礼仪中的镇宁' },
  { key: 'nature', no: 7, label: '自然', title: '自然', sub: '水与洞', note: '夜郎洞、白马湖、桂家湖' },
  { key: 'night', no: 8, label: '夜线', title: '夜线', sub: '青石板上的矮桌', note: '下北街到天瀑步行街' },
]

const RAW = [...batchA, ...batchB, ...batchC]

const DEFAULTS = {
  entry_type: 'thematic',
  category: [],
  region: '',
  chapter_index: 0,
  scroll_anchor: '',
  hero_media: { type: 'none', url: '', fallback_url: '', credit: '', license: '' },
  claims: [],
  sources: [],
  subitems: [],
  route_points: [],
  traceability: 'B',
  notes: '',
  tags: [],
  related_entry_ids: [],
  narrative: { hook: '', scene: '' },
}

const num = (v, d) => (typeof v === 'number' && !Number.isNaN(v) ? v : d)

/** C 组数据里 entry_no 写成了裸数字，统一补成 "C1"…"C16" */
function fixEntryNo(e) {
  const raw = e.entry_no
  if (typeof raw === 'number') return `C${raw}`
  const s = String(raw || '').trim()
  if (/^\d+$/.test(s) && e.scroll_anchor) return `C${s}`
  return s
}

function normalize(e, i) {
  const o = { ...DEFAULTS, ...e }
  o.entry_no = fixEntryNo(o) || `E${i + 1}`
  o.title = String(o.title || '')
  o.subtitle = String(o.subtitle || '')
  o.summary = String(o.summary || '')
  o.notes = String(o.notes || '')
  o.region = String(o.region || '')
  o.scroll_anchor = String(o.scroll_anchor || '')
  o.category = Array.isArray(o.category) ? o.category.map(String) : []
  o.tags = Array.isArray(o.tags) ? o.tags.map(String) : []
  o.related_entry_ids = Array.isArray(o.related_entry_ids) ? o.related_entry_ids.map(String) : []
  o.coordinates = {
    lat: num(o.coordinates?.lat, 26.25),
    lng: num(o.coordinates?.lng, 105.93),
  }
  o.chapter_index = num(o.chapter_index, 0)
  o.claims = (o.claims || []).map((c) => ({
    text: c.text || '',
    source_ids: c.source_ids || [],
    variant: c.variant || '事实',
    confidence: c.confidence || 'direct',
  }))
  o.sources = (o.sources || []).map((s, j) => ({
    id: s.id || `src_${String(j + 1).padStart(2, '0')}`,
    title: s.title || '未命名来源',
    url: s.url || '',
    publisher: s.publisher || '',
    retrieved_at: s.retrieved_at || '2026-11-14',
    tier: s.tier || 'B',
    excerpt: s.excerpt || '',
    media: s.media || { type: 'none' },
  }))
  o.subitems = (o.subitems || []).map((s) => ({
    name: s.name || '',
    claims: (s.claims || []).map((c) => ({
      text: c.text || '',
      source_ids: c.source_ids || [],
      variant: c.variant || '事实',
      confidence: c.confidence || 'direct',
    })),
  }))
  o.route_points = (o.route_points || [])
    .map((r, j) => ({
      name: r.name || `点位 ${j + 1}`,
      order: num(r.order, j + 1),
      coordinates: { lat: num(r.coordinates?.lat, 26.25), lng: num(r.coordinates?.lng, 105.93) },
      note: r.note || '',
      source_ids: r.source_ids || [],
    }))
    .sort((a, b) => a.order - b.order)
  o.narrative = { hook: o.narrative?.hook || '', scene: o.narrative?.scene || '' }
  return o
}

export const ENTRIES = RAW.map(normalize).sort((a, b) => {
  const ga = groupOf(a)
  const gb = groupOf(b)
  if (ga !== gb) return ga - gb
  return a.entry_no.localeCompare(b.entry_no, 'en', { numeric: true })
})

function groupOf(e) {
  if (e.entry_no?.startsWith('A')) return 0
  if (e.entry_no?.startsWith('B')) return 1
  return 2
}

export const BY_ID = new Map(ENTRIES.map((e) => [e.entry_id, e]))

export const GROUPS = [
  {
    key: 'anshun',
    no: 'A',
    title: '安顺主线',
    count: 13,
    desc: '屯堡、地戏、喀斯特与赛事——一条从明代军屯延续到今天的线索。',
  },
  {
    key: 'city',
    no: 'B',
    title: '市井安顺',
    count: 7,
    desc: '景区之外，仍有完整的日常生活。街道、湖、早市与茶馆。',
  },
  {
    key: 'zhenning',
    no: 'C',
    title: '镇宁专栏',
    count: 16,
    desc: '石 · 银 · 蜡 · 戏 · 糖 · 李 · 食 · 自然 · 夜线，九个滚动章节。',
  },
]

/** 探索页图层 */
export const LAYERS = [
  { key: 'tunpu', label: '屯堡与地戏', color: '#3D5A80', match: (e) => /地戏|屯堡|面具|云山|天龙|吉昌|鲍家/.test(e.title) },
  { key: 'karst', label: '喀斯特', color: '#6B7A8A', match: (e) => /瀑布|龙宫|格凸|夜郎洞|白马湖|桂家湖/.test(e.title) },
  { key: 'city', label: '市井与动线', color: '#8A7A6A', match: (e) => e.entry_no.startsWith('B') },
  { key: 'zhenning', label: '镇宁专栏', color: '#B8935A', match: (e) => e.entry_no.startsWith('C') },
  { key: 'race', label: '赛事', color: '#5C7CA6', match: (e) => e.entry_type === 'event' },
]

export function layerOf(e) {
  for (const l of LAYERS) if (l.match(e)) return l.key
  return 'zhenning'
}

/** 探索页里只保留有独立地理意义的点：索引/主题类不落点，蜂糖李只标六马一个点 */
export function mapPoints(entries) {
  return entries.filter((e) => {
    if (e.entry_type === 'index') return false
    if (e.route_points?.length) return true
    return true
  })
}

export function routePolyline(e) {
  return e.route_points.map((p) => [p.coordinates.lat, p.coordinates.lng])
}

/** 聚合：某条目的来源数、断言数、最高等级 */
export function statsOf(entries) {
  const list = Array.isArray(entries) ? entries : [entries]
  const srcIds = new Set()
  let claims = 0
  list.forEach((e) => {
    e.sources.forEach((s) => srcIds.add(`${e.entry_id}:${s.id}`))
    claims += e.claims.length
    e.subitems.forEach((s) => (claims += s.claims.length))
  })
  const tiers = list.map((e) => e.traceability)
  return { sources: srcIds.size, claims, tier: worstTier(tiers), entries: list.length }
}

export function worstTier(tiers) {
  const rank = { A: 0, 'A/B': 1, B: 2, C: 3 }
  let best = 'A'
  let worst = 'A'
  tiers.forEach((t) => {
    if ((rank[t] ?? 2) < (rank[best] ?? 2)) best = t
    if ((rank[t] ?? 2) > (rank[worst] ?? 2)) worst = t
  })
  if (best === worst) return best
  return best === 'A' && worst === 'A/B' ? 'A/B' : worst
}

export function chapterEntries(anchor) {
  return ENTRIES.filter((e) => e.scroll_anchor === anchor)
}

export const TOTAL = {
  entries: ENTRIES.length,
  sources: ENTRIES.reduce((n, e) => n + e.sources.length, 0),
  claims: ENTRIES.reduce(
    (n, e) => n + e.claims.length + e.subitems.reduce((m, s) => m + s.claims.length, 0),
    0,
  ),
  tierA: ENTRIES.filter((e) => e.traceability === 'A' || e.traceability === 'A/B').length,
}

export const TIER_LABEL = { A: 'A 级', 'A/B': 'A/B 级', B: 'B 级', C: 'C 级' }

export function tierNote(t) {
  if (t === 'A') return '核心断言均有官方／央媒／学术来源'
  if (t === 'A/B') return '核心断言为 A 级，含并置说法或少量 B 级来源'
  if (t === 'B') return '主要依赖主流媒体来源'
  return '来源有限：单一自媒体来源，或未获取全文'
}

export function typeLabel(t) {
  return (
    {
      place: '地点',
      person: '人物',
      thematic: '主题',
      event: '事件',
      index: '索引',
      route: '动线',
    }[t] || '条目'
  )
}
