import React, { useState, useRef } from 'react';

// ─── palette straight from the OS9 window chrome ───────────────────────────
const C = {
  chrome:      'rgb(204, 204, 204)',
  chromeDark:  'rgb(119, 119, 119)',
  chromeLight: 'rgb(255, 255, 255)',
  border:      'rgb(100, 100, 100)',
  insetShadow: 'rgb(80, 80, 80)',
  white:       '#fff',
  black:       '#000',
  // AOL brand — muted to sit inside the platinum shell
  aolBlue:     'rgb(0, 70, 160)',
};

// classic Mac platinum bevel borders
const bevelOut = {
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: `${C.chromeLight} ${C.insetShadow} ${C.insetShadow} ${C.chromeLight}`,
};
const bevelIn = {
  borderStyle: 'solid',
  borderWidth: '2px',
  borderColor: `${C.insetShadow} ${C.chromeLight} ${C.chromeLight} ${C.insetShadow}`,
};

// Usernames that require a password (lowercase for comparison)
const PASSWORD_REQUIRED = new Set(['emma']);

/** sha256(utf-8 string) → lowercase hex via Web Crypto */
async function sha256Hex(str) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(str)
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function AolSplash({ onSignOn }) {
  const [screenName, setScreenName] = useState(() => {
    try { return localStorage.getItem('chat.username') || ''; } catch (e) { return ''; }
  });
  const [password, setPassword] = useState('');
  const [shake, setShake] = useState(false);
  const [shakeField, setShakeField] = useState(null); // 'name' | 'password'
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const passwordRef = useRef(null);

  const needsPassword = PASSWORD_REQUIRED.has(screenName.trim().toLowerCase());

  const triggerShake = (field, msg = '') => {
    setShakeField(field);
    setErrorMsg(msg);
    setTimeout(() => setShakeField(null), 500);
    (field === 'password' ? passwordRef : inputRef).current?.focus();
  };

  const handleSignOn = async () => {
    if (busy) return;
    const name = screenName.trim();
    if (!name) { triggerShake('name'); return; }

    if (needsPassword) {
      if (!password) { triggerShake('password', 'Password required.'); return; }

      setBusy(true);
      setErrorMsg('');
      try {
        const hash = await sha256Hex(password);
        const res = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: name, hash }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
          triggerShake('password', data.error || 'Incorrect password.');
          setPassword('');
          setBusy(false);
          return;
        }
      } catch (e) {
        triggerShake('password', 'Could not verify password. Try again.');
        setBusy(false);
        return;
      }
      setBusy(false);
    }

    try { localStorage.setItem('chat.username', name); } catch (e) {}
    onSignOn(name);
  };

  const onKey = (e) => {
    if (e.key === 'Enter') handleSignOn();
  };

  return (
    <div style={styles.root}>
      {/* OS9 teal desktop pattern */}
      <div style={styles.desktopBg} />

      {/* Outer window chrome */}
      <div style={styles.window}>
        <TitleBar title="EmmAOL Instant Messenger" />

        <div style={styles.body}>
          {/* AOL logo inset well */}
          <div style={styles.logoBox}>
            <div style={styles.logoInner}>
              <span style={styles.logoAOL}>EmmAOL</span>
            </div>
          </div>

          {/* form */}
          <div style={styles.formSection}>
            <OS9Label>Screen Name:</OS9Label>
            <input
              ref={inputRef}
              value={screenName}
              onChange={e => { setScreenName(e.target.value); setErrorMsg(''); }}
              onKeyDown={onKey}
              autoFocus
              maxLength={32}
              style={{
                ...styles.textInput,
                ...(shakeField === 'name' ? styles.shakeTarget : {}),
              }}
            />

            <OS9Label style={{ marginTop: 10 }}>Password:</OS9Label>
            <input
              ref={passwordRef}
              type="password"
              disabled={!needsPassword || busy}
              placeholder={needsPassword ? '' : '(not required)'}
              value={password}
              onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
              onKeyDown={onKey}
              style={{
                ...styles.textInput,
                ...(!needsPassword ? { color: C.chromeDark, cursor: 'not-allowed' } : {}),
                ...(shakeField === 'password' ? styles.shakeTarget : {}),
              }}
            />

            {errorMsg ? (
              <div style={{
                fontSize: '11px',
                color: 'rgb(170,0,0)',
                fontFamily: 'Charcoal, Arial, sans-serif',
                marginTop: '4px',
              }}>{errorMsg}</div>
            ) : null}

            {/* Mac-style separator */}
            <div style={styles.separator} />

            <div style={styles.buttonRow}>
              <OS9Button onClick={handleSignOn} primary disabled={busy}>
                {busy ? 'Signing On…' : 'Sign On'}
              </OS9Button>
            </div>
          </div>

          <div style={styles.version}>EmmAOL 9.0 for Macintosh  •  © 2026 poweremma.com</div>
        </div>
      </div>

      <style>{keyframes}</style>
    </div>
  );
}

