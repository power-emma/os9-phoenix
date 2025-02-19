import React from 'react';
import Close from "./images/close.png"

const Window = ({init, closeFunction }) => {
    // Get init variables
    let x = init.x;
    let y = init.y;
    let height = init.height;
    let width = init.width;
    let name = init.name;
    let content = init.content;
    let id = init.id

    // Spawn titlebar
    let tb = titlebar(name)
    // If mobile then spawn the larger titlebar
    if (init.mobile) {
        tb = titlebarMobile(name)
    }

    // Wrapper for the closef unction
    const deleteFunction = () => {
        closeFunction(id)
    }

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

    // Overall HTML code
    return <div style = {{
        position: "absolute",
        display: "block",
        height: height + "px",
        width: width + "px",
        left: x + "px",
        top: y + "px",
        }} >

        <div style = {{display: "inline-block",  height: "100%", width:"100%"}}>
            <strong>
                <div>
                    {tb}
                </div>
            </strong>
            <div style = {{display: "flex", height: "100%", width:"100%", overflow: "auto"}}>
                {content}
            </div>
        </div>
    </div>
        
    
}


export default Window;