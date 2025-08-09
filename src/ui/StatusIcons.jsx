import React from 'react'

const ICON = {
  bleed: (s=16)=> (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2s6 7 6 11a6 6 0 11-12 0c0-4 6-11 6-11z"/></svg>),
  noReroll: (s=16)=> (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v4H4zM4 10h16v10H4z"/><path d="M6 12l12 8M18 12l-12 8" stroke="#111" strokeWidth="2"/></svg>),
  firstReduce: (s=16)=> (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/></svg>),
  untargetableUnlessLast: (s=16)=> (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 019 9h-2a7 7 0 10-7 7v2a9 9 0 110-18z"/></svg>),
  reflect1: (s=16)=> (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M3 12l8-8 2 2-6 6 6 6-2 2-8-8zM19 3v18h2V3h-2z"/></svg>),
  healBlock: (s=16)=> (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.35-7-10a4 4 0 018-1 4 4 0 018 1c0 5.65-7 10-7 10z"/><path d="M6 6l12 12" stroke="#111" strokeWidth="2"/></svg>),
  armorShred: (s=16)=> (<svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z"/><path d="M5 19l14-14" stroke="#111" strokeWidth="2"/></svg>),
}
const LABEL = {
  bleed: 'Bleed', noReroll: 'No Reroll', firstReduce: 'First-Hit Shield',
  untargetableUnlessLast: 'Untargetable unless last', reflect1: 'Reflect 1',
  healBlock: 'Heal -1 / Block', armorShred: 'Armor Shred'
}
function Count({n}){ if(!n || n<=1) return null; return <span className="status-count">x{n}</span> }

export default function StatusIcons({ flags={}, compact=false }){
  const keys = Object.keys(flags||{}).filter(k => flags[k])
  if(!keys.length) return null
  return (
    <div style={{display:'flex', gap:8, flexWrap:'wrap', marginTop: compact? 4 : 8}}>
      {keys.map(k => {
        const val = flags[k]
        const stacks = (typeof val==='object' && (val.stacks || val.amount)) ? (val.stacks||val.amount) : null
        return (
          <span key={k} className={"status fx-"+k} title={LABEL[k] || k}>
            {ICON[k]?.(14)}<Count n={stacks}/>
          </span>
        )
      })}
    </div>
  )
}
