import {React, useState, useEffect} from 'react';
import ReactDOM from 'react-dom/client';
import Window from './window';
import TContent from './testContent';
import PortfolioMain from '../portfolio/portfoliomain';
import Orbit from '../orbit/orbitbridge';
import aurora from './aurora.png'
import siteIcon from './portfolioIcon.png'
import orbitIcon from './orbiticon.png'
import testIcon from './testicon.png'

import Draggable from "react-draggable";

function activeWindowOnClick(e) {
    
    console.log("WM Here :3")
     
}


const WM = () => {

    const [maxZIndex, setMaxZIndex] = useState(0);
    const [windows, setWindows] = useState([]);

    function parentClickHandler(id) {
        let newValue = maxZIndex + 1;
        setMaxZIndex(newValue);
    
        let newArray = windows.map((item) =>
          item.id === id ? { ...item, zIndex: newValue } : item
        );
        setWindows(newArray);
    }

    const deleteWindow = (id) => {
        // let newArray = windows.map((item) =>
        //   item.id === id ? {...null, zIndex: 0} : item
        // );

        let newArray = []
        for (let i = 0; i < windows.length; i++) {
            if (i === id) {
                console.log("deleted " + i)
            } else {
                console.log("did not delete " + i)
                newArray.push(windows[i])
            }
        }
        setWindows(newArray)

        //console.log("deleted window " + id)
    }

    const makeWindow = (x,y,height,width,name,content) => {
        let newValue = maxZIndex + 1;
        setMaxZIndex(newValue);
        let newID = windows.length
        let tempWin = <Window init={{
            x: x,
            y: y,
            height: height,
            width: width,
            name: name,
            content: content,
            id: newID
          }}
           closeFunction={deleteWindow}
          />
    
          let newArray = []

          windows.forEach((item, index) => {
            newArray.push(item)
          })
          newArray.push({
            window: tempWin,
            id: windows.length,
            zIndex: newValue,
            baseX: x,
            baseY: y
          })

          setWindows(newArray);
          console.log(windows)
    }




    useEffect(() => {
        makeWindow(20, 20, window.innerHeight - 60, window.innerWidth - 400, "Emma's Website", <PortfolioMain />)
        console.log(windows)
      }, [])



    const desktopStyle = {
        //top: "200px",
        //backgroundImage: `url(${aurora})`,
        //backgroundPosition: "center center",
        //height: "100vh",
        //width: "100vw",
        //objectFit: "cover",
        //overflow: "hidden"
        //position: "absolute"
    }

    const iconTextStyle = {backgroundColor: "rgb(204, 204, 204)", 
        fontFamily: "Geneva", 
        fontStyle: "normal", 
        fontSize: "14pt", 
        paddingLeft: "4px", 
        paddingRight: "4px", 
        paddingTop: "4px", 
        textAlign: "center"
    }

    return <div style={{desktopStyle}}>

        
        <div style= {{}}>
            {windows.map((item) => (
                <Draggable onMouseDown={() => {parentClickHandler(item.id)}} handle="strong" >
                <div style={{zIndex: item.zIndex, position: "absolute"}} zIndex={item.zIndex} onMouseDown={() => {parentClickHandler(item.id)}}>
                    {item.window}
                </div>
                </Draggable>
            ))}
        </div>
        <div className="justify-content-center" style={{float: "right", marginRight: "200px"}}>
            
            <button onClick={() =>{makeWindow(20, 20, window.innerHeight - 60, window.innerWidth - 400, "Emma's Website", <PortfolioMain />)} } style={{position: "absolute", top: "20px", right: "20px", border: "none", background: "none"}} >
                <img src={siteIcon} style={{height: "64px", imageRendering: "pixelated"}}></img>
                <h4 style={iconTextStyle}>Emma's Website</h4>
            </button>
            <button onClick={() =>{makeWindow(200, 50, 800, 1000, "orbit.js", <Orbit />)} } style={{position: "absolute", top: "120px", right: "56px", border: "none", background: "none"}} >
                <img src={orbitIcon} style={{height: "64px", imageRendering: "pixelated"}}></img>
                <h4 style={iconTextStyle}>Orbit.js</h4>
            </button>
            <button onClick={() =>{makeWindow(1600, 200, 100, 400, "Test Window", <TContent />)} } style={{position: "absolute", top: "220px", right: "36px", border: "none", background: "none"}} >
                <img src={testIcon} style={{height: "64px", imageRendering: "pixelated"}}></img>
                <h4 style={iconTextStyle}>Test Window</h4>
            </button>
        </div>
    </div>
    
    

}

export default WM;