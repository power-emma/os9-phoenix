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

// Images
import siteIcon from './icons/portfolio.png'
import orbitIcon from './icons/orbit.png'
import raycastIcon from './icons/raycast.png'
import plasmaIcon from './icons/plasma.png'
import renderIcon from './icons/renderer.png'


const WM = () => {
    // Int to store the next zIndex
    const [maxZIndex, setMaxZIndex] = useState(0);
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
        let newValue = maxZIndex + 1;
        setMaxZIndex(newValue);
        // Apply new zIndex to the item with said id
        let newArray = windows.map((item) =>
          item.id === id ? { ...item, zIndex: newValue } : item
        );
        setWindows(newArray);
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
        // Give window a zIndex
        let newValue = maxZIndex + 1;
        setMaxZIndex(newValue);
        // Give window an ID
        let newID = windows.length

        // Make window object
        let tempWin = <Window init={{
            x: x,
            y: y,
            height: height,
            width: width,
            name: name,
            content: content,
            id: newID,
            mobile: mobile
          }}
           closeFunction={deleteWindow}
        />
        
        // Make copy of windows
        let newArray = []
        windows.forEach((item, index) => {
            newArray.push(item)
        })

        // Add new window to top
        newArray.push({
            window: tempWin,
            id: windows.length,
            zIndex: newValue,
            baseX: x,
            baseY: y
        })

        setWindows(newArray);
    }



    // Blank Array useEffect means this code only runs at startup
    useEffect(() => {
        // Spawn Portfolio window
        makeWindow(20, 24, window.innerHeight - 60, practicalWidth - 40, "Emma's Website", <PortfolioMain init = {{
            height: window.innerHeight - 60,
            width: practicalWidth - 40
        }}/>)

        
      }, [])
    
    // Desktop Icon Tect
    // base text style for desktop icon labels; the visible background is applied to the label element
    const iconTextStyle = {
        fontSize: '14pt',
        textAlign: 'center'
    }

    // Define the desktop icons, and the initial parameters of the apps they run
    // desktop configuration can be provided via a JSON file at `/desktop.ini` (served from public/)
    // Format: JSON array of entries: [{"name":"Orbit.js","icon":"/path/to/icon.png","script":"orbit","width":<px>,"height":<px>}]
    // `script` may be a known app id (portfolio, orbit, raycast, plasma, renderer) or a URL (starts with http/ or /) to open in an iframe.
    const [desktopConfig, setDesktopConfig] = useState(null);

    useEffect(() => {
        // try to fetch a JSON config from the public folder
        fetch('/desktop.ini').then(async (res) => {
            if (!res.ok) return;
            const text = await res.text();
            try {
                const parsed = JSON.parse(text);
                if (Array.isArray(parsed)) setDesktopConfig(parsed);
            } catch (e) {
                // fallback: parse simple pipe-delimited lines: name|icon|script
                const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
                const parsed = lines.map(line => {
                    const parts = line.split('|').map(p => p.trim());
                    return { name: parts[0] || 'App', icon: parts[1] || '', script: parts[2] || '' };
                });
                setDesktopConfig(parsed);
            }
        }).catch(() => {
            // ignore fetch errors and fall back to defaults
        })
    }, [])

    const knownApps = {
        'portfolio': (w,h) => <PortfolioMain init={{width: w, height: h}} />,
        'orbit': (w,h) => <Orbit init={{width: w, height: h}} />,
        'raycast': (w,h) => <Raycast init={{width: w, height: h}} />,
        'plasma': (w,h) => <Plasma init={{width: w, height: h}} />,
        'renderer': (w,h) => <Renderer init={{width: w, height: h}} />
    };

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

    const desktopIcons = <div className="justify-content-center" style={{float: "right", marginRight: "200px", marginTop: "16px"}}>
        { (desktopConfig || [
            {name: "Emma's Website", icon: siteIcon, script: 'portfolio'},
            {name: 'Orbit.js', icon: orbitIcon, script: 'orbit'},
            {name: 'Raycast', icon: raycastIcon, script: 'raycast'},
            {name: 'Plasma', icon: plasmaIcon, script: 'plasma'},
            {name: '3D Renderer', icon: renderIcon, script: 'renderer'}
        ]).map((item, idx) => {
            const top = 32 + (idx * 100);
            // choose a sensible default icon based on the advertised script if no explicit icon is provided
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
            const iconSrc = item.icon || defaultIconFor(scriptKey);
            const appWidth = item.width || Math.round(practicalWidth - 40);
            const appHeight = item.height || (window.innerHeight - 60);
            // center icon and label together and use a consistent right offset unless overridden
            const rightOffset = item.rightOffset || 58;
            return (
                <button key={idx}
                    onClick={() => { makeWindow(20, top, appHeight, appWidth, item.name, makeContentFromEntry(item, appWidth, appHeight)) }}
                    style={{
                        position: 'absolute',
                        top: top + 'px',
                        right: rightOffset + 'px',
                        border: 'none',
                        background: 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: '220px',
                        padding: '6px',
                        textAlign: 'center'
                    }}>
                    <img src={iconSrc} style={{height: '64px', margin: '0 auto 6px', imageRendering: 'pixelated', display: 'block'}} alt={item.name}></img>
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
                            borderRadius: '0px'
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