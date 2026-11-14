import React, { useEffect, useRef } from 'react'
import { TOTAL, CHAPTERS } from '../data/kb.js'
import { useReducedMotion } from '../lib/hooks.js'
import { StatsStrip } from '../components/TierChip.jsx'

export default function Hero() {
  const reduced = useReducedMotion()
  const rootRef = useRef(null)

  useEffect(() => {
    if (reduced) return
    const el = rootRef.current
    if (!el) return
    let raf = 0
    const on = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = 0
        const y = window.scrollY
        const layer = el.querySelector('.hero__bg')
        const text = el.querySelector('.hero__inner')
        if (layer) layer.style.transform = `translate3d(0,${y * 0.24}px,0) scale(${1 + y * 0.00012})`
        if (text) {
          const p = Math.min(1, y / (window.innerHeight * 0.8))
          text.style.opacity = String(1 - p * 1.15)
          text.style.transform = `translate3d(0,${y * 0.14}px,0)`
        }
      })
    }
    window.addEventListener('scroll', on, { passive: true })
    return () => {
      window.removeEventListener('scroll', on)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [reduced])

  return (
    <div className="hero" ref={rootRef}>
      <div className="hero__bg" aria-hidden="true">
        <div className="hero__ridge hero__ridge--far" />
        <div className="hero__ridge hero__ridge--mid" />
        <div className="hero__ridge hero__ridge--near" />
        <div className="hero__grain" />
        <div className="hero__vignette" />
        <div className="hero__lamp hero__lamp--1" />
        <div className="hero__lamp hero__lamp--2" />
      </div>

      <div className="hero__inner">
        <p className="hero__eyebrow eyebrow">
          在地 · 安顺／镇宁 · 信息收集知识库
        </p>

        <h1 className="hero__title">
          每一条信息，
          <br />
          都能回到它来的地方。
        </h1>

        <p className="hero__lede">
          屯堡 · 地戏 · 蜂糖李 · 布依族饮食 · 市井动线
        </p>

        <div className="hero__cta">
          <a className="btn-enter" href="#/explore">
            <span>进入知识库</span>
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M4 12h14M12 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </a>
        </div>

        <StatsStrip />
      </div>

      <div className="hero__foot">
        <span className="hero__scroll mono">向下滚动</span>
        <span className="hero__rule" aria-hidden="true" />
        <span className="hero__footnote">
          {CHAPTERS.length} 个镇宁章节 · 36 条条目 · 断言均可回溯
        </span>
      </div>

      <div className="hero__band" aria-hidden="true">
        <span>屯堡</span><span>地戏</span><span>蜂糖李</span><span>波波糖</span>
        <span>蜡染</span><span>苗银</span><span>布依族饮食</span><span>喀斯特</span>
      </div>
    </div>
  )
}
