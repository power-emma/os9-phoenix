import {React, useState, useEffect} from 'react';
import ReactDOM from 'react-dom/client';
import Window from './window';
import TContent from './testContent';
import PortfolioMain from '../portfolio/portfoliomain';

let windows = []

function activeWindowOnClick(e) {
    
    console.log("WM Here :3")
     
}

function makeWindow(x,y,height,width,name,content) {
    console.log("Ran")
    let tempWin = <Window init={{
        x: x,
        y: y,
        height: height,
        width: width,
        name: name,
        content: content,
        WMOnClick: {activeWindowOnClick},
        id: 1
      }}/>

    windows.push(tempWin)
}

makeWindow(20, 20, 1200, 1200, "Emma's Website", <PortfolioMain />)
makeWindow(1600, 200, 100, 400, "Side Shit", <TContent />)

const WM = () => {

    

    //   let w1 = <Window init={{
    //     x: 300,
    //     y: 200,
    //     height: 300,
    //     width: 400,
    //     name: "Skibidi Ohio",
    //     content: <TContent />,
    //     WMOnClick: {activeWindowOnClick},
    //     bringToFront: {bringToFront},
    //     id: 1
    //   }}/>
    
    // let w2 = <Window init={{
    //     x: 800,
    //     y: 300,
    //     height: 300,
    //     width: 400,
    //     name: "Rizzzzler",
    //     content: <TContent />,
    //     WMOnClick: {activeWindowOnClick},
        
    //     id: 2
    //   }}/>
    
    //windows = [w1, w2]

    

    return <div>
        {windows}
    </div>;
    

}

export default WM;