import {React, useState, useEffect, useRef} from 'react';
import ReactDOM from 'react-dom/client';




const Raycast = ({init}) => {   
    const canvasRef = useRef(null)
    const backgfloorCanvasRef = useRef(null)

    // Height and Width for screenDraw
    let height = init.height
    let width = init.width


    // Grid of blocks for the world map
    const worldMap = [
        [1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,1],
        [1,0,0,0,0,1,0,1],
        [1,0,0,0,0,1,0,1],
        [1,1,1,0,0,0,0,1],
        [1,0,1,0,0,0,0,1],
        [1,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1]
    ];

    // Control Booleans
    let leftPressed = 0;
    let rightPressed = 0;
    let upPressed = 0;
    let downPressed = 0; 

    // Player Position
    let posX = 3
    let posY = 2
    // Player Direction
    let dirX = -1
    let dirY = 0
    // Camera Direction
    let planeX = 0
    let planeY = 0.66
    
    // Stores Screen Draw Data
    let rays = []

    const keyDownHandler = (event) => {
        if (event.code === "ArrowRight" || event.key === "d") {
            rightPressed = 1;
        } else if (event.code === "ArrowLeft" || event.key === "a") {
            leftPressed = 1;
        }
        if (event.code === "ArrowDown" || event.key === "s") {
            downPressed = 1;
        } else if (event.code === "ArrowUp" || event.key === "w") {
            upPressed = 1;
        }
    }

    const keyUpHandler = (event) => {
        if (event.code === "ArrowRight" || event.key === "d") {
            rightPressed = 0;
        } else if (event.code === "ArrowLeft" || event.key === "a") {
            leftPressed = 0;
        }
        if (event.code === "ArrowDown" || event.key === "s") {
            downPressed = 0;
        } else if (event.code === "ArrowUp" || event.key === "w") {
            upPressed = 0;
        }
    }

    const intCast = (num) => {
        if (num > 0) {
            return Math.floor(num)
        }
        return Math.ceil(num)
    }

    const controls = () => {
        let rotSpeed = 0.02;
		let moveSpeed = 0.02;

		if (leftPressed) {

			let oldDirX = dirX;
			dirX = dirX * Math.cos(rotSpeed) - dirY * Math.sin(rotSpeed);
			dirY = oldDirX * Math.sin(rotSpeed) + dirY * Math.cos(rotSpeed);

			let oldPlaneX = planeX;
			planeX = planeX * Math.cos(rotSpeed) - planeY * Math.sin(rotSpeed);
			planeY = oldPlaneX * Math.sin(rotSpeed) + planeY * Math.cos(rotSpeed);
		}
		if (rightPressed) {
			let oldDirX = dirX;
			dirX = dirX * Math.cos(-rotSpeed) - dirY * Math.sin(-rotSpeed);
			dirY = oldDirX * Math.sin(-rotSpeed) + dirY * Math.cos(-rotSpeed);

			let oldPlaneX = planeX;
			planeX = planeX * Math.cos(-rotSpeed) - planeY * Math.sin(-rotSpeed);
			planeY = oldPlaneX * Math.sin(-rotSpeed) + planeY * Math.cos(-rotSpeed);
		}

		if (upPressed) {
			if (worldMap[intCast(posX + dirX * moveSpeed)][intCast(posY)] == 0) {
				posX = posX + (dirX * moveSpeed)
			}
			if (worldMap[intCast(posX)][intCast(posY + dirY * moveSpeed)] == 0) {
				posY = posY + (dirY * moveSpeed)
			}
		}
		if (downPressed) {
			if (worldMap[intCast(posX - dirX * moveSpeed)][intCast(posY)] == 0) {
				posX = posX - (dirX * moveSpeed)
			}
			if (worldMap[intCast(posX)][intCast(posY - dirY * moveSpeed)] == 0) {
				posY = posY - (dirY * moveSpeed)
			}
		}

    }

    const cast = () => {
        // Store the Rays
        let tempRays = []

        for (let x = 0; x < width; x++) {
            // Temp Variables
            let sideDistX = 0.0
            let sideDistY = 0.0
            let perpWallDist = 0.0
            let stepX = 0
            let stepY = 0
            let hit = 0
            let side = 0

            // Get Ray Start Position
            let mapX = intCast(posX)
            let mapY = intCast(posY)

            // Find where the ray is going
            let cameraX = ((2 * x) / (width)) - 1
            let rayDirX = dirX + (planeX * cameraX)
            let rayDirY = dirY + (planeY * cameraX)

            // Find length of grid step
            let deltaDistX = Math.abs(1 / rayDirX)
			let deltaDistY = Math.abs(1 / rayDirY)

            // Caculate step direction and sideDist (distance to next line on grid)
            if (rayDirX < 0) {
                stepX = -1
                sideDistX = (posX - mapX) * deltaDistX
            } else {
                stepX = 1
                sideDistX = (mapX + 1.0 - posX) * deltaDistX
            }
            if (rayDirY < 0) {
                stepY = -1
                sideDistY = (posY - mapY) * deltaDistY
            } else {
                stepY = 1
                sideDistY = (mapY + 1.0 - posY) * deltaDistY
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
				perpWallDist = (mapX - posX + (1 - stepX) / 2) / rayDirX;
			} else {
				perpWallDist = (mapY - posY + (1 - stepY) / 2) / rayDirY;
			}


            // Make line size to draw on screen
			let lineHeight = Math.floor(height / perpWallDist);

            // Y coordinates of this line for screenDraw()
            let drawStart = Math.floor((-lineHeight / 2 + height / 2) - 10)
			let drawEnd = Math.floor((lineHeight / 2 + height / 2) + 10)

            // Max line size
			if (drawStart < 0) {
				drawStart = 0;
			}
			if (drawEnd > height) {
				drawEnd = height;
			}   

            // Paramaters for screenDraw()
            let ray = {
                start: drawStart,
                end: drawEnd,
                side: side
            }

            tempRays.push(ray)
        }

        // Make them not temporary
        rays = tempRays
    }

    const screenDraw = (ctx, bctx, frameCount) => {
        // Screen Blank
        ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);
        // Draw Lines
        for (let i = 0; i < rays.length; i++) {
            ctx.beginPath();
            // Something to accentuate corners
            if (rays[i].side == 1) {
                ctx.strokeStyle = "Red"
            } else {
                ctx.strokeStyle = "Blue"
            }
            // Top of line (calculated by raycast)
            ctx.moveTo(i, rays[i].start);
            // Bottom of line (calculated by raycast)
            ctx.lineTo(i, rays[i].end);
            ctx.stroke()
        }

    }

    useEffect(() => {
        const canvas = canvasRef.current
        const backgfloorCanvas = backgfloorCanvasRef.current
        const context = canvas.getContext('2d')
        const backgfloorContext = backgfloorCanvas.getContext('2d')


        document.addEventListener("keydown", keyDownHandler, false);
        document.addEventListener("keyup", keyUpHandler, false);

        let frameCount = 0
        let animationFrameId
        backgfloorContext.fillStyle = '#FFFFFF'
        backgfloorContext.fillRect(0,0, context.canvas.width, context.canvas.height);

        const render = () => {
            frameCount++
            
            //console.log("START")
            controls()
            cast()
            screenDraw(context)
            //console.log("FRAME")
            animationFrameId = window.requestAnimationFrame(render)
        }

        render()

    }, [])
    

    
    return(
        <div style={{width: "100%", height: "100%", position: "relative"}}>
            <canvas ref={backgfloorCanvasRef} width={width} height={height} style={{width: "100%", height: "100%", top: "0", left: "0", position: "absolute"}}/>
            <canvas ref={canvasRef} width={width} height={height}  style={{width: "100%", height: "100%", top: "0", left: "0", position: "absolute"}}/>
        </div>
    )

}

export default Raycast;