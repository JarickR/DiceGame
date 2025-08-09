import React from 'react';

/**
 * LootModal
 * Props:
 *  - offer: { heroName, d20, itemIndex }
 *  - onAccept(), onSkip()
 *  - renderItem(index) -> ReactNode (use Portrait with items sheet)
 */
export default function LootModal({ offer, onAccept, onSkip, renderItem }) {
  if (!offer) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ marginTop: 0 }}>Accessory Found</h2>
        <p className="small muted" style={{ marginTop: 6 }}>
          {offer.heroName || 'Hero'} rolled a <b>d20 = {offer.d20}</b>. This reveals accessory #{(offer.itemIndex ?? 0) + 1}.
        </p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
          <div style={{ width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {renderItem?.(offer.itemIndex)}
          </div>
          <div className="small" style={{ opacity: .8 }}>
            Tier-2 enemies drop one accessory. You may accept it (max 2 accessories) or skip it.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="btn" onClick={onAccept}>Accept</button>
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
  width: 520,
  color: '#e8ecf1'
};
