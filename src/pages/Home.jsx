import React from 'react'
import Hero from './Hero.jsx'
import Explore from './Explore.jsx'
import { GROUPS, ENTRIES } from '../data/kb.js'

export default function Home() {
  return (
    <>
      <Hero />
      <div id="scroll-explore">
        <Explore embedded />
      </div>
      <section className="gate">
        <div className="gate__inner">
          <p className="eyebrow">三条线索 / THREE THREADS</p>
          <h2 className="gate__title">从屯堡到市井，再到镇宁的九个章节</h2>

          <div className="gate__grid">
            {GROUPS.map((g) => {
              const list = ENTRIES.filter((e) => e.entry_no.startsWith(g.no))
              const tierCount = list.filter((e) => e.traceability === 'A' || e.traceability === 'A/B').length
              return (
                <a
                  className="gate__card"
                  key={g.key}
                  href={g.key === 'zhenning' ? '#/zhenning' : `#/explore?g=${g.no}`}
                >
                  <div className="gate__card-top">
                    <span className="gate__no mono">{g.no}</span>
                    <span className="gate__count mono">{list.length} 条</span>
                  </div>
                  <h3>{g.title}</h3>
                  <p>{g.desc}</p>
                  <div className="gate__card-foot">
                    <span className="mono">{tierCount} 条 A 级及以上</span>
                    <span className="gate__go">进入 →</span>
                  </div>
                </a>
              )
            })}
          </div>

          <div className="gate__note">
            <span className="mono">SOURCES ALWAYS VISIBLE</span>
            <p>
              详情页右侧常驻出处栏，断言后的 [src_01] 点击即定位到对应来源卡片；
              点击「展开原文」在断言下方内联展开关键句，不跳转。
            </p>
          </div>
        </div>
      </section>

      <footer className="homefoot">
        <span className="mono">在地 · 安顺／镇宁 · 信息收集知识库</span>
        <span>只收集，不交易。每一条断言都能回到它来的地方。</span>
        <a href="#/about">方法 →</a>
      </footer>
    </>
  )
}
