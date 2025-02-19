import {React, useEffect, useRef, useState} from 'react';
import ReactDOM from 'react-dom/client';


// Gravitational Constant
let g = 0.000000000066743;

// Makes using distance() easier
function distanceBetweenBodies(b1, b2) {
  return distance(b1.posX, b1.posY, b2.posX, b2.posY);
}

// Standard distance formula
function distance(x1,y1,x2,y2) {
  return Math.sqrt(((x2-x1)**2) +((y2-y1)**2));
}
  
// Return an object so i can take scientific data from google easier
function sciNotation(m, x) {
  return m * (10**x);
}
  



const Orbit = ({init}) => {
  //Element References
  const canvasRef = useRef(null)
  const backgroundCanvasRef = useRef(null)
  const orbitRef = useRef(null);

  // Window Height/Width
  let height = init.height
  let width = init.width

  // Where to center camera
  let camX = 0;
  let camY = 0;

  // Where to paint on screen as to be centered with reference
  let adjX = 0;
  let adjY = 0;

  // Array of all bodies in the system
  let bodies = [];

  // The simulation will run at this many times faster
  let timeMultiplier = 10000;


  // Amount to zoom out (meters)
  let zoom = 2000000000;

  // Amount to adjust screen draw by
  let zoomMultiplier = 1/zoom;

  // Last position for background drawing
  let lastCamX = camX;
  let lastCamY = camY;

  /*
      Given 2 bodies (b1 and b2) this function
      - Calculates the gravitational force between the 2 bodies
      - Calculates the velocity vectors of this force upon b1
      - Applies this velocity to speedX and speedY of b1
  */
  const orbit = (b1, b2) => {
    // https://en.wikipedia.org/wiki/Orbit_modeling Newton Approach
    let f = (g * b1.mass * b2.mass) / (distanceBetweenBodies(b1,b2)**2);
    // Vectors :(
    // F = magnitude
    // Find the distance between b1 and b2
    let b1x = b1.posX - b2.posX;
    let b1y = b1.posY - b2.posY;
    // cos theta = (X / Magnitude of b1)
    // Angle between 2 vectors where one of the vectors is b1 and the other is the x axis vector
    let cosAngle = (b1x) / (Math.sqrt((b1x**2) + (b1y**2)));
    // Find theta using arccos
    let angle = Math.acos(cosAngle);

    // JS will only give you the angle up to PI where i want up to 2PI
    if (b1.posY > b2.posY) {
        angle = (2 * Math.PI) - angle;
    }

    // Find the X and Y vectors of the gravitational force
    let dx = Math.abs(Math.cos(angle)) * f;
    let dy = Math.abs(Math.sin(angle)) * f;

    // V = F/(M * t)
    // Find velocity given force
    let vx1 = (dx / (b1.mass * 1)) * timeMultiplier;
    let vy1 = (dy / (b1.mass * 1)) * timeMultiplier;

    // Apply appropriate signs as only magnitude was known
    if(angle > (Math.PI) * 3/2) {
        // Bottom Right
        vx1 *= -1; vy1 *= -1;
    } else if(angle > (Math.PI)) {
        //Bottom Left
        vy1 *= -1;
    } else if(angle > (Math.PI) * 1/2) {
        //Top Left (No correction needed)
    } else {
        //Top Right
        vx1 *= -1;
    }

    // Apply gravitational difference to the speed of the body
    b1.speedX += vx1;
    b1.speedY += vy1;
  }

  // Makes a body (planetary object) and returns it
  const makeBody = (id, radius, posX, posY, speedX, speedY, mass, colour) => {
    // Defines body parameters
    const body = {
      id: id,
      radius: radius,
      posX: posX,
      posY: posY,
      speedX: speedX,
      speedY: speedY,
      mass: mass,
      colour: colour,
      lastPosX: posX,
      lastPosY: posY,
      static: false
    }
    return {
        body
    };
  }

  // Apply orbit calculation to every possible pair of bodies
  const updateBodies = () => {
    // Calculate the gravitational force vector for each combination of bodies
    for (let i = 0; i < bodies.length; i++) {
        for (let j = 0; j < bodies.length; j++) {
            if (j != i && bodies[i].static != true) {
                orbit(bodies[i], bodies[j]);
            }
        }
    }
  
    // Apply the velocity for the desired amount of time
    for(let i = 0; i < bodies.length; i++) {
        let temp = bodies[i];
        temp.posX += (temp.speedX * timeMultiplier);
        temp.posY += (temp.speedY * timeMultiplier);
    }
  }

  // Initial Solar System model
  bodies.push(makeBody("Sun", 6, 1, 100000, 0, 0, sciNotation(1.989,30), "#ffc400").body);
  bodies.push(makeBody("Mercury", 3, 58000000000, 0, 0, 47400, sciNotation(3.285,23), "#a1a1a1").body);
  bodies.push(makeBody("Venus", 4, 108030000000, 0, 0, 35000, sciNotation(4.867,24), "#d68006").body);
  bodies.push(makeBody("Earth", 4, 149000000000, 0, 0, 29800, sciNotation(5.97,24), "#0022cf").body);
  bodies.push(makeBody("Mars", 3, 228000000000, 0, 0, 24100, sciNotation(6.42,23), "#ffae78").body);
  bodies.push(makeBody("Jupiter", 5, 778500000000, 0, 0, 13100, sciNotation(1898,24), "#ff771c").body);
  bodies.push(makeBody("Saturn", 5, 1432000000000, 0, 0, 9700, sciNotation(568,24), "#edd86d").body);
  bodies.push(makeBody("Uranus", 4, 2867000000000, 0, 0, 6800, sciNotation(86.8,24), "#b3f0fc").body);
  bodies.push(makeBody("Neptune", 4, 4515000000000, 0, 0, 5400, sciNotation(102,24), "#5094fa").body);

  // Camera will center on the first body
  let referenceBody = bodies[0];


  const screenDraw = (ctx, bctx) => {
    //Update camera based on reference point
    camX = referenceBody.posX;
    camY = referenceBody.posY;
    //Clear Screen
    ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);

    for(let i = 0; i < bodies.length; i++) {
        // Current object
        let temp = bodies[i];
        // Needed for every object
        ctx.beginPath();
        // X, Y, Radius, Start (radians), End (radians)
        // Takes into account the zoom and the cameras current position
        ctx.arc(((temp.posX - camX) * zoomMultiplier) + adjX,
          ((temp.posY - camY) * zoomMultiplier) + adjY,
          temp.radius,
          0, 
          2 * Math.PI);
        // Make it solid
        ctx.fillStyle = temp.colour;
        // Apply to canvas
        ctx.fill();
        ctx.stroke();

        // Needed for every line
        bctx.beginPath();
        // Start line at the previous position taking into account the position of the previous camera
        bctx.moveTo(((temp.lastPosX - lastCamX) * zoomMultiplier) + adjX, ((temp.lastPosY - lastCamY) * zoomMultiplier) + adjY);
        // Bring line to the current position taking into account the current camera position
        bctx.lineTo(((temp.posX - camX) * zoomMultiplier) + adjX, ((temp.posY - camY) * zoomMultiplier) + adjY);
        // Canvas
        bctx.strokeStyle = temp.colour;
        bctx.stroke();

        //Remember current position for next time
        temp.lastPosX = temp.posX;
        temp.lastPosY = temp.posY;
    }

    if (bodies.length == 0) {
      bctx.fillRect(0,0, ctx.canvas.width, ctx.canvas.height);

    }
    //Remember current camera position for next time
    lastCamX = camX;
    lastCamY = camY;
  }

  // Reset Button
  const clearScreen = () => {
    bodies = []
  }

  const spawnPlanet = (e) => {
    // ref knows where the div is on page
    const divRect = orbitRef.current.getBoundingClientRect();
    // Get the mouse click position
    let mouseX = e.clientX;
    let mouseY = e.clientY;

    // Calculate the relative position inside the div
    let divX = mouseX - divRect.left;
    let divY = mouseY - divRect.top;
    
    // if array is cleared then set camera to origin
    if(bodies.length == 0) {
      camX = 0
      camY = 0
    }

    // Solve Screen Draw Routine for worldX instead of screenX
    let worldX = ((divX - adjX )/zoomMultiplier) + camX
    let worldY = ((divY - adjY )/zoomMultiplier) + camY

    // Generates random hex code for colour
    const tempColour = Math.floor(Math.random() * 16777216).toString(16);
    
    // Make and add the body
    bodies.push(makeBody("X", 3, worldX, worldY, 0, 0, sciNotation(3.285,30), "#" + tempColour).body);
  }

  // Blank Array useEffect means this code only runs at startup
  useEffect(() => {
    // Acquire canvases
    const canvas = canvasRef.current
    const backgroundCanvas = backgroundCanvasRef.current
    const context = canvas.getContext('2d')
    const backgroundContext = backgroundCanvas.getContext('2d')

    // Set Center of canvas
    adjX = context.canvas.width/2
    adjY = context.canvas.height/2

    // Define frameID for use with constant render
    let animationFrameId;

    // Make background White
    backgroundContext.fillStyle = '#FFFFFF'
    backgroundContext.fillRect(0,0, context.canvas.width, context.canvas.height);

    // Main loop
    const render = () => {
      // Do Physics
      updateBodies()
      // Draw to screen
      screenDraw(context, backgroundContext)
      // Call this function again when ready for next frame
      animationFrameId = window.requestAnimationFrame(render)
    }

    // Initial call to main loop
    render()

  }, [])

  // Dense HTML
  return (<div style={{width: "100%", height: "100%", position: "relative"}}>
      <div ref={orbitRef} style={{width: "100%", height: "90%", position: "relative" }} onClick={spawnPlanet}>
        <canvas ref={backgroundCanvasRef} width={width} height={(height* 0.9)} style={{width: "100%", height: "100%", top: "0", left: "0", position: "absolute"}}/>
        <canvas ref={canvasRef} width={width} height={(height* 0.9)}  style={{width: "100%", height: "100%", top: "0", left: "0", position: "absolute"}}/>
      </div>
      <div style={{width: "100%", height: "10%", position: "relative", backgroundColor: "#CCCCCC"}}>
        <button onClick={clearScreen} style={{ width: "30%", display: "inline-block",  height: "100%"}}>Reset</button>
        <div style={{width: "70%", display: "inline-block", alignItems: 'center'}}>
          <p style={{textAlign: "center"}} >Click to add Objects!</p>
        </div>
      </div>
    </div>
  );
};

export default Orbit;