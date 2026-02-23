import React, { useEffect, useState } from 'react';

// Simulates the Mac OS 9 "Starting Up..." boot progress bar.
// `onDone` is called once the minimum display time has passed AND the
// parent signals that real content is ready (via the `ready` prop).
export default function BootScreen({ ready, onDone }) {
  const MIN_MS = 1000;
  const [progress, setProgress] = useState(0);   // 0–100
  const [minElapsed, setMinElapsed] = useState(false);
  const [fading, setFading] = useState(false);

  // Count up the minimum display timer
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), MIN_MS);
    return () => clearTimeout(t);
  }, []);

  // Animate the progress bar — fills over ~1.2 s then stalls at 90% until ready
  useEffect(() => {
    let raf;
    const start = performance.now();
    const FILL_MS = 1200; // time to reach 90 %

    const tick = (now) => {
      const elapsed = now - start;
      const natural = Math.min((elapsed / FILL_MS) * 90, 90);
      setProgress(natural);
      if (natural < 90) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Once both conditions are met, jump bar to 100% then fade out
  useEffect(() => {
    if (ready && minElapsed && !fading) {
      setProgress(100);
      setFading(true);
      const t = setTimeout(onDone, 400); // match CSS transition
      return () => clearTimeout(t);
    }
  }, [ready, minElapsed, fading, onDone]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      backgroundColor: '#6b5ea8', // OS9 purple desktop
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Cpath d='M18 10 C18 6,22 4,26 8 C30 12,28 18,22 20 C28 22,32 28,28 32 C24 36,18 34,16 30 C14 26,16 20,22 20 C16 18,14 12,18 10Z' fill='rgba(255,255,255,0.07)'/%3E%3C/svg%3E")`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.35s ease',
      pointerEvents: fading ? 'none' : 'all',
    }}>
      {/* Boot dialog — white box with thin grey border, like OS9 */}
      <div style={{
        background: '#fff',
        border: '1px solid #aaa',
        boxShadow: '2px 2px 0 rgba(0,0,0,0.35)',
        width: 260,
        padding: '28px 24px 22px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
      }}>
        {/* Finder-style happy mac icon */}
        <img
          src="/finder-big.png"
          alt="Finder"
          style={{
            width: 64,
            height: 64,
            imageRendering: 'pixelated',
            marginBottom: 12,
          }}
        />

        <div style={{
          fontFamily: 'Charcoal, Arial, sans-serif',
          fontSize: 22,
          color: '#000',
          marginBottom: 18,
          letterSpacing: '-0.5px',
        }}>
          Mac OS 9
        </div>

        <div style={{
          fontFamily: 'Charcoal, Arial, sans-serif',
          fontSize: 11,
          color: '#333',
          marginBottom: 8,
          alignSelf: 'flex-start',
        }}>
          Starting Up…
        </div>

        {/* Progress bar — inset track with discrete OS9-style block segments */}
        <div style={{
          width: '100%',
          height: 14,
          background: '#fff',
          borderTop: '1px solid #666',
          borderLeft: '1px solid #666',
          borderBottom: '1px solid #ccc',
          borderRight: '1px solid #ccc',
          boxSizing: 'border-box',
          padding: '1px',
          overflow: 'hidden',
        }}>
          {/* Solid dark-blue fill that grows — the "blocks" are the pixel texture of the color */}
          <div style={{
            height: '100%',
            width: progress + '%',
            transition: 'width 0.12s linear',
            background: 'linear-gradient(180deg, #c084fc 0%, #a855f7 18%, #7c3aed 50%, #6d28d9 51%, #7c3aed 82%, #9333ea 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -1px 0 rgba(0,0,0,0.2)',
            borderRadius: '1px',
          }} />
        </div>
      </div>
    </div>
  );
}
