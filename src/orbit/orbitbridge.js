import {React, useEffect} from 'react';
import ReactDOM from 'react-dom/client';
import "./orbit.css"

const Orbit = () => {
    useEffect(() => {
      // Dynamically load the script
      const script = document.createElement("script");
      script.src = "../public/orbit/orbit.js";
      script.async = true;
      document.body.appendChild(script);
  
      return () => {
        // Cleanup script when component unmounts
        document.body.removeChild(script);
      };
    }, []);
  
    return (
      <div id="orbit">
      </div>
    );
  };

export default Orbit;