import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CHAPTERS, ENTRIES, chapterEntries, typeLabel, worstTier, TIER_LABEL } from '../data/kb.js'
import { useReducedMotion } from '../lib/hooks.js'
import TierChip from '../components/TierChip.jsx'

const TIER_RANK = { A: 0, 'A/B': 1, B: 2, C: 3 }

/** 章节内按 URL 去重，保留最强等级，并记录被哪些条目引用 */
function dedupeSources(list) {
  const map = new Map()
  list.forEach((e) => {
    e.sources.forEach((s) => {
      const key = s.url || `${s.title}|${s.publisher}`
      const cur = map.get(key)
      if (!cur) {
        map.set(key, { ...s, entries: [e.entry_no] })
      } else {
        if (!cur.entries.includes(e.entry_no)) cur.entries.push(e.entry_no)
        if (TIER_RANK[s.tier] < TIER_RANK[cur.tier]) cur.tier = s.tier
      }
    })
  })
  return [...map.values()].sort(
    (a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier] || a.entries[0].localeCompare(b.entries[0]),
  )
}

export default function Zhenning({ anchor }) {
  const rootRef = useRef(null)
  const reduced = useReducedMotion()
  const [current, setCurrent] = useState(0)
  const [openSources, setOpenSources] = useState(false)

  const chapters = useMemo(
    () =>
      CHAPTERS.map((c) => {
        const list = chapterEntries(c.key)
        const srcIds = new Set()
        let claims = 0
        list.forEach((e) => {
          e.sources.forEach((s) => srcIds.add(s.id))
          claims += e.claims.length + e.subitems.reduce((n, s) => n + s.claims.length, 0)
        })
        return {
          ...c,
          entries: list,
          sources: dedupeSources(list),
          sourceCount: srcIds.size,
          claimCount: claims,
          gapCount: list.filter((e) => e.traceability === 'C').length,
          tier: worstTier(list.map((e) => e.traceability)),
        }
      }),
    [],
  )

  const active = chapters[current] || chapters[0]

  /* 章节观测：更新 sticky 出处条 */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const secs = [...root.querySelectorAll('[data-chapter]')]
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            const idx = Number(en.target.getAttribute('data-chapter'))
            setCurrent(idx)
          }
        })
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )
    secs.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [chapters.length])

  /* 视差：章节大字与背景随滚动缓慢位移 */
  useEffect(() => {
    if (reduced) return
    const root = rootRef.current
    if (!root) return
    let raf = 0
    const read = () => {
      raf = 0
      const vh = window.innerHeight
      root.querySelectorAll('[data-chapter]').forEach((sec) => {
        const r = sec.getBoundingClientRect()
        const p = (vh - r.top) / (vh + r.height)
        sec.style.setProperty('--p', String(Math.min(1, Math.max(0, p))))
      })
    }
    const on = () => {
      if (!raf) raf = requestAnimationFrame(read)
    }
    read()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduced])

  /* 从 #/zhenning/plum 进来时滚到对应章节 */
  useEffect(() => {
    if (!anchor) return
    const i = chapters.findIndex((c) => c.key === anchor)
    if (i < 0) return
    const t = setTimeout(() => {
      document.getElementById(`ch-${anchor}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
    return () => clearTimeout(t)
  }, [anchor, chapters])

  const jump = useCallback((key) => {
    document.getElementById(`ch-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  return (
    <div className="zn" ref={rootRef}>
      <section className="zn__head">
        <p className="eyebrow">镇宁专栏 / ZHENNING · 9 CHAPTERS</p>
        <h1 className="zn__title">镇宁</h1>
        <p className="zn__lede">
          石、银、蜡、戏、糖、李、食、自然、夜线。九个纵向章节，滚动阅读；
          每章末尾的出处条固定停在视口底部，随章节内容更新——它不表演，只证明。
        </p>

        <nav className="zn__index" aria-label="镇宁章节导航">
          {chapters.map((c, i) => (
            <button
              key={c.key}
              className={`zn__idx ${i === current ? 'is-on' : ''}`}
              onClick={() => jump(c.key)}
            >
              <span className="zn__idx-no mono">{String(i + 1).padStart(2, '0')}</span>
              <span className="zn__idx-label">{c.label}</span>
              <span className="zn__idx-sub">{c.sub}</span>
            </button>
          ))}
        </nav>
      </section>

      {chapters.map((c, i) => (
        <Chapter key={c.key} chapter={c} index={i} />
      ))}

      <footer className="zn__end">
        <p>
          镇宁专栏共 {chapters.reduce((n, c) => n + c.entries.length, 0)} 条条目，
          {chapters.reduce((n, c) => n + c.sourceCount, 0)} 个来源引用。
        </p>
        <a href="#/explore">在地图上查看全部 →</a>
      </footer>

      {/* ── sticky 出处条 ─────────────────────────── */}
      <div className={`srcbar ${openSources ? 'is-open' : ''}`}>
        <div className="srcbar__main">
          <span className="srcbar__chapter">
            <b>{active.label}</b>
            <span>{active.sub}</span>
          </span>
          <span className="srcbar__sep" aria-hidden="true" />
          <TierChip tier={active.tier} />
          <span className="srcbar__stat mono">{active.sourceCount} 条来源</span>
          <span className="srcbar__stat mono">{active.claimCount} 条断言</span>
          <button className="srcbar__toggle" onClick={() => setOpenSources((v) => !v)}>
            {openSources ? '收起原文' : '展开原文'}
            <span className="srcbar__caret" aria-hidden="true">
              {openSources ? '▾' : '▴'}
            </span>
          </button>
        </div>

        {openSources && (
          <div className="srcbar__drawer">
            <div className="srcbar__cols">
              <div>
                <p className="eyebrow">本章条目</p>
                <ul>
                  {active.entries.map((e) => (
                    <li key={e.entry_id}>
                      <a href={`#/entry/${e.entry_id}`}>
                        <span className="mono">{e.entry_no}</span> {e.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="eyebrow">来源 · {active.sources.length}</p>
                <ul className="srcbar__srclist">
                  {active.sources.map((s) => (
                    <li key={s.url || s.title}>
                      <span className={`tierdot tierdot--${s.tier.replace('/', '')}`}>{s.tier}</span>
                      <a href={s.url} target="_blank" rel="noreferrer noopener">
                        {s.title}
                      </a>
                      <span className="srcbar__pub">{s.publisher}</span>
                      <span className="srcbar__refs mono">{s.entries.join(' ')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Chapter({ chapter: c, index }) {
  return (
    <section className="ch" id={`ch-${c.key}`} data-chapter={index}>
      <div className="ch__bg" aria-hidden="true">
        <span className="ch__glyph">{c.label}</span>
        <span className="ch__wash" />
      </div>

      <div className="ch__inner">
        <header className="ch__head" data-reveal>
          <span className="ch__no mono">{String(index + 1).padStart(2, '0')} / 09</span>
          <h2 className="ch__title">{c.title}</h2>
          <p className="ch__sub">{c.sub}</p>
          <p className="ch__note">{c.note}</p>
        </header>

        <div className="ch__entries">
          {c.entries.map((e) => (
            <article className="ecard" key={e.entry_id} data-reveal>
              <div className="ecard__top">
                <span className="ecard__no mono">{e.entry_no}</span>
                <span className="ecard__type">{typeLabel(e.entry_type)}</span>
                <TierChip tier={e.traceability} compact />
              </div>
              <h3 className="ecard__title">
                <a href={`#/entry/${e.entry_id}`}>{e.title}</a>
              </h3>
              <p className="ecard__sub">{e.subtitle}</p>
              <p className="ecard__sum">{e.summary}</p>

              {e.narrative?.hook && <p className="ecard__hook">「{e.narrative.hook}」</p>}

              {e.subitems.length > 0 && (
                <ul className="ecard__subs">
                  {e.subitems.map((s) => (
                    <li key={s.name}>
                      <span>{s.name}</span>
                      <em className="mono">{s.claims.length} 条断言</em>
                    </li>
                  ))}
                </ul>
              )}

              <div className="ecard__foot">
                <span className="mono">
                  {e.sources.length} 源 · {e.claims.length + e.subitems.reduce((n, s) => n + s.claims.length, 0)} 断言
                </span>
                <span className="ecard__acts">
                  {e.route_points.length > 1 && <a href={`#/route/${e.entry_id}`}>滚动走线</a>}
                  <a href={`#/entry/${e.entry_id}`}>查看完整条目 →</a>
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="ch__foot" data-reveal>
          <span className="mono">
            本章 {c.entries.length} 条 · {c.sourceCount} 源 · {c.claimCount} 断言
          </span>
          <span className="ch__foot-tier">
            {c.gapCount > 0
              ? `${TIER_LABEL[c.tier]} · 其中 ${c.gapCount} 条来源有限，待核项见条目备注`
              : `${TIER_LABEL[c.tier]} · 出处条常驻视口底部`}
          </span>
        </div>
      </div>
    </section>
  )
}
