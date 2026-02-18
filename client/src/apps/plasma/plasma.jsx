import {React, useEffect, useRef, useState} from 'react';

const Plasma = ({init}) => {
    const canvasRef = useRef(null);
    const backgfloorCanvasRef = useRef(null);

    const width = init.width;
    const height = init.height;
    // local state for number of waves 
    const [wavesCount, setWavesCount] = useState((init && init.amtWaves && Number(init.amtWaves) > 0) ? Number(init.amtWaves) : 3);
    // regen key to force regeneration of wave parameters
    const [regenKey, setRegenKey] = useState(0);
    // resolution exponent
    // default to 0.5x
    const [resolutionExp, setResolutionExp] = useState(1);
    // derived scale for convenience
    const resolutionScale = Math.pow(0.5, resolutionExp);

    // Precompute wave parameters and full-resolution bases only when wavesCount, size or regenKey change
    const precompRef = useRef({ waves: [], bases: [], palette: null, sinTable: null });

    useEffect(() => {
        // Prepare sin table because god is javascript slow
        const sinTable = new Float32Array(256);
        for (let i = 0; i < 256; i++) sinTable[i] = Math.sin(i * 2 * Math.PI / 255);

        const totalPixelsFull = width * height;

        const waves = [];
        const bases = [];

        for (let wi = 0; wi < wavesCount; wi++) {
            // choose random variables
            const cx = ((4 * Math.random()) - 2) * width;
            const cy = ((4 * Math.random()) - 2) * height;
            const diameter = 0.2 + Math.random() * 2.0; // scale
            const speed = (0.5 + Math.random() * 1.5) * 2;
            const phase = Math.floor(Math.random() * 256);

            waves.push({ cx, cy, diameter, speed, phase });

            const base = new Uint8Array(totalPixelsFull);
            let p = 0;
            for (let y = 0; y < height; y++) {
                const dy = y - cy;
                for (let x = 0; x < width; x++) {
                    const dx = x - cx;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    base[p++] = (Math.floor(dist * diameter) & 255);
                }
            }
            bases.push(base);
        }

        // Create a 4-color palette 
        // Dont pick colors that are too close in hue or lightness.
        const palette = new Uint8Array(12);

        function rgbToHsl(r, g, b) {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            let h = 0, s = 0, l = (max + min) / 2;
            if (max !== min) {
                const d = max - min;
                s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
                switch (max) {
                    case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                    case g: h = (b - r) / d + 2; break;
                    case b: h = (r - g) / d + 4; break;
                }
                h *= 60;
            }
            return { h, s, l };
        }

        function clampHueDiff(a, b) {
            let d = Math.abs(a - b);
            if (d > 180) d = 360 - d;
            return d;
        }

        const chosen = [];
        const minHueDiff = 15; // degrees
        const minLightDiff = 0.20; // lightness (0..1)

        for (let i = 0; i < 4; i++) {
            let attempt = 0;
            let picked = null;
            while (attempt < 200) {
                attempt++;
                const r = Math.floor(Math.random() * 256);
                const g = Math.floor(Math.random() * 256);
                const b = Math.floor(Math.random() * 256);
                const hsl = rgbToHsl(r, g, b);
                let ok = true;
                for (let j = 0; j < chosen.length; j++) {
                    const other = chosen[j];
                    const hueDist = clampHueDiff(hsl.h, other.h);
                    if (hueDist < minHueDiff) { ok = false; break; }
                    if (Math.abs(hsl.l - other.l) < minLightDiff) { ok = false; break; }
                }
                if (ok) { picked = { r, g, b, h: hsl.h, l: hsl.l }; break; }
            }
            // fallback - you can be a little close as a treat
            if (!picked) {
                const r = Math.floor(Math.random() * 256);
                const g = Math.floor(Math.random() * 256);
                const b = Math.floor(Math.random() * 256);
                const hsl = rgbToHsl(r, g, b);
                picked = { r, g, b, h: hsl.h, l: hsl.l };
            }
            chosen.push(picked);
            palette[i * 3 + 0] = picked.r;
            palette[i * 3 + 1] = picked.g;
            palette[i * 3 + 2] = picked.b;
        }

        precompRef.current = { waves, bases, palette, sinTable };
    }, [width, height, wavesCount, regenKey]);


    // Render Loop

    const [fps, setFps] = useState(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        const backgfloorCanvas = backgfloorCanvasRef.current;
        if (!canvas || !backgfloorCanvas) return;

        const ctx = canvas.getContext('2d');
        const bgCtx = backgfloorCanvas.getContext('2d');

        // White background
        bgCtx.fillStyle = '#FFFFFF';
        bgCtx.fillRect(0, 0, canvas.width, canvas.height);

        const { waves, bases, palette, sinTable } = precompRef.current;
        if (!waves || waves.length === 0) return;

        // scaled dimensions for lower-resolution rendering
        const scaledW = Math.max(1, Math.floor(width * resolutionScale));
        const scaledH = Math.max(1, Math.floor(height * resolutionScale));
        const totalPixels = scaledW * scaledH;

        // Offscreen canvas at scaled resolution
        const offscreen = document.createElement('canvas');
        offscreen.width = scaledW;
        offscreen.height = scaledH;
        const offCtx = offscreen.getContext('2d');

        // Reusable ImageData at scaled resolution
        const imageData = offCtx.createImageData(scaledW, scaledH);
        const data = imageData.data;

        // Aliases for speed
        const tSin = sinTable;
        const pixels = totalPixels;

        // Prepare a small array for per-frame integer phase offsets so we
        // don't allocate inside the pixel loop.
        const phaseOffsets = new Uint8Array(waves.length);

        let animationFrameId = null;
        let frameCount = 0;
        // FPS measurement
        let lastFpsTime = performance.now();
        let framesSince = 0;

        const render = () => {
            frameCount++;

            // Integer phase offsets per wave 
            for (let w = 0; w < waves.length; w++) {
                phaseOffsets[w] = (waves[w].phase + Math.floor(frameCount * waves[w].speed)) & 255;
            }

            let ptr = 0;
            // Iterate over scaled pixels; map each scaled pixel to source pixel for reuse
            for (let sy = 0; sy < scaledH; sy++) {
                const fy = Math.min(height - 1, Math.floor(sy / resolutionScale));
                for (let sx = 0; sx < scaledW; sx++) {
                    const fx = Math.min(width - 1, Math.floor(sx / resolutionScale));
                    const fullIdx = fy * width + fx;

                    let sum = 0.0;
                    for (let w = 0; w < waves.length; w++) {
                        const baseIdx = bases[w][fullIdx];
                        sum += tSin[(baseIdx + phaseOffsets[w]) & 255];
                    }
                    const v = sum / waves.length; // in [-1,1]

                    // map to [0,1]
                    const t = (v + 1) * 0.5;
                    // scale across 3 segments between 4 colors (palette still 4 colors)
                    let s = t * 3;
                    let idx = s | 0; // 0..3 but clamp to 0..2 for pairs
                    if (idx > 2) idx = 2;
                    const f = s - idx;

                    const r0 = palette[idx * 3 + 0], g0 = palette[idx * 3 + 1], b0c = palette[idx * 3 + 2];
                    const r1 = palette[(idx + 1) * 3 + 0], g1 = palette[(idx + 1) * 3 + 1], b1c = palette[(idx + 1) * 3 + 2];

                    const r = ((r0 * (1 - f) + r1 * f)) | 0;
                    const g = ((g0 * (1 - f) + g1 * f)) | 0;
                    const b = ((b0c * (1 - f) + b1c * f)) | 0;

                    data[ptr++] = r;
                    data[ptr++] = g;
                    data[ptr++] = b;
                    data[ptr++] = 255;
                }
            }

            // Put the computed image onto the offscreen, then draw it to scale
            offCtx.putImageData(imageData, 0, 0);
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(offscreen, 0, 0, width, height);

            framesSince++;
            // update FPS every 500ms
            const now = performance.now();
            if (now - lastFpsTime >= 500) {
                const measured = Math.round((framesSince * 1000) / (now - lastFpsTime));
                setFps(measured);
                framesSince = 0;
                lastFpsTime = now;
            }

            animationFrameId = window.requestAnimationFrame(render);
        };

        render();

        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, [width, height, resolutionExp, wavesCount, regenKey]);

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <canvas ref={backgfloorCanvasRef} width={width} height={height} style={{ width: '100%', height: '100%', top: '0', left: '0', position: 'absolute' }} />
            <canvas ref={canvasRef} width={width} height={height} style={{ width: '100%', height: '100%', top: '0', left: '0', position: 'absolute' }} />

            {/* Small control panel styled like the app windows (grey, lined titlebar) */}
            <div style={{position: 'absolute', left: 16, top: 16, width: 220, backgroundColor: 'rgb(204,204,204)', border: '1px solid rgb(119,119,119)', userSelect: 'none', zIndex: 999}}>
                <div style={{height: 22, backgroundColor: 'rgb(204,204,204)', paddingLeft: 6, fontFamily: 'Charcoal', fontSize: 13, display: 'flex', alignItems: 'center'}}>
                    <strong>Plasma Controls</strong>
                </div>
                <div style={{padding: 8, background: 'linear-gradient(180deg, #fff, #ddd)'}}>
                    <label style={{display: 'block', fontFamily: 'Charcoal', fontSize: 12, marginBottom: 6}}>Waves: {wavesCount}</label>
                    <input type="range" min={1} max={12} value={wavesCount} onChange={(e) => setWavesCount(Number(e.target.value))} style={{width: '100%'}} />
                    <div style={{height: 10}} />
                    <label style={{display: 'block', fontFamily: 'Charcoal', fontSize: 12, marginBottom: 6}}>Resolution: {resolutionScale}x</label>
                    <input type="range" min={0} max={6} step={1} value={resolutionExp} onChange={(e) => setResolutionExp(Number(e.target.value))} style={{width: '100%'}} />
                    <div style={{height: 8}} />
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <button onClick={() => setRegenKey(k => k + 1)} style={{display: 'inline-block', width: '70%', padding: '6px 8px', background: 'rgb(221,221,221)', border: '1px solid rgb(119,119,119)', fontFamily: 'Charcoal'}}>Regenerate</button>
                        <div style={{width: '28%', textAlign: 'right', fontFamily: 'Charcoal', fontSize: 12}}>FPS: {fps}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Plasma;

