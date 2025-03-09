import {React, useState, useEffect, useRef} from 'react';
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import ReactDOM from 'react-dom/client';
import background from './background.png'
import emma from "./emma.webp"
import './portfolio.css'



const PortfolioMain = ({init}) => {

    // Window height and width
    let height = init.height
    let width = init.width

    // How many ems should text be
    let em = width/1000 
    if (height/800 < em) {
        em = height/800
    }

    // Desktop PAdding
    let defaultPadding = "2vh"

    let mobile = false
    if (height > width && width < 700   ) {
        mobile = true
        em = height/1200
        defaultPadding = "6vh"
    }

    // Get size dependent font sizes
    let imgHeight = height/1.5 + "px"
    let headerSize = 2*em + "em"
    let h1Size = 4*em + "em"
    let h2Size = 3*em + "em"
    let heropSize = 1.5*em + "em"

    // Store page elements as state
    const [currentPage, setCurrentPage] = useState(<div></div>);
    
    // Router who??? (This website is 3 pages it will do fine)
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

    // Header HTML
    let header = <div className = "h-25 d-flex justify-content-center " style={{color: "white", fontFamily: "Charcoal",}}>
        <div className = "col-sm-3 d-flex justify-content-center"> 
            <h1 style={{fontSize: "2em", background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent", padding: "4vh"}}> Emma Power </h1>
        </div>
        <div className = "col-sm-6 justify-content-center align-items-center" >
        <div className = "h-25 d-flex justify-content-center " style={{color: "white"}}></div>
        
        </div>
        <div className = "col-sm-3 d-flex justify-content-center" style={{padding: "4vh", paddingRight: "20vw"}}>
            <h1 style={{whiteSpace: "pre", fontSize: headerSize, background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent", cursor: "pointer"}} onClick={() => {changePage("Home")}}>Home</h1>
            <h1 style={{whiteSpace: "pre", fontSize: headerSize, background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent", cursor: "pointer"}} onClick={() => {changePage("Projects")}}>   Projects</h1>
            <h1 style={{whiteSpace: "pre", fontSize: headerSize, background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent", cursor: "pointer"}} onClick={() => {changePage("Photos")}}>   Photos</h1>

        </div>
    </div>

    // Special Formatting if mobile
    if (mobile) {
        header = <div className = "h-25 d-flex justify-content-center " style={{color: "white", fontFamily: "Charcoal",}}>
            <div className = "d-flex justify-content-center"> 
                <h1 style={{fontSize: "2em", background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent", padding: "4vh"}}> Emma Power </h1>
            </div>
            <div className = "justify-content-center align-items-center" >
            <div className = "h-25 d-flex justify-content-center " style={{color: "white"}}></div>
            
            </div>
            <div className = "" style={{padding: "4vh", paddingRight: "5vw"}}>
                <h1 style={{whiteSpace: "pre", fontSize: headerSize, background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent"}} onClick={() => {changePage("Home")}}>Home</h1>
                <h1 style={{whiteSpace: "pre", fontSize: headerSize, background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent"}} onClick={() => {changePage("Projects")}}>Projects</h1>
                <h1 style={{whiteSpace: "pre", fontSize: headerSize, background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent"}} onClick={() => {changePage("Photos")}}>Photos</h1>

            </div>
        </div>
    }

    // Home page HTML
    const home = () => {
        let emmaPhoto = ""
        let emmaPhotoMobile = ""
        let emmaHeight = "100%"
        // If on desktop the photo should be inline with the hero text
        if (! mobile) {
            emmaPhoto = <div className = "col-sm-6 d-flex justify-content-center align-items-center" >
            <img className="gradImgBorder" src={emma} style={{height: imgHeight, imageRendering: "auto"}}/>
        </div>
        emmaPhotoMobile = <div>
            <div className = "h-100 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal", paddingTop: "5vh"}}>
                <img src={null} style={{imageRendering: "auto"}}/>
            </div>
        </div>
        // If on Mobile the photo should be under the button
        } else {
            emmaHeight = "130%"
            emmaPhotoMobile = <div>
            <div className = "h-25 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal", paddingTop: "5vh"}}>

                <img className="gradImgBorder" src={emma} style={{height: imgHeight, imageRendering: "auto"}}/>
                </div>
            </div>
        }

        // HTML and Bootstrap Hell
        return (
            <div style={{backgroundImage: 'url(' + background + ')', backgroundSize: "cover", backgroundAttachment: "fixed", backgroundRepeat: "no-repeat", backgroundColor: "#000", position: "flex", imageRendering: "pixelated", backgroundSize: "cover"}}> 
    
                {header}

                <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal",}}>
                    <div className = "col-sm-2 d-flex justify-content-center"> 
    
                    </div>
                    <div className = "col-sm-4 justify-content-center align-items-center"  style = {{padding: defaultPadding}}>
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
                        <br/>
                        
                    </div>
                    {emmaPhoto}
                </div>
                <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal",}}>
                    {emmaPhotoMobile}
                    
                </div>
                <div className = "h-25 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal", marginTop: "50px", padding: "2vh"}}>
                    <div className = "col-sm-2 d-flex justify-content-center"> 

                    </div>
                    <div className = "col-sm-8 justify-content-center align-items-center gradProjBorder" style = {{padding: "40px"}} >
                        <div className = "h-50 d-flex align-items-center" style={{color: "white"}}>
                            <h1 style={{fontSize: h2Size}}>Treat this like a normal desktop!</h1>
                        </div>
                        <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", display: 'inline'}}>
                            <p style={{fontSize: heropSize}} >Move and close windows just like you are used to! The desktop icons will launch apps in their own windows too!</p>
                        </div>
                        <br/>
                    </div>
                    <div className = "col-sm-2 d-flex justify-content-center align-items-center">
                        
                    </div>
                </div>
            </div>
        )
    }
    
    // Projects page
    const proj = () => {
        // HTML and Bootstrap Hell
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
                    <p style={{fontSize: heropSize}}>Combining modern web design paradigms with the aesthetics of an operating system from the 90's, this React based website allows for a unique, window based take to display other web based applications</p>
                </div>
                <div className = "h-25 d-flex justify-content-center align-items-center" style={{color: "white"}}>
                    <p style={{fontSize: heropSize}}>Tip: Move the Windows Around and Click the Desktop Icons!</p>
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
                    <p style={{fontSize: heropSize}}> Tip: Orbits are difficult to create, place planets carefully to avoid collisions</p>
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
                    <h1 style={{fontSize: h2Size}}>Raycast</h1>
                </div>
                <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", display: 'inline'}}>
                    <p style={{fontSize: heropSize}}>A graphical engine which uses distance away from objects on a 2d world, to create a 3d effect. While necessary to achieve a 3d effect on older processors, now serves to create a unique aesthetic</p>
                </div>
                <div className = "h-25 d-flex justify-content-center align-items-center" style={{color: "white"}}>
                    <p style={{fontSize: heropSize,  display: "block"}}>Tip: Control with WASD or the Arrow Keys</p>
                </div>
                <br/>
            </div>
            <div className = "col-sm-2 d-flex justify-content-center align-items-center">
                
            </div>
        </div>

        <div className = "h-75 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal", marginTop: "50px", paddingBottom: "4vh"}}>
            <div className = "col-sm-2 d-flex justify-content-center"> 

            </div>
            <div className = "col-sm-8 justify-content-center align-items-center gradProjBorder" style = {{padding: "40px"}} >
                <div className = "h-25 d-flex align-items-center" style={{color: "white"}}>
                    <h1 style={{fontSize: h2Size}}>Other Projects</h1>
                </div>
                <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", display: 'inline'}}>
                    <p style={{fontSize: heropSize}} >Check out my GitHub page for projects in other languages like C and Java, as well as the source code of this website!</p>
                </div>
                <div className = "h-25 d-flex justify-content-center align-items-center" style={{color: "white"}}>
                    <a className="gradbutton" href='https://github.com/power-emma'>See my GitHub</a>
                </div>
                <br/>
            </div>
            <div className = "col-sm-2 d-flex justify-content-center align-items-center">
                
            </div>
        </div>

    </div>
    }

    const favPics = [
        { src: "./photos/film/f1.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f2.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f3.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f4.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f5.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f6.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f7.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f8.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f9.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f10.jpg", width: 1544, height: 1024 },
        { src: "./photos/film/f11.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f12.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f13.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f14.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f15.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f16.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f17.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f18.jpg", width: 1544, height: 1024 },
        { src: "./photos/film/f19.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f20.jpg", width: 1024, height: 1544 },
    ]

    const qtp = [
        { src: "./photos/qt/qt1.jpg", width: 480, height: 640 },
        { src: "./photos/qt/qt2.jpg", width: 480, height: 640 },
        { src: "./photos/qt/qt3.jpg", width: 480, height: 640 },
        { src: "./photos/qt/qt4.jpg", width: 640, height: 480 },
        { src: "./photos/qt/qt5.jpg", width: 640, height: 480 },
        { src: "./photos/qt/qt6.jpg", width: 480, height: 640 },
    ];

    const mavicaPics = [
        { src: "./photos/mavica/m1.jpg", width: 480, height: 640},
        { src: "./photos/mavica/m2.jpg", width: 640, height: 480},
        { src: "./photos/mavica/m3.jpg", width: 480, height: 640},
        { src: "./photos/mavica/m4.jpg", width: 640, height: 480},
        { src: "./photos/mavica/m5.jpg", width: 480, height: 640},
        { src: "./photos/mavica/m6.jpg", width: 480, height: 640},
        { src: "./photos/mavica/m7.jpg", width: 480, height: 640},
        { src: "./photos/mavica/m8.jpg", width: 480, height: 640},
        { src: "./photos/mavica/m9.jpg", width: 480, height: 640},
        { src: "./photos/mavica/m10.jpg", width: 480, height: 640},
        { src: "./photos/mavica/m11.jpg", width: 480, height: 640},
        { src: "./photos/mavica/m12.jpg", width: 480, height: 640},
        { src: "./photos/mavica/m13.jpg", width: 480, height: 640},
    ]

    const filmPics = [
        { src: "./photos/film/f1.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f2.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f3.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f4.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f5.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f6.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f7.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f8.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f9.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f10.jpg", width: 1544, height: 1024 },
        { src: "./photos/film/f11.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f12.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f13.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f14.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f15.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f16.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f17.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f18.jpg", width: 1544, height: 1024 },
        { src: "./photos/film/f19.jpg", width: 1024, height: 1544 },
        { src: "./photos/film/f20.jpg", width: 1024, height: 1544 },
    ]
    const spacePics = [
        { src: "../photos/space/s1.png", width: 2543, height: 1691 },
        { src: "../photos/space/s2.png", width: 4288, height: 2854 },
        { src: "../photos/space/s3.png", width: 2743, height: 1824 },
        { src: "../photos/space/s4.png", width: 2854, height: 4288 },
        { src: "../photos/space/s5.png", width: 856, height: 1277 },
        { src: "../photos/space/s6.png", width: 1926, height: 1287 },
        { src: "../photos/space/s7.png", width: 8596, height: 5708 },
        { src: "../photos/space/s8.png", width: 2970, height: 3290 },
        { src: "../photos/space/s9.jpg", width: 958, height: 1277 },

    ];
    const [activePics, setActivePics] = useState([<div classname = 'q'><RowsPhotoAlbum
        photos={favPics}
        // Scales well to vertical and horizontal
        targetRowHeight={30 + (width/Math.log(16, width * 1.5))}
        withLightbox={true}
    /></div>]);

    const [photosHero, setPhotosHero] = useState({
        name: "Emma's Film Photos",
        description: "Somehow, humanity managed to gain the power to create an exact likeness of any scene in an instant, before we figured out how to make a cardboard box"
    });

    useEffect(() => {
        // Refresh photos page
        setCurrentPage(photos())
     }, [activePics])

    // Photos Page (Not implemented)
    const photos = () => {

        const changePics = (arr,name,desc) => {
            let newA = [<div classname = 'q'><RowsPhotoAlbum
                photos={arr}
                // Scales well to vertical and horizontal
                targetRowHeight={30 + (width/Math.log(16, width * 1.5))}
                withLightbox={true}
            /></div>]
            setPhotosHero( {
                name: name,
                description: desc
            })
            setActivePics(newA)

            console.log("clack")
            console.log(activePics)
        }

        // (Soon to be) HTML and Bootstrap Hell
        return <div style={{backgroundImage: 'url(' + background + ')', backgroundSize: "cover", backgroundAttachment: "fixed", backgroundRepeat: "no-repeat", backgroundColor: "#000", position: "flex", imageRendering: "pixelated", width:"100%"}}> 
        
            {header}
            <div className='px-3 d-flex justify-content-center' style={{flexWrap: "wrap"}}>

                    <button className="mx-2 my-1 gradbutton" style={{padding: ((width/100) + "px "+ (width/33) + "px"), fontSize: heropSize}} onClick={() => changePics(qtp, "Quicktake", "Released at a time where their logo had a rainbow yet their laptops remained in black and white, Apple's first digital camera remains a competitive choice for capturing UFO sightings")}>Quicktake</button>
                    <button className="mx-2 my-1 gradbutton" style={{padding: ((width/100) + "px "+ (width/33) + "px"), fontSize: heropSize}}  onClick={() => changePics(mavicaPics, "Sony Mavica", "The photographic power of a bank security camera, and the computing power of a floppy disk drive, all in one place")}>Mavica</button>
                    <button className="mx-2 my-1 gradbutton" style={{padding: ((width/100) + "px "+ (width/33) + "px"), fontSize: heropSize}}  onClick={() => changePics(filmPics, "Emma's Film Photos", "Somehow, humanity managed to gain the power to create an exact likeness of any scene in an instant, before we figured out how to make a cardboard box")}>Film</button>
                    <button className="mx-2 my-1 gradbutton" style={{padding: ((width/100) + "px "+ (width/33) + "px"), fontSize: heropSize}}  onClick={() => changePics(spacePics, "Space", "Stars are like pretty cool I guess")}>Space</button>

            </div>
            <div className = "d-flex " style={{color: "white", fontFamily: "Charcoal",}}>
                <div className = "col-sm-2 d-flex justify-content-center"> 

                </div>
                <div className = "p-2 col-sm-8 justify-content-center align-items-center" >
                    <div>
                        <h1 style={{fontSize: h1Size, background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent"}}>{photosHero.name}</h1>
                        <p style={{fontSize: heropSize}}>{photosHero.description}</p>
                    </div>
                    <div style={{imageRendering: "auto"}}>
                        {activePics}
                    </div>

                </div>
                <div className = "col-sm-2 d-flex justify-content-center align-items-center">
                    
                </div>
            </div>
        </div>
        
    }

    // Set initial page to home
    useEffect(() => {
        setCurrentPage(home())
    }, [])

    // Only show the current page
    return(
        <div style={{width:"100%"}}>
            {currentPage}
        </div>
    )
}

export default PortfolioMain;