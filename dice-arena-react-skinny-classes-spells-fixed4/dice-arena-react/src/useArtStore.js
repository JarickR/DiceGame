import { useEffect, useState } from 'react'

function loadGrid(key, fallback){
  try{
    const raw = localStorage.getItem(key)
    if(!raw) return fallback
    const v = JSON.parse(raw)
    if(typeof v?.cols==='number' && typeof v?.rows==='number') return v
  }catch(e){}
  return fallback
}
function saveGrid(key, value){
  try{ localStorage.setItem(key, JSON.stringify(value)) }catch(e){}
}

export function useArtStore(){
  const [tier1Img,setTier1Img] = useState('/art/Tier1.png')
  const [tier2Img,setTier2Img] = useState('/art/Tier2.png')
  const [bossImg,setBossImg]   = useState('/art/Boss.png')
  const [accImg,setAccImg]     = useState('/art/Accessories.png')

  const [tier1Grid,setTier1Grid] = useState(()=>loadGrid('grid_tier1',{cols:10,rows:2}))
  const [tier2Grid,setTier2Grid] = useState(()=>loadGrid('grid_tier2',{cols:5,rows:4}))
  const [bossGrid,setBossGrid]   = useState(()=>loadGrid('grid_boss',{cols:5,rows:4}))
  const [accGrid,setAccGrid]     = useState(()=>loadGrid('grid_acc',{cols:5,rows:4}))

  useEffect(()=>saveGrid('grid_tier1', tier1Grid), [tier1Grid])
  useEffect(()=>saveGrid('grid_tier2', tier2Grid), [tier2Grid])
  useEffect(()=>saveGrid('grid_boss', bossGrid), [bossGrid])
  useEffect(()=>saveGrid('grid_acc', accGrid), [accGrid])

  function resetDefaults(){
    setTier1Grid({cols:10,rows:2})
    setTier2Grid({cols:5,rows:4})
    setBossGrid({cols:5,rows:4})
    setAccGrid({cols:5,rows:4})
  }

  return {
    tier1Img,tier2Img,bossImg,accImg,
    tier1Grid,tier2Grid,bossGrid,accGrid,
    setTier1Img,setTier2Img,setBossImg,setAccImg,
    setTier1Grid,setTier2Grid,setBossGrid,setAccGrid,
    resetDefaults
  }
}
