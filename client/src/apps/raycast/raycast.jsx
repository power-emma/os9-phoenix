import {React, useState, useEffect, useRef} from 'react';
import ReactDOM from 'react-dom/client';




const Raycast = ({init}) => {   
    // Canvas References
    const canvasRef = useRef(null)
    const backgfloorCanvasRef = useRef(null)

    // Height and Width for screenDraw (use refs so the animation loop can read updated sizes)
    const widthRef = useRef(init.width)
    const heightRef = useRef(init.height)
    widthRef.current = init.width
    heightRef.current = init.height


    // Grid of blocks for the world map
    const worldMap = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,4,0,0,0,0,0,0,2,0,0,1],
        [1,0,0,0,4,4,0,0,0,0,0,0,2,0,6,1],
        [1,0,0,0,0,4,0,0,0,0,0,0,2,0,6,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,2,0,6,1],
        [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,2,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,3,0,0,0,0,0,0,0,0,0,1],
        [1,4,0,0,0,0,4,0,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,5,0,0,0,0,0,0,0,1],
        [1,0,0,0,0,0,0,0,6,0,2,3,3,3,3,1],
        [1,0,0,0,0,0,0,0,0,0,2,0,0,0,0,5],
        [1,0,0,0,0,0,0,0,0,0,2,0,3,4,0,5],
        [1,0,0,0,0,0,0,0,0,0,2,0,6,5,0,5],
        [1,6,0,0,0,0,0,0,0,0,0,0,0,0,0,5],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];

    // Control Booleans (refs)
    const leftRef = useRef(0);
    const rightRef = useRef(0);
    const upRef = useRef(0);
    const downRef = useRef(0);

    // Player Position (refs)
    const posXRef = useRef(13);
    const posYRef = useRef(4);
    // Player Direction (refs)
    const dirXRef = useRef(-1);
    const dirYRef = useRef(0);
    // Camera Direction (refs)
    const planeXRef = useRef(0);
    const planeYRef = useRef(0.66);
    
    // Stores Screen Draw Data (ref)
    const raysRef = useRef([])

    // Control Handlers (TODO: Mobile Controls)
    const keyDownHandler = (event) => {
        if (event.code === "ArrowRight" || event.key === "d") {
            rightRef.current = 1;
        } else if (event.code === "ArrowLeft" || event.key === "a") {
            leftRef.current = 1;
        }
        if (event.code === "ArrowDown" || event.key === "s") {
            downRef.current = 1;
        } else if (event.code === "ArrowUp" || event.key === "w") {
            upRef.current = 1;
        }
    }

    const keyUpHandler = (event) => {
        if (event.code === "ArrowRight" || event.key === "d") {
            rightRef.current = 0;
        } else if (event.code === "ArrowLeft" || event.key === "a") {
            leftRef.current = 0;
        }
        if (event.code === "ArrowDown" || event.key === "s") {
            downRef.current = 0;
        } else if (event.code === "ArrowUp" || event.key === "w") {
            upRef.current = 0;
        }
    }

    // Function emulates casting to int (thanks js)
    const intCast = (num) => {
        if (num > 0) {
            return Math.floor(num)
        }
        return Math.ceil(num)
    }

    // Apply movement and rotation based on control input every frame
    const controls = () => {
        let rotSpeed = 0.03;
        let moveSpeed = 0.04;

        if (leftRef.current) {
            let oldDirX = dirXRef.current;
            dirXRef.current = dirXRef.current * Math.cos(rotSpeed) - dirYRef.current * Math.sin(rotSpeed);
            dirYRef.current = oldDirX * Math.sin(rotSpeed) + dirYRef.current * Math.cos(rotSpeed);

            let oldPlaneX = planeXRef.current;
            planeXRef.current = planeXRef.current * Math.cos(rotSpeed) - planeYRef.current * Math.sin(rotSpeed);
            planeYRef.current = oldPlaneX * Math.sin(rotSpeed) + planeYRef.current * Math.cos(rotSpeed);
        }
        if (rightRef.current) {
            let oldDirX = dirXRef.current;
            dirXRef.current = dirXRef.current * Math.cos(-rotSpeed) - dirYRef.current * Math.sin(-rotSpeed);
            dirYRef.current = oldDirX * Math.sin(-rotSpeed) + dirYRef.current * Math.cos(-rotSpeed);

            let oldPlaneX = planeXRef.current;
            planeXRef.current = planeXRef.current * Math.cos(-rotSpeed) - planeYRef.current * Math.sin(-rotSpeed);
            planeYRef.current = oldPlaneX * Math.sin(-rotSpeed) + planeYRef.current * Math.cos(-rotSpeed);
        }

        if (upRef.current) {
            if (worldMap[intCast(posXRef.current + dirXRef.current * moveSpeed)][intCast(posYRef.current)] == 0) {
                posXRef.current = posXRef.current + (dirXRef.current * moveSpeed)
            }
            if (worldMap[intCast(posXRef.current)][intCast(posYRef.current + dirYRef.current * moveSpeed)] == 0) {
                posYRef.current = posYRef.current + (dirYRef.current * moveSpeed)
            }
        }
        if (downRef.current) {
            if (worldMap[intCast(posXRef.current - dirXRef.current * moveSpeed)][intCast(posYRef.current)] == 0) {
                posXRef.current = posXRef.current - (dirXRef.current * moveSpeed)
            }
            if (worldMap[intCast(posXRef.current)][intCast(posYRef.current - dirYRef.current * moveSpeed)] == 0) {
                posYRef.current = posYRef.current - (dirYRef.current * moveSpeed)
            }
        }

    }

    // Does the actual raycasting
    const cast = () => {
        // Store the Rays
        let tempRays = []

    for (let x = 0; x < widthRef.current; x++) {
            // Temp Variables
            let sideDistX = 0.0
            let sideDistY = 0.0
            let perpWallDist = 0.0
            let stepX = 0
            let stepY = 0
            let hit = 0
            let side = 0

            // Get Ray Start Position
            let mapX = intCast(posXRef.current)
            let mapY = intCast(posYRef.current)

            // Find where the ray is going
            let cameraX = ((2 * x) / (widthRef.current)) - 1
            let rayDirX = dirXRef.current + (planeXRef.current * cameraX)
            let rayDirY = dirYRef.current + (planeYRef.current * cameraX)

            // Find length of grid step
            let deltaDistX = Math.abs(1 / rayDirX)
			let deltaDistY = Math.abs(1 / rayDirY)

            // Caculate step direction and sideDist (distance to next line on grid)
            if (rayDirX < 0) {
                stepX = -1
                sideDistX = (posXRef.current - mapX) * deltaDistX
            } else {
                stepX = 1
                sideDistX = (mapX + 1.0 - posXRef.current) * deltaDistX
            }
            if (rayDirY < 0) {
                stepY = -1
                sideDistY = (posYRef.current - mapY) * deltaDistY
            } else {
                stepY = 1
                sideDistY = (mapY + 1.0 - posYRef.current) * deltaDistY
            }
            
            // Loop through and jump squares until you hit one
			while (hit === 0) {
				// Go to next line on grid, whichever is closer
				if (sideDistX < sideDistY) {
					sideDistX += deltaDistX
					mapX = mapX + stepX
					side = 0
				} else {
					sideDistY += deltaDistY
					mapY = mapY + stepY
					side = 1
				}

				// Check if it hit
				if (worldMap[mapX][mapY] > 0) {
					hit = 1;
				}
			}

			// Remove fisheye effect (something something distortion pattern)
            if (side === 0) {
                perpWallDist = (mapX - posXRef.current + (1 - stepX) / 2) / rayDirX;
            } else {
                perpWallDist = (mapY - posYRef.current + (1 - stepY) / 2) / rayDirY;
            }


            // Make line size to draw on screen
            let lineHeight = Math.floor(heightRef.current / perpWallDist);

            // Y coordinates of this line for screenDraw()
            let drawStart = Math.floor((-lineHeight / 2 + heightRef.current / 2) - 10)
            let drawEnd = Math.floor((lineHeight / 2 + heightRef.current / 2) + 10)

            // Max line size
			if (drawStart < 0) {
				drawStart = 0;
			}
            if (drawEnd > heightRef.current) {
                drawEnd = heightRef.current;
			}   

            // Paramaters for screenDraw()
            let ray = {
                start: drawStart,
                end: drawEnd,
                side: side,
                type: worldMap[mapX][mapY]
            }

            tempRays.push(ray)
        }

        // Make them not temporary
        raysRef.current = tempRays
    }

    // Draws the results of raycast to screen
    const screenDraw = (ctx, bctx, frameCount) => {
        // Screen Blank
        ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);
        // Draw Lines
        const rays = raysRef.current;
        for (let i = 0; i < rays.length; i++) {
            ctx.beginPath();
            // Initalize colour values
            let red = 0
            let green = 0
            let blue = 0
            // Get colour values based on number
            switch (rays[i].type) {
                case 1:
                    // Red
                    red = 255
                    break;
                case 2:
                    // Orange
                    red = 255
                    green = 128
                    break;
                case 3:
                    // Yellow
                    red = 255
                    green = 255
                    break;
                case 4:
                    // Green
                    green = 255
                    break;
                case 5:
                    // Blue
                    blue = 255
                    break;
                case 6:
                    // Purple
                    red = 187
                    blue = 255
                    break;
            }

            // Shadow effect makes corners more visible
            if (rays[i].side == 1) {
                // Darken each colour channel by ~ 30%
                red = red * 0.7
                green = green * 0.7
                blue = blue * 0.7
            }

            // Set colour
            ctx.strokeStyle = `rgb(${red}, ${green}, ${blue})`;
            // Top of line (calculated by raycast)
            ctx.moveTo(i, rays[i].start);
            // Bottom of line (calculated by raycast)
            ctx.lineTo(i, rays[i].end);
            // Draw!
            ctx.stroke()
        }

    }

    // Blank Array useEffect means this code only runs at startup
    useEffect(() => {
        // Find canvases
        const canvas = canvasRef.current
        const backgfloorCanvas = backgfloorCanvasRef.current
        const context = canvas.getContext('2d')
        const backgfloorContext = backgfloorCanvas.getContext('2d')

        // Add control listeners (TODO: Only control when window is active)
        document.addEventListener("keydown", keyDownHandler, false);
        document.addEventListener("keyup", keyUpHandler, false);

        // Define frameID for use with constant render
        let animationFrameId

        // Make background White
        backgfloorContext.fillStyle = '#FFFFFF'
        backgfloorContext.fillRect(0,0, context.canvas.width, context.canvas.height);

        // Main Loop
        const render = () => {
            // Apply controls
            controls()
            // Perform Raycast operations
            cast()
            // Draw Screen
            screenDraw(context)
            // Call this function again when ready for next frame
            animationFrameId = window.requestAnimationFrame(render)
        }

        // Start main loop
        render()

        // Cleanup when effect unmounts
        return () => {
            document.removeEventListener("keydown", keyDownHandler);
            document.removeEventListener("keyup", keyUpHandler);
            if (animationFrameId) window.cancelAnimationFrame(animationFrameId);
        }

    }, [])

    // When the virtual window size changes, update canvas backing store and redraw background
    useEffect(() => {
        const canvas = canvasRef.current;
        const backgfloorCanvas = backgfloorCanvasRef.current;
        if (!canvas || !backgfloorCanvas) return;
        const ctx = canvas.getContext('2d');
        const bgctx = backgfloorCanvas.getContext('2d');
        // update backing pixel dimensions
        canvas.width = widthRef.current;
        canvas.height = heightRef.current;
        backgfloorCanvas.width = widthRef.current;
        backgfloorCanvas.height = heightRef.current;
        // redraw background
        bgctx.fillStyle = '#FFFFFF';
        bgctx.fillRect(0, 0, backgfloorCanvas.width, backgfloorCanvas.height);
    }, [init && init.width, init && init.height]);
    

    // Detect mobile (touch device)
    const isMobile = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

    // Touch button style helper
    const touchBtnStyle = (extraStyle = {}) => ({
        width: 64,
        height: 64,
        borderRadius: 12,
        background: 'rgba(0,0,0,0.45)',
        border: '2px solid rgba(255,255,255,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'none',
        color: '#fff',
        fontSize: 28,
        cursor: 'pointer',
        ...extraStyle,
    });

    // Touch event handlers — set ref on touchstart, clear on touchend/touchcancel
    const makeTouchHandlers = (ref) => ({
        onTouchStart: (e) => { e.preventDefault(); ref.current = 1; },
        onTouchEnd:   (e) => { e.preventDefault(); ref.current = 0; },
        onTouchCancel:(e) => { e.preventDefault(); ref.current = 0; },
    });

    // Simple HTML
    return(
        <div style={{width: "100%", height: "100%", position: "relative"}}>
            <canvas ref={backgfloorCanvasRef} width={init.width} height={init.height} style={{width: "100%", height: "100%", top: "0", left: "0", position: "absolute"}}/>
            <canvas ref={canvasRef} width={init.width} height={init.height}  style={{width: "100%", height: "100%", top: "0", left: "0", position: "absolute"}}/>

            {isMobile && (
                <div style={{
                    position: 'absolute',
                    bottom: 18,
                    left: 0,
                    right: 0,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    padding: '0 18px',
                    pointerEvents: 'none',
                }}>
                    {/* Look left / right */}
                    <div style={{display: 'flex', gap: 12, pointerEvents: 'all'}}>
                        <div style={touchBtnStyle()} {...makeTouchHandlers(leftRef)}>◀</div>
                        <div style={touchBtnStyle()} {...makeTouchHandlers(rightRef)}>▶</div>
                    </div>

                    {/* Move forward */}
                    <div style={{pointerEvents: 'all'}}>
                        <div style={touchBtnStyle()} {...makeTouchHandlers(upRef)}>▲</div>
                    </div>
                </div>
            )}
        </div>
    )

}

export default Raycast;