// src/ui/UpgradeModal.jsx
import React from "react";

/**
 * Pure presentational modal. No engine imports.
 * Props:
 *  - open: boolean
 *  - hero: { id, name, spells[] } | null
 *  - offer: { locked, oldSpell, newSpell } | null
 *  - renderSprite: ({tier,index}) => ReactNode
 *  - spriteParams: (spell|null) => {tier,index}|null
 *  - onChooseSlot: (i:number) => void
 *  - onAccept: (takeNew:boolean) => void
 *  - onClose: () => void
 */
export default function UpgradeModal({
  open,
  hero,
  offer,
  renderSprite,
  spriteParams,
  onChooseSlot,
  onAccept,
  onClose,
}) {
  if (!open || !hero) return null;

  const locked = !!offer?.locked;

  return (
    <div style={overlay} onMouseDown={(e)=>e.stopPropagation()}>
      <div style={modal} onMouseDown={(e)=>e.stopPropagation()} role="dialog" aria-modal="true">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
          <h2 style={{ margin: 0 }}>Upgrade</h2>
          <button type="button" style={btnGhost} onClick={onClose}>Close</button>
        </div>
        {!locked && (
          <div className="small" style={{ opacity:.8, marginBottom:10 }}>
            Choose a spell slot on <b>{hero.name}</b> to upgrade.
          </div>
        )}
        {locked && (
          <div className="small" style={{ opacity:.8, marginBottom:10 }}>
            A single candidate was rolled. No rerolls allowed.
          </div>
        )}

        {/* Unlocked: slot list */}
        {!locked && (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:10 }}>
            {(hero.spells || [null,null,null,null]).map((sp, i) => {
              const p = spriteParams(sp); // null for blanks => show placeholder
              const title = sp ? `${sp.name} (T${sp.tier})` : "Blank";
              const desc  = sp?.desc || (sp ? "" : "Upgrade → random Tier 1");
              return (
                <div key={i} style={card}>
                  <div className="small" style={{ opacity:.7, marginBottom:6 }}>Slot {i+1}</div>
                  {p && renderSprite ? renderSprite(p) : <div style={ph} />}
                  <div style={{ fontWeight:700, marginTop:6 }}>{title}</div>
                  <div className="small" style={{ opacity:.8 }}>{desc}</div>
                  <div style={{ display:"flex", justifyContent:"flex-end", marginTop:8 }}>
                    <button type="button" style={btnPrimary} onClick={() => onChooseSlot(i)}>
                      Upgrade this
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Locked: old vs new */}
        {locked && (
          <div style={{ display:"grid", gap:12 }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
              <div style={card}>
                <div className="small" style={{ opacity:.7, marginBottom:6 }}>Old</div>
                {offer.oldSpell && renderSprite
                  ? renderSprite(spriteParams(offer.oldSpell))
                  : <div style={ph} />
                }
                <div style={{ fontWeight:700, marginTop:6 }}>
                  {offer.oldSpell ? `${offer.oldSpell.name} (T${offer.oldSpell.tier})` : "Blank"}
                </div>
                <div className="small" style={{ opacity:.8 }}>
                  {offer.oldSpell?.desc || (offer.oldSpell ? "" : "No spell on this face.")}
                </div>
              </div>

              <div style={card}>
                <div className="small" style={{ opacity:.7, marginBottom:6 }}>New</div>
                {offer.newSpell && renderSprite
                  ? renderSprite(spriteParams(offer.newSpell))
                  : <div style={ph} />
                }
                <div style={{ fontWeight:700, marginTop:6 }}>
                  {offer.newSpell ? `${offer.newSpell.name} (T${offer.newSpell.tier})` : "—"}
                </div>
                <div className="small" style={{ opacity:.8 }}>
                  {offer.newSpell?.desc || ""}
                </div>
              </div>
            </div>

            <div style={{ display:"flex", gap:8, justifyContent:"flex-end" }}>
              <button type="button" style={btnSecondary} onClick={() => onAccept(false)}>Keep Old</button>
              <button type="button" style={btnPrimary}   onClick={() => onAccept(true)}>Take New</button>
            </div>
          </div>
        )}

        {/* tiny debug line */}
        <div className="small" style={{ opacity:.6, marginTop:10 }}>
          Debug: hero #{hero.id} • locked={String(locked)}
        </div>
      </div>
    </div>
  );
}

/* ----- styles ----- */
const overlay = {
  position:"fixed", inset:0,
  background:"rgba(0,0,0,.6)", backdropFilter:"blur(2px)",
  zIndex: 999999,
  display:"flex", alignItems:"center", justifyContent:"center",
  pointerEvents:"auto"
};
const modal = {
  width: 860, maxWidth:"95vw",
  background:"#0e1116", color:"#e8f1ff",
  border:"1px solid #242a34", borderRadius:16,
  padding:16, boxShadow:"0 30px 80px rgba(0,0,0,.55)",
  pointerEvents:"auto"
};
const card = { background:"#0b0e13", border:"1px solid #242a34", borderRadius:12, padding:12 };
const ph   = { width:96, height:Math.round((375/500)*96), borderRadius:12, background:"rgba(255,255,255,.03)", border:"1px dashed #2b3342" };

const btnPrimary   = { background:"#1d3557", border:"1px solid #2b4f7c", color:"#e8f1ff", borderRadius:10, padding:"10px 14px", cursor:"pointer" };
const btnSecondary = { background:"#12151a", border:"1px solid #2b3342", color:"#e8f1ff", borderRadius:10, padding:"10px 14px", cursor:"pointer" };
const btnGhost     = { background:"transparent", border:"1px solid #2b3342", color:"#e8f1ff", borderRadius:10, padding:"8px 12px", cursor:"pointer" };
