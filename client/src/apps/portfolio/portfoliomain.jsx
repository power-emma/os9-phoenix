import {React, useState, useEffect, useRef} from 'react';
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import background from './background.png'
import emma from "./emma.webp"
import './portfolio.css'
import PlasmaBackground from './PlasmaBackground'
import ShootingStars from './ShootingStars'

// Photo arrays are constant — defined outside the component so they are never recreated on re-render
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
];
const qtp = [
    { src: "./photos/qt/qt1.jpg", width: 480, height: 640 },
    { src: "./photos/qt/qt2.jpg", width: 480, height: 640 },
    { src: "./photos/qt/qt3.jpg", width: 480, height: 640 },
    { src: "./photos/qt/qt4.jpg", width: 640, height: 480 },
    { src: "./photos/qt/qt5.jpg", width: 640, height: 480 },
    { src: "./photos/qt/qt6.jpg", width: 480, height: 640 },
];
const mavicaPics = [
    { src: "./photos/mavica/m1.jpg", width: 480, height: 640 },
    { src: "./photos/mavica/m2.jpg", width: 640, height: 480 },
    { src: "./photos/mavica/m3.jpg", width: 480, height: 640 },
    { src: "./photos/mavica/m4.jpg", width: 640, height: 480 },
    { src: "./photos/mavica/m5.jpg", width: 480, height: 640 },
    { src: "./photos/mavica/m6.jpg", width: 480, height: 640 },
    { src: "./photos/mavica/m7.jpg", width: 480, height: 640 },
    { src: "./photos/mavica/m8.jpg", width: 480, height: 640 },
    { src: "./photos/mavica/m9.jpg", width: 480, height: 640 },
    { src: "./photos/mavica/m10.jpg", width: 480, height: 640 },
    { src: "./photos/mavica/m11.jpg", width: 480, height: 640 },
    { src: "./photos/mavica/m12.jpg", width: 480, height: 640 },
    { src: "./photos/mavica/m13.jpg", width: 480, height: 640 },
];
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
];
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



