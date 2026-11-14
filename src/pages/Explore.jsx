import React, { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { addBasemap } from '../lib/basemap.js'
import { ENTRIES, LAYERS, layerOf, routePolyline, typeLabel } from '../data/kb.js'
import TierChip from '../components/TierChip.jsx'

const TIER_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'A', label: 'A 级' },
  { key: 'B', label: 'B 级' },
  { key: 'C', label: 'C 级' },
]

const GROUP_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'A', label: '安顺主线' },
  { key: 'B', label: '市井安顺' },
  { key: 'C', label: '镇宁专栏' },
]

function tierRank(t) {
  return { A: 0, 'A/B': 1, B: 2, C: 3 }[t] ?? 2
}

function matchesTier(t, f) {
  if (f === 'all') return true
  if (f === 'A') return t === 'A' || t === 'A/B'
  if (f === 'B') return t === 'B' || t === 'A/B'
  return t === 'C'
}

export default function Explore({ embedded = false }) {
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const layerGroup = useRef(null)
  const fitted = useRef(false)
  const [layerOn, setLayerOn] = useState(() => new Set(LAYERS.map((l) => l.key)))
  const [tier, setTier] = useState('all')
  const [group, setGroup] = useState('all')
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(null)

  /* 嵌入首屏时，滚动进入该区块才初始化地图，省流量 */
  const [entered, setEntered] = useState(!embedded)
  const shellRef = useRef(null)
  useEffect(() => {
    if (!embedded || entered) return
    const el = shellRef.current
    if (!el || !('IntersectionObserver' in window)) {
      setEntered(true)
      return
    }
    const io = new IntersectionObserver(
      (en) => {
        if (en[0].isIntersecting) {
          setEntered(true)
          io.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [embedded, entered])

  const visible = useMemo(() => {
    return ENTRIES.filter((e) => {
      if (!layerOn.has(layerOf(e))) return false
      if (!matchesTier(e.traceability, tier)) return false
      if (group !== 'all' && !e.entry_no.startsWith(group)) return false
      if (query.trim()) {
        const q = query.trim()
        const hay = `${e.title} ${e.subtitle} ${e.region} ${e.tags.join(' ')} ${e.category.join(' ')}`
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [layerOn, tier, group, query])

  /* ── 初始化地图 ─────────────────────────── */
  useEffect(() => {
    if (!entered) return
    if (!mapEl.current || mapRef.current) return
    const map = L.map(mapEl.current, {
      center: [26.16, 105.86],
      zoom: 10,
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
    })
    L.tileLayer && addBasemap(map)
    L.control.zoom({ position: 'bottomright' }).addTo(map)
    mapRef.current = map
    layerGroup.current = L.layerGroup().addTo(map)
    setTimeout(() => map.invalidateSize(), 120)
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [entered])

  /* ── 绘制点位与动线 ─────────────────────── */
  useEffect(() => {
    const map = mapRef.current
    const g = layerGroup.current
    if (!map || !g) return
    g.clearLayers()

    const bounds = []
    visible.forEach((e) => {
      const isRoute = e.entry_type === 'route' && e.route_points.length > 1
      if (isRoute) {
        const pts = routePolyline(e)
        const zhenning = e.entry_no.startsWith('C')
        L.polyline(pts, {
          color: zhenning ? '#6B7A8A' : '#3D5A80',
          weight: 2,
          opacity: 0.85,
          dashArray: zhenning ? '7 6' : null,
          lineCap: 'round',
        }).addTo(g)
        e.route_points.forEach((p) => {
          bounds.push([p.coordinates.lat, p.coordinates.lng])
          L.circleMarker([p.coordinates.lat, p.coordinates.lng], {
            radius: 3.4,
            color: zhenning ? '#6B7A8A' : '#3D5A80',
            weight: 1.2,
            fillColor: '#0D1117',
            fillOpacity: 1,
          })
            .addTo(g)
            .bindTooltip(`${e.title} · ${p.order}. ${p.name}`, {
              direction: 'top',
              className: 'maptip',
              offset: [0, -6],
            })
        })
      }

      if (e.entry_type === 'index') return
      bounds.push([e.coordinates.lat, e.coordinates.lng])

      const color = LAYERS.find((l) => l.key === layerOf(e))?.color || '#3D5A80'
      const size = e.traceability === 'A' ? 12 : e.traceability === 'A/B' ? 11 : 10
      const icon = L.divIcon({
        className: 'mkr',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        html: `<span class="mkr__dot mkr__dot--${e.traceability.replace('/', '')}" style="--c:${color}"></span>`,
      })
      const m = L.marker([e.coordinates.lat, e.coordinates.lng], {
        icon,
        riseOnHover: true,
        keyboard: false,
      })
        .addTo(g)
        .on('click', () => {
          setActive(e.entry_id)
          document
            .getElementById(`row-${e.entry_id}`)
            ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
        })
      m.bindTooltip(
        `<b>${e.entry_no}</b> ${e.title}<em>${typeLabel(e.entry_type)} · ${e.traceability}</em>`,
        { direction: 'top', className: 'maptip maptip--rich', offset: [0, -8] },
      )
    })

    if (bounds.length && !fitted.current) {
      fitted.current = true
      map.fitBounds(L.latLngBounds(bounds).pad(0.22), { animate: false, maxZoom: 12 })
    }
  }, [visible, entered])

  const flyTo = (e) => {
    setActive(e.entry_id)
    const map = mapRef.current
    if (!map) return
    if (e.route_points.length > 1) {
      const pts = routePolyline(e)
      map.flyToBounds(L.latLngBounds(pts).pad(0.35), { duration: 0.9 })
    } else {
      map.flyTo([e.coordinates.lat, e.coordinates.lng], 13, { duration: 0.9 })
    }
  }

  const toggleLayer = (k) => {
    setLayerOn((prev) => {
      const next = new Set(prev)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  return (
    <div className={`explore ${embedded ? 'explore--embedded' : ''}`} ref={shellRef}>
      <div className="explore__map" ref={mapEl} />

      {embedded && (
        <div className="explore__crown">
          <p className="eyebrow">探索 / EXPLORE</p>
          <h2>
            把 <span className="mono">{ENTRIES.length}</span> 条条目放回地图上
          </h2>
          <p className="explore__crown-sub">
            点按点位查看条目；动线以实线（安顺）与虚线（镇宁）绘出。
          </p>
        </div>
      )}

      <aside className="panel">
        <div className="panel__head">
          <p className="eyebrow">探索 / EXPLORE</p>
          <h1 className="panel__title">安顺与镇宁</h1>
          <p className="panel__sub">
            {visible.length} 条条目在地图上。颜色是类别，边框是可信度等级。
          </p>
        </div>

        <div className="panel__filter">
          <label className="search">
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="1.4" />
            </svg>
            <input
              value={query}
              onChange={(ev) => setQuery(ev.target.value)}
              placeholder="搜索条目、地名、专名"
              aria-label="搜索条目"
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="清空">
                ×
              </button>
            )}
          </label>

          <div className="filters">
            <div className="filters__group">
              <span className="filters__label">图层</span>
              <div className="chips">
                {LAYERS.map((l) => (
                  <button
                    key={l.key}
                    className={`chip ${layerOn.has(l.key) ? 'is-on' : ''}`}
                    onClick={() => toggleLayer(l.key)}
                  >
                    <span className="chip__dot" style={{ background: l.color }} />
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filters__group">
              <span className="filters__label">可追溯性</span>
              <div className="seg">
                {TIER_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    className={`seg__b ${tier === f.key ? 'is-on' : ''}`}
                    onClick={() => setTier(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="filters__group">
              <span className="filters__label">板块</span>
              <div className="seg seg--wide">
                {GROUP_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    className={`seg__b ${group === f.key ? 'is-on' : ''}`}
                    onClick={() => setGroup(f.key)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="panel__list">
          {visible.length === 0 && (
            <p className="panel__empty">当前筛选下没有条目。放宽图层或等级试试。</p>
          )}
          {visible.map((e) => {
            const color = LAYERS.find((l) => l.key === layerOf(e))?.color
            return (
              <div
                key={e.entry_id}
                id={`row-${e.entry_id}`}
                className={`erow ${active === e.entry_id ? 'is-active' : ''}`}
                onMouseEnter={() => setActive(e.entry_id)}
                onClick={() => flyTo(e)}
              >
                <span className="erow__bar" style={{ background: color }} />
                <div className="erow__body">
                  <div className="erow__top">
                    <span className="erow__no mono">{e.entry_no}</span>
                    <span className="erow__title">{e.title}</span>
                    <TierChip tier={e.traceability} compact />
                  </div>
                  <p className="erow__sub">
                    {e.subtitle}
                    {e.route_points.length > 1 && <span className="erow__badge">动线 {e.route_points.length} 点</span>}
                  </p>
                  <div className="erow__acts">
                    <a href={`#/entry/${e.entry_id}`} onClick={(ev) => ev.stopPropagation()}>
                      查看条目
                    </a>
                    {e.route_points.length > 1 && (
                      <a href={`#/route/${e.entry_id}`} onClick={(ev) => ev.stopPropagation()}>
                        滚动走线
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="panel__legend">
          <div className="legend__row">
            <span className="mkr__dot mkr__dot--A" style={{ '--c': '#3D5A80' }} /> A 级：实心细边框
          </div>
          <div className="legend__row">
            <span className="mkr__dot mkr__dot--B" style={{ '--c': '#3D5A80' }} /> B 级：无边框
          </div>
          <div className="legend__row">
            <span className="mkr__dot mkr__dot--C" style={{ '--c': '#3D5A80' }} /> C 级：虚线边框
          </div>
        </div>
      </aside>
    </div>
  )
}
