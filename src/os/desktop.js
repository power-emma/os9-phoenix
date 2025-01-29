import React from 'react';
import ReactDOM from 'react-dom/client';
import aurora from './aurora.png'

class Desktop extends React.Component {

    
    render() {

        const desktopStyle = {
            top: "200px",
            backgroundPosition: "center center",
            height: "100vh",
            width: "100vw",
            objectFit: "cover",
            overflow: "hidden"
        }
        return <img style = {desktopStyle} src={aurora}>

        </img>
    }
}


export default Desktop;