const PortfolioMain = ({init}) => {

    // Window height and width
    let height = init.height
    let width = init.width
    // Callback to open a new OS window
    const openWindow = init.openWindow || null

    // How many ems should text be - compute a responsive base and clamp it
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
    // base is proportional to viewport but clamped to sensible ranges
    let em = clamp(Math.min(width / 1000, height / 800), 0.7, 1.6)

    // Desktop PAdding
    let defaultPadding = "2vh"

    let mobile = false
    if (height > width && width < 700) {
        mobile = true
        // make mobile fonts a bit smaller but still clamped
        em = clamp(Math.min(width / 450, height / 1200), 0.6, 1.1)
        defaultPadding = "5vh"
    }

    // Get size dependent font sizes
    // Prefer CSS-driven scaling for many things; compute a few fallbacks
    let imgHeight = Math.round(height / (mobile ? 2.6 : 1.7)) + "px"
    let headerSize = (2 * em) + "em"
    let h1Size = (3.6 * em) + "em"
    let h2Size = (2.6 * em) + "em"
    let heropSize = (1.25 * em) + "em"

    // Store page name as state — render inline so everything always uses fresh width/height
    const [currentPage, setCurrentPage] = useState('Home');

    // Active photo set for the photos page
    const [activePicSet, setActivePicSet] = useState({ arr: favPics, name: "Emma's Film Photos", description: "Somehow, humanity managed to gain the power to create an exact likeness of any scene in an instant, before we figured out how to make a cardboard box" });

    // Header HTML
    let header = <div className = "h-25 d-flex align-items-center" style={{
        color: "white", 
        fontFamily: "Charcoal", 
        width: "100%", 
        paddingTop: "1.5vh",
        background: "rgba(0, 0, 0, 0.7)",
        position: "relative"
    }}>
        <div style={{flex: "0 0 auto", padding: "2vh 3%"}}> 
            <h1 style={{fontSize: headerSize, background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent", margin: 0, whiteSpace: "nowrap"}}> Emma Power </h1>
        </div>
        <div style={{flex: 1}} />
        <div className = "d-flex justify-content-end align-items-center" style={{padding: "2vh 3%", gap: "1.5em"}}>
            <h1 style={{fontSize: headerSize, background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent", cursor: "pointer", margin: 0, whiteSpace: "nowrap"}} onClick={() => setCurrentPage("Home")}>Home</h1>
            <h1 style={{fontSize: headerSize, background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent", cursor: "pointer", margin: 0, whiteSpace: "nowrap"}} onClick={() => setCurrentPage("Projects")}>Projects</h1>
            <h1 style={{fontSize: headerSize, background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent", cursor: "pointer", margin: 0, whiteSpace: "nowrap"}} onClick={() => setCurrentPage("Photos")}>Photos</h1>
        </div>
        <div style={{
            position: "absolute",
            bottom: "-100px",
            left: 0,
            right: 0,
            height: "100px",
            background: "linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%)",
            pointerEvents: "none",
            zIndex: -1
        }} />
    </div>

    // Special Formatting if mobile
    if (mobile) {
        header = <div className = "h-25 d-flex justify-content-center " style={{
            color: "white", 
            fontFamily: "Charcoal", 
            paddingTop: "1.5vh",
            background: "rgba(0, 0, 0, 0.7)",
            position: "relative"
        }}>
            <div className = "d-flex justify-content-center"> 
                <h1 style={{fontSize: "2em", background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent", padding: "4vh 5vh"}}> Emma Power </h1>
            </div>
            <div className = "justify-content-center align-items-center" >
            <div className = "h-25 d-flex justify-content-center " style={{color: "white"}}></div>
            
            </div>
            <div className = "" style={{padding: "4vh", paddingRight: "5vw"}}>
                <h1 style={{whiteSpace: "pre", fontSize: headerSize, background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent"}} onClick={() => setCurrentPage("Home")}>Home</h1>
                <h1 style={{whiteSpace: "pre", fontSize: headerSize, background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent"}} onClick={() => setCurrentPage("Projects")}>Projects</h1>
                <h1 style={{whiteSpace: "pre", fontSize: headerSize, background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent"}} onClick={() => setCurrentPage("Photos")}>Photos</h1>
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
            <img className="gradImgBorder" src={emma} style={{maxWidth: "100%", height: "auto", maxHeight: imgHeight, imageRendering: "auto"}}/>
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

                <img className="gradImgBorder" src={emma} style={{maxWidth: "85%", height: "auto", maxHeight: imgHeight, imageRendering: "auto"}}/>
                </div>
            </div>
        }

        // HTML and Bootstrap Hell
        return (
            <div style={{position: "relative", minHeight: "100vh", overflow: "hidden"}}> 
                <PlasmaBackground />
    
                {header}
                <div style={{height: "7vh"}} />

                <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal",}}>
                    <div className = "col-sm-2 d-flex justify-content-center"> 
    
                    </div>
                    <div className = "col-sm-4 justify-content-center align-items-center"  style = {{padding: defaultPadding}}>
                        <div className = "h-25 d-flex " style={{color: "white"}}>
                            <h1 style={{fontSize: h1Size}}>Hi!</h1>
                        </div>
                        <div className = "h-50 d-flex" style={{color: "white", display: 'inline'}}>
                            <h1 style={{whiteSpace: "pre", fontSize: h1Size, display: "inline"}}>I'm </h1>
                            <h1 className="animated-gradient" style={{fontSize: h1Size}}>Emma</h1>
                        </div>
                        <div className = "h-25 d-flex " style={{color: "white"}}>
                            <p style={{fontSize: heropSize}}>I'm a software engineering student with a passion for all things digital. I enjoy developing software, working with technology new and old, and taking photos using unique cameras!</p>
                        </div>
                        <br/>
                        <button className="gradbutton" onClick={() => setCurrentPage("Projects")}>See My Projects</button>
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
                    <div className = "col-sm-8 justify-content-center align-items-center gradProjBorder" style = {{padding: "40px", background: "rgba(0, 0, 0, 0.6)", position: "relative", overflow: "hidden"}} >
                        <ShootingStars seed={12345} />
                        <div className = "h-50 d-flex align-items-center" style={{color: "white", position: "relative", zIndex: 1}}>
                            <h1 style={{fontSize: h2Size}}>Treat this like a normal desktop!</h1>
                        </div>
                        <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", display: 'inline', position: "relative", zIndex: 1}}>
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
        return <div style={{position: "relative", minHeight: "100vh", overflow: "hidden", width:"100%"}}> 
            <PlasmaBackground />
    
        {header}
        <div style={{height: "2vh"}} />

        <div className = "h-75 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal",}}>
            <div className = "col-sm-2 d-flex justify-content-center"> 

            </div>
            <div className = "col-sm-8 justify-content-center align-items-center gradProjBorder" style = {{paddingTop: "40px", paddingLeft: "40px", paddingRight: "40px", background: "rgba(0, 0, 0, 0.6)", position: "relative", overflow: "hidden"}}  >
                <ShootingStars seed={54321} />
                <div className = "h-25 d-flex align-items-center" style={{color: "white", position: "relative", zIndex: 1}}>
                    <h1 style={{fontSize: h2Size}}>This Website!</h1>
                </div>
                <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", display: 'inline', position: "relative", zIndex: 1}}>
                    <p style={{fontSize: heropSize}}>Combining modern web design paradigms with the aesthetics of an operating system from the 90's, this React based website allows for a unique, window based take to display other web based applications</p>
                </div>
                <div className = "h-25 d-flex justify-content-center align-items-center" style={{color: "white", position: "relative", zIndex: 1}}>
                    <p style={{fontSize: heropSize}}>Tip: Move the Windows Around, Resize the windows, and Click the Desktop Icons!</p>
                </div>
                <p style={{position: "relative", zIndex: 1}}>Date Created: December 2024</p>
                <br/>
            </div>
            <div className = "col-sm-2 d-flex justify-content-center align-items-center">
                
            </div>
        </div>

        <div className = "h-75 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal", marginTop: "50px"}}>
            <div className = "col-sm-2 d-flex justify-content-center"> 

            </div>
            <div className = "col-sm-8 justify-content-center align-items-center gradProjBorder" style = {{paddingTop: "40px", paddingLeft: "40px", paddingRight: "40px", background: "rgba(0, 0, 0, 0.6)", position: "relative", overflow: "hidden"}} >
                <ShootingStars seed={98765} />
                <div className = "h-25 d-flex align-items-center" style={{color: "white", position: "relative", zIndex: 1}}>
                    <h1 style={{fontSize: h2Size}}>3D Software Renderer</h1>
                </div>
                <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", display: 'inline', position: "relative", zIndex: 1}}>
                    <p style={{fontSize: heropSize}} >A fully functional 3d object renderer, with arbitrary object loading, polygon ordering, and rasterization </p>
                </div>
                <div className = "h-25 d-flex justify-content-center align-items-center" style={{color: "white", position: "relative", zIndex: 1}}>
                    <p style={{fontSize: heropSize}}> Note: Works best on PC due to WASD/Arrow key controls</p>
                </div>
                <p style={{position: "relative", zIndex: 1}}>Date Created: January 2026</p>
                <br/>
            </div>
            <div className = "col-sm-2 d-flex justify-content-center align-items-center">
                
            </div>
        </div>


<div className = "h-75 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal", marginTop: "50px"}}>
            <div className = "col-sm-2 d-flex justify-content-center"> 

            </div>
            <div className = "col-sm-8 justify-content-center align-items-center gradProjBorder" style = {{paddingTop: "40px", paddingLeft: "40px", paddingRight: "40px", background: "rgba(0, 0, 0, 0.6)", position: "relative", overflow: "hidden"}} >
                <ShootingStars seed={98765} />
                <div className = "h-25 d-flex align-items-center" style={{color: "white", position: "relative", zIndex: 1}}>
                    <h1 style={{fontSize: h2Size}}>ARM Assembler and Emulator</h1>
                </div>
                <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", display: 'inline', position: "relative", zIndex: 1}}>
                    <p style={{fontSize: heropSize}} >A small ARM assembler and emulator, packaged into one web-based IDE. While it was written in C originally, porting it into JS was harder than writing the emulator itself. This is impressive to the right kind of nerd.</p>
                </div>
                <div className = "h-25 d-flex justify-content-center align-items-center" style={{color: "white", position: "relative", zIndex: 1}}>
                    <p style={{fontSize: heropSize}}> Tip: ... I need to write a book to give a good tip here</p>
                </div>
                <div className = "h-25 d-flex justify-content-center align-items-center" style={{color: "white", position: "relative", zIndex: 1, gap: "5vw"}}>
                    <a className="gradbutton" href='https://github.com/power-emma/Neurotic'>Neurotic (Assembler)</a>
                    <a className="gradbutton" href='https://github.com/power-emma/Tranquil'>Tranquil (Emulator)</a>
                </div>
                <br/>
                <p style={{position: "relative", zIndex: 1}}>Date Created: November 2025 | Date Ported: March 2026</p>
                <br/>
            </div>
            <div className = "col-sm-2 d-flex justify-content-center align-items-center">
                
            </div>
        </div>

        <div className = "h-75 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal", marginTop: "50px"}}>
            <div className = "col-sm-2 d-flex justify-content-center"> 

            </div>
            <div className = "col-sm-8 justify-content-center align-items-center gradProjBorder" style = {{paddingTop: "40px", paddingLeft: "40px", paddingRight: "40px", background: "rgba(0, 0, 0, 0.6)", position: "relative", overflow: "hidden"}} >
                <ShootingStars seed={24680} />
                <div className = "h-25 d-flex align-items-center" style={{color: "white", position: "relative", zIndex: 1}}>
                    <h1 style={{fontSize: h2Size}}>Orbit.JS</h1>
                </div>
                <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", display: 'inline', position: "relative", zIndex: 1}}>
                    <p style={{fontSize: heropSize}} >Displays an accurate model of any arbitrary amount of celestial bodies. Allows for visualization of Solar Systems as well as other gravitational phenomena</p>
                </div>
                <div className = "h-25 d-flex justify-content-center align-items-center" style={{color: "white", position: "relative", zIndex: 1}}>
                    <p style={{fontSize: heropSize}}> Tip: Orbits are difficult to create, place planets carefully to avoid collisions</p>
                </div>
                <p style={{position: "relative", zIndex: 1}}>Date Created: June 2023 | Date Ported: January 2025</p>
                <br/>
            </div>
            <div className = "col-sm-2 d-flex justify-content-center align-items-center">
                
            </div>
        </div>

        <div className = "h-75 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal", marginTop: "50px"}}>
            <div className = "col-sm-2 d-flex justify-content-center"> 

            </div>
            <div className = "col-sm-8 justify-content-center align-items-center gradProjBorder" style = {{paddingTop: "40px", paddingLeft: "40px", paddingRight: "40px", background: "rgba(0, 0, 0, 0.6)", position: "relative", overflow: "hidden"}} >
                <ShootingStars seed={13579} />
                <div className = "h-25 d-flex align-items-center" style={{color: "white", position: "relative", zIndex: 1}}>
                    <h1 style={{fontSize: h2Size}}>Plasma</h1>
                </div>
                <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", display: 'inline', position: "relative", zIndex: 1}}>
                    <p style={{fontSize: heropSize}} >Inspired by famous Demoscene examples, plasma is a vibrant visualization that works on the same principles as electromagnetic radiation</p>
                </div>
                <div className = "h-25 d-flex justify-content-center align-items-center" style={{color: "white", position: "relative", zIndex: 1}}>
                    <p style={{fontSize: heropSize}}> Tip: It almost looks too clean at native resolution, use the resolution slider for a more old-school demo look.</p>
                </div>
                <p style={{position: "relative", zIndex: 1}}>Date Created: December 2025</p>
                <br/>
            </div>
            <div className = "col-sm-2 d-flex justify-content-center align-items-center">
                
            </div>
        </div>

        <div className = "h-75 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal", marginTop: "50px"}}>
            <div className = "col-sm-2 d-flex justify-content-center"> 

            </div>
            <div className = "col-sm-8 justify-content-center align-items-center gradProjBorder" style = {{paddingTop: "40px", paddingLeft: "40px", paddingRight: "40px", background: "rgba(0, 0, 0, 0.6)", position: "relative", overflow: "hidden"}} >
                <ShootingStars seed={86420} />
                <div className = "h-25 d-flex align-items-center" style={{color: "white", position: "relative", zIndex: 1}}>
                    <h1 style={{fontSize: h2Size}}>Raycast</h1>
                </div>
                <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", display: 'inline', position: "relative", zIndex: 1}}>
                    <p style={{fontSize: heropSize}}>A graphical engine which uses distance away from objects on a 2d world, to create a 3d effect. While necessary to achieve a 3d effect on older processors, now serves to create a unique aesthetic</p>
                </div>
                <div className = "h-25 d-flex justify-content-center align-items-center" style={{color: "white", position: "relative", zIndex: 1}}>
                    <p style={{fontSize: heropSize,  display: "block"}}>Tip: Control with WASD or the Arrow Keys</p>
                </div>
                <p style={{position: "relative", zIndex: 1}}>Date Created: August 2021 | Date Ported: February 2025</p>
                <br/>
            </div>
            <div className = "col-sm-2 d-flex justify-content-center align-items-center">
                
            </div>
        </div>

        <div className = "h-75 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal", marginTop: "50px", paddingBottom: "4vh"}}>
            <div className = "col-sm-2 d-flex justify-content-center"> 

            </div>
            <div className = "col-sm-8 justify-content-center align-items-center gradProjBorder" style = {{padding: "40px", background: "rgba(0, 0, 0, 0.6)", position: "relative", overflow: "hidden"}} >
                <ShootingStars seed={77777} />
                <div className = "h-25 d-flex align-items-center" style={{color: "white", position: "relative", zIndex: 1}}>
                    <h1 style={{fontSize: h2Size}}>Other Projects</h1>
                </div>
                <div className = "h-50 d-flex justify-content-center align-items-center" style={{color: "white", display: 'inline', position: "relative", zIndex: 1}}>
                    <p style={{fontSize: heropSize}} >Check out my GitHub page for projects in other languages like C and Java, as well as the source code of this website!</p>
                </div>
                <div className = "h-25 d-flex justify-content-center align-items-center" style={{color: "white", position: "relative", zIndex: 1}}>
                    <a className="gradbutton" href='https://github.com/power-emma'>See my GitHub</a>
                </div>
                <br/>
            </div>
            <div className = "col-sm-2 d-flex justify-content-center align-items-center">
                
            </div>
        </div>

    </div>
    }

    const openPhoto = (photo, event) => {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        if (!openWindow) return;

        const TITLEBAR = 32; // px — matches the Window component's title bar height
        const maxW = Math.round(window.innerWidth  * 0.9);
        const maxH = Math.round(window.innerHeight * 0.9) - TITLEBAR;

        // Scale the image down to fit within the viewport while preserving aspect ratio
        const aspect = photo.width / photo.height;
        let imgW = photo.width;
        let imgH = photo.height;
        if (imgW > maxW) { imgW = maxW; imgH = Math.round(imgW / aspect); }
        if (imgH > maxH) { imgH = maxH; imgW = Math.round(imgH * aspect); }

        const winW = imgW;
        const winH = imgH + TITLEBAR;
        const startX = Math.round((window.innerWidth  - winW) / 2);
        const startY = Math.round((window.innerHeight - winH) / 2);

        openWindow(
            startX, startY, winH, winW,
            photo.src.split('/').pop(),
            // width/height fill the content area exactly — no object-fit boxing needed
            <img src={photo.src} alt={photo.src} style={{width: '100%', height: '100%', display: 'block'}} />
        );
    };

    const makeAlbum = (arr) => (
        <div className='q'>
            <RowsPhotoAlbum
                photos={arr}
                targetRowHeight={Math.max(180, Math.min(400, Math.round(width / 4)))}
                onClick={({ photo, event }) => openPhoto(photo, event)}
            />
        </div>
    );

    // Photos Page
    const photos = () => {
        const { arr, name, description } = activePicSet;
        const changePics = (newArr, newName, newDesc) =>
            setActivePicSet({ arr: newArr, name: newName, description: newDesc });

        // (Soon to be) HTML and Bootstrap Hell
        return <div style={{position: "relative", minHeight: "100vh", overflow: "hidden", width:"100%"}}> 
            <PlasmaBackground />
        
            {header}
            <div style={{height: "2vh"}} />
            <div className='px-3 d-flex justify-content-center' style={{flexWrap: "wrap"}}>
                    <button className="mx-2 my-1 gradbutton" style={{padding: ((width/100) + "px "+ (width/33) + "px"), fontSize: heropSize}} onClick={() => changePics(qtp, "Quicktake", "Released at a time where their logo had a rainbow yet their laptops remained in black and white, Apple's first digital camera remains a competitive choice for capturing UFO sightings")}>Quicktake</button>
                    <button className="mx-2 my-1 gradbutton" style={{padding: ((width/100) + "px "+ (width/33) + "px"), fontSize: heropSize}}  onClick={() => changePics(mavicaPics, "Sony Mavica", "The photographic power of a bank security camera, and the computing power of a floppy disk drive, all in one place")}>Mavica</button>
                    <button className="mx-2 my-1 gradbutton" style={{padding: ((width/100) + "px "+ (width/33) + "px"), fontSize: heropSize}}  onClick={() => changePics(filmPics, "Emma's Film Photos", "Somehow, humanity managed to gain the power to create an exact likeness of any scene in an instant, before we figured out how to make a cardboard box")}>Film</button>
                    <button className="mx-2 my-1 gradbutton" style={{padding: ((width/100) + "px "+ (width/33) + "px"), fontSize: heropSize}}  onClick={() => changePics(spacePics, "Space", "Stars are like pretty cool I guess")}>Space</button>
            </div>
            <div className = "d-flex " style={{color: "white", fontFamily: "Charcoal",}}>
                <div className = "col-sm-2 d-flex justify-content-center"></div>
                <div className = "p-2 col-sm-8 justify-content-center align-items-center" >
                    <div>
                        <h1 style={{fontSize: h1Size, background: "linear-gradient(60deg, #fcf, #bef)", backgroundClip: "text", color: "transparent"}}>{name}</h1>
                        <p style={{fontSize: heropSize}}>{description}</p>
                    </div>
                    <div style={{imageRendering: "auto"}}>
                        {makeAlbum(arr)}
                    </div>
                </div>
                <div className = "col-sm-2 d-flex justify-content-center align-items-center"></div>
            </div>
        </div>
    }

    // Render the current page inline — no JSX stored in state, so resize never causes stale renders
    const renderPage = () => {
        switch (currentPage) {
            case 'Projects': return proj();
            case 'Photos':   return photos();
            default:         return home();
        }
    }

    // Only show the current page
    return(
        <div style={{width:"100%"}}>
            {renderPage()}
        </div>
    )
}

export default PortfolioMain;