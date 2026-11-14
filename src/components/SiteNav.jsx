import React, { useEffect, useState } from 'react'

const LINKS = [
  { key: 'hero', label: '入口', href: '#/' },
  { key: 'explore', label: '探索', href: '#/explore' },
  { key: 'zhenning', label: '镇宁专栏', href: '#/zhenning' },
  { key: 'about', label: '方法', href: '#/about' },
]

export default function SiteNav({ route }) {
  const [solid, setSolid] = useState(false)
  const [past, setPast] = useState(false)

  useEffect(() => {
    const on = () => {
      setSolid(window.scrollY > 12)
      setPast(window.scrollY > window.innerHeight * 0.55)
    }
    on()
    window.addEventListener('scroll', on, { passive: true })
    window.addEventListener('resize', on)
    return () => {
      window.removeEventListener('scroll', on)
      window.removeEventListener('resize', on)
    }
  }, [])

  // 首屏不承载导航（沉浸入口），滚动过半屏后淡入
  const hidden = route.name === 'hero' && !past
  // 条目页与动线页归入「探索」，让导航始终有当前位置
  const section =
    route.name === 'entry' || route.name === 'route' ? 'explore' : route.name

  return (
    <header className={`sitenav ${solid ? 'is-solid' : ''} ${hidden ? 'is-hidden' : ''}`}>
      <a className="sitenav__brand" href="#/">
        <span className="sitenav__mark" aria-hidden="true">
          <svg viewBox="0 0 28 28" width="22" height="22">
            <path d="M3 21 L9 9 L14 17 L18 11 L25 21 Z" fill="none" stroke="#B8935A" strokeWidth="1.2" />
            <circle cx="14" cy="6" r="1.8" fill="#3D5A80" />
          </svg>
        </span>
        <span className="sitenav__name">在地</span>
        <span className="sitenav__sub">安顺／镇宁</span>
      </a>

      <nav className="sitenav__links">
        {LINKS.map((l) => (
          <a
            key={l.key}
            href={l.href}
            className={`sitenav__link ${section === l.key ? 'is-active' : ''}`}
            aria-current={section === l.key ? 'page' : undefined}
          >
            {l.label}
          </a>
        ))}
      </nav>

      <div className="sitenav__meta mono">
        <span className="dot" />
        只收集 · 不交易
      </div>
    </header>
  )
}
