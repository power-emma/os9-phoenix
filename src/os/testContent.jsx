import React from 'react';
import ReactDOM from 'react-dom/client';

function name() {
    return <div style={{backgroundColor: "rgb(255, 209, 223)", height: "100%", width:"400px"}}> {Math.random()} <br/>This Number should only generate when the window is instantiated</div>
}

class TContent extends React.Component {

    render() {
        let con = name()
        return <div>
            {con}
        </div>;
    }

}

export default TContent;