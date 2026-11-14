/**
 * 截图探针：node tools/shot.mjs <hash> <out.png> [width] [height] [scrollY] [fullPage]
 * 例：node tools/shot.mjs "#/explore" out/explore.png 1600 1000
 */
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const [, , hash = '#/', out = 'out/shot.png', w = '1600', h = '1000', scrollY = '0', full = '0'] =
  process.argv

const BASE = process.env.BASE_URL || 'http://127.0.0.1:4173/'

const outPath = path.resolve(out)
fs.mkdirSync(path.dirname(outPath), { recursive: true })

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb', '--hide-scrollbars'],
  defaultViewport: { width: Number(w), height: Number(h), deviceScaleFactor: 1 },
})

const page = await browser.newPage()
const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push(String(e)))

await page.goto(BASE + hash, { waitUntil: 'domcontentloaded', timeout: 45000 })
await page.evaluate(() => document.fonts?.ready)
await new Promise((r) => setTimeout(r, 3200))

// 分段滚动：触发所有 IntersectionObserver 显现，再回到目标位置
if (Number(scrollY) > 0) {
  const target = Number(scrollY)
  for (let y = 0; y < target; y += 400) {
    await page.evaluate((v) => window.scrollTo(0, v), y)
    await new Promise((r) => setTimeout(r, 90))
  }
  await page.evaluate((v) => window.scrollTo(0, v), target)
  await new Promise((r) => setTimeout(r, 1400))
}

await page.screenshot({ path: outPath, fullPage: full === '1' })
await browser.close()

if (errors.length) {
  console.log('页面错误:')
  errors.forEach((e) => console.log('  -', e))
} else {
  console.log('无控制台错误')
}
console.log('saved:', outPath)
