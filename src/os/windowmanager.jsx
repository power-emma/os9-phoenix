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

// Images
import siteIcon from './icons/portfolio.png'
import orbitIcon from './icons/orbit.png'
import raycastIcon from './icons/raycast.png'
import testIcon from './icons/test.png'


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
    const iconTextStyle = {backgroundColor: "rgb(204, 204, 204)", 
        fontSize: "14pt", 
        paddingLeft: "4px", 
        paddingRight: "4px", 
        textAlign: "center"
    }

    // Define the desktop icons, and the initial parameters of the apps they run
    const desktopIcons = <div className="justify-content-center" style={{float: "right", marginRight: "200px", marginTop: "16px"}}>
        <button onClick={() =>{makeWindow(20, 32, window.innerHeight - 60, practicalWidth - 40, "Emma's Website", 
            <PortfolioMain init = {{
                height: window.innerHeight - 60,
                width: practicalWidth - 40
            }}
        />)}}
        style={{position: "absolute", top: "32px", right: "20px", border: "none", background: "none"}} >
            <img src={siteIcon} style={{height: "64px", imageRendering: "pixelated"}}></img>
            <h4 style={iconTextStyle}>Emma's Website</h4>
        </button>

        <button onClick={() =>{makeWindow(20, 32, window.innerHeight - 60, practicalWidth/ 1.25, "orbit.js", 
            <Orbit init = {{
                height: window.innerHeight - 60,
                width: practicalWidth / 1.25
            }}
        />)}} 
        style={{position: "absolute", top: "132px", right: "58px", border: "none", background: "none"}} >
            <img src={orbitIcon} style={{height: "64px", imageRendering: "pixelated"}}></img>
            <h4 style={iconTextStyle}>Orbit.js</h4>
        </button>

        <button onClick={() =>{makeWindow(20, 32, window.innerHeight - 60, practicalWidth - 40, "Raycast Engine", 
            <Raycast init = {{
            height: window.innerHeight - 60,
            width: practicalWidth - 40
            }}/>
        )} } style={{position: "absolute", top: "232px", right: "58px", border: "none", background: "none"}} >
            <img src={raycastIcon} style={{height: "64px", imageRendering: "pixelated"}}></img>
            <h4 style={iconTextStyle}>Raycast</h4>
        </button>
        
        <button onClick={() =>{makeWindow(40, 40, 100, 400, "Test Window", <TContent />)} } style={{position: "absolute", top: "332px", right: "36px", border: "none", background: "none"}} >
            <img src={testIcon} style={{height: "64px", imageRendering: "pixelated"}}></img>
            <h4 style={iconTextStyle}>Test Window</h4>
        </button>
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