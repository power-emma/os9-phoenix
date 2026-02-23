// React Imports
import {React, useState, useEffect, useRef} from 'react';
import ReactDOM from 'react-dom/client';
import Draggable from "react-draggable";

// Window Imports
import Window from './window';

// Applications
import TContent from './testContent';
import PortfolioMain from '../apps/portfolio/portfoliomain';
import Orbit from '../apps/orbit/orbitbridge';
import Raycast from '../apps/raycast/raycast';
import Plasma from '../apps/plasma/plasma';
import Renderer from '../apps/3d/renderer';
import Chat from '../apps/chat/chat';

// Images
import siteIcon from './icons/portfolio.png'
import orbitIcon from './icons/orbit.png'
import raycastIcon from './icons/raycast.png'
import plasmaIcon from './icons/plasma.png'
import renderIcon from './icons/renderer.png'
import chatIcon from './icons/chat.png'


const WM = ({ onReady }) => {
    // Int to store the next zIndex — kept in a ref so closures always read the latest value
    const maxZIndexRef = useRef(0);
    const bumpZ = () => { maxZIndexRef.current += 1; return maxZIndexRef.current; };
    // Array of all windows
    const [windows, setWindows] = useState([]);
    // Reference to most updated copy of windows (used when calling from child)
    const windowRef = useRef();
    windowRef.current = windows
    // Mobile flag used for some apps
    let mobile = false
    // Crops window to show desktop icons
    let practicalWidth = window.innerWidth - 200
    // If the window is too thin then cover the desktop icons by default
    if (window.innerWidth < 1265) {
        practicalWidth = window.innerWidth
    }
    // If aspect ratio is portrait then treat as mobile
    if (window.innerHeight > window.innerWidth) {
        mobile = true
    }
        

    // Brings window with the given id to the top
    function activeWindowHandler(id) {
        const newValue = bumpZ();
        setWindows(prev => prev.map(item =>
            item.id === id ? { ...item, zIndex: newValue } : item
        ));
    }

    const deleteWindow = (id) => {
        // Temp Array to store windows
        let newArray = []

        //windowRef stores the most current reference, where if we called windows directly it would use an outdated reference
        for (let i = 0; i < windowRef.current.length; i++) {
            if (windowRef.current[i].id !== id) {
                // IDs not equal, so dont change it
                newArray.push(windowRef.current[i])
            } else {
                // Element with ID found, so delete (or well more blank it)
                newArray.push({...null, zIndex: 0})
            }
        }
        setWindows(newArray)
    }

    const makeWindow = (x,y,height,width,name,content) => {
        // Give window a zIndex — bumpZ() reads from the ref, so always current even in stale closures
        let newValue = bumpZ();

        // Clamp size so the window fits within the viewport
        const menubarH = 22;
        const maxW = window.innerWidth;
        const maxH = window.innerHeight - menubarH;
        const clampedWidth  = Math.min(width,  maxW);
        const clampedHeight = Math.min(height, maxH);
        // Clamp position so the window doesn't start off-screen
        const clampedX = Math.max(0, Math.min(x, maxW  - clampedWidth));
        const clampedY = Math.max(menubarH, Math.min(y, window.innerHeight - clampedHeight));

        // Use functional update so we always append to the *current* windows array,
        // not a stale closure snapshot (fixes photo viewer replacing the portfolio window)
        setWindows(prev => {
            const newID = prev.length;

            const tempWin = <Window init={{
                x: clampedX,
                y: clampedY,
                height: clampedHeight,
                width: clampedWidth,
                name: name,
                content: content,
                id: newID,
                mobile: mobile
              }}
               closeFunction={deleteWindow}
            />

            return [...prev, {
                window: tempWin,
                id: newID,
                zIndex: newValue,
                baseX: x,
                baseY: y
            }];
        });
    }

    const knownApps = {
        'portfolio': (w,h) => <PortfolioMain init={{width: w, height: h, openWindow: makeWindow}} />,
        'orbit':     (w,h) => <Orbit    init={{width: w, height: h}} />,
        'raycast':   (w,h) => <Raycast  init={{width: w, height: h}} />,
        'chat':      (w,h) => <Chat     init={{width: w, height: h}} />,
        'plasma':    (w,h) => <Plasma   init={{width: w, height: h}} />,
        'renderer':  (w,h) => <Renderer init={{width: w, height: h}} />,
    };

    // Parse the deep-link slug once at load time (e.g. /chat → 'chat')
    const deepLinkSlug = window.location.pathname.replace(/^\//, '').split('/')[0].toLowerCase();

    // Desktop Icon Text
    // base text style for desktop icon labels; the visible background is applied to the label element
    const iconTextStyle = {
        fontSize: '11pt',
        textAlign: 'center'
    }

    // Define the desktop icons, and the initial parameters of the apps they run
    // desktop configuration can be provided via a JSON file at `/desktop.ini` (served from public/)
    // Format: JSON array of entries: [{"name":"Orbit.js","icon":"/path/to/icon.png","script":"orbit","width":<px>,"height":<px>}]
    // `script` may be a known app id (portfolio, orbit, raycast, plasma, renderer) or a URL (starts with http/ or /) to open in an iframe.
    const [desktopConfig, setDesktopConfig] = useState(null);
    // Guard so StrictMode's double-invocation of effects never opens two windows
    const initDone = useRef(false);

    useEffect(() => {
        // Try multiple fetch strategies to obtain desktop.ini safely.
        // 1) try same-origin /api/desktop
        // 2) try backend at http://localhost:3000/api/desktop (dev server)
        // 3) fallback to static /desktop.ini
        const tryFetch = async (url) => {
            try {
                const res = await fetch(url);
                if (!res.ok) return null;
                const contentType = (res.headers.get('content-type') || '').toLowerCase();
                // don't accept HTML (likely index.html) as valid desktop config
                if (contentType.includes('text/html')) return null;
                if (contentType.includes('application/json')) {
                    const parsed = await res.json();
                    if (Array.isArray(parsed)) return parsed;
                    return null;
                }
                // plain text
                const text = await res.text();
                const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                const parsed = lines.map(line => {
                    const parts = line.split('|').map(p => p.trim());
                    return { name: parts[0] || 'App', icon: parts[1] || '', script: parts[2] || '' };
                });
                return parsed;
            } catch (e) {
                return null;
            }
        }

        (async () => {
            let cfg = await tryFetch('/api/desktop');
            // fallback to static /desktop.ini if API not available
            if (!cfg) cfg = await tryFetch('/desktop.ini');
            if (cfg) setDesktopConfig(cfg);
            // signal ready regardless of whether config was found
            if (onReady) onReady();

            // Only open the initial window once — guards against StrictMode double-invoke
            if (initDone.current) return;
            initDone.current = true;

            // Open the initial window now that we have the desktop config
            const slug = deepLinkSlug;
            if (knownApps[slug]) {
                // Deep-link: open the requested app
                const entry = (cfg || []).find(e => (e.script || '').toLowerCase() === slug);
                const appWidth  = entry?.width  || Math.round(practicalWidth - 40);
                const appHeight = entry?.height || (window.innerHeight - 60);
                const startX = entry?.x ?? 20;
                const startY = entry?.y ?? 24;
                const appName = entry?.name || slug.charAt(0).toUpperCase() + slug.slice(1);
                makeWindow(startX, startY, appHeight, appWidth, appName, knownApps[slug](appWidth, appHeight));
            } else {
                // Default: open portfolio
                makeWindow(20, 24, window.innerHeight - 60, practicalWidth - 40, "Emma's Website", <PortfolioMain init={{
                    height: window.innerHeight - 60,
                    width: practicalWidth - 40,
                    openWindow: makeWindow,
                }}/>);
            }
        })();
    }, [])

    const makeContentFromEntry = (entry, w, h) => {
        if (!entry) return null;
        const script = (entry.script || '').toString();
        const key = script.toLowerCase();
        if (knownApps[key]) return knownApps[key](w,h);
        // if script looks like a URL or path, render in an iframe
        if (script.startsWith('/') || script.startsWith('http')) {
            return <iframe src={script} style={{width: '100%', height: '100%', border: 'none'}} title={entry.name} />
        }
        // fallback: if script matches a filename under /apps, try dynamic import - else null
        return null;
    }

    const ICON_COL_W = 90;   // px per column
    const ICON_ROW_H = 100;  // px per icon slot
    const ICON_RIGHT_PAD = 24; // px gap from right edge
    const availableH = window.innerHeight - 22; // below menubar
    const iconsPerCol = Math.max(1, Math.floor(availableH / ICON_ROW_H));

    const desktopIcons = <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        { (desktopConfig || []).map((item, idx) => {
            const col = Math.floor(idx / iconsPerCol);
            const row = idx % iconsPerCol;
            const rightPx = ICON_RIGHT_PAD + col * ICON_COL_W;
            const topPx  = 22 + row * ICON_ROW_H;

            const scriptKey = (item.script || '').toString().toLowerCase();
            const defaultIconFor = (key) => {
                if (!key) return siteIcon;
                if (key.includes('orbit')) return orbitIcon;
                if (key.includes('raycast')) return raycastIcon;
                if (key.includes('plasma')) return plasmaIcon;
                if (key.includes('render')) return renderIcon;
                if (key.includes('portfolio')) return siteIcon;
                return siteIcon;
            };
            const namedIcons = {
                'chat.png': chatIcon,
                'portfolio.png': siteIcon,
                'orbit.png': orbitIcon,
                'raycast.png': raycastIcon,
                'plasma.png': plasmaIcon,
                'renderer.png': renderIcon
            };

            let iconSrc;
            if (typeof item.icon === 'string' && item.icon.length > 0) {
                iconSrc = namedIcons[item.icon] || item.icon;
            } else if (item.icon) {
                iconSrc = item.icon;
            } else {
                iconSrc = defaultIconFor(scriptKey);
            }
            const appWidth = item.width || Math.round(practicalWidth - 40);
            const appHeight = item.height || (window.innerHeight - 60);
            const startX = (typeof item.x === 'number') ? item.x : 20;
            const startY = (typeof item.y === 'number') ? item.y : 24;
            return (
                <button key={idx}
                    onClick={() => { makeWindow(startX, startY, appHeight, appWidth, item.name, makeContentFromEntry(item, appWidth, appHeight)) }}
                    style={{
                        position: 'absolute',
                        top: topPx + 'px',
                        right: rightPx + 'px',
                        border: 'none',
                        background: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: ICON_COL_W + 'px',
                        padding: '6px 0',
                        textAlign: 'center',
                        pointerEvents: 'all',
                    }}>
                    <img src={iconSrc} style={{height: '48px', margin: '0 auto 4px', imageRendering: 'pixelated', display: 'block'}} alt={item.name} />
                    <h4
                        title={item.name}
                        style={{
                            ...iconTextStyle,
                            margin: 0,
                            boxSizing: 'border-box',
                            whiteSpace: 'nowrap',
                            display: 'inline-block',
                            backgroundColor: 'rgb(204, 204, 204)',
                            padding: '4px 8px',
                        }}
                    >{item.name}</h4>
                </button>
            )
        }) }
    </div>


    // Final HTML Code
    return <div >
        <div style= {{}}>
            {windows.map((item) => (
                <Draggable onMouseDown={() => {activeWindowHandler(item.id)}} handle="strong" >
                <div style={{zIndex: item.zIndex, position: "absolute"}} zIndex={item.zIndex} onMouseDown={() => {activeWindowHandler(item.id)}}>
                    {item.window}
                </div>
                </Draggable>
            ))}
        </div>
        {desktopIcons}
    </div>
}

export default WM;