import React from 'react';
import ReactDOM from 'react-dom/client';
import Window from './window';
import TContent from './testContent';

let windows = []

function activeWindowOnClick(e) {
    
    console.log("WM Here :3")
     
}

let w1 = <Window init={{
    x: 300,
    y: 200,
    height: 300,
    width: 400,
    name: "Skibidi Ohio",
    content: <TContent />,
    WMOnClick: {activeWindowOnClick}
  }}/>

let w2 = <Window init={{
    x: 800,
    y: 300,
    height: 300,
    width: 400,
    name: "Rizzzzler",
    content: <TContent />,
    WMOnClick: {activeWindowOnClick}
  }}/>

windows = [w1, w2]

console.log(typeof {activeWindowOnClick})
class WM extends React.Component {
    

    render() {
        

        
        return <div>
            {windows}
        </div>;
    }

}

export default WM;