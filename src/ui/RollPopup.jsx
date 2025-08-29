import React, { useEffect, useMemo, useRef, useState } from "react";
import SpellIcon from "../ui/SpellIcon";
import ClassIcon from "../ui/ClassIcon";

/**
 * Props:
 * - open: boolean
 * - faces: array of 6 face objects from App.facesForHero(heroIndex)
 * - landingIndex: number (0..5)
 * - onClose(): called after fade or when user clicks OK
 *
 * Face shapes:
 *   {kind:"class", classId:"thief"}
 *   {kind:"spell", spell:{tier:1|2|3, name:"attack"|"heal"|...}}
 *   {kind:"upgrade"}
 *   {kind:"blank"}
 */
export default function RollPopup({ open, faces = [], landingIndex = 0, onClose }) {
  const [step, setStep] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [done, setDone] = useState(false);
  const timerRef = useRef(null);

  const totalSpins = 18;            // how many face flashes before landing
  const intervalFast = 70;          // start speed
  const intervalSlow = 150;         // end speed

  // derive current face index while spinning
  const currentIndex = useMemo(() => {
    if (!faces.length) return 0;
    if (showResult) return landingIndex;
    // make it slow down near the end
    const idx = step % faces.length;
    return idx;
  }, [faces, step, showResult, landingIndex]);

  useEffect(() => {
    if (!open) return;
    setStep(0);
    setShowResult(false);
    setDone(false);

    // progressive slowdown
    let spins = 0;
    function scheduleNext() {
      const progress = spins / totalSpins; // 0..1
      const interval = Math.round(intervalFast + (intervalSlow - intervalFast) * progress);
      timerRef.current = setTimeout(() => {
        spins += 1;
        setStep((s) => s + 1);
        if (spins <= totalSpins) {
          scheduleNext();
        } else {
          // stop on landing face
          setShowResult(true);
          // keep highlighted for a moment then mark done
          timerRef.current = setTimeout(() => setDone(true), 700);
        }
      }, interval);
    }
    scheduleNext();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open, landingIndex]);

  if (!open) return null;

  const face = faces[currentIndex] || { kind: "blank" };

  function renderThumb(f) {
    if (!f) return null;
    if (f.kind === "class") {
      return (
        <div className="rp-face">
          <ClassIcon name={f.classId} size={72} radius={12} />
          <div className="rp-faceLabel">{f.classId}</div>
        </div>
      );
    }
    if (f.kind === "spell") {
      return (
        <div className="rp-face">
          <SpellIcon tier={f.spell.tier} name={f.spell.name} size={72} radius={12} />
          <div className="rp-faceLabel">
            {f.spell.name} <span style={{ opacity: 0.7 }}>T{f.spell.tier}</span>
          </div>
        </div>
      );
    }
    if (f.kind === "upgrade") {
      return (
        <div className="rp-face">
          <SpellIcon upgrade size={72} radius={12} />
          <div className="rp-faceLabel">upgrade</div>
        </div>
      );
    }
    // blank
    return (
      <div className="rp-face rp-blank">
        <div className="rp-blankBox" />
        <div className="rp-faceLabel">blank</div>
      </div>
    );
  }

  return (
    <div className="rp-backdrop">
      <div className="rp-modal">
        <div className="rp-title">Rolling…</div>
        <div className={`rp-window ${showResult ? "rp-result" : ""}`}>
          {renderThumb(face)}
        </div>
        <div className="rp-footer">
          {!done ? (
            <div>Spinning…</div>
          ) : (
            <button className="rp-btn" onClick={onClose}>OK</button>
          )}
        </div>
      </div>

      {/* styles scoped to the popup */}
      <style>{`
        .rp-backdrop{
          position: fixed; inset: 0; display: grid; place-items: center;
          background: rgba(0,0,0,0.5); z-index: 2000;
        }
        .rp-modal{
          width: min(560px, 92vw);
          background:#12161d;
          color:#fff;
          border-radius: 16px;
          border:1px solid rgba(255,255,255,0.12);
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
          padding: 16px;
        }
        .rp-title{
          font-size: 22px; font-weight: 800; margin-bottom: 10px;
        }
        .rp-window{
          height: 140px;
          border-radius: 14px;
          background:#0b0e13;
          border: 1px solid rgba(255,255,255,0.08);
          display:grid; place-items:center;
          overflow: hidden;
          transition: box-shadow 140ms ease, border-color 140ms ease;
        }
        .rp-window.rp-result{
          border-color: #d4a11d;
          box-shadow: 0 0 0 3px rgba(212,161,29,0.35) inset, 0 0 18px rgba(212,161,29,0.35);
        }
        .rp-face{ display:grid; place-items:center; gap:6px; }
        .rp-faceLabel{ font-size:14px; opacity:0.9; text-transform:capitalize; }
        .rp-blankBox{
          width:72px; height:72px; border-radius:12px;
          background: #232833; border: 1px dashed rgba(255,255,255,0.25);
        }
        .rp-footer{ display:flex; justify-content:flex-end; padding-top: 12px; }
        .rp-btn{
          padding: 8px 14px; border-radius:10px; border:1px solid rgba(255,255,255,0.18);
          background:#1f6feb; color:#fff; font-weight:700; cursor:pointer;
        }
        .rp-btn:hover{ filter: brightness(1.08); }
      `}</style>
    </div>
  );
}
