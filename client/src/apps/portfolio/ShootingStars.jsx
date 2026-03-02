import {React, useEffect, useRef} from 'react';

const ShootingStars = ({seed = 0}) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.offsetWidth;
        const height = canvas.offsetHeight;
        canvas.width = width;
        canvas.height = height;

        // Seeded random for consistent but different patterns per box
        let rngSeed = seed;
        const seededRandom = () => {
            rngSeed = (rngSeed * 9301 + 49297) % 233280;
            return rngSeed / 233280;
        };

        // Create stars
        const starCount = 20 + Math.floor(seededRandom() * 30);
        const stars = [];
        
        // Pastel rainbow colors
        const pastelColors = [
            'rgb(255, 150, 150)', // Pastel red
            'rgb(255, 200, 150)', // Pastel orange
            'rgb(255, 255, 150)', // Pastel yellow
            'rgb(150, 255, 150)', // Pastel green
            'rgb(150, 200, 255)', // Pastel blue
            'rgb(200, 150, 255)', // Pastel purple
            'rgb(255, 150, 220)'  // Pastel pink
        ];
        
        for (let i = 0; i < starCount; i++) {
            stars.push({
                x: seededRandom() * width,
                y: seededRandom() * height,
                length: 30 + seededRandom() * 70,
                speed: 2 + seededRandom() * 4,
                angle: -0.3 - seededRandom() * 0.4, // Shooting down and to the right
                opacity: 0.3 + seededRandom() * 0.4,
                color: pastelColors[Math.floor(seededRandom() * pastelColors.length)]
            });
        }

        let animationFrameId;

        const render = () => {
            ctx.clearRect(0, 0, width, height);

            stars.forEach(star => {
                // Update position
                star.x += Math.cos(star.angle) * star.speed;
                star.y += Math.sin(star.angle) * star.speed;

                // Reset star if it leaves the visible area
                if (star.x > width + star.length || star.y > height + star.length || 
                    star.x < -star.length || star.y < -star.length) {
                    // Respawn from random position on top, left, or bottom edge
                    const edge = seededRandom();
                    if (edge < 0.33) {
                        // Spawn from top edge
                        star.x = seededRandom() * width;
                        star.y = -star.length;
                    } else if (edge < 0.66) {
                        // Spawn from left edge
                        star.x = -star.length;
                        star.y = seededRandom() * height;
                    } else {
                        // Spawn from bottom edge
                        star.x = seededRandom() * width;
                        star.y = height + star.length;
                    }
                    star.length = 30 + seededRandom() * 70;
                    star.speed = 2 + seededRandom() * 4;
                    star.angle = -0.3 - seededRandom() * 0.4;
                    star.opacity = 0.3 + seededRandom() * 0.4;
                    star.color = pastelColors[Math.floor(seededRandom() * pastelColors.length)];
                }

                // Draw star trail
                const endX = star.x - Math.cos(star.angle) * star.length;
                const endY = star.y - Math.sin(star.angle) * star.length;

                const gradient = ctx.createLinearGradient(star.x, star.y, endX, endY);
                gradient.addColorStop(0, star.color.replace('rgb', 'rgba').replace(')', `, ${star.opacity})`));
                gradient.addColorStop(1, star.color.replace('rgb', 'rgba').replace(')', ', 0)'));

                ctx.strokeStyle = gradient;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(star.x, star.y);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [seed]);

    return (
        <canvas 
            ref={canvasRef}
            style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                opacity: 0.5
            }} 
        />
    );
};

export default ShootingStars;
