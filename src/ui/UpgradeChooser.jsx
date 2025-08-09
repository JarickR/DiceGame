import React from 'react';

/**
 * UpgradeChooser
 * - Shows old/new face names
 * - If `renderSprite` is provided, shows sprite previews (uses your Portrait renderer)
 *   Pass a function: ({ tier, index }) => <Portrait .../>
 *   You can add `spriteTier` and `spriteIndex` to your face objects to light this up.
 */
export default function UpgradeChooser({ choice, onKeepNew, onKeepOld, renderSprite }) {
  if (!choice) return null;

  const oldFace = choice.oldFace || {};
  const newFace = choice.newFace || {};

  const OldSprite = renderSprite
    ? renderSprite({ tier: oldFace.spriteTier ?? oldFace.tier, index: oldFace.spriteIndex ?? 0 })
    : null;

  const NewSprite = renderSprite
    ? renderSprite({ tier: newFace.spriteTier ?? newFace.tier, index: newFace.spriteIndex ?? 0 })
    : null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ marginTop: 0 }}>Upgrade</h2>
        <p className="small muted" style={{ marginTop: 6 }}>
          Replace the selected face with a random face of the next tier (or keep the old one).
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div style={panelStyle}>
            <div className="bold" style={{ marginBottom: 6 }}>Old</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {OldSprite}
              </div>
              <div>
                <div className="small">{oldFace.name || '—'}</div>
                <div className="small" style={{ opacity: .7 }}>T{oldFace.tier ?? 0}</div>
              </div>
            </div>
          </div>

          <div style={panelStyle}>
            <div className="bold" style={{ marginBottom: 6 }}>New</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 96, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {NewSprite}
              </div>
              <div>
                <div className="small">{newFace.name || '—'}</div>
                <div className="small" style={{ opacity: .7 }}>T{newFace.tier ?? 0}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button className="btn" onClick={onKeepNew}>Take New</button>
          <button className="btn secondary" onClick={onKeepOld}>Keep Old</button>
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
  zIndex: 50
};
const modalStyle = {
  background: '#12151a',
  border: '1px solid #242a34',
  borderRadius: 12,
  padding: 16,
  width: 560,
  color: '#e8ecf1'
};
const panelStyle = {
  background: '#0b0e13',
  border: '1px solid #242a34',
  borderRadius: 10,
  padding: 10
};
