import React from 'react';
import './menubar.css'

const MenuBar = () => {

    function updateTime() {
        let time = new Date().toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
        let timeContainer = document.body.querySelector(".menubar__time");
        timeContainer.innerHTML = time;
    }

    let barElems = (window.innerWidth - 250) / 50
    console.log(barElems)

    let barText = [
        <p className="menubar__button--no-text" style={{marginLeft: "38px"}}>File</p>,
        <p className="menubar__button--no-text" style={{marginLeft: "73px"}}>Edit</p>,
        <p className="menubar__button--no-text" style={{marginLeft: "110px"}}>View</p>,
        <p className="menubar__button--no-text" style={{marginLeft: "155px"}}>Special</p>,
        <p className="menubar__button--no-text" style={{marginLeft: "213px"}}>Help</p>
    ]
    if (barElems < barText.length) {
        barText.splice(barElems)
    }
    setInterval(function() {
        updateTime();
    }, 100);

    // Overall HTML code
    return  <div className="menubar" style={{zIndex: 9999999, width: window.innerWidth}}>
        <img className="menubar__left-corner" src="corner.png" />
        <img className="menubar__apple-button" src="applelogo.png" />

        <div className="menubar__action-button-div" >
            {barText}
        </div>
        <div className="menubar__time">
            TI:ME PM
        </div>
        <div className="menubar__right-header">
            <img src="headerdivider.png" style={{marginRight: "4px"}} />
            <img src="finder.png" />
            <p className="menubar__button--no-text" style={{top: "-1px", left: "32px", display: "inline"}}>poweremma.com</p>
        </div>
        <img className="menubar__right-corner" src="corner.png" />
  </div>
        
    
}


export default MenuBar;