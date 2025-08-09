import { useEffect, useState } from 'react'

function load(key, fallback){
  try{
    const raw = localStorage.getItem(key)
    if(!raw) return fallback
    const v = JSON.parse(raw)
    return v && typeof v==='object' ? v : fallback
  }catch(e){ return fallback }
}
function save(key, value){
  try{ localStorage.setItem(key, JSON.stringify(value)) }catch(e){}
}

/**
 * Frame map: maps entity ID (1..20) to a sheet frame index (1..N).
 * Separate maps for tier1, tier2, boss.
 */
export function useFrameMap(){
  const [t1, setT1] = useState(()=>load('frame_t1', {}))
  const [t2, setT2] = useState(()=>load('frame_t2', {}))
  const [boss, setBoss] = useState(()=>load('frame_boss', {}))

  useEffect(()=>save('frame_t1', t1), [t1])
  useEffect(()=>save('frame_t2', t2), [t2])
  useEffect(()=>save('frame_boss', boss), [boss])

  function reset(){
    setT1({}); setT2({}); setBoss({})
  }
  function getFrame(tier, id){
    if(tier===1) return t1[id] || id
    if(tier===2) return t2[id] || id
    if(tier===3) return boss[id] || id
    return id
  }
  function setFrame(tier, id, frameIndex){
    if(tier===1) setT1(prev=>({...prev, [id]: frameIndex}))
    if(tier===2) setT2(prev=>({...prev, [id]: frameIndex}))
    if(tier===3) setBoss(prev=>({...prev, [id]: frameIndex}))
  }

  return { t1, t2, boss, setT1, setT2, setBoss, reset, getFrame, setFrame }
}
