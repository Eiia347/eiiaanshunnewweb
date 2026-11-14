/**
 * 交互探针：node tools/probe.mjs
 * 覆盖：出处条抽屉、断言跳转高亮、展开原文、筛选器、键盘可达性
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173/'
const OUT = path.resolve('out')
fs.mkdirSync(OUT, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb'],
  defaultViewport: { width: 1600, height: 1000, deviceScaleFactor: 1 },
})
const page = await browser.newPage()
const errors = []
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
page.on('pageerror', (e) => errors.push(String(e)))

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const log = (...a) => console.log(...a)

/* ── 1. 镇宁：出处条抽屉 ─────────────────────── */
await page.goto(BASE + '#/zhenning/sugar', { waitUntil: 'domcontentloaded' })
await page.evaluate(() => document.fonts?.ready)
await wait(2500)
const barText = await page.$eval('.srcbar__chapter', (el) => el.innerText.replace(/\n/g, ' '))
log('srcbar 当前章节:', barText)
await page.click('.srcbar__toggle')
await wait(700)
const drawer = await page.$('.srcbar__drawer')
log('抽屉已展开:', !!drawer)
const drawerLinks = await page.$$eval('.srcbar__srclist li a', (as) => as.map((a) => a.textContent.trim()))
log('抽屉来源条数:', drawerLinks.length, '首条:', drawerLinks[0])
await page.screenshot({ path: path.join(OUT, 'probe-srcbar.png') })

/* ── 2. 条目页：断言点击 → 来源卡片高亮 ───────── */
await page.goto(BASE + '#/entry/zhenning-bobotang-origins', { waitUntil: 'domcontentloaded' })
await wait(2200)
const srcBtns = await page.$$('.srcref')
log('断言内来源按钮数:', srcBtns.length)
await srcBtns[0].click()
await wait(800)
const lit = await page.$$eval('.srccard.is-hl', (els) => els.length)
log('被点亮的来源卡片数:', lit)
await page.screenshot({ path: path.join(OUT, 'probe-claim-src.png') })

/* ── 3. 展开原文 ─────────────────────────────── */
const expandBtn = await page.$('.claim__expand')
if (expandBtn) {
  await expandBtn.click()
  await wait(600)
  const inline = await page.$$eval('.claim__excerpts blockquote', (els) =>
    els.map((e) => e.innerText.slice(0, 30)),
  )
  log('内联展开的原文块:', inline.length, inline[0] || '')
  await page.screenshot({ path: path.join(OUT, 'probe-excerpt.png') })
} else {
  log('未找到展开原文按钮')
}

/* ── 4. 探索页：筛选器 ───────────────────────── */
await page.goto(BASE + '#/explore', { waitUntil: 'domcontentloaded' })
await wait(4200)
const total = await page.$$eval('.erow', (r) => r.length)
log('探索页初始条目:', total)
const tierBtns = await page.$$('.seg__b')
log('分段控件数:', tierBtns.length)
await page.$$eval('.seg__b', (bs) => {
  const b = [...bs].find((x) => x.textContent.trim() === 'C 级')
  b && b.click()
})
await wait(900)
const onlyC = await page.$$eval('.erow .tier', (c) => [...new Set(c.map((x) => x.textContent.trim()))])
log('筛 C 级后出现的等级:', onlyC)
const cCount = await page.$$eval('.erow', (r) => r.length)
log('筛 C 级后条目数:', cCount)
await page.screenshot({ path: path.join(OUT, 'probe-filter.png') })

/* ── 5. 搜索 ─────────────────────────────────── */
await page.click('.search input')
await page.type('.search input', '蜂糖李')
await wait(900)
const hits = await page.$$eval('.erow__title', (t) => t.map((x) => x.textContent.trim()))
log('搜索「蜂糖李」命中:', hits)

/* ── 6. 键盘：Tab 焦点可见 ───────────────────── */
await page.goto(BASE + '#/entry/zhenning-fengtangli', { waitUntil: 'domcontentloaded' })
await wait(1800)
for (let i = 0; i < 6; i++) await page.keyboard.press('Tab')
const focused = await page.evaluate(() => {
  const el = document.activeElement
  const cs = getComputedStyle(el)
  return { tag: el.tagName, text: (el.innerText || '').slice(0, 18), outline: cs.outlineWidth + ' ' + cs.outlineColor }
})
log('第 6 次 Tab 焦点:', focused)

await browser.close()
log(errors.length ? `\n控制台错误 ${errors.length} 条:\n  ` + errors.join('\n  ') : '\n无控制台错误')
