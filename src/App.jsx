import React, { useEffect } from 'react'
import { useHashRoute } from './lib/hooks.js'
import Home from './pages/Home.jsx'
import Explore from './pages/Explore.jsx'
import Zhenning from './pages/Zhenning.jsx'
import EntryPage from './pages/EntryPage.jsx'
import RoutePage from './pages/RoutePage.jsx'
import About from './pages/About.jsx'
import SiteNav from './components/SiteNav.jsx'

export default function App() {
  const route = useHashRoute()

  useEffect(() => {
    document.body.dataset.page = route.name
  }, [route.name])

  /* 全站统一的章节显现：任何页面的 [data-reveal] 进入视口后淡入 */
  useEffect(() => {
    const targets = [...document.querySelectorAll('[data-reveal]')]
    if (!targets.length) return
    if (!('IntersectionObserver' in window)) {
      targets.forEach((t) => t.classList.add('is-in'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in')
            io.unobserve(e.target)
          }
        })
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.04 },
    )
    targets.forEach((t) => io.observe(t))
    // 首屏已可见的元素立即显现
    requestAnimationFrame(() => {
      targets.forEach((t) => {
        const r = t.getBoundingClientRect()
        if (r.top < window.innerHeight && r.bottom > 0) t.classList.add('is-in')
      })
    })
    return () => io.disconnect()
  }, [route.name, route.id, route.anchor])

  let page
  if (route.name === 'explore') page = <Explore />
  else if (route.name === 'zhenning') page = <Zhenning anchor={route.anchor} />
  else if (route.name === 'entry') page = <EntryPage id={route.id} />
  else if (route.name === 'route') page = <RoutePage id={route.id} />
  else if (route.name === 'about') page = <About />
  else page = <Home />

  return (
    <>
      <SiteNav route={route} />
      <main key={route.name + (route.id || '')}>{page}</main>
    </>
  )
}
