import React, { useMemo, useState } from 'react'
import { mulberry32, d20 } from './rng.js'
import SpriteArt from './SpriteArt.jsx'
import ArtControls from './ArtControls.jsx'
import FramePickerPanel from './ui/FramePickerPanel.jsx'
import { useArtStore } from './useArtStore.js'
import { useFrameMap } from './useFrameMap.js'
import LootModal from './ui/LootModal.jsx'
import LevelChoiceModal from './ui/LevelChoiceModal.jsx'
import StatusIcons from './ui/StatusIcons.jsx'
import UpgradeChooser from './ui/UpgradeChooser.jsx'
import { attachEngine } from './rules/engine.js'
import { defaultDie, classFaces } from './rules/dice.js'
import { Traits, inferTraitsFromText, tickStatuses } from './traits.js'

function Pill({label}){ return <span className="pill">{label}</span> }

export default function App(){
  const art = useArtStore()
  const frames = useFrameMap()
  const [seed,setSeed] = useState(1337)
  const rand = useMemo(()=>mulberry32(seed),[seed])

  // --- Engine wiring ---
  const [upgradeChoice,setUpgradeChoice] = useState(null)
  const [log,setLog] = useState([])
  function push(msg){ setLog(l=>[...l, msg]) }
  const [party,setParty] = useState([
    {id:1,name:'Tank',hp:20,maxHp:20,armor:0,acc:[],bonusAttack:0,bonusSpells:0,flags:{}},
    {id:2,name:'Healer',hp:20,maxHp:20,armor:0,acc:[],bonusAttack:0,bonusSpells:0,flags:{}},
    {id:3,name:'DPS',hp:20,maxHp:20,armor:0,acc:[],bonusAttack:0,bonusSpells:0,flags:{}},
  ])
  const [enemies,setEnemies] = useState(null)
  const [roomOutcome,setRoomOutcome] = useState(null)
  const [ambush,setAmbush] = useState(false)
  const [sigils,setSigils] = useState(0)
  const [finalReady,setFinalReady] = useState(false)

  const [loot,setLoot] = useState(null)
  const [lootOpen,setLootOpen] = useState(false)
  const [levelModal,setLevelModal] = useState(false)

  const app = { push, rand, get party(){return party}, setParty, get enemies(){return enemies}, setEnemies, log:push }
  attachEngine(app)

  const data = {
    accessories: Array.from({length:20}).map((_,i)=>({ id:i+1, name:`Accessory ${i+1}`, text:`Effect of accessory ${i+1}.`})),
    bosses: Array.from({length:20}).map((_,i)=>({ id:i+1, name:`Boss ${i+1}`, hp:24, armor:2, tier:3, trait:'Reflect 1. Untargetable unless last.' }))
  }

  function rollRoom(){
    const r = d20(rand)
    setRoomOutcome({roll:r, type: r<=12? (r<=6?'T1':'T2') : 'Event'})
    push(`Room roll d20=${r} → ${r<=12? (r<=6?'Tier 1':'Tier 2'):'Event'}`)
  }
  function rollEncounter(){
    if(!roomOutcome){ push('Roll room first.'); return; }
    if(roomOutcome.type==='Event'){ push('Event triggered (not implemented in demo).'); return; }
    const tier = roomOutcome.type==='T1'?1:2
    const cap = tier===1? (art.tier1Grid.cols*art.tier1Grid.rows) : (art.tier2Grid.cols*art.tier2Grid.rows)
    const id = (d20(rand)-1) % cap + 1
    const base = { id, name:`Enemy ${id}`, hp: tier===1?10:14, armor: tier===1?1:2, tier, trait: tier===1? 'Thick Hide. Unstable (on death deal 1).' : 'Corrosive: removes 1 armor. Chill Aura: no reroll 1 turn.' }
    setEnemies([{...base, traitKeys: inferTraitsFromText(base), flags:{}}])
    push(`Encounter: ${tier===1?'Tier 1':'Tier 2'} → Enemy ${id}`)
  }

  function startCombat(){
    if(!roomOutcome || !enemies){ push('Need a room + encounter first.'); return; }
    setEnemies(es=> es.map(e=> ({...e, traitKeys: inferTraitsFromText(e), flags:{} })))
    push(`Combat started vs ${enemies.map(e=>e.name).join(', ')}${ambush?' (Ambush: enemies act first)':''}.`)
    onRoundStart()
  }

  function makeCtx(){
    return {
      log:(m)=>push(m),
      enemies: enemies||[],
      party,
    }
  }

  function onRoundStart(){
    setEnemies(es=> es?.map(e=>{
      if(!e) return e
      const ctx = makeCtx()
      e.traitKeys?.forEach(k => Traits[k]?.onRoundStart?.(e, ctx))
      return e
    }))
    push('Round start.')
  }

  function onRoundEnd(){
    setParty(p => p.map(h => { const copy = {...h}; tickStatuses(copy, {log: (m)=>push(m)}); return copy }))
    setEnemies(es => es?.map(e => { const copy = {...e}; tickStatuses(copy, {log: (m)=>push(m)}); return copy }))
    push('End of round effects resolved.')
  }

  function partyAttack(){
    if(!enemies) return;
    const target = enemies[0]
    if(!target) return
    if(target?.flags?.untargetableUnlessLast && enemies.filter(e=>e.hp>0).length>1){ push(`${target.name} is untargetable while allies live.`); return; }
    let raw = 4 + (party[0]?.bonusAttack||0)
    let mitigated = Math.max(0, raw - (target.armor||0))
    const next = {...target, hp: target.hp - mitigated}
    setEnemies([next])
    push(`Party hits ${target.name} for ${mitigated} (raw ${raw}${target.armor?`, -${target.armor} armor`:''}). HP now ${Math.max(next.hp,0)}`)
  }

  function enemyAttack(){
    if(!enemies) return;
    const e = enemies[0]; if(e.hp<=0){ push(`${e.name} is defeated.`); return; }
    const idx = Math.floor(rand()*party.length)
    const h = party[idx]
    let raw = e.tier===1?2:4
    let mitigated = Math.max(0, raw - (h.armor||0))
    const nextHp = (h.hp - mitigated)
    setParty(p=>p.map((x,i)=>i===idx?{...x,hp:nextHp}:x))
    push(`${e.name} hits ${h.name} for ${mitigated} (raw ${raw}${h.armor?`, -${h.armor} armor`:''}). ${h.name} HP now ${Math.max(nextHp,0)}`)
    onRoundEnd()
  }

  function cleanup(){
    if(!enemies) return
    const e = enemies[0]
    if(e.hp<=0){
      push(`${e.name} defeated.`)
      if(e.tier===1) onTier1Victory()
      if(e.tier===2) onTier2Victory()
      if(e.tier===3) onBossVictory()
    }else{
      push(`Enemy still has ${e.hp} HP.`)
    }
  }

  function openLootFromRoll(category){
    const roll = d20(rand)
    const acc = { id: roll, name: `Accessory ${roll}`, text: `Effect of accessory ${roll}.` }
    setLoot(acc); setLootOpen(true)
    push(`${category} loot roll d20=${roll}: ${acc.id}. ${acc.name}`)
  }
  function takeLoot(playerIndex=0){
    if(!loot){ setLootOpen(false); return; }
    setParty(p=>p.map((h,i)=>{
      if(i!==playerIndex) return h
      const has = h.acc || []
      if(has.length>=2) return h
      if(has.find(a=>a.id===loot.id)) return h
      return { ...h, acc:[...has, loot] }
    }))
    setLootOpen(false)
    push(`Equipped ${loot.name} to ${party[playerIndex].name}.`)
  }
  function skipLoot(){ setLootOpen(false); push('Loot declined.') }

  function onTier1Victory(){ setLevelModal(true) }
  function onChooseLevel(playerId, choice){
    if(choice==='level'){
      setParty(p=>p.map(h=> h.id===playerId ? { ...h, bonusAttack:(h.bonusAttack||0)+1, bonusSpells:(h.bonusSpells||0)+1, hp:h.maxHp } : h))
      push(`Level up: +1 attack & +1 spells for player ${playerId}; spells reset.`)
    }else{
      push(`Kept upgrades for player ${playerId}.`)
    }
  }
  function onTier2Victory(){ openLootFromRoll('Tier 2') }
  function onBossVictory(){
    openLootFromRoll('Boss')
    setSigils(s=>{
      const n = s+1
      if(n>=3){ setFinalReady(true); push('The Sigil is complete — Final Boss unlocked!'); }
      return n
    })
  }
  function startFinalBoss(){
    setParty(p=>p.map(h=>({...h, hp:h.maxHp})))
    const r = d20(rand)
    const base = { id:r, name:`Boss ${r}`, hp:24, armor:2, tier:3, trait:'Reflect 1. Untargetable unless last.' }
    const fb = { ...base, name: base.name + ' (Final Boss)', hp: Math.round(base.hp*1.5), traitKeys: inferTraitsFromText(base), flags:{} }
    setEnemies([fb]); setFinalReady(false)
    push(`Final Boss revealed: ${base.name} (+50% HP).`)
    onRoundStart()
  }

  return (
    <>
      <div className="container">
        <h1>Dice Arena — React</h1>
        <div className="small muted">Prototype with art, traits, loot, level-up, sigils, and final boss.</div>

        <div className="grid" style={{marginTop:12}}>
          {/* LEFT COLUMN */}
          <div>
            <ArtControls art={art} />
            <FramePickerPanel art={art} frames={frames} />

            <div className="card">
              <h2>Party</h2>
              {party.map((h,idx)=>(
                <div key={h.id} className="card" style={{marginTop:8}}>
                  <div className="row" style={{justifyContent:'space-between'}}>
                    <div className="bold">{h.name}</div>
                    <div className="small">
                      <Pill label={`HP ${h.hp}/${h.maxHp}`}/> <Pill label={`Armor ${h.armor}`}/>
                    </div>
                  </div>

                  <div className="row" style={{gap:8, marginTop:6}}>
                    <label className="small muted">Class</label>
                    <select value={h.classId||''} onChange={(e)=>{
                      const id = e.target.value
                      setParty(p=>p.map((x,i)=> i===idx ? { ...x, classId:id, die:[...(x.die?.filter(f=>!f.classId) || []), ...classFaces(id)] } : x))
                    }} style={{ background:'#0f141b', border:'1px solid #28384a', color:'#e7edf5', borderRadius:6, padding:'4px 6px' }}>
                      <option value="">(none)</option>
                      <option value="thief">Thief</option>
                      <option value="judge">Judge</option>
                      <option value="tank">Tank</option>
                      <option value="vampire">Vampire</option>
                      <option value="king">King</option>
                      <option value="lich">Lich</option>
                      <option value="paladin">Paladin</option>
                      <option value="barbarian">Barbarian</option>
                    </select>

                    <button className="btn" onClick={()=>{
                      const hero = party[idx]
                      if(!hero.die) hero.die = defaultDie()
                      const face = app.rollFace(hero)
                      app.resolveFace(hero, face)
                      app.endHeroTurn(hero)
                      setParty(p=>[...p]) // refresh
                      setUpgradeChoice(app._upgradeChoice || null)
                    }}>Roll Face</button>

                    <div className="small muted">{party[idx]?._lastFace ? `Last: ${party[idx]._lastFace.name} (T${party[idx]._lastFace.tier||0})` : '—'}</div>
                  </div>

                  <StatusIcons flags={h.flags} compact />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            <div className="card">
              <h2>Exploration</h2>
              <div className="bar">
                <button className="btn" onClick={rollRoom}>Roll Room (d20)</button>
                <button className="btn" onClick={rollEncounter}>Roll Encounter</button>
                <button className="btn" onClick={startCombat}>Start Combat</button>
                <div className="pill">Room: {roomOutcome ? `${roomOutcome.type} (d20=${roomOutcome.roll})` : '—'}</div>
              </div>
            </div>

            <div className="card">
              <h2>Encounter</h2>
              {!enemies && <div className="small muted">No enemies yet.</div>}
              {enemies && enemies.map((e, i)=>(
                <div key={i} className="card" style={{marginTop:8}}>
                  <div className="row" style={{justifyContent:'space-between', alignItems:'center'}}>
                    <div className="bold">{e.name}</div>
                    <div className="small">
                      <Pill label={`HP ${e.hp}`}/> <Pill label={`Armor ${e.armor}`}/>
                    </div>
                  </div>

                  <div className="small"><span className="bold">Trait:</span> {e.trait}</div>
                  <StatusIcons flags={e.flags}/>

                  <div style={{marginTop:8, display:'flex', gap:12, alignItems:'center'}}>
                    {e.tier===1 && <SpriteArt img={art.tier1Img} cols={art.tier1Grid.cols} rows={art.tier1Grid.rows} index={frames.getFrame(1, e.id)} width={120} height={180} border={true}/>} 
                    {e.tier===2 && <SpriteArt img={art.tier2Img} cols={art.tier2Grid.cols} rows={art.tier2Grid.rows} index={frames.getFrame(2, e.id)} width={120} height={180} border={true}/>} 
                    {e.tier===3 && <SpriteArt img={art.bossImg} cols={art.bossGrid.cols} rows={art.bossGrid.rows} index={frames.getFrame(3, e.id)} width={120} height={180} border={true}/>} 
                  </div>

                  <div className="bar" style={{marginTop:8}}>
                    <button className="btn secondary" onClick={enemyAttack}>Enemy Attack</button>
                    <button className="btn" onClick={cleanup}>Cleanup (if defeated)</button>
                    <button className="btn" onClick={()=>setAmbush(a=>!a)}>{ambush?'Ambush: ON':'Ambush: OFF'}</button>
                    <button className="btn" onClick={onRoundStart}>[Round Start]</button>
                    <button className="btn secondary" onClick={onRoundEnd}>[End Round]</button>
                    <button className="btn" onClick={partyAttack}>Party Attack</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="card">
              <h2>Sigil Progress</h2>
              <div className="bar">
                <div className="pill">Pieces: {sigils}/3</div>
                {finalReady && <button className="btn" onClick={startFinalBoss}>Enter Final Boss</button>}
              </div>
            </div>

            <div className="card">
              <h2>Art Preview</h2>
              <div className="bar">
                <SpriteArt img={art.tier1Img} cols={art.tier1Grid.cols} rows={art.tier1Grid.rows} index={1} width={80} height={120} border={true}/>
                <SpriteArt img={art.tier2Img} cols={art.tier2Grid.cols} rows={art.tier2Grid.rows} index={1} width={80} height={120} border={true}/>
                <SpriteArt img={art.bossImg} cols={art.bossGrid.cols} rows={art.bossGrid.rows} index={1} width={80} height={120} border={true}/>
                <SpriteArt img={art.accImg} cols={art.accGrid.cols} rows={art.accGrid.rows} index={1} width={80} height={120} border={true}/>
              </div>
            </div>

            <div className="card">
              <h2>Log</h2>
              <div className="small muted">{log.length===0 && 'No messages yet.'}</div>
              <ul className="small" style={{marginTop:8}}>
                {log.map((m,i)=>(<li key={i}>{m}</li>))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <footer className="small muted" style={{textAlign:'center', padding:'10px 0'}}>
        Dice Arena © You — React prototype. Default sheets loaded from <code>/public/art</code>.
      </footer>

      <LootModal open={lootOpen} accessory={loot} onTake={()=>takeLoot(0)} onSkip={skipLoot} art={art.accImg} grid={art.accGrid} />
      <LevelChoiceModal open={levelModal} party={party} onChoose={onChooseLevel} />
      <UpgradeChooser
        choice={upgradeChoice || app._upgradeChoice}
        onKeepNew={()=>{ app.commitUpgrade(true); setUpgradeChoice(null); setParty(p=>[...p]) }}
        onKeepOld={()=>{ app.commitUpgrade(false); setUpgradeChoice(null); setParty(p=>[...p]) }}
      />
    </>
  )
}
