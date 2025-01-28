import React from 'react';
import ReactDOM from 'react-dom/client';
import background from './background.png'
function base() {
    return (
        <div style={{backgroundImage: 'url(' + background + ')', backgroundSize: "cover", backgroundAttachment: "fixed", backgroundRepeat: "no-repeat", position: "flex", imageRendering: "pixelated", height: "100%", width:"100%"}}> 

            <div className = "h-25 d-flex justify-content-center align-items-center" style={{color: "white", fontFamily: "Charcoal",}}>
                <div className = "col-sm-3 d-flex justify-content-center"> 
                    ski
                </div>
                <div className = "col-sm-6 d-flex justify-content-center align-items-center" >
                    <div>
                        <h1>Emma Power</h1>
                    </div>
                </div>
                <div className = "col-sm-3 d-flex justify-content-center align-items-center">
                    bidi
                </div>
            </div>
            <div className = "h-50 d-flex justify-content-center " style={{color: "white"}}>
                <div className = "col-sm-2 d-flex justify-content-center"> 
                </div>
                <div className = "col-sm-10 d-flex justify-content-center" >
                    <div style={{ top: "10%" }}>
                        <h1>Please hire me im fucking desperate</h1>
                    </div>
                </div>
                <div className = "col-sm-2 d-flex justify-content-center">
                    
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