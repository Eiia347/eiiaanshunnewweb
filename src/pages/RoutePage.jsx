import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { BY_ID, TIER_LABEL } from '../data/kb.js'
import { addBasemap } from '../lib/basemap.js'
import { useScrollProgress } from '../lib/hooks.js'
import TierChip from '../components/TierChip.jsx'

export default function RoutePage({ id }) {
  const entry = BY_ID.get(id)
  const scroller = useRef(null)
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const lineRef = useRef(null)
  const markersRef = useRef([])
  const [progress, setProgress] = useState(0)
  const [activeIdx, setActiveIdx] = useState(0)

  const points = entry?.route_points || []

  const onProgress = useCallback((p) => setProgress(p), [])
  useScrollProgress(scroller, onProgress)

  /* 当前点位由滚动进度推导 */
  useEffect(() => {
    if (!points.length) return
    const p = Math.min(0.9999, Math.max(0, progress))
    const i = Math.floor(p * points.length)
    setActiveIdx(i)
  }, [progress, points.length])

  /* 地图初始化 */
  useEffect(() => {
    if (!entry || !mapEl.current || mapRef.current) return
    const pts = entry.route_points.map((p) => [p.coordinates.lat, p.coordinates.lng])
    const map = L.map(mapEl.current, {
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: false,
      dragging: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      preferCanvas: true,
    })
    addBasemap(map)
    map.fitBounds(L.latLngBounds(pts).pad(0.28), { animate: false })

    const isZhenning = entry.entry_no.startsWith('C')
    L.polyline(pts, {
      color: '#2b323c',
      weight: 2,
      opacity: 0.9,
      dashArray: '2 7',
      lineCap: 'round',
    }).addTo(map)

    lineRef.current = L.polyline(pts, {
      color: isZhenning ? '#6B7A8A' : '#3D5A80',
      weight: 2.6,
      opacity: 1,
      dashArray: isZhenning ? '8 7' : null,
      lineCap: 'round',
    }).addTo(map)

    markersRef.current = entry.route_points.map((p) =>
      L.circleMarker([p.coordinates.lat, p.coordinates.lng], {
        radius: 5,
        color: '#0D1117',
        weight: 2,
        fillColor: '#6B7A8A',
        fillOpacity: 1,
      }).addTo(map),
    )

    mapRef.current = map
    setTimeout(() => map.invalidateSize(), 150)
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [entry])

  /* 轨迹按滚动进度逐段绘制 */
  useEffect(() => {
    const map = mapRef.current
    const line = lineRef.current
    if (!map || !line || !points.length) return

    const total = points.length - 1
    const seg = progress * total
    const n = Math.floor(seg)
    const frac = seg - n
    const coords = points.map((p) => [p.coordinates.lat, p.coordinates.lng])

    const drawn = coords.slice(0, n + 1)
    if (frac > 0.02 && n + 1 < coords.length) {
      const a = coords[n]
      const b = coords[n + 1]
      drawn.push([a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac])
    }
    line.setLatLngs(drawn.length > 1 ? drawn : [])

    markersRef.current.forEach((m, i) => {
      const on = i <= n
      m.setStyle({
        fillColor: i === activeIdx ? '#B8935A' : on ? '#3D5A80' : '#232a33',
        radius: i === activeIdx ? 6.5 : 4.6,
        color: i === activeIdx ? '#B8935A' : '#0D1117',
      })
    })
  }, [progress, activeIdx, points])

  if (!entry) {
    return (
      <div className="notfound">
        <p className="eyebrow">404</p>
        <h1>没有这条动线</h1>
        <a href="#/explore">回到探索页 →</a>
      </div>
    )
  }

  const isZhenning = entry.entry_no.startsWith('C')

  return (
    <div className="routepage">
      <div className="routepage__scroll" ref={scroller}>
        <section className="routepage__intro">
          <p className="eyebrow">动线 / ROUTE · {entry.entry_no}</p>
          <h1 className="routepage__title">{entry.title}</h1>
          <p className="routepage__sub">{entry.subtitle}</p>
          <p className="routepage__lede">{entry.summary}</p>
          <div className="routepage__meta">
            <TierChip tier={entry.traceability} />
            <span className="mono">{points.length} 个点位</span>
            <span className="mono">{entry.sources.length} 条来源</span>
            <span className="routepage__hint">向下滚动，轨迹逐段绘制 ↓</span>
          </div>
        </section>

        {points.map((p, i) => {
          const srcs = p.source_ids.map((sid) => entry.sources.find((s) => s.id === sid)).filter(Boolean)
          const claims = entry.claims.filter((c) => c.source_ids.some((s) => p.source_ids.includes(s)))
          return (
            <section
              className={`rpoint ${i === activeIdx ? 'is-active' : ''} ${i < activeIdx ? 'is-past' : ''}`}
              key={p.order}
              data-idx={i}
            >
              <div className="rpoint__sticky">
                <span className="rpoint__no mono">
                  {String(p.order).padStart(2, '0')} / {String(points.length).padStart(2, '0')}
                </span>
                <h2 className="rpoint__name">{p.name}</h2>
                <p className="rpoint__note">{p.note}</p>

                {claims.length > 0 && (
                  <ul className="rpoint__claims">
                    {claims.slice(0, 3).map((c, j) => (
                      <li key={j}>
                        {c.text}
                        <span className="rpoint__srcs mono">
                          {c.source_ids.map((s) => `[${s}]`).join(' ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="rpoint__foot">
                  {srcs.map((s) => (
                    <a key={s.id} href={s.url} target="_blank" rel="noreferrer noopener" className="rpoint__src">
                      <span className={`tierdot tierdot--${s.tier.replace('/', '')}`}>{s.tier}</span>
                      {s.publisher} · {s.title}
                    </a>
                  ))}
                </div>

                <a className="rpoint__full" href={`#/entry/${entry.entry_id}`}>
                  查看完整条目 →
                </a>
              </div>
            </section>
          )
        })}

        <section className="routepage__end">
          <p className="eyebrow">动线结束 / END OF ROUTE</p>
          <p>{entry.narrative?.scene}</p>
          <div className="routepage__endacts">
            <a className="linkbtn" href={`#/entry/${entry.entry_id}`}>
              回到条目页
            </a>
            <a className="linkbtn linkbtn--ghost" href="#/explore">
              回到地图
            </a>
          </div>
        </section>
      </div>

      <aside className="routepage__map">
        <div className="routepage__mapel" ref={mapEl} />
        <div className="routepage__progress">
          <span className="mono">{Math.round(progress * 100)}%</span>
          <span className="routepage__bar">
            <i style={{ width: `${progress * 100}%` }} />
          </span>
        </div>
        <div className="routepage__maplegend">
          <span>
            <i className="lg lg--on" /> 已走
          </span>
          <span>
            <i className="lg lg--now" /> 当前
          </span>
          <span>
            <i className="lg lg--todo" /> 未至
          </span>
          <span className="routepage__tier">
            {TIER_LABEL[entry.traceability]} · {isZhenning ? '镇宁虚线' : '安顺实线'}
          </span>
        </div>
      </aside>

      {/* sticky 出处条 */}
      <div className="srcbar srcbar--route">
        <div className="srcbar__main">
          <span className="srcbar__chapter">
            <b>
              {String(points[activeIdx]?.order || 1).padStart(2, '0')}
            </b>
            <span>{points[activeIdx]?.name}</span>
          </span>
          <span className="srcbar__sep" aria-hidden="true" />
          <TierChip tier={entry.traceability} />
          <span className="srcbar__stat mono">
            {points[activeIdx]?.source_ids.length || 0} 条来源绑定本点位
          </span>
          <span className="srcbar__stat mono">
            {activeIdx + 1} / {points.length} 点位
          </span>
          <a className="srcbar__toggle" href={`#/entry/${entry.entry_id}`}>
            展开原文 →
          </a>
        </div>
      </div>
    </div>
  )
}