// ── OS9 titlebar with alternating stripes ─────────────────────────────────────
function TitleBar({ title }) {
  const stripes = [];
  for (let i = 0; i < 12; i++) {
    stripes.push(
      <div key={i} style={{
        position: 'absolute',
        top: (i + 4) + 'px',
        left: '20px',
        right: '20px',
        height: '1px',
        backgroundColor: i % 2 === 0 ? C.chromeLight : C.chromeDark,
      }} />
    );
  }
  return (
    <div style={{
      position: 'relative',
      height: '22px',
      backgroundColor: C.chrome,
      borderBottom: `1px solid ${C.border}`,
      userSelect: 'none',
      flexShrink: 0,
    }}>
      {stripes}
      {/* close box — decorative */}
      <div style={{
        position: 'absolute',
        left: '4px',
        top: '4px',
        width: '13px',
        height: '13px',
        backgroundColor: C.chrome,
        ...bevelOut,
      }} />
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '2px',
        transform: 'translateX(-50%)',
        backgroundColor: C.chrome,
        fontFamily: 'Charcoal, Arial, sans-serif',
        fontSize: '13px',
        color: C.black,
        paddingLeft: '4px',
        paddingRight: '4px',
        whiteSpace: 'nowrap',
      }}>
        {title}
      </div>
    </div>
  );
}

// ── OS9 label ─────────────────────────────────────────────────────────────────
function OS9Label({ children, style }) {
  return (
    <div style={{
      fontFamily: 'Charcoal, Arial, sans-serif',
      fontSize: '12px',
      color: C.black,
      marginBottom: '3px',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── OS9 button with press state ───────────────────────────────────────────────
function OS9Button({ children, onClick, primary, disabled }) {
  const [down, setDown] = useState(false);
  return (
    <button
      disabled={disabled}
      onMouseDown={() => !disabled && setDown(true)}
      onMouseUp={() => { setDown(false); if (!disabled) onClick?.(); }}
      onMouseLeave={() => setDown(false)}
      style={{
        fontFamily: 'Charcoal, Arial, sans-serif',
        fontSize: '12px',
        minWidth: primary ? '88px' : '72px',
        padding: '3px 10px',
        backgroundColor: C.chrome,
        color: disabled ? C.chromeDark : C.black,
        cursor: disabled ? 'not-allowed' : 'default',
        outline: 'none',
        userSelect: 'none',
        ...(down && !disabled ? bevelIn : bevelOut),
        // default button — thick black outer ring
        ...(primary ? { boxShadow: `0 0 0 2px ${disabled ? C.chromeDark : C.black}` } : {}),
      }}
    >
      {children}
    </button>
  );
}

// ── styles ─────────────────────────────────────────────────────────────────────
const styles = {
  root: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
  },
  desktopBg: {
    position: 'absolute',
    inset: 0,
    // Mac OS 9 default teal desktop
    backgroundColor: 'rgb(100, 134, 170)',
    backgroundImage: `repeating-linear-gradient(
      0deg,
      transparent,
      transparent 1px,
      rgba(0,0,0,0.04) 1px,
      rgba(0,0,0,0.04) 2px
    )`,
  },
  window: {
    position: 'relative',
    width: '300px',
    backgroundColor: C.chrome,
    display: 'flex',
    flexDirection: 'column',
    ...bevelOut,
    boxShadow: '4px 4px 0 rgba(0,0,0,0.5)',
  },
  body: {
    padding: '14px 16px 12px',
    display: 'flex',
    flexDirection: 'column',
  },
  logoBox: {
    ...bevelIn,
    backgroundColor: C.white,
    padding: '10px 14px',
    marginBottom: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  logoInner: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  logoTriangle: {
    display: 'inline-block',
    width: 0,
    height: 0,
    borderLeft: '11px solid transparent',
    borderRight: '11px solid transparent',
    borderBottom: `19px solid ${C.aolBlue}`,
  },
  logoAOL: {
    fontFamily: 'Charcoal, Arial, sans-serif',
    fontSize: '26px',
    fontWeight: 'bold',
    color: C.aolBlue,
    letterSpacing: '-1px',
    lineHeight: 1,
  },
  logoSub: {
    fontFamily: 'Charcoal, Arial, sans-serif',
    fontSize: '11px',
    color: C.aolBlue,
    fontStyle: 'italic',
  },
  formSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  textInput: {
    width: '100%',
    padding: '2px 4px',
    fontFamily: 'Charcoal, "Courier New", monospace',
    fontSize: '12px',
    backgroundColor: C.white,
    color: C.black,
    marginBottom: '2px',
    boxSizing: 'border-box',
    outline: 'none',
    ...bevelIn,
  },
  shakeTarget: {
    animation: 'aolShake 0.45s ease',
    borderColor: `rgb(170,0,0) ${C.chromeLight} ${C.chromeLight} rgb(170,0,0)`,
  },
  separator: {
    height: '1px',
    backgroundColor: C.insetShadow,
    margin: '12px 0 10px',
    boxShadow: `0 1px 0 ${C.chromeLight}`,
  },
  buttonRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
  version: {
    marginTop: '12px',
    fontSize: '9px',
    color: C.chromeDark,
    textAlign: 'center',
    fontFamily: 'Charcoal, Arial, sans-serif',
  },
};

const keyframes = `
@keyframes aolShake {
  0%   { transform: translateX(0); }
  15%  { transform: translateX(-5px); }
  30%  { transform: translateX(4px); }
  45%  { transform: translateX(-3px); }
  60%  { transform: translateX(2px); }
  75%  { transform: translateX(-1px); }
  100% { transform: translateX(0); }
}
`;
