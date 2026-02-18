import React, { useState, useEffect, useRef } from 'react';

export default function Chat({ init }) {
  const [username, setUsername] = useState(() => {
    try { return localStorage.getItem('chat.username') || '' } catch(e){return ''}
  });
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const lastTsRef = useRef(0);
  const pollingRef = useRef(null);
  const listRef = useRef(null);
  // Explicit API base to ensure requests go to the backend server (useful during dev)
  const API_BASE = 'http://localhost:3000';
  // track the last time the user cleared the local view; messages before this ts are hidden
  const lastClearRef = useRef(() => {
    try { return parseInt(localStorage.getItem('chat.lastClear') || '0', 10) || 0 } catch (e) { return 0 }
  });
  // normalize current value
  if (typeof lastClearRef.current === 'function') lastClearRef.current = lastClearRef.current();

  useEffect(() => {
    // start polling
    const fetchSince = async () => {
      try {
        const url = API_BASE + '/api/chat?since=' + lastTsRef.current;
        console.debug('[chat] polling', url);
        const res = await fetch(url);
        if (!res.ok) {
          console.warn('[chat] polling failed', res.status);
          return;
        }
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          // only include messages after lastClear
          const filteredIncoming = data.filter(m => m.ts > (lastClearRef.current || 0));
          if (filteredIncoming.length) {
            setMessages(prev => {
              const merged = prev.concat(filteredIncoming);
              // keep last 1000
              return merged.slice(-1000);
            });
            lastTsRef.current = filteredIncoming[filteredIncoming.length - 1].ts;
          } else {
            // advance lastTsRef if incoming had later messages but all were before clear
            const maxTs = data[data.length - 1].ts;
            if (maxTs > lastTsRef.current) lastTsRef.current = maxTs;
          }
        }
      } catch (e) {
        console.warn('[chat] polling error', e);
      }
    }
    // initial fetch
    fetchSince();
    pollingRef.current = setInterval(fetchSince, 1000);
    return () => clearInterval(pollingRef.current);
  }, []);

  useEffect(() => {
    // scroll to bottom when messages update
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!username || !message) return;
    try {
      try {
        const url = API_BASE + '/api/chat';
        console.debug('[chat] posting to', url, { username, message });
        const res = await fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ username, message }) });
        if (!res.ok) { console.warn('[chat] post failed', res.status); return; }
        setMessage('');
        localStorage.setItem('chat.username', username);
        const newMsg = await res.json();
        // only display if after last clear
        if (newMsg.ts > (lastClearRef.current || 0)) {
          setMessages(prev => prev.concat(newMsg));
        }
        if (newMsg.ts > lastTsRef.current) lastTsRef.current = newMsg.ts;
      } catch (e) {
        console.warn('[chat] post error', e);
      }
    } catch (e) {
      // ignore
    }
  }

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#ffffff'}}>
      <div style={{padding: '8px', borderBottom: '1px solid #ccc', display: 'flex', gap: '8px', width: '100%'}}>
        <input placeholder="username" value={username} onChange={e=>setUsername(e.target.value)} style={{flex: 1, minWidth: '120px'}} />
        <button onClick={() => {
          // clear local messages and set lastClear to now so older messages won't reappear
          const now = Date.now();
          setMessages([]);
          lastClearRef.current = now;
          lastTsRef.current = now;
          try { localStorage.setItem('chat.lastClear', String(now)); } catch (e) {}
        }}>Clear</button>
      </div>
      <div ref={listRef} style={{flex: 1, overflowY: 'auto', padding: '8px', background: '#ffffff', width: '100%'}}>
        {messages.map(m => (
          <div key={m.id} style={{marginBottom: '8px'}}>
            <div style={{fontSize: '11px', color: '#666'}}>{new Date(m.ts).toLocaleTimeString()} — <strong>{m.username}</strong></div>
            <div style={{padding: '6px 8px', background: '#fff', border: '1px solid #eee'}}>{m.message}</div>
          </div>
        ))}
      </div>
      <div style={{padding: '8px', borderTop: '1px solid #ccc', display: 'flex', gap: '8px', width: '100%'}}>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} onKeyDown={onKey} placeholder="Type a message and press Enter" style={{flex: 1, height: '48px', width: '100%'}} />
        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <button onClick={sendMessage} style={{minWidth: '80px'}}>Send</button>
        </div>
      </div>
    </div>
  )
}
