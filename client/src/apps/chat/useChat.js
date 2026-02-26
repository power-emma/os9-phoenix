import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Builds the WebSocket URL from the current page origin.
 * Works in dev (Vite proxies /ws → backend) and in production (nginx proxies /ws).
 */
function getWsUrl() {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${proto}//${window.location.host}/ws/chat`;
}

// Number of messages the server sends on connect/channel-switch
const PAGE_SIZE = 20;
// Number of older messages to request per "load more"
const FETCH_SIZE = 50;

/**
 * useChat — manages a single WebSocket connection shared across channel switches.
 *
 * Pagination is server-driven:
 *   - On connect / join the server sends the last PAGE_SIZE messages.
 *   - Calling loadMore(channel) sends a `fetch_history` frame with the oldest
 *     message id the client currently holds; the server replies with up to
 *     FETCH_SIZE older messages.
 *   - `hasMore` is set to false when the server returns fewer than FETCH_SIZE
 *     messages (meaning we hit the beginning of history).
 *
 * Messages are stored newest-first (descending ts).
 *
 * Returns:
 *   { messages, hasMore, loadMore, channel, setChannel, sendMessage, connected, channels, channelsLoading }
 */
export function useChat(username) {
  // channelDefs: [{ id, label }] — loaded from server via hello frame
  const [channelDefs, setChannelDefs] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(true);

  // Messages per channel, newest-first
  const [allMessages, setAllMessages] = useState({});

  // Per-channel pin text (null = no pin)
  const [pinnedMessages, setPinnedMessages] = useState({});

  // Per-channel flag: false once server returns < FETCH_SIZE (reached top of history)
  const [hasMoreMap, setHasMoreMap] = useState({});

  // Prevent parallel fetch_history requests per channel
  const fetchingRef = useRef({});

  const [channel, setChannelState] = useState(null);
  const [connected, setConnected] = useState(false);

  const wsRef = useRef(null);
  const channelRef = useRef(null);
  const pendingRef = useRef([]);
  const validChannelsRef = useRef(new Set());

  /**
   * Merge new messages into a channel's store.
   * `prepend` — messages are older than what we have (came from fetch_history).
   * Returns the count of newly-added messages so callers can check if we
   * should mark hasMore=false.
   */
  const addMessages = useCallback((ch, msgs, { prepend = false, fetchSize = null } = {}) => {
    let addedCount = 0;
    setAllMessages(prev => {
      const existing = prev[ch] || [];
      const existingIds = new Set(existing.map(m => m.id));
      const fresh = msgs.filter(m => !existingIds.has(m.id));
      addedCount = fresh.length;
      if (!fresh.length) return prev;
      // Merge and sort newest-first; cap at 2000 to avoid unbounded growth
      const merged = [...existing, ...fresh]
        .sort((a, b) => b.ts - a.ts)
        .slice(0, 2000);
      return { ...prev, [ch]: merged };
    });

    // If we received a full page, more may exist. If fewer arrived, we've
    // hit the start of history. Only update after a fetch_history response.
    if (fetchSize !== null) {
      setHasMoreMap(prev => ({
        ...prev,
        [ch]: msgs.length >= fetchSize,
      }));
    }

    return addedCount;
  }, []);

  // Connect once; reconnect on drop
  useEffect(() => {
    let reconnectTimer;
    let unmounted = false;
    let activeWs = null;

    const connect = () => {
      if (unmounted) return;
      const url = getWsUrl();
      console.debug('[chat ws] connecting to', url);
      const ws = new WebSocket(url);
      activeWs = ws;
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmounted || ws !== activeWs) { ws.close(); return; }
        console.debug('[chat ws] connected');
        setConnected(true);
        pendingRef.current.forEach(p => ws.send(p));
        pendingRef.current = [];
        if (channelRef.current) {
          ws.send(JSON.stringify({ type: 'join', channel: channelRef.current }));
        }
      };

      ws.onmessage = (event) => {
        let data;
        try { data = JSON.parse(event.data); } catch { return; }

        if (data.type === 'hello') {
          const defs = Array.isArray(data.channels) ? data.channels : [];
          setChannelDefs(defs);
          setChannelsLoading(false);
          validChannelsRef.current = new Set(defs.map(c => c.id));

          const defaultCh = data.defaultChannel || (defs[0]?.id ?? null);
          if (defaultCh) {
            channelRef.current = defaultCh;
            setChannelState(defaultCh);
          }
          if (defaultCh && Array.isArray(data.history)) {
            // Initial history: assume there may be more unless under page size
            addMessages(defaultCh, data.history);
            setHasMoreMap(prev => ({
              ...prev,
              [defaultCh]: data.history.length >= PAGE_SIZE,
            }));
          }
          if (defaultCh && data.pin !== undefined) {
            setPinnedMessages(prev => ({ ...prev, [defaultCh]: data.pin ?? null }));
          }

        } else if (data.type === 'history') {
          // Response to join (no prepend flag) or fetch_history (prepend: true)
          const isPrepend = !!data.prepend;
          addMessages(data.channel, data.messages, {
            prepend: isPrepend,
            fetchSize: isPrepend ? FETCH_SIZE : null,
          });
          // Carry pin sent with join response
          if (data.pin !== undefined) {
            setPinnedMessages(prev => ({ ...prev, [data.channel]: data.pin ?? null }));
          }
          // Release the in-flight lock for this channel
          if (isPrepend) delete fetchingRef.current[data.channel];

        } else if (data.type === 'message') {
          // Live incoming message — prepend at top, no hasMore change
          addMessages(data.channel, [data.msg]);

        } else if (data.type === 'pin') {
          // Emma set or cleared a pin for this channel
          setPinnedMessages(prev => ({ ...prev, [data.channel]: data.pin ?? null }));

        } else if (data.type === 'message_deleted') {
          setAllMessages(prev => {
            const store = prev[data.channel];
            if (!store) return prev;
            return { ...prev, [data.channel]: store.filter(m => m.id !== data.id) };
          });
        }
      };

      ws.onclose = () => {
        if (ws === activeWs) {
          setConnected(false);
          if (wsRef.current === ws) wsRef.current = null;
        }
        if (!unmounted && ws === activeWs) {
          console.debug('[chat ws] disconnected, reconnecting in 2s...');
          reconnectTimer = setTimeout(connect, 2000);
        }
      };

      ws.onerror = (err) => {
        console.warn('[chat ws] error', err);
        ws.close();
      };
    };

    connect();
    return () => {
      unmounted = true;
      clearTimeout(reconnectTimer);
      if (activeWs) activeWs.close();
      wsRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setChannel = useCallback((ch) => {
    if (!validChannelsRef.current.has(ch)) return;
    channelRef.current = ch;
    setChannelState(ch);
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'join', channel: ch }));
    }
  }, []);

  /**
   * Request older messages from the server.
   * Finds the smallest (oldest) id in local store and asks for
   * FETCH_SIZE messages before it.
   */
  const loadMore = useCallback((ch) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (fetchingRef.current[ch]) return; // already in-flight

    setAllMessages(prev => {
      const msgs = prev[ch] || [];
      // Oldest id in the store (msgs are newest-first, so last element)
      const oldestId = msgs.length ? msgs[msgs.length - 1].id : undefined;
      fetchingRef.current[ch] = true;
      ws.send(JSON.stringify({
        type: 'fetch_history',
        channel: ch,
        beforeId: oldestId ?? Infinity,
        limit: FETCH_SIZE,
      }));
      return prev; // no state change here; reply handled in onmessage
    });
  }, []);

  const sendMessage = useCallback((message) => {
    const ws = wsRef.current;
    console.debug('[chat ws] sendMessage called', {
      hasWs: !!ws, readyState: ws?.readyState, username, message, channel: channelRef.current,
    });
    if (!username || !message) {
      console.warn('[chat ws] send failed: missing username or message');
      return false;
    }
    const payload = JSON.stringify({
      type: 'message',
      channel: channelRef.current,
      username,
      message,
    });
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
      return true;
    } else if (ws && ws.readyState === WebSocket.CONNECTING) {
      console.debug('[chat ws] socket still connecting, queuing message');
      pendingRef.current.push(payload);
      return true;
    } else {
      console.warn('[chat ws] send failed: ws not open, readyState=', ws?.readyState);
      return false;
    }
  }, [username]);

  const deleteMessage = useCallback((channel, id) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'delete_message', channel, id, username }));
  }, [username]);

  const messages = channel ? (allMessages[channel] || []) : [];
  const hasMore   = channel ? (hasMoreMap[channel] ?? false) : false;
  const pinned    = channel ? (pinnedMessages[channel] ?? null) : null;

  return {
    connected,
    channel,
    setChannel,
    sendMessage,
    deleteMessage,
    loadMore,
    messages,   // newest-first, all fetched messages for current channel
    hasMore,
    pinned,     // string | null — current pin for the active channel
    channels: channelDefs,
    channelsLoading,
  };
}
