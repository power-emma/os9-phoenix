import {React, useState, useEffect} from 'react';
import ReactDOM from 'react-dom/client';
import Window from './window';
import TContent from './testContent';
import PortfolioMain from '../portfolio/portfoliomain';
import Orbit from '../orbit/orbitbridge';
import aurora from './aurora.png'

import Draggable from "react-draggable";

function activeWindowOnClick(e) {
    
    console.log("WM Here :3")
     
}





function makeIcon() {

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

    const makeWindow = (x,y,height,width,name,content,parentClickHandler) => {
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
           parentClickHandler={() => parentClickHandler(newID)}
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
        <button onClick={() =>{makeWindow(20, 20, window.innerHeight - 60, window.innerWidth - 400, "Emma's Website", <PortfolioMain />)} } style={{position: "absolute", top: "0px"}} >Emma's Website</button>
        <button onClick={() =>{makeWindow(200, 50, 800, 1000, "orbit.js", <Orbit />)} } style={{position: "absolute", top: "26px"}} >Orbit.js</button>
        <button onClick={() =>{makeWindow(1600, 200, 100, 400, "I BEG OF YOU", <TContent />)} } style={{position: "absolute", top: "52px"}} >Test Window</button>
    </div>
    
    

}

export default WM;