/**
 * 全站巡检：node tools/crawl.mjs
 * 遍历 36 个条目页 + 3 条动线 + 9 个章节锚点，检查渲染错误与关键元素
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173/'

const kb = fs.readFileSync('src/data/raw/batchA.json', 'utf8')
const load = (f) => JSON.parse(fs.readFileSync(`src/data/raw/${f}`, 'utf8'))
const all = [...load('batchA.json'), ...load('batchB.json'), ...load('batchC.json')]
const entries = all.filter((e) => e.entry_type !== 'index' || true)

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
  defaultViewport: { width: 1440, height: 900, deviceScaleFactor: 1 },
})
const page = await browser.newPage()
let errs = []
page.on('console', (m) => m.type() === 'error' && errs.push(m.text()))
page.on('pageerror', (e) => errs.push(String(e)))

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const rows = []

for (const e of entries) {
  errs = []
  await page.goto(`${BASE}#/entry/${e.entry_id}`, { waitUntil: 'domcontentloaded' })
  await wait(420)
  const info = await page.evaluate(() => ({
    h1: document.querySelector('.entry__title')?.innerText || '',
    claims: document.querySelectorAll('.claim').length,
    cards: document.querySelectorAll('.srccard').length,
    variants: document.querySelectorAll('.variant').length,
    empty: !!document.querySelector('.notfound'),
  }))
  rows.push({
    id: e.entry_id,
    no: e.entry_no,
    tier: e.traceability,
    h1: info.h1.slice(0, 14),
    claims: info.claims,
    cards: info.cards,
    variants: info.variants,
    bad: info.empty || !info.h1 || errs.length > 0,
    err: errs[0] || '',
  })
}

for (const e of all.filter((x) => (x.route_points || []).length > 1)) {
  errs = []
  await page.goto(`${BASE}#/route/${e.entry_id}`, { waitUntil: 'domcontentloaded' })
  await wait(900)
  const info = await page.evaluate(() => ({
    points: document.querySelectorAll('.rpoint').length,
    map: !!document.querySelector('.leaflet-container'),
    markers: document.querySelectorAll('.leaflet-interactive').length,
  }))
  rows.push({
    id: `route:${e.entry_id}`,
    no: e.entry_no,
    tier: e.traceability,
    h1: `${info.points} points`,
    claims: info.markers,
    cards: info.map ? 1 : 0,
    variants: 0,
    bad: info.points !== (e.route_points || []).length || !info.map || errs.length > 0,
    err: errs[0] || '',
  })
}

await browser.close()

const bad = rows.filter((r) => r.bad)
console.log(`检查 ${rows.length} 个页面，异常 ${bad.length} 个\n`)
for (const r of rows) {
  const flag = r.bad ? '✗' : '·'
  console.log(
    `${flag} ${String(r.no).padEnd(4)} ${r.tier.padEnd(4)} 断言${String(r.claims).padStart(3)} 源卡${String(r.cards).padStart(2)} 变体${String(r.variants).padStart(2)}  ${r.h1}  ${r.err}`,
  )
}
