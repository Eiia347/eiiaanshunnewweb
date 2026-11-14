import React from 'react'
import { TOTAL, ENTRIES, CHAPTERS } from '../data/kb.js'
import { TierLegend, StatsStrip } from '../components/TierChip.jsx'

const CHAIN = [
  {
    no: 'A',
    title: '链 A · 名录抽取',
    body: '官方名录／名单 → Flash 结构化抽取 → 基础条目（entry_type: place | person，traceability 通常为 A）。',
  },
  {
    no: 'B',
    title: '链 B · 受约束重述',
    body: '已选来源页面 → Flash 受约束重述 → 重述条目。只使用输入文本，每个断言绑定来源编号，数字与专名与原文完全一致。',
  },
  {
    no: 'C',
    title: '并置而非裁决',
    body: '当来源存在两种以上说法时，不合并、不裁决，拆成独立 claim，各自绑定 source_ids，并增加 variant 字段。蜂糖李的「民间传说」与「科研记载」是标准样板。',
  },
]

export default function About() {
  const variants = new Set()
  ENTRIES.forEach((e) => e.claims.forEach((c) => variants.add(c.variant)))

  return (
    <div className="about">
      <header className="about__head">
        <p className="eyebrow">方法 / METHOD</p>
        <h1 className="about__title">
          一个只做信息收集、
          <br />
          不做交易的在地知识库。
        </h1>
        <p className="about__lede">
          用 Agent 从公开来源提取结构化事实，以「可追溯的重述」呈现安顺与镇宁的吃穿风景建筑人文地理。
          入口沉浸，阅读安静，出处永远可见。
        </p>
        <StatsStrip />
      </header>

      <section className="about__sec">
        <h2>两条链，离线跑，Web 只读</h2>
        <div className="chain">
          {CHAIN.map((c) => (
            <div className="chain__item" key={c.no}>
              <span className="chain__no mono">{c.no}</span>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about__sec">
        <h2>可追溯性等级</h2>
        <p className="about__p">
          等级表示来源强度，不表示事实真伪的最终裁决。当两种说法并存时，两条 claim 的视觉权重完全相同，
          出处条中并列显示，不标注「哪个更可信」。
        </p>
        <TierLegend />
      </section>

      <section className="about__sec">
        <h2>九章节的镇宁</h2>
        <p className="about__p">
          镇宁专栏的九个锚点不是顶部 tab，而是纵向滚动章节的导航。每个章节末尾固定一个半透明出处条，
          它不随章节滚出视口而消失，随章节内容更新文本。
        </p>
        <div className="about__chapters">
          {CHAPTERS.map((c, i) => (
            <a key={c.key} href={`#/zhenning/${c.key}`} className="about__ch">
              <span className="mono">{String(i + 1).padStart(2, '0')}</span>
              <b>{c.label}</b>
              <em>{c.sub}</em>
            </a>
          ))}
        </div>
      </section>

      <section className="about__sec">
        <h2>边界与已知限制</h2>
        <ul className="about__list">
          <li>
            <b>不部署后端。</b>数据为本地整理后导出的静态 JSON，前端 fetch 加载；SQLite 仅用于本地校验。
          </li>
          <li>
            <b>不提供图片。</b>hero_media 与来源图片均需逐张版权确认，未确认时 media.type 为 none 是合法状态。
          </li>
          <li>
            <b>学术论文无法获取全文时降为索引条目。</b>只记录「存在这篇论文」，标注来源未获取全文。
          </li>
          <li>
            <b>来源失效时仍可展示关键句。</b>sources[].excerpt 存原文关键句，出处卡片不因页面 404 而失去意义。
          </li>
          <li>
            <b>人工核验仍需 2 小时左右。</b>核验项：数字／年份、专名写法、URL 可访问性、等级匹配度。
          </li>
        </ul>
      </section>

      <section className="about__sec">
        <h2>数据规模</h2>
        <div className="about__stats">
          {[
            ['条目', TOTAL.entries],
            ['来源', TOTAL.sources],
            ['断言', TOTAL.claims],
            ['A 级及以上条目', TOTAL.tierA],
            ['variant 分组数', variants.size],
          ].map(([k, v]) => (
            <div key={k}>
              <b className="mono">{v}</b>
              <span>{k}</span>
            </div>
          ))}
        </div>
      </section>

      <footer className="about__foot">
        <a href="#/">← 回到入口</a>
        <a href="#/explore">进入探索页 →</a>
      </footer>
    </div>
  )
}
