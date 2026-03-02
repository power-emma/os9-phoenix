import {React, useEffect, useRef, useState} from 'react';

const PlasmaBackground = () => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                const { offsetWidth, offsetHeight } = containerRef.current;
                setDimensions({ width: offsetWidth, height: offsetHeight });
            }
        };

        updateDimensions();
        
        const resizeObserver = new ResizeObserver(updateDimensions);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const { width, height } = dimensions;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        // Fixed pink and blue palette
        const palette = new Uint8Array([
            77, 0, 75,
            69, 0, 110,  
            16, 63, 133, 
            24, 97, 107 
        ]);

        // Precompute sin table
        const sinTable = new Float32Array(256);
        for (let i = 0; i < 256; i++) sinTable[i] = Math.sin(i * 2 * Math.PI / 255);

        // Seeded random number generator for consistent waves
        let seed = Math.random() * 1000000;
        const seededRandom = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };

        // Wave parameters - similar to the reference with some randomness
        const waves = [
            { 
                cx: 500 + (seededRandom() - 0.5) * 200, 
                cy: 500 + (seededRandom() - 0.5) * 200, 
                diameter: 1.0 + (seededRandom() - 0.5) * 0.4, 
                speed: (0.5 + seededRandom() * 1.5) * 0.2, 
                phase: Math.floor(seededRandom() * 256) 
            },
            { 
                cx: -2600 + (seededRandom() - 0.5) * 400, 
                cy: 1900 + (seededRandom() - 0.5) * 400, 
                diameter: 0.6 + (seededRandom() - 0.5) * 0.2, 
                speed: (0.5 + seededRandom() * 1.5) * 0.2, 
                phase: Math.floor(seededRandom() * 256) 
            },
            { 
                cx: 1900 + (seededRandom() - 0.5) * 400, 
                cy: 1550 + (seededRandom() - 0.5) * 400, 
                diameter: 0.7 + (seededRandom() - 0.5) * 0.2, 
                speed: (0.5 + seededRandom() * 1.5) * 0.2, 
                phase: Math.floor(seededRandom() * 256) 
            }
        ];

        console.log('Plasma waves:', waves);

        // Precompute base distance maps
        const bases = waves.map(wave => {
            const base = new Uint8Array(width * height);
            let p = 0;
            for (let y = 0; y < height; y++) {
                const dy = y - wave.cy;
                for (let x = 0; x < width; x++) {
                    const dx = x - wave.cx;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    base[p++] = (Math.floor(dist * wave.diameter) & 255);
                }
            }
            return base;
        });

        // Render at lower resolution for performance
        const scale = 0.25;
        const scaledW = Math.max(1, Math.floor(width * scale));
        const scaledH = Math.max(1, Math.floor(height * scale));

        const offscreen = document.createElement('canvas');
        offscreen.width = scaledW;
        offscreen.height = scaledH;
        const offCtx = offscreen.getContext('2d');

        const imageData = offCtx.createImageData(scaledW, scaledH);
        const data = imageData.data;

        let frameCount = 0;
        let animationFrameId = null;
        let lastFrameTime = 0;
        const frameInterval = 1000 / 10; // 10 frames per second
        const movementPerFrame = 5; // How much the waves move each frame
        const darkness = 0.75; // Darkness filter (0 = black, 1 = normal brightness)

        const render = (currentTime) => {
            const elapsed = currentTime - lastFrameTime;

            if (elapsed >= frameInterval) {
                lastFrameTime = currentTime - (elapsed % frameInterval);
                frameCount++;

                const phaseOffsets = waves.map(wave => 
                    (wave.phase + Math.floor(frameCount * wave.speed * movementPerFrame)) & 255
                );

                let ptr = 0;
                for (let sy = 0; sy < scaledH; sy++) {
                    const fy = Math.min(height - 1, Math.floor(sy / scale));
                    for (let sx = 0; sx < scaledW; sx++) {
                        const fx = Math.min(width - 1, Math.floor(sx / scale));
                        const fullIdx = fy * width + fx;

                        let sum = 0.0;
                        for (let w = 0; w < waves.length; w++) {
                            const baseIdx = bases[w][fullIdx];
                            sum += sinTable[(baseIdx + phaseOffsets[w]) & 255];
                        }
                        const v = sum / waves.length;

                        const t = (v + 1) * 0.5;
                        let s = t * 3;
                        let idx = s | 0;
                        if (idx > 2) idx = 2;
                        const f = s - idx;

                        const r0 = palette[idx * 3 + 0], g0 = palette[idx * 3 + 1], b0c = palette[idx * 3 + 2];
                        const r1 = palette[(idx + 1) * 3 + 0], g1 = palette[(idx + 1) * 3 + 1], b1c = palette[(idx + 1) * 3 + 2];

                        const r = ((r0 * (1 - f) + r1 * f) * darkness) | 0;
                        const g = ((g0 * (1 - f) + g1 * f) * darkness) | 0;
                        const b = ((b0c * (1 - f) + b1c * f) * darkness) | 0;

                        data[ptr++] = r;
                        data[ptr++] = g;
                        data[ptr++] = b;
                        data[ptr++] = 255;
                    }
                }

                offCtx.putImageData(imageData, 0, 0);
                ctx.imageSmoothingEnabled = true;
                ctx.drawImage(offscreen, 0, 0, width, height);
            }

            animationFrameId = window.requestAnimationFrame(render);
        };

        render(0);

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [dimensions]);

    return (
        <div ref={containerRef} style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: -1
        }}>
            <canvas 
                ref={canvasRef}
                style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'block'
                }} 
            />
        </div>
    );
};

export default PlasmaBackground;
