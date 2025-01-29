import React from 'react';
import ReactDOM from 'react-dom/client';
import background from './background.png'
import emma from "./emma.jpg"
import './portfolio.css'
function base() {
    return (
        <div style={{backgroundImage: 'url(' + background + ')', backgroundSize: "cover", backgroundAttachment: "fixed", backgroundRepeat: "no-repeat", position: "flex", imageRendering: "pixelated", height: "100%", width:"100%"}}> 

            <div className = "h-25 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal",}}>
                <div className = "col-sm-3 d-flex justify-content-center"> 

                </div>
                <div className = "col-sm-6 justify-content-center align-items-center" >
                <div className = "h-25 d-flex justify-content-center " style={{color: "white"}}></div>
                    
                </div>
                <div className = "col-sm-3 d-flex justify-content-center align-items-center">

                </div>
            </div>

            <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal",}}>
                <div className = "col-sm-2 d-flex justify-content-center"> 

                </div>
                <div className = "col-sm-4 justify-content-center align-items-center" >
                    <div className = "h-25 d-flex " style={{color: "white"}}>
                        <h1 style={{fontSize: "5em"}}>Hi!</h1>
                    </div>
                    <div className = "h-50 d-flex" style={{color: "white", display: 'inline'}}>
                        <h1 style={{whiteSpace: "pre", fontSize: "5em", display: "inline"}}>I'm </h1>
                        <h1 style={{fontSize: "5em", background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent"}}>Emma</h1>
                    </div>
                    <div className = "h-25 d-flex " style={{color: "white"}}>
                        <p style={{fontSize: "1.5em"}}>I'm a software engineering student with a passion for all things digital. I enjoy developing software, working with technology new and old, and taking photos using unique cameras!</p>
                    </div>
                    <br/>
                    <button className="gradbutton">See My Projects</button>
                </div>
                <div className = "col-sm-6 d-flex justify-content-center align-items-center">
                    <img className="gradborder" src={emma} style={{width: "500px", imageRendering: "auto"}}/>
                </div>
            </div>
            <div className = "h-25 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal",}}>
                <div className = "col-sm-3 d-flex justify-content-center"> 

                </div>
                <div className = "col-sm-6 justify-content-center align-items-center" >
                    
                </div>
                <div className = "col-sm-3 d-flex justify-content-center align-items-center">

                </div>
            </div>
        </div>
    )
}




class PortfolioMain extends React.Component {

    render() {
        let con = base()
        return <div style={{width:"100%"}}>
            {con}
        </div>;
    }

}

export default PortfolioMain;