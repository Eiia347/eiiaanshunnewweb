import React, { useMemo, useRef, useState } from 'react'
import { BY_ID, ENTRIES, TIER_LABEL, tierNote, typeLabel, CHAPTERS } from '../data/kb.js'
import TierChip from '../components/TierChip.jsx'

function groupByVariant(claims) {
  const map = new Map()
  claims.forEach((c) => {
    const k = c.variant || '事实'
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(c)
  })
  return [...map.entries()]
}

export default function EntryPage({ id }) {
  const entry = BY_ID.get(id)
  const [hl, setHl] = useState(null)
  const [openExcerpt, setOpenExcerpt] = useState(() => new Set())
  const srcRefs = useRef({})

  if (!entry) {
    return (
      <div className="notfound">
        <p className="eyebrow">404</p>
        <h1>没有这个条目</h1>
        <a href="#/explore">回到探索页 →</a>
      </div>
    )
  }

  const srcById = useMemo(() => new Map(entry.sources.map((s) => [s.id, s])), [entry])
  const variantGroups = groupByVariant(entry.claims)
  const related = (entry.related_entry_ids || []).map((r) => BY_ID.get(r)).filter(Boolean)
  const chapter = CHAPTERS.find((c) => c.key === entry.scroll_anchor)
  const claimTotal =
    entry.claims.length + entry.subitems.reduce((n, s) => n + s.claims.length, 0)

  const focusSource = (sid) => {
    setHl(sid)
    srcRefs.current[sid]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    setTimeout(() => setHl((cur) => (cur === sid ? null : cur)), 2200)
  }

  const toggleExcerpt = (key) => {
    setOpenExcerpt((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const ClaimRow = ({ c, idx, prefix }) => {
    const key = `${prefix}-${idx}`
    const open = openExcerpt.has(key)
    return (
      <li className="claim">
        <p className="claim__text">{c.text}</p>
        <div className="claim__meta">
          {c.source_ids.map((sid) => (
            <button
              key={sid}
              className={`srcref ${hl === sid ? 'is-hl' : ''}`}
              onClick={() => focusSource(sid)}
              title={srcById.get(sid)?.title}
            >
              [{sid}]
            </button>
          ))}
          <button className="claim__expand" onClick={() => toggleExcerpt(key)}>
            {open ? '收起原文' : '展开原文'}
          </button>
          {c.confidence !== 'direct' && (
            <span className="claim__conf">{c.confidence === 'inferred' ? '推得' : '转述'}</span>
          )}
        </div>
        {open && (
          <div className="claim__excerpts">
            {c.source_ids.map((sid) => {
              const s = srcById.get(sid)
              if (!s) return null
              return (
                <blockquote key={sid}>
                  <span className="claim__ex-src">
                    [{sid}] {s.publisher}
                  </span>
                  {s.excerpt || '该来源未记录关键句，可点击右侧出处卡片查看原文。'}
                </blockquote>
              )
            })}
          </div>
        )}
      </li>
    )
  }

  return (
    <article className="entry">
      <div className="entry__wrap">
        <header className="entry__head">
          <div className="entry__crumbs">
            <a href="#/explore">探索</a>
            <span>/</span>
            {chapter ? (
              <a href={`#/zhenning/${chapter.key}`}>镇宁专栏 · {chapter.label}</a>
            ) : (
              <span>{entry.entry_no.startsWith('A') ? '安顺主线' : '市井安顺'}</span>
            )}
            <span>/</span>
            <span className="mono">{entry.entry_no}</span>
          </div>

          <h1 className="entry__title">{entry.title}</h1>
          <p className="entry__sub">{entry.subtitle}</p>

          <div className="entry__tags">
            <TierChip tier={entry.traceability} />
            <span className="entry__type">{typeLabel(entry.entry_type)}</span>
            <span className="entry__region">{entry.region}</span>
            {entry.category.map((c) => (
              <span className="tag" key={c}>
                {c}
              </span>
            ))}
          </div>
        </header>

        <div className="entry__grid">
          <div className="entry__main">
            <section className="block block--summary">
              <p className="eyebrow">摘要 / SUMMARY</p>
              <p className="summary">{entry.summary}</p>
            </section>

            {entry.narrative?.scene && (
              <section className="block block--scene">
                <p className="eyebrow">现场 / SCENE</p>
                <p className="scene">{entry.narrative.scene}</p>
              </section>
            )}

            {entry.subitems.length > 0 && (
              <section className="block">
                <p className="eyebrow">子项 / SUBITEMS · {entry.subitems.length}</p>
                {entry.subitems.map((sub) => (
                  <div className="subitem" key={sub.name}>
                    <h3 className="subitem__name">{sub.name}</h3>
                    {groupByVariant(sub.claims).map(([variant, claims]) => (
                      <div className="variant" key={variant}>
                        <p className="variant__label">{variant}</p>
                        <ol className="claims">
                          {claims.map((c, i) => (
                            <ClaimRow key={i} c={c} idx={i} prefix={`${sub.name}-${variant}`} />
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                ))}
              </section>
            )}

            {entry.claims.length > 0 && (
              <section className="block block--claims">
                <p className="eyebrow">
                  断言 / CLAIMS · {entry.claims.length}
                  {variantGroups.length > 1 && ' · 分组并置'}
                </p>
                {variantGroups.map(([variant, claims]) => (
                  <div className={`variant ${variantGroups.length > 1 ? 'variant--split' : ''}`} key={variant}>
                    <p className="variant__label">{variant}</p>
                    <ol className="claims">
                      {claims.map((c, i) => (
                        <ClaimRow key={i} c={c} idx={i} prefix={variant} />
                      ))}
                    </ol>
                  </div>
                ))}
              </section>
            )}

            {entry.route_points.length > 0 && (
              <section className="block">
                <p className="eyebrow">动线点位 / ROUTE POINTS</p>
                <ol className="routelist">
                  {entry.route_points.map((p) => (
                    <li key={p.order}>
                      <span className="routelist__no mono">{String(p.order).padStart(2, '0')}</span>
                      <div>
                        <b>{p.name}</b>
                        <p>{p.note}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <a className="linkbtn" href={`#/route/${entry.entry_id}`}>
                  进入滚动走线 →
                </a>
              </section>
            )}

            <section className="block block--notes">
              <p className="eyebrow">核验备注 / NOTES</p>
              <p className="notes">{entry.notes}</p>
            </section>

            {related.length > 0 && (
              <section className="block">
                <p className="eyebrow">相关条目 / RELATED</p>
                <div className="relgrid">
                  {related.map((r) => (
                    <a className="relcard" href={`#/entry/${r.entry_id}`} key={r.entry_id}>
                      <span className="mono">{r.entry_no}</span>
                      <b>{r.title}</b>
                      <em>{r.subtitle}</em>
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ── 出处侧栏（桌面常驻 / 移动端底部抽屉） ── */}
          <aside className="entry__aside">
            <div className="aside__head">
              <p className="eyebrow">出处 / SOURCES · {entry.sources.length}</p>
              <div className="aside__tier">
                <TierChip tier={entry.traceability} />
                <span>{tierNote(entry.traceability)}</span>
              </div>
              <p className="aside__stat mono">
                {claimTotal} 条断言 · {entry.sources.length} 条来源
              </p>
            </div>

            <ul className="srccards">
              {entry.sources.map((s) => (
                <li
                  key={s.id}
                  ref={(el) => (srcRefs.current[s.id] = el)}
                  className={`srccard ${hl === s.id ? 'is-hl' : ''}`}
                >
                  <div className="srccard__top">
                    <span className="srccard__id mono">[{s.id}]</span>
                    <span className={`tierdot tierdot--${s.tier.replace('/', '')}`}>{s.tier}</span>
                    <span className="srccard__pub">{s.publisher}</span>
                  </div>
                  <a className="srccard__title" href={s.url} target="_blank" rel="noreferrer noopener">
                    {s.title}
                  </a>
                  {s.excerpt && <p className="srccard__excerpt">「{s.excerpt}」</p>}
                  <div className="srccard__foot">
                    <span className="mono">取回 {s.retrieved_at}</span>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer noopener">
                        原文 ↗
                      </a>
                    ) : (
                      <span className="srccard__dead">链接待补</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <p className="aside__disclaimer">
              本页只做信息收集与重述，不做交易。等级表示来源强度，不表示事实真伪的最终裁决。
            </p>
          </aside>
        </div>

        <nav className="entry__pager">
          <PrevNext id={entry.entry_id} />
        </nav>
      </div>
    </article>
  )
}

function PrevNext({ id }) {
  const idx = ENTRIES.findIndex((e) => e.entry_id === id)
  const prev = ENTRIES[idx - 1]
  const next = ENTRIES[idx + 1]
  return (
    <>
      {prev ? (
        <a className="pager pager--prev" href={`#/entry/${prev.entry_id}`}>
          <span className="mono">← {prev.entry_no}</span>
          <b>{prev.title}</b>
        </a>
      ) : (
        <span />
      )}
      {next ? (
        <a className="pager pager--next" href={`#/entry/${next.entry_id}`}>
          <span className="mono">{next.entry_no} →</span>
          <b>{next.title}</b>
        </a>
      ) : (
        <span />
      )}
    </>
  )
}
