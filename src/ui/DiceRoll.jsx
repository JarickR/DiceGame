// src/ui/DiceRoll.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./DiceRoll.css";

/**
 * Fancy Dice Roll overlay with screen shake + colored particles
 *
 * Props:
 *  - value?: 1..6                 -> final face (optional; random if not given)
 *  - duration?: ms                -> total time (default 1100)
 *  - onDone?: () => void
 *  - theme?: "white"|"black"|"gold"
 *  - effect?: "phys"|"fire"|"poison"|"arcane"|"heal"
 *  - shake?: boolean              -> enable stage shake on settle (default true)
 *  - sfx?: { start?: string, settle?: string }
 */
export default function DiceRoll({
  value,
  duration = 1100,
  onDone,
  theme = "white",
  effect = "phys",
  shake = true,
  sfx
}) {
  const final = useMemo(
    () => (value >= 1 && value <= 6 ? value : 1 + Math.floor(Math.random() * 6)),
    [value]
  );

  const [phase, setPhase] = useState("rolling"); // rolling -> settle -> done

  // randomized spin axis and slight camera tilt
  const spin = useMemo(
    () => ({
      x: 120 + Math.floor(Math.random() * 380),
      y: 120 + Math.floor(Math.random() * 380),
      cam: (Math.random() * 10 - 5).toFixed(1),
    }),
    []
  );

  // tiny “burst” particles
  const particles = useMemo(
    () =>
      Array.from({ length: 12 }).map((_, i) => ({
        id: i,
        angle: (i / 12) * Math.PI * 2,
        dist: 22 + Math.random() * 26,
        delay: 10 + i * 8,
      })),
    []
  );

  const startAudio = useRef(null);
  const settleAudio = useRef(null);

  useEffect(() => {
    if (sfx?.start) {
      startAudio.current = new Audio(sfx.start);
      startAudio.current.volume = 0.45;
      startAudio.current.play().catch(() => {});
    }

    const t1 = setTimeout(() => setPhase("settle"), Math.max(0, duration - 240));
    const t2 = setTimeout(() => setPhase("done"), duration);
    const t3 = setTimeout(() => {
      if (sfx?.settle) {
        settleAudio.current = new Audio(sfx.settle);
        settleAudio.current.volume = 0.6;
        settleAudio.current.play().catch(() => {});
      }
    }, Math.max(0, duration - 230));

    const t4 = setTimeout(() => onDone?.(), duration + 220);
    return () => [t1, t2, t3, t4].forEach(clearTimeout);
  }, [duration, onDone, sfx]);

  // orientation for final face
  const faceRot = {
    1: "rotateX(0deg) rotateY(0deg)",
    2: "rotateX(0deg) rotateY(-90deg)",
    3: "rotateX(90deg) rotateY(0deg)",
    4: "rotateX(-90deg) rotateY(0deg)",
    5: "rotateX(0deg) rotateY(90deg)",
    6: "rotateX(0deg) rotateY(180deg)",
  };

  return (
    <div className={`dice-overlay ${phase !== "done" ? "show" : ""} effect-${effect}`}>
      <div className={`backdrop ${phase}`} />

      <div
        className={`dice-stage ${shake && phase === "settle" ? "shake" : ""}`}
        style={{ transform: `perspective(900px) rotateX(${spin.cam}deg)` }}
      >
        {/* rolling shadow */}
        <div className={`die-shadow ${phase}`} />

        {/* cube */}
        <div
          className={`die theme-${theme} ${phase}`}
          style={{
            "--spinX": `${spin.x}deg`,
            "--spinY": `${spin.y}deg`,
            transform: phase === "rolling" ? undefined : faceRot[final],
          }}
          aria-label={`Rolled a ${final}`}
        >
          <div className="face f1"><Pips n={1} /></div>
          <div className="face f2"><Pips n={2} /></div>
          <div className="face f3"><Pips n={3} /></div>
          <div className="face f4"><Pips n={4} /></div>
          <div className="face f5"><Pips n={5} /></div>
          <div className="face f6"><Pips n={6} /></div>

          {/* sheen sweep on settle */}
          <div className="sheen" />
        </div>

        {/* burst */}
        <div className={`burst ${phase}`}>
          {particles.map((p) => (
            <span
              key={p.id}
              className="spark"
              style={{
                transform: `rotate(${(p.angle * 180) / Math.PI}deg) translateX(${p.dist}px)`,
                animationDelay: `${p.delay}ms`,
              }}
            />
          ))}
        </div>

        <div className={`result ${phase}`}>d6 → {final}</div>
      </div>
    </div>
  );
}

function Pips({ n }) {
  return (
    <div className={`pips p${n}`}>
      {Array.from({ length: n }).map((_, i) => (
        <span key={i} className="pip" />
      ))}
    </div>
  );
}
