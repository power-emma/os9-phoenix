import React, { useState, useRef, useEffect } from 'react';
import Close from "./images/close.png"

const Window = ({init, closeFunction }) => {
    // Get init variables
    const x = init.x;
    const y = init.y;
    const name = init.name;
    const content = init.content;
    const id = init.id;

    // keep width/height in state so resizing updates layout
    const [size, setSize] = useState({ width: init.width, height: init.height });
    const sizeRef = useRef(size);
    sizeRef.current = size;
    const draggingRef = useRef(false);
    const startRef = useRef({ mouseX: 0, mouseY: 0, startW: 0, startH: 0 });

    // Spawn titlebar
    let tb = titlebar(name)
    // If mobile then spawn the larger titlebar
    if (init.mobile) {
        tb = titlebarMobile(name)
    }

    // Wrapper for the close function
    const deleteFunction = () => closeFunction(id);

    // Resize handlers
    useEffect(() => {
        function onMove(e) {
            if (!draggingRef.current) return;
            e.preventDefault();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const dx = clientX - startRef.current.mouseX;
            const dy = clientY - startRef.current.mouseY;
            const newW = Math.max(120, Math.round(startRef.current.startW + dx));
            const newH = Math.max(80, Math.round(startRef.current.startH + dy));
            setSize({ width: newW, height: newH });
        }

        function onUp() {
            if (!draggingRef.current) return;
            draggingRef.current = false;
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onUp);
        }

        // attach global listeners when dragging starts via handlers below
        return () => {
            // cleanup in case
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onUp);
        };
    }, []);

    // Creates the titlebar
    function titlebar(name) {
        // Array of all HTML Elements
        let windowTitle = []
        
        // General Title Styling
        const nameStyle = {
            class: "window",
            position: "absolute",
            fontFamily: "Charcoal",
            fontWeight: "lighter",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgb(204, 204, 204)",
            top: "2px",
            whiteSpace: "nowrap",
            paddingLeft: "4px",
            paddingRight: "4px",
            fontSize: "13px"
        }
    
        // Spawn the horizontal lines of title bar
        for (let i = 0; i < 12; i++) {
            // Distance from top of bar
            let yOffset = 4
            // Alternate between white and grey
            let lineColor = (i % 2 === 0) ? "rgb(255, 255, 255)" : "rgb(119, 119, 119)"   
            // Title lines styling puts them under one another         
            const sty = {
                position: "absolute",
                top: (i + yOffset) + "px",
                backgroundColor: lineColor,
                height: "1px",
                left: "21px",
                right: "21px"
            }
            // Push Lines
            windowTitle.push(<div style={sty}></div>) 
        }
        // Close Button
        windowTitle.push(<img style={{height: "14px", width: "18px", paddingLeft: "4px", top: "-2px", verticalAlign: "unset", display: "inline"}} src={Close} onClick={() => deleteFunction()}/>)
        // Titlebar Text
        windowTitle.push(<div style={nameStyle}>{name}</div>)
        
        // Overall titlebar element is returned
        return <div style={{backgroundColor: "rgb(204, 204, 204)", height: "22px", userSelect: "none"}} > {windowTitle} </div>
    
    }   

    // Creates the mobile version of the titlebar
    function titlebarMobile(name) {
        // Array of all HTML Elements
        let windowTitle = []
        // General Title Styling
        const nameStyle = {
            class: "window",
            position: "absolute",
            fontFamily: "Charcoal",
            fontWeight: "lighter",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgb(204, 204, 204)",
            top: "2px",
            whiteSpace: "nowrap",
            paddingLeft: "4px",
            paddingRight: "4px",
            // Font has to be larger on Mobile
            fontSize: "20px"
        }

        // Spawn the horizontal lines of title bar
        for (let i = 0; i < 12; i++) {
            // Distance from top of bar
            let yOffset = 4
            // Alternate between white and grey
            let lineColor = (i % 2 === 0) ? "rgb(255, 255, 255)" : "rgb(119, 119, 119)"   
            // Title lines styling puts them under one another                  
            const sty = {
                position: "absolute",
                // Mobile has double height lines
                top: (2*i + yOffset) + "px",
                backgroundColor: lineColor,
                height: "2px",
                // Mobile Padding is different
                left: "37px",
                right: "8px"
            }
    
            windowTitle.push(<div style={sty}></div>) 
        }
        // Close Button
        windowTitle.push(<img style={{height: "28px", width: "30px", paddingLeft: "6px", paddingTop: "4px", verticalAlign: "unset", display: "inline"}} src={Close} onClick={() => deleteFunction()} onTouchEnd={() => deleteFunction() } />)
        // Titlebar Text
        windowTitle.push(<div style={nameStyle}>{name}</div>)

        // Overall titlebar element is returned
        return <div style={{backgroundColor: "rgb(204, 204, 204)", height: "32px", userSelect: "none"}} > {windowTitle} </div>
    
    }

    // Start/stop dragging from handle
    const onHandleDown = (e) => {
        e.preventDefault();
        draggingRef.current = true;
        document.body.style.userSelect = 'none';
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        startRef.current = { mouseX: clientX, mouseY: clientY, startW: sizeRef.current.width, startH: sizeRef.current.height };
        function onMove(e) {
            if (!draggingRef.current) return;
            const clientX2 = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY2 = e.touches ? e.touches[0].clientY : e.clientY;
            const dx = clientX2 - startRef.current.mouseX;
            const dy = clientY2 - startRef.current.mouseY;
            const newW = Math.max(120, Math.round(startRef.current.startW + dx));
            const newH = Math.max(80, Math.round(startRef.current.startH + dy));
            setSize({ width: newW, height: newH });
        }
        function onUp() {
            draggingRef.current = false;
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onUp);
    };

    // HTML code
    return <div style = {{
        position: "absolute",
        display: "block",
        height: size.height + "px",
        width: size.width + "px",
        left: x + "px",
        top: y + "px",
        }} >

        <div style = {{display: "inline-block",  height: "100%", width:"100%", position: 'relative'}}>
            <strong>
                <div>
                    {tb}
                </div>
            </strong>
            <div style = {{display: "flex", height: "100%", width:"100%", overflow: "auto"}}>
                {content}
            </div>

            {}
            
            <div
                onMouseDown={onHandleDown}
                onTouchStart={onHandleDown}
                style={{
                    position: 'absolute',
                    width: 14,
                    height: 14,
                    right: 0,
                    bottom: -23,
                    background: 'linear-gradient(135deg, rgba(0,0,0,0.12), rgba(255,255,255,0.6))',
                    border: '1px solid rgba(0,0,0,0.2)',
                    cursor: 'nwse-resize',
                    zIndex: 1000,
                    userSelect: 'none'
                }}
            />
        </div>
    </div>
        
    
}


export default Window;