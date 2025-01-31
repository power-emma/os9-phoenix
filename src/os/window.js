import React from 'react';
import { useReducer } from 'react';
import ReactDOM from 'react-dom/client';
import TContent from './testContent.js';
import Draggable from "react-draggable";
import Close from "./close.png"
import aurora from './aurora.png'

function titlebar(name) {
    let windowTitle = []

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

    

    for (let i = 0; i < 12; i++) {
        // Distance from top of bar
        let yOffset = 4
        let lineColor = (i % 2 === 0) ? "rgb(255, 255, 255)" : "rgb(119, 119, 119)"            
        const sty = {
            position: "absolute",
            top: (i + yOffset) + "px",
            backgroundColor: lineColor,
            height: "1px",
            left: "21px",
            right: "21px"
        }

        windowTitle.push(<div style={sty}></div>) 
    }
    windowTitle.push(<img style={{height: "14px", width: "18px", paddingLeft: "4px", top: "-2px", verticalAlign: "unset", display: "inline"}} src={Close} onClick={() => console.log("click")}/>)
    windowTitle.push(<div style={nameStyle}>{name}</div>)
    
    return <div style={{backgroundColor: "rgb(204, 204, 204)", height: "22px", userSelect: "none"}} > {windowTitle} </div>

}



const Window = (props, parentClickHandler) => {

    let x = props.init.x;
    let y = props.init.y;
    let height = props.init.height;
    let width = props.init.width;
    
    let name = props.init.name;
    let content = props.init.content;

    let tb = titlebar(name)


    


    return <div style = {{
        position: "absolute",
        display: "block",
        height: height + "px",
        width: width + "px",
        left: x + "px",
        top: y + "px",
    }} >
        
        <Draggable handle="strong">
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
        </Draggable>
    </div>
        
    
}


export default Window;