import React from 'react';
import ReactDOM from 'react-dom/client';
import TContent from './testContent.js';

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
        fontSize: "13px",
    }

    

     for (let i = 0; i < 12; i++) {
        // Distance from top of bar
        let yOffset = 4
        let lineColor = (i % 2 == 0) ? "rgb(255, 255, 255)" : "rgb(119, 119, 119)"            
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

    windowTitle.push(<div style={nameStyle}>{name}</div>)
    return <div style={{backgroundColor: "rgb(204, 204, 204)", height: "22px"}} > {windowTitle} </div>

}



class Window extends React.Component {
    constructor(props) {

        super(props);
        this.x = props.init.x;
        this.y = props.init.y;
        this.height = props.init.height;
        this.width = props.init.width;
        
        this.name = props.init.name;
        this.content = props.init.content;


    }
    
    render() {
        const windowStyle = {
            position: "absolute",
            display: "block",
            height: "250px",
            width: "400px",
            left: "300px",
            top: "500px"
        }

        let tb = titlebar(this.name)

        return <div style = {windowStyle}>
            <div>{tb}</div>
            
            <div style = {{display: "flex", height: "100%", width:"100%"}}>
                {this.content}
            </div>
        </div>
        
    }
}


export default Window;