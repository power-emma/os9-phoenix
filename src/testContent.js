import React from 'react';
import ReactDOM from 'react-dom/client';

function name() {
    return <div style={{backgroundColor: "rgb(255, 209, 223)", height: "100%", width:"400px"}}> Meow or some shit im just silly :3</div>
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