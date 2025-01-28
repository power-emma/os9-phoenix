import {React, useState} from 'react';
import ReactDOM from 'react-dom/client';
import Window from './window';
import TContent from './testContent';

let windows = []

function activeWindowOnClick(e) {
    
    console.log("WM Here :3")
     
}



const WM = () => {



    const [zIndexes, setZIndexes] = useState(() => {
        const initialZIndexes = {};
        windows.forEach((window, index) => {
          initialZIndexes[window.id] = index + 1; // Start z-index at 1
        });
        return initialZIndexes;
      });
    
      const bringToFront = (id) => {
        setZIndexes((prevZIndexes) => {
          const maxZIndex = Math.max(...Object.values(prevZIndexes));
          return { ...prevZIndexes, [id]: maxZIndex + 1 };
        });
      };

      let w1 = <Window init={{
        x: 300,
        y: 200,
        height: 300,
        width: 400,
        name: "Skibidi Ohio",
        content: <TContent />,
        WMOnClick: {activeWindowOnClick},
        bringToFront: {bringToFront},
        id: 1
      }}/>
    
    let w2 = <Window init={{
        x: 800,
        y: 300,
        height: 300,
        width: 400,
        name: "Rizzzzler",
        content: <TContent />,
        WMOnClick: {activeWindowOnClick},
        
        id: 2
      }}/>
    
    windows = [w1, w2]


    return <div>
        {windows}
    </div>;
    

}

export default WM;