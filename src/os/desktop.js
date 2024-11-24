import React from 'react';
import ReactDOM from 'react-dom/client';

class Desktop extends React.Component {

    
    render() {

        const desktopStyle = {
            backgroundRepeat: "repeat",
            backgroundImage: 'url(' + require('./lobotomy.png') + ')',
            width: "100%",
            height: "100vh"
        }
        return <div style = {desktopStyle}>

        </div>
    }
}


export default Desktop;