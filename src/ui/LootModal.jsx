import React, { useState, useEffect } from 'react';
import { ACCESSORY_INFO } from "../art/manifest.js";

/**
 * LootModal
 * Props:
 *  - offer: { heroId, heroName, d20, itemIndex }
 *  - heroInventory: number[] (indexes of current items, length 0..2)
 *  - onAccept(replaceIndex|null), onSkip()
 *  - renderItem(index) -> ReactNode (use Portrait with items sheet)
 *  - renderItemSmall(index) -> ReactNode (optional smaller previews)
 */
export default function LootModal({ offer, heroInventory = [], onAccept, onSkip, renderItem, renderItemSmall }) {
  const [replaceIndex, setReplaceIndex] = useState(null);

  useEffect(() => {
    // Reset selection whenever a new offer appears
    setReplaceIndex(null);
  }, [offer?.heroId, offer?.itemIndex]);

  if (!offer) return null;

  const full = (heroInventory?.length || 0) >= 2;
  const newInfo = ACCESSORY_INFO[offer.itemIndex] || {};

  const acceptDisabled = full ? (replaceIndex !== 0 && replaceIndex !== 1) : false;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ marginTop: 0 }}>Accessory Found</h2>
        <p className="small muted" style={{ marginTop: 6, lineHeight:1.6 }}>
          {offer.heroName || 'Hero'} rolled a <b>d20 = {offer.d20}</b> and revealed:
        </p>

        {/* New item preview */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 10 }}>
          <div style={{ width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderItem?.(offer.itemIndex)}
          </div>
          <div className="small">
            <div style={{ fontWeight: 700 }}>{newInfo.name || `Item #${(offer.itemIndex ?? 0)+1}`}</div>
            <div style={{ opacity:.85 }}>{newInfo.desc || ''}</div>
          </div>
        </div>

        {/* Replace flow when inventory full */}
        {full && (
          <div style={{ marginTop: 14 }}>
            <div className="small" style={{ marginBottom: 6, opacity:.85 }}>
              Inventory is full. Choose a slot to replace:
            </div>
            <div style={{ display:'flex', gap:12 }}>
              {[0,1].map((slot) => {
                const idx = heroInventory[slot] ?? 0;
                const info = ACCESSORY_INFO[idx] || {};
                const selected = replaceIndex === slot;
                return (
                  <button
                    key={slot}
                    onClick={() => setReplaceIndex(slot)}
                    style={{
                      display:'flex', alignItems:'center', gap:8,
                      padding:8, borderRadius:10,
                      border: selected ? '2px solid #93f2b0' : '1px solid #242a34',
                      background: selected ? '#0f1a15' : '#0b0e13',
                      cursor:'pointer', flex:1, textAlign:'left'
                    }}
                    title={`${info.name || `Item #${idx+1}`}\n${info.desc || ''}`}
                  >
                    <div style={{ width:48, height:48, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {renderItemSmall?.(idx) || renderItem?.(idx)}
                    </div>
                    <div className="small" style={{ lineHeight:1.3 }}>
                      <div style={{ fontWeight:700 }}>Slot {slot+1}</div>
                      <div>{info.name || `Item #${idx+1}`}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="btn" disabled={acceptDisabled} onClick={() => onAccept?.(full ? replaceIndex : null)}>
            {full ? 'Replace Selected Slot' : 'Accept'}
          </button>
          <button className="btn secondary" onClick={onSkip}>Skip</button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  backdropFilter: 'blur(4px)',
  background: 'rgba(0,0,0,.55)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 60
};
const modalStyle = {
  background: '#12151a',
  border: '1px solid #242a34',
  borderRadius: 12,
  padding: 16,
  width: 560,
  color: '#e8ecf1'
};
