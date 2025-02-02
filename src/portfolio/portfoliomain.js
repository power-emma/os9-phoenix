import {React, useState, useEffect} from 'react';
import ReactDOM from 'react-dom/client';
import background from './background.png'
import emma from "./emma.jpg"
import './portfolio.css'



const PortfolioMain = ({init}) => {

    let height = init.height
    let width = init.width

    let em = width/1000 
    if (height/800 < em) {
        em = height/800
    }

    let imgHeight = height/1.5 + "px"
    let headerSize = 2*em + "em"
    let h1Size = 4*em + "em"
    let h2Size = 3*em + "em"
    let heropSize = 1.5*em + "em"

    console.log(headerSize)

    const [currentPage, setCurrentPage] = useState(<div></div>);

    const changePage = (to) => {
        switch(to) {
            case 'Home':
                setCurrentPage(home());
                break;
            case 'Projects':
                setCurrentPage(proj());
                break;
            case 'Photos':
                setCurrentPage(photos());
                break;
        }

    }

    const header = <div className = "h-25 d-flex justify-content-center " style={{color: "white", fontFamily: "Charcoal",}}>
        <div className = "col-sm-3 d-flex justify-content-center"> 
            <h1 style={{fontSize: "2em", background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent", padding: "4vh"}}> Emma Power </h1>
        </div>
        <div className = "col-sm-6 justify-content-center align-items-center" >
        <div className = "h-25 d-flex justify-content-center " style={{color: "white"}}></div>
        
        </div>
        <div className = "col-sm-3 d-flex justify-content-center" style={{padding: "4vh", paddingRight: "20vw"}}>
            <h1 style={{whiteSpace: "pre", fontSize: headerSize, background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent"}} onClick={() => {changePage("Home")}}>Home</h1>
            <h1 style={{whiteSpace: "pre", fontSize: headerSize, background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent"}} onClick={() => {changePage("Projects")}}>   Projects</h1>
            <h1 style={{whiteSpace: "pre", fontSize: headerSize, background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent"}} onClick={() => {changePage("Photos")}}>   Photos</h1>

        </div>
    </div>

    const home = () => {
        return (
            <div style={{backgroundImage: 'url(' + background + ')', backgroundSize: "cover", backgroundAttachment: "fixed", backgroundRepeat: "no-repeat", position: "flex", imageRendering: "pixelated", height: "100%", width:"100%"}}> 
    
                {header}

                <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal",}}>
                    <div className = "col-sm-2 d-flex justify-content-center"> 
    
                    </div>
                    <div className = "col-sm-4 justify-content-center align-items-center" >
                        <div className = "h-25 d-flex " style={{color: "white"}}>
                            <h1 style={{fontSize: h1Size}}>Hi!</h1>
                        </div>
                        <div className = "h-50 d-flex" style={{color: "white", display: 'inline'}}>
                            <h1 style={{whiteSpace: "pre", fontSize: h1Size, display: "inline"}}>I'm </h1>
                            <h1 style={{fontSize: h1Size, background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent"}}>Emma</h1>
                        </div>
                        <div className = "h-25 d-flex " style={{color: "white"}}>
                            <p style={{fontSize: heropSize}}>I'm a software engineering student with a passion for all things digital. I enjoy developing software, working with technology new and old, and taking photos using unique cameras!</p>
                        </div>
                        <br/>
                        <button className="gradbutton" onClick={() => {changePage("Projects")}}>See My Projects</button>
                    </div>
                    <div className = "col-sm-6 d-flex justify-content-center align-items-center">
                        <img className="gradImgBorder" src={emma} style={{height: imgHeight, imageRendering: "auto"}}/>
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
    
    const proj = () => {
        return <div style={{backgroundImage: 'url(' + background + ')', backgroundSize: "cover", backgroundAttachment: "fixed", backgroundRepeat: "no-repeat", backgroundColor: "#000", position: "flex", imageRendering: "pixelated", width:"100%"}}> 
    
        {header}

        <div className = "h-75 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal",}}>
            <div className = "col-sm-2 d-flex justify-content-center"> 

            </div>
            <div className = "col-sm-8 justify-content-center align-items-center gradProjBorder" style = {{padding: "40px"}} >
                <div className = "h-25 d-flex align-items-center" style={{color: "white"}}>
                    <h1 style={{fontSize: h2Size}}>This Website!</h1>
                </div>
                <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", display: 'inline'}}>
                    <p style={{fontSize: heropSize}}>Combining modern web design paradigms with the aesthetics of an operating system from the 90's, this React based website allows for a unique, window based take to display other JavaScript based applications</p>
                </div>
                <div className = "h-25 d-flex justify-content-center align-items-center" style={{color: "white"}}>
                    <p style={{fontSize: heropSize}}>Tip: Move the Windows Around!</p>
                </div>
                <br/>
            </div>
            <div className = "col-sm-2 d-flex justify-content-center align-items-center">
                
            </div>
        </div>

        <div className = "h-75 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal", marginTop: "50px"}}>
            <div className = "col-sm-2 d-flex justify-content-center"> 

            </div>
            <div className = "col-sm-8 justify-content-center align-items-center gradProjBorder" style = {{padding: "40px"}} >
                <div className = "h-25 d-flex align-items-center" style={{color: "white"}}>
                    <h1 style={{fontSize: h2Size}}>Orbit.JS</h1>
                </div>
                <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", display: 'inline'}}>
                    <p style={{fontSize: heropSize}} >Displays an accurate model of any arbitrary amount of celestial bodies. Allows for visualization of Solar Systems as well as other gravitational phenomena</p>
                </div>
                <div className = "h-25 d-flex justify-content-center align-items-center" style={{color: "white"}}>
                    <p style={{fontSize: heropSize}}> Coming Soon: Interactive Planet Placement</p>
                </div>
                <br/>
            </div>
            <div className = "col-sm-2 d-flex justify-content-center align-items-center">
                
            </div>
        </div>

        <div className = "h-75 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal", marginTop: "50px"}}>
            <div className = "col-sm-2 d-flex justify-content-center"> 

            </div>
            <div className = "col-sm-8 justify-content-center align-items-center gradProjBorder" style = {{padding: "40px"}} >
                <div className = "h-25 d-flex align-items-center" style={{color: "white"}}>
                    <h1 style={{fontSize: h2Size}}>Other Projects</h1>
                </div>
                <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", display: 'inline'}}>
                    <p style={{fontSize: heropSize}} >Coming Soon (I swear ive written more than 2 applications in my lifetime) </p>
                </div>
                <div className = "h-25 d-flex justify-content-center align-items-center" style={{color: "white"}}>
                    <p style={{fontSize: heropSize}}>Hint! Its a pain to port Java and C apps to React!</p>
                </div>
                <br/>
            </div>
            <div className = "col-sm-2 d-flex justify-content-center align-items-center">
                
            </div>
        </div>

    </div>
    }

    const photos = () => {
        return <div style={{backgroundImage: 'url(' + background + ')', backgroundSize: "cover", backgroundAttachment: "fixed", backgroundRepeat: "no-repeat", position: "flex", imageRendering: "pixelated", height: "100%", width:"100%"}}> 
        
            {header}

            <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal",}}>
                <div className = "col-sm-2 d-flex justify-content-center"> 

                </div>
                <div className = "col-sm-4 justify-content-center align-items-center" >
                    <div className = "h-25 d-flex " style={{color: "white"}}>
                        <h1 style={{fontSize: h1Size}}>Photos!</h1>
                    </div>
                    <div className = "h-50 d-flex" style={{color: "white", display: 'inline'}}>

                    </div>
                    <div className = "h-25 d-flex " style={{color: "white"}}>
                        <p style={{fontSize: heropSize}}>Still a WIP</p>
                    </div>
                    <br/>
                </div>
                <div className = "col-sm-6 d-flex justify-content-center align-items-center">
                    
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
    }
    
    useEffect(() => {
        setCurrentPage(home())
    }, [])
    

    
    return(
        <div style={{width:"100%"}}>
            {currentPage}
        </div>
    )

}

export default PortfolioMain;