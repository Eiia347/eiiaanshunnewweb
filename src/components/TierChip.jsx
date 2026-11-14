import React from 'react'
import { TOTAL } from '../data/kb.js'
import { TIER_LABEL, tierNote } from '../data/kb.js'

const ORDER = ['A', 'A/B', 'B', 'C']

export default function TierChip({ tier, compact = false }) {
  return (
    <span className={`tier tier--${tier.replace('/', '')} ${compact ? 'tier--compact' : ''}`} title={tierNote(tier)}>
      {compact ? tier : TIER_LABEL[tier] || tier}
    </span>
  )
}

export function TierLegend() {
  return (
    <div className="tierlegend">
      {ORDER.map((t) => (
        <div className="tierlegend__row" key={t}>
          <TierChip tier={t} compact />
          <span>{tierNote(t)}</span>
        </div>
      ))}
    </div>
  )
}

export function StatsStrip() {
  const items = [
    ['条目', TOTAL.entries],
    ['来源', TOTAL.sources],
    ['断言', TOTAL.claims],
    ['A 级及以上', TOTAL.tierA],
  ]
  return (
    <div className="stats">
      {items.map(([k, v]) => (
        <div className="stats__cell" key={k}>
          <div className="stats__v mono">{String(v).padStart(2, '0')}</div>
          <div className="stats__k">{k}</div>
        </div>
      ))}
    </div>
  )
}
