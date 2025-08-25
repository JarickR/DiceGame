// src/ui/UpgradeModal.jsx
import React from "react";
import "./UpgradeModal.css";
import SpellIcon from "../ui/SpellIcon";

/**
 * Props:
 * - open: boolean
 * - title: string (e.g., "Upgrade — P1")
 * - heroId: string|number
 * - slots: [{ type:'spell'|'blank', tier?:1|2|3, name?:string }] length 4
 * - onPick: (slotIndex:number)=>void
 * - onClose: ()=>void
 */
export default function UpgradeModal({
  open,
  title = "Upgrade",
  heroId,
  slots = [],
  onPick,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="umodal-backdrop" role="dialog" aria-modal="true">
      <div className="umodal-container">
        <div className="umodal-header">
          <div className="umodal-title">{title}</div>
          <button className="btn btn-small" onClick={onClose} aria-label="Close">
            Close
          </button>
        </div>

        <div className="umodal-subtitle">Select a spell slot to upgrade:</div>

        <div className="upgrade-grid">
          {slots.map((slot, idx) => {
            const isBlank = !slot || slot.type === "blank";
            return (
              <button
                key={idx}
                className={`upgrade-slot ${isBlank ? "blank" : ""}`}
                onClick={() => onPick?.(idx)}
              >
                <div className="slot-art">
                  {isBlank ? (
                    <div className="blank-chip">Blank</div>
                  ) : (
                    <SpellIcon
                      tier={slot.tier}
                      name={slot.name}
                      size={80}
                      radius={10}
                    />
                  )}
                </div>
                <div className="slot-label">Slot {idx + 1}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
