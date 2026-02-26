import React, { useState, useEffect, useRef } from 'react';
import AolSplash from './AolSplash';
import { useChat } from './useChat';

function formatTs(ts) {
  try {
    const d = new Date(ts);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const mon = months[d.getMonth()] || '';
    const day = d.getDate();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${mon} ${day} - ${hh}:${mm}`;
  } catch (e) { return ''; }
}

export default function Chat({ init }) {
  const [username, setUsername] = useState(() => {
    try { return localStorage.getItem('chat.username') || '' } catch(e){ return '' }
  });
  const [message, setMessage] = useState('');
  const [hoveredId, setHoveredId] = useState(null);
  const listRef = useRef(null);

  const { connected, channel, setChannel, sendMessage, deleteMessage, messages, hasMore, loadMore, pinned, channels, channelsLoading } = useChat(username);

  // channels is now [{ id, label }] from the server
  const channelLabel = (id) => channels.find(c => c.id === id)?.label ?? `# ${id}`;

  // In column-reverse, scrolling toward the visual top means scrollTop approaches max — that's the oldest end
  const handleScroll = (e) => {
    const el = e.currentTarget;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distFromBottom < 80 && hasMore && channel) {
      loadMore(channel);
    }
  };

  const handleSend = () => {
    if (!username || !message.trim()) return;
    const ok = sendMessage(message.trim());
    if (ok) {
      setMessage('');
      localStorage.setItem('chat.username', username);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100%', width: '100%', background: '#ffffff'}}>
      {/* AOL splash — replaces the chat UI until signed on */}
      {!username ? (
        <div style={{flex: 1, minHeight: 0, overflow: 'hidden'}}>
          <AolSplash onSignOn={(name) => setUsername(name)} />
        </div>
      ) : (
        <div style={{display: 'flex', flexDirection: 'column', height: '100%', width: '100%'}}>

          {/* ── Top bar ──────────────────────────────────────────────── */}
          <div style={{
            padding: '6px 8px',
            borderBottom: '1px solid #ccc',
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <span style={{
              display: 'inline-block',
              width: 8, height: 8,
              borderRadius: '50%',
              background: connected ? '#4caf50' : '#f44336',
              flexShrink: 0,
            }} title={connected ? 'Connected' : 'Reconnecting…'} />
            <span style={{fontSize: '12px', color: '#555', flexShrink: 0}}>
              <strong>{username}</strong>
            </span>
            <button
              style={{marginLeft: 'auto'}}
              onClick={() => {
                setUsername('');
                try { localStorage.removeItem('chat.username'); } catch (e) {}
              }}
            >
              Switch User
            </button>
          </div>

          {/* ── Body: channel list + message area ────────────────────── */}
          <div style={{display: 'flex', flex: 1, minHeight: 0}}>

            {/* Channel sidebar */}
            <div style={{
              width: '110px',
              flexShrink: 0,
              borderRight: '1px solid #ccc',
              background: '#f5f5f5',
              display: 'flex',
              flexDirection: 'column',
              padding: '6px 0',
            }}>
              <div style={{fontSize: '10px', color: '#888', padding: '0 8px 4px', fontWeight: 'bold', textTransform: 'uppercase'}}>
                Channels
              </div>
              {channelsLoading ? (
                <div style={{fontSize: '11px', color: '#aaa', padding: '6px 8px'}}>Loading…</div>
              ) : channels.map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setChannel(ch.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '4px 8px',
                    border: 'none',
                    background: ch.id === channel ? '#d0e8ff' : 'transparent',
                    fontWeight: ch.id === channel ? 'bold' : 'normal',
                    fontSize: '12px',
                    cursor: 'pointer',
                    color: '#000',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {ch.label}
                </button>
              ))}
            </div>

            {/* Message pane */}
            <div style={{display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0}}>
              {/* Channel header */}
              <div style={{
                padding: '4px 10px',
                borderBottom: '1px solid #eee',
                fontSize: '12px',
                color: '#444',
                flexShrink: 0,
                background: '#fafafa',
              }}>
                <strong>{channel ? channelLabel(channel) : '…'}</strong>
              </div>

              {/* Pinned message banner */}
              {pinned && (
                <div style={{
                  padding: '5px 10px',
                  borderBottom: '1px solid #f0c0f0',
                  background: '#fff0ff',
                  fontSize: '11px',
                  color: '#660066',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '6px',
                }}>
                  <span style={{
                    fontWeight: 'bold',
                    color: '#FF00FF',
                    flexShrink: 0,
                    fontSize: '10px',
                    marginTop: '1px',
                  }}>PIN</span>
                  <span style={{wordBreak: 'break-word'}}>{pinned}</span>
                </div>
              )}

              {/* Messages — newest first; column-reverse keeps scroll anchor at top */}
              <div
                ref={listRef}
                onScroll={handleScroll}
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '8px',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column-reverse',
                }}
              >
                {messages.length === 0 && (
                  <div style={{fontSize: '12px', color: '#aaa', textAlign: 'center', marginTop: '24px'}}>
                    No messages yet. Say something!
                  </div>
                )}
                {messages.map(m => {
                  const isEmma = m.username === 'Emma';
                  const canDelete = username === 'Emma';
                  const isHovered = hoveredId === m.id;
                  return (
                    <div
                      key={m.id}
                      style={{marginBottom: '8px', position: 'relative'}}
                      onMouseEnter={() => canDelete && setHoveredId(m.id)}
                      onMouseLeave={() => canDelete && setHoveredId(null)}
                    >
                      <div style={{fontSize: '11px', color: '#666', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap'}}>
                        {formatTs(m.ts)} —{' '}
                        <strong style={isEmma ? {color: '#FF00FF'} : undefined}>{m.username}</strong>
                        {isEmma && (
                          <span style={{
                            fontSize: '9px',
                            fontWeight: 'bold',
                            color: '#fff',
                            background: '#FF00FF',
                            borderRadius: '2px',
                            padding: '1px 4px',
                            letterSpacing: '0.5px',
                            lineHeight: '14px',
                          }}>DEV</span>
                        )}
                        {canDelete && isHovered && (
                          <button
                            onClick={() => deleteMessage(m.channel, m.id)}
                            title="Delete message"
                            style={{
                              marginLeft: 'auto',
                              fontSize: '10px',
                              color: '#c00',
                              background: 'none',
                              border: '1px solid #c00',
                              borderRadius: '2px',
                              padding: '0 4px',
                              cursor: 'pointer',
                              lineHeight: '14px',
                              flexShrink: 0,
                            }}
                          >✕</button>
                        )}
                      </div>
                      <div style={{padding: '4px 8px', background: '#fff', border: '1px solid #eee', wordBreak: 'break-word'}}>
                        {m.message}
                      </div>
                    </div>
                  );
                })}
                {/* Load-more sits last in DOM → visual top with column-reverse */}
                {hasMore && (
                  <div style={{textAlign: 'center', padding: '6px 0'}}>
                    <button
                      onClick={() => channel && loadMore(channel)}
                      style={{fontSize: '11px', color: '#666', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline'}}
                    >
                      Load older messages
                    </button>
                  </div>
                )}
              </div>

              {/* Input */}
              <div style={{
                padding: '8px',
                borderTop: '1px solid #ccc',
                display: 'flex',
                gap: '6px',
                flexShrink: 0,
                minWidth: 0,
              }}>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={onKey}
                  placeholder={connected && channel ? `Message ${channelLabel(channel)}…` : 'Reconnecting…'}
                  disabled={!connected || !channel}
                  style={{flex: 1, minWidth: 0, height: '48px', resize: 'none', boxSizing: 'border-box'}}
                />
                <button
                  onClick={handleSend}
                  disabled={!connected || !channel || !message.trim()}
                  style={{width: '52px', flexShrink: 0, alignSelf: 'flex-end', boxSizing: 'border-box'}}
                >
                  Send
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
