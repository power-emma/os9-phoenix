// React Imports
import {React, useState, useEffect, useRef} from 'react';
import ReactDOM from 'react-dom/client';
import Draggable from "react-draggable";

// Window Imports
import Window from './window';

// Fallback icon for any app that doesn't provide its own via `meta.icon`
import defaultIcon from './icons/portfolio.png'

// Auto-discover every app under src/apps/*/index.jsx. To add a new app,
// drop its folder in (e.g. as a git submodule) with an index.jsx that does:
//   export default MyComponent;               // receives props.init = {width, height, openWindow}
//   export const meta = { name, icon, width, height, x, y };
// No other file needs to change — it shows up on the desktop automatically.
const appModules = import.meta.glob('../apps/*/index.jsx', { eager: true });

const DISCOVERED_APPS = Object.entries(appModules)
    .map(([path, mod]) => {
        const folder = path.split('/').slice(-2, -1)[0];
        const meta = mod.meta || {};
        return { key: meta.id || folder, Component: mod.default, meta };
    })
    .filter(app => typeof app.Component === 'function')
    .sort((a, b) => (a.meta.order ?? 0) - (b.meta.order ?? 0) || a.key.localeCompare(b.key));

const WM = ({ onReady }) => {
    // Int to store the next zIndex — kept in a ref so closures always read the latest value
    const maxZIndexRef = useRef(0);
    const bumpZ = () => { maxZIndexRef.current += 1; return maxZIndexRef.current; };
    // Array of all windows
    const [windows, setWindows] = useState([]);
    // Per-window draggable positions { [id]: {x, y} } — lets us snap on release
    const [positions, setPositions] = useState({});
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

            // Seed the draggable position for this window
            setPositions(prev => ({ ...prev, [newID]: { x: clampedX, y: clampedY } }));

            return [...prev, {
                window: tempWin,
                id: newID,
                zIndex: newValue,
                baseX: x,
                baseY: y
            }];
        });
    }

    // Maps app key -> (w, h) => <Component .../>, built from the auto-discovered apps
    const knownApps = {};
    DISCOVERED_APPS.forEach(({ key, Component }) => {
        knownApps[key] = (w, h) => <Component init={{ width: w, height: h, openWindow: makeWindow }} />;
    });

    // Desktop icon entries, derived straight from each app's own `meta` export
    const desktopConfig = DISCOVERED_APPS.map(({ key, meta }) => ({
        script: key,
        name: meta.name || key,
        icon: meta.icon || defaultIcon,
        width: meta.width,
        height: meta.height,
        x: meta.x,
        y: meta.y,
    }));

    // Parse the deep-link slug once at load time (e.g. /chat → 'chat')
    const deepLinkSlug = window.location.pathname.replace(/^\//, '').split('/')[0].toLowerCase();

    // Desktop Icon Text
    // base text style for desktop icon labels; the visible background is applied to the label element
    const iconTextStyle = {
        fontSize: '11pt',
        textAlign: 'center'
    }

    // Guard so StrictMode's double-invocation of effects never opens two windows
    const initDone = useRef(false);

    useEffect(() => {
        // Apps are discovered synchronously at module load (no server round-trip needed),
        // so we're ready as soon as this effect runs.
        if (onReady) onReady();

        // Only open the initial window once — guards against StrictMode double-invoke
        if (initDone.current) return;
        initDone.current = true;

        // Open the initial window: deep-linked app if the URL matches one, else the home app
        const entry = desktopConfig.find(e => e.script === deepLinkSlug)
            || desktopConfig.find(e => e.script === 'portfolio')
            || desktopConfig[0];

        if (entry) {
            const appWidth  = entry.width  || Math.round(practicalWidth - 40);
            const appHeight = entry.height || (window.innerHeight - 60);
            const startX = entry.x ?? 20;
            const startY = entry.y ?? 24;
            makeWindow(startX, startY, appHeight, appWidth, entry.name, knownApps[entry.script](appWidth, appHeight));
        }
    }, [])

    const ICON_COL_W = 90;   // px per column
    const ICON_ROW_H = 100;  // px per icon slot
    const ICON_RIGHT_PAD = 24; // px gap from right edge
    const availableH = window.innerHeight - 22; // below menubar
    const iconsPerCol = Math.max(1, Math.floor(availableH / ICON_ROW_H));

    const desktopIcons = <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        { desktopConfig.map((item, idx) => {
            const col = Math.floor(idx / iconsPerCol);
            const row = idx % iconsPerCol;
            const rightPx = ICON_RIGHT_PAD + col * ICON_COL_W;
            const topPx  = 22 + row * ICON_ROW_H;

            const appWidth = item.width || Math.round(practicalWidth - 40);
            const appHeight = item.height || (window.innerHeight - 60);
            const startX = (typeof item.x === 'number') ? item.x : 20;
            const startY = (typeof item.y === 'number') ? item.y : 24;
            return (
                <button key={idx}
                    onClick={() => { makeWindow(startX, startY, appHeight, appWidth, item.name, knownApps[item.script](appWidth, appHeight)) }}
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
                    <img src={item.icon} style={{height: '48px', margin: '0 auto 4px', imageRendering: 'pixelated', display: 'block'}} alt={item.name} />
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
    const MENUBAR_H = 22;
    return <div >
        <div style= {{}}>
            {windows.map((item) => {
                const pos = positions[item.id] || { x: 0, y: MENUBAR_H };
                return (
                    <Draggable
                        key={item.id}
                        handle="strong"
                        position={pos}
                        onMouseDown={() => activeWindowHandler(item.id)}
                        onDrag={(e, data) => {
                            setPositions(prev => ({ ...prev, [item.id]: { x: data.x, y: data.y } }));
                        }}
                        onStop={(e, data) => {
                            // Snap down if dragged above the menubar
                            const snappedY = Math.max(MENUBAR_H, data.y);
                            setPositions(prev => ({ ...prev, [item.id]: { x: data.x, y: snappedY } }));
                        }}
                    >
                        <div style={{zIndex: item.zIndex, position: "absolute"}} onMouseDown={() => activeWindowHandler(item.id)}>
                            {item.window}
                        </div>
                    </Draggable>
                );
            })}
        </div>
        {desktopIcons}
    </div>
}

export default WM;
