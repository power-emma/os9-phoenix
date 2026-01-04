import { React, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';



function triangleToScreen(v, camera, width, height) {


    function projectVertex(p) {
        // Translate to camera-relative
        let dx = p.x - (camera.x || 0);
        let dy = p.y - (camera.y || 0);
        let dz = p.z - (camera.z || 0);

        // let you use radians or simple degrees
        function normAngle(a) {
            if (!a) return 0;
            if (Math.abs(a) > Math.PI * 2) return a * Math.PI / 180; // degrees -> radians
            return a;
        }
        let yaw = normAngle(camera.yaw || 0);
        let pitch = normAngle(camera.pitch || 0);

        // max pitch to avoid overflow
        const maxPitch = Math.PI / 2 - 0.001;
        if (pitch > maxPitch) pitch = maxPitch;
        if (pitch < -maxPitch) pitch = -maxPitch;

        const cy = Math.cos(-yaw);
        const sy = Math.sin(-yaw);

        // rotate around Y (yaw)
        const rx = dx * cy - dz * sy;
        const rz = dx * sy + dz * cy;

        const cp = Math.cos(-pitch);
        const sp = Math.sin(-pitch);

        // rotate around X (pitch)
        const ry = dy * cp - rz * sp;
        const rz2 = dy * sp + rz * cp;

        // Camera Direction = -1z, so forward is negative
        const zCam = -rz2;

        // FOV params
        const fov = (camera.fov !== undefined) ? camera.fov : (60 * Math.PI / 180); // radians
        const f = (height / 2) / Math.tan(fov / 2);

        // Camera-space coords
        const camX = rx;
        const camY = ry;
        const camZ = rz2;

        // f-camZ > 0 = infront = visible
        const depth = -camZ;
        if (depth <= 0.0001) {
            return { x: rx, y: ry, z: camZ, onScreen: false, camX, camY, camZ };
        }

        const screenX = (rx * f) / depth + width / 2;
        const screenY = (-ry * f) / depth + height / 2; // invert Y for screen coordinates

        return { x: screenX, y: screenY, z: camZ, onScreen: true, camX, camY, camZ };
    }

    const p1 = projectVertex(v.v1);
    const p2 = projectVertex(v.v2);
    const p3 = projectVertex(v.v3);

    return { v1: p1, v2: p2, v3: p3 };

}


const Renderer = ({ init }) => {

    // Canvas References
    const canvasRef = useRef(null)
    const backgroundCanvasRef = useRef(null)

    // Window Height/Width
    let height = init.height
    let width = init.width

    // camera stored in a ref so updates don't trigger React re-renders
    const cameraRef = useRef({
        x: 0,
        y: 0,
        z: 1,
        pitch: 0,
        yaw: 0,
        fov: 45 * Math.PI / 180
    });

    // References are awful and i hate them but react loves them so so so much so ugh >:(
    const keysRef = useRef({});
    const prevMoveRef = useRef({ x: 0, y: 0, z: 0 });
    const debugLogCountRef = useRef(0);
    const prevCamRef = useRef({ x: 0, y: 0, z: 0 });
    const debugFrameLogRef = useRef(0);
    const keyEventLogRef = useRef(0);
    const draggingRef = useRef(false);
    const dragStartRef = useRef({ x: 0, y: 0, yaw: 0, pitch: 0 });
    // last timestamp for smooth movement
    const lastTimeRef = useRef(null);

    // Debug toggles (wireframe and normals visualization)
    const [wireframe, setWireframe] = useState(false);
    const [normalsView, setNormalsView] = useState(true);
    const [fps, setFps] = useState(0);
    const framesRef2 = useRef(0);
    const lastFpsTimeRef = useRef(performance.now());


    // Reusable buffers
    const zbufRef = useRef(null);
    const imageDataRef = useRef(null);
    const triCacheRef = useRef(null);
    // Offscreen cache for resolution scaling
    const offscreenCacheRef = useRef({ w: 0, h: 0, offscreen: null, imageData: null, zbuf: null });

    // Resolution scaler (like Plasma): resolutionExp controls pow(0.5, exp) scale
    const [resolutionExp, setResolutionExp] = useState(1);
    const resolutionScale = Math.pow(0.5, resolutionExp);

    // Model selection state
    const [modelList, setModelList] = useState([]);
    const [selectedModel, setSelectedModel] = useState(null);
    const modelsCacheRef = useRef({});

    // Cube vertices
    const v = [
        { x: -0.5, y: -0.5, z: -0.5 }, // v0
        { x: 0.5, y: -0.5, z: -0.5 }, // v1
        { x: 0.5, y: 0.5, z: -0.5 }, // v2
        { x: -0.5, y: 0.5, z: -0.5 }, // v3
        { x: -0.5, y: -0.5, z: 0.5 }, // v4
        { x: 0.5, y: -0.5, z: 0.5 }, // v5
        { x: 0.5, y: 0.5, z: 0.5 }, // v6
        { x: -0.5, y: 0.5, z: 0.5 }  // v7
    ];

    // Colour Pallette
    const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#800000', '#008000', '#000080', '#808000', '#800080', '#008080'];

    // If nothing loaded then use default cube
    const trianglesRef = useRef([
        // front (z = +0.5)
        { v1: v[4], v2: v[5], v3: v[6], color: colors[0] },
        { v1: v[4], v2: v[6], v3: v[7], color: colors[1] },
        // back (z = -0.5)
        { v1: v[0], v2: v[3], v3: v[2], color: colors[2] },
        { v1: v[0], v2: v[2], v3: v[1], color: colors[3] },
        // left
        { v1: v[0], v2: v[4], v3: v[7], color: colors[4] },
        { v1: v[0], v2: v[7], v3: v[3], color: colors[5] },
        // right
        { v1: v[1], v2: v[2], v3: v[6], color: colors[6] },
        { v1: v[1], v2: v[6], v3: v[5], color: colors[7] },
        // top
        { v1: v[3], v2: v[7], v3: v[6], color: colors[8] },
        { v1: v[3], v2: v[6], v3: v[2], color: colors[9] },
        // bottom
        { v1: v[0], v2: v[1], v3: v[5], color: colors[10] },
        { v1: v[0], v2: v[5], v3: v[4], color: colors[11] }
    ]);

    // obj parser (its literally just a coordinates in a text file do i really need to explain this)
    function parseOBJ(text) {
        const verts = [];
        const tris = [];
        const lines = text.split(/\r?\n/);
        for (let raw of lines) {
            const line = raw.trim();
            if (!line || line.startsWith('#')) continue;
            const parts = line.split(/\s+/);
            if (parts[0] === 'v' && parts.length >= 4) {
                const x = parseFloat(parts[1]);
                const y = parseFloat(parts[2]);
                const z = parseFloat(parts[3]);
                verts.push({ x, y, z });
            } else if (parts[0] === 'f' && parts.length >= 4) {
                // face indices (may have formats like 'f v/vt/vn')
                const idx = parts.slice(1).map(p => {
                    const a = p.split('/')[0];
                    const i = parseInt(a, 10);
                    return (i >= 0) ? i - 1 : verts.length + i; // OBJ 1-based, allow negative
                });
                // triangulate fan
                for (let i = 1; i < idx.length - 1; i++) {
                    const v1 = verts[idx[0]];
                    const v2 = verts[idx[i]];
                    const v3 = verts[idx[i + 1]];
                    if (!v1 || !v2 || !v3) continue;
                    tris.push({ v1: { ...v1 }, v2: { ...v2 }, v3: { ...v3 } });
                }
            }
        }
        return tris;
    }

    // Load obj file from /public
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const res = await fetch('/objs/miat.obj');
                if (!res.ok) throw new Error('Not found');
                const txt = await res.text();
                const parsed = parseOBJ(txt);
                if (parsed && parsed.length > 0) {
                    // Assign colours from cube pallette (change here to do texture bs)
                    for (let i = 0; i < parsed.length; i++) {
                        parsed[i].color = colors[i % colors.length];
                    }
                    if (mounted) {
                        trianglesRef.current = parsed;
                        // move camera back a bit so teapot is visible
                        cameraRef.current.z = 5;
                        cameraRef.current.y = 4;
                        cameraRef.current.pitch = -Math.PI / 6;
                        console.log('Loaded /teapot.obj, triangles:', trianglesRef.current.length);
                    }
                }
            } catch (err) {
                console.warn('Could not load /teapot.obj — using default cube. Place teapot.obj in public/ to enable.', err);
            }
        })();
        return () => { mounted = false; };
    }, []);

  
    // Fetch available models and cache the selected model
    useEffect(() => {
        let mounted = true;
        fetch('/objs/list.json').then(r => {
            if (!r.ok) throw new Error('No manifest');
            return r.json();
        }).then(list => {
            if (!mounted) return;
            if (Array.isArray(list) && list.length) {
                setModelList(list);
                // pick previously selected or first
                setSelectedModel(prev => prev || list[0]);
            }
        }).catch(err => {
            console.warn('Could not load /objs/list.json', err);
            // fallback to known teapot if present
            setSelectedModel(prev => prev || 'teapot.obj');
        });
        return () => { mounted = false; };
    }, []);

    // Load the selected model (once per filename) and cache the parsed triangles
    useEffect(() => {
        if (!selectedModel) return;
        let mounted = true;
        async function loadModel(name) {
            try {
                if (modelsCacheRef.current[name]) {
                    trianglesRef.current = modelsCacheRef.current[name];
                    return;
                }
                const res = await fetch('/objs/' + name);
                if (!res.ok) throw new Error('Not found');
                const txt = await res.text();
                const parsed = parseOBJ(txt);
                for (let i = 0; i < parsed.length; i++) parsed[i].color = colors[i % colors.length];
                modelsCacheRef.current[name] = parsed;
                if (mounted) {
                    trianglesRef.current = parsed;
                    cameraRef.current.z = 3;
                    console.log('Loaded', name, 'triangles:', parsed.length);
                }
            } catch (err) {
                console.warn('Could not load model', name, err);
            }
        }
        loadModel(selectedModel);
        return () => { mounted = false; };
    }, [selectedModel]);
    // Software rasterizer
    const screenDraw = (ctx, bctx) => {
        // Render into a scaled offscreen buffer controlled by resolutionScale
        const mainW = ctx.canvas.width | 0;
        const mainH = ctx.canvas.height | 0;
        const scaledW = Math.max(1, Math.floor(mainW * resolutionScale));
        const scaledH = Math.max(1, Math.floor(mainH * resolutionScale));

        // ensure offscreen cache
        let cache = offscreenCacheRef.current;
        if (!cache.offscreen || cache.w !== scaledW || cache.h !== scaledH) {
            const off = document.createElement('canvas');
            off.width = scaledW;
            off.height = scaledH;
            cache = { w: scaledW, h: scaledH, offscreen: off, imageData: off.getContext('2d').createImageData(scaledW, scaledH), zbuf: new Float32Array(scaledW * scaledH) };
            offscreenCacheRef.current = cache;
        }

        const off = cache.offscreen;
        const offCtx = off.getContext('2d');
        const imageData = cache.imageData;
        const data = imageData.data;
        const zbuf = cache.zbuf;

        // Build list of candidate triangles using scaled screen dimensions
        const drawList = [];
        const triangles = trianglesRef.current;
        for (let i = 0; i < triangles.length; i++) {
            const tri = triangles[i];
            const screenCoords = triangleToScreen(tri, cameraRef.current, scaledW, scaledH);
            if (!screenCoords.v1.onScreen && !screenCoords.v2.onScreen && !screenCoords.v3.onScreen) continue;
            const a3 = { x: screenCoords.v2.camX - screenCoords.v1.camX, y: screenCoords.v2.camY - screenCoords.v1.camY, z: screenCoords.v2.camZ - screenCoords.v1.camZ };
            const b3 = { x: screenCoords.v3.camX - screenCoords.v1.camX, y: screenCoords.v3.camY - screenCoords.v1.camY, z: screenCoords.v3.camZ - screenCoords.v1.camZ };
            const nx = a3.y * b3.z - a3.z * b3.y;
            const ny = a3.z * b3.x - a3.x * b3.z;
            const nz = a3.x * b3.y - a3.y * b3.x;
            const toCamX = -screenCoords.v1.camX;
            const toCamY = -screenCoords.v1.camY;
            const toCamZ = -screenCoords.v1.camZ;
            const dot = nx * toCamX + ny * toCamY + nz * toCamZ;
            if (dot <= 0) continue;
            const d1 = -screenCoords.v1.camZ;
            const d2 = -screenCoords.v2.camZ;
            const d3 = -screenCoords.v3.camZ;
            drawList.push({ tri, screenCoords, normal: { nx, ny, nz }, d1, d2, d3 });
        }

        // clear zbuf and image
        for (let i = 0, L = scaledW * scaledH; i < L; i++) zbuf[i] = 1e9;
        data.fill(255);

        // Precompute per-triangle raster variables
        const triCache = [];
        function parseColorFast(col) {
            if (!col) return [200, 200, 200, 255];
            if (col[0] === '#') {
                const hex = col.replace('#', '');
                const bigint = parseInt(hex, 16);
                if (hex.length === 6) return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255, 255];
                if (hex.length === 3) return [((bigint >> 8) & 15) * 17, ((bigint >> 4) & 15) * 17, (bigint & 15) * 17, 255];
            }
            const m = col.match(/rgb\((\d+),(\d+),(\d+)\)/);
            if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3]), 255];
            return [200, 200, 200, 255];
        }

        for (let item of drawList) {
            const s = item.screenCoords;
            const x1 = s.v1.x, y1 = s.v1.y;
            const x2 = s.v2.x, y2 = s.v2.y;
            const x3 = s.v3.x, y3 = s.v3.y;
            const denom = (y2 - y3) * (x1 - x3) + (x3 - x2) * (y1 - y3);
            if (Math.abs(denom) < 1e-6) continue;
            const denomInv = 1 / denom;
            const minX = Math.max(0, Math.floor(Math.min(x1, x2, x3)));
            const maxX = Math.min(scaledW - 1, Math.ceil(Math.max(x1, x2, x3)));
            const minY = Math.max(0, Math.floor(Math.min(y1, y2, y3)));
            const maxY = Math.min(scaledH - 1, Math.ceil(Math.max(y1, y2, y3)));
            const r1 = 1 / Math.max(1e-6, item.d1);
            const r2 = 1 / Math.max(1e-6, item.d2);
            const r3 = 1 / Math.max(1e-6, item.d3);
            let rgba = parseColorFast(item.tri.color);
            if (normalsView && !wireframe) {
                let nxn = item.normal.nx;
                let nyn = item.normal.ny;
                let nzn = item.normal.nz;
                const nl = Math.hypot(nxn, nyn, nzn) || 1;
                nxn /= nl; nyn /= nl; nzn /= nl;
                const rcol = (nxn * 0.5 + 0.5) * 255 | 0;
                const gcol = (nyn * 0.5 + 0.5) * 255 | 0;
                const bcol = (nzn * 0.5 + 0.5) * 255 | 0;
                rgba = [rcol, gcol, bcol, 255];
            }
            triCache.push({ x1, y1, x2, y2, x3, y3, denomInv, minX, maxX, minY, maxY, r1, r2, r3, rgba });
        }

        if (wireframe) {
            offCtx.fillStyle = '#FFFFFF';
            offCtx.fillRect(0, 0, scaledW, scaledH);
            offCtx.save();
            offCtx.strokeStyle = '#000000';
            offCtx.lineWidth = 1;
            drawList.sort((a, b) => ((a.d1 + a.d2 + a.d3) / 3) - ((b.d1 + b.d2 + b.d3) / 3));
            for (let item of drawList) {
                const s = item.screenCoords;
                offCtx.beginPath();
                offCtx.moveTo(s.v1.x, s.v1.y);
                offCtx.lineTo(s.v2.x, s.v2.y);
                offCtx.lineTo(s.v3.x, s.v3.y);
                offCtx.closePath();
                offCtx.stroke();
            }
            offCtx.restore();
        } else {
            for (let t = 0, tlen = triCache.length; t < tlen; t++) {
                const T = triCache[t];
                const { x1, y1, x2, y2, x3, y3, denomInv, minX, maxX, minY, maxY, r1, r2, r3, rgba } = T;
                for (let py = minY; py <= maxY; py++) {
                    const pyf = py + 0.5;
                    let base = py * scaledW;
                    for (let px = minX; px <= maxX; px++) {
                        const sxf = px + 0.5;
                        const w1 = ((y2 - y3) * (sxf - x3) + (x3 - x2) * (pyf - y3)) * denomInv;
                        const w2 = ((y3 - y1) * (sxf - x3) + (x1 - x3) * (pyf - y3)) * denomInv;
                        const w3 = 1 - w1 - w2;
                        if (w1 >= -0.0005 && w2 >= -0.0005 && w3 >= -0.0005) {
                            const rr = w1 * r1 + w2 * r2 + w3 * r3;
                            if (rr <= 0) continue;
                            const depth = 1 / rr;
                            const idx = base + px;
                            if (depth < zbuf[idx]) {
                                zbuf[idx] = depth;
                                const di = idx * 4;
                                data[di] = rgba[0];
                                data[di + 1] = rgba[1];
                                data[di + 2] = rgba[2];
                                data[di + 3] = rgba[3];
                            }
                        }
                    }
                }
            }
            offCtx.putImageData(imageData, 0, 0);
        }

        // draw offscreen to main canvas without smoothing
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(off, 0, 0, mainW, mainH);
    };

        useEffect(() => {
        const canvas = canvasRef.current;
        const backgroundCanvas = backgroundCanvasRef.current;
        let animationFrameId = null;

        // Movement keys
        function normalizeKey(e) {
            const code = (e.code || '').toLowerCase();
            const key = (e.key || '').toLowerCase();

            if (code === 'arrowup') return 'w';
            if (code === 'arrowdown') return 's';
            if (code === 'arrowleft') return 'a';
            if (code === 'arrowright') return 'd';

            if (key && key.length === 1) return key;
            return key || code;
        }

        function onKeyDown(e) {
            // prevent browser from scrolling when using arrow keys / space while interacting
            const c = (e.code || '').toLowerCase();
            if (c.startsWith('arrow') || c === 'space') e.preventDefault();
            const k = normalizeKey(e);
            keysRef.current[k] = true;
            if (keyEventLogRef.current < 8) {
                keyEventLogRef.current += 1;
                console.warn('keyDown event', { key: k, code: e.code, keysSnapshot: { ...keysRef.current } });
            }
        }

        function onKeyUp(e) {
            const k = normalizeKey(e);
            keysRef.current[k] = false;
            if (keyEventLogRef.current < 8) {
                keyEventLogRef.current += 1;
                console.warn('keyUp event', { key: k, code: e.code, keysSnapshot: { ...keysRef.current } });
            }
        }

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        // keys are cleared if the window loses focus
        function onWindowBlur() { keysRef.current = {}; if (debugFrameLogRef.current < 8) { debugFrameLogRef.current += 1; console.warn('window blur — cleared keys'); } }
        function onWindowFocus() { if (debugFrameLogRef.current < 8) { debugFrameLogRef.current += 1; console.warn('window focus'); } }
        window.addEventListener('blur', onWindowBlur);
        window.addEventListener('focus', onWindowFocus);

        function onPointerDown(e) {
            e.preventDefault();
            draggingRef.current = true;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            dragStartRef.current = { x: clientX, y: clientY, yaw: cameraRef.current.yaw, pitch: cameraRef.current.pitch };
            document.body.style.userSelect = 'none';
        }
        function onPointerUp() {
            draggingRef.current = false;
            document.body.style.userSelect = '';
        }
        function onPointerMove(e) {
            if (!draggingRef.current) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const dx = clientX - dragStartRef.current.x;
            const dy = clientY - dragStartRef.current.y;
            const yawSpeed = 0.005;
            const pitchSpeed = 0.005;
            cameraRef.current.yaw = dragStartRef.current.yaw + dx * yawSpeed;
            cameraRef.current.pitch = dragStartRef.current.pitch + dy * pitchSpeed;
        }

        canvas.addEventListener('mousedown', onPointerDown);
        canvas.addEventListener('touchstart', onPointerDown, { passive: false });
        document.addEventListener('mouseup', onPointerUp);
        document.addEventListener('touchend', onPointerUp);
        document.addEventListener('mousemove', onPointerMove);
        document.addEventListener('touchmove', onPointerMove, { passive: false });


        const context = canvas.getContext('2d');
        const backgroundContext = backgroundCanvas.getContext('2d');
        // Make background White
        backgroundContext.fillStyle = '#FFFFFF';
        backgroundContext.fillRect(0, 0, context.canvas.width, context.canvas.height);

        const render2D = (time) => {
            if (!lastTimeRef.current) lastTimeRef.current = time;
            const dt = Math.min(0.05, (time - lastTimeRef.current) / 1000);
            lastTimeRef.current = time;

            // FPS
            framesRef2.current = (framesRef2.current || 0) + 1;
            const now = time;
            if (now - lastFpsTimeRef.current >= 250) {
                const elapsed = now - lastFpsTimeRef.current;
                const measured = (framesRef2.current * 1000) / elapsed;
                setFps(Math.round(measured));
                framesRef2.current = 0;
                lastFpsTimeRef.current = now;
            }

            // movement: forward follows the direction you're pointing (includes pitch),

            // left/right are the 90-degree horizontal directions relative to yaw.
            const cam = cameraRef.current;
            const speed = 1.5; // units per second
            const yaw = cam.yaw || 0;
            const pitch = cam.pitch || 0;

            // forward vector
            const fx = Math.sin(yaw) * Math.cos(pitch);
            const fy = Math.sin(pitch);
            const fz = -Math.cos(yaw) * Math.cos(pitch);

            // right vector
            const rx = Math.cos(yaw);
            const ry = 0;
            const rz = Math.sin(yaw);
            const prevCam = { x: cam.x, y: cam.y, z: cam.z };
            let moveX = 0, moveY = 0, moveZ = 0;
            if (keysRef.current['w']) { moveX += fx; moveY += fy; moveZ += fz; }
            if (keysRef.current['s']) { moveX -= fx; moveY -= fy; moveZ -= fz; }
            if (keysRef.current['a']) { moveX -= rx; moveZ -= rz; }
            if (keysRef.current['d']) { moveX += rx; moveZ += rz; }
            const preMag = Math.hypot(moveX, moveY, moveZ);

            // recompute magnitude after smoothing
            const mag = Math.hypot(moveX, moveY, moveZ);
            if (mag > 0.0001) {
                const scale = (speed * dt) / mag;
                cam.x += moveX * scale;
                cam.y += moveY * scale;
                cam.z += moveZ * scale;
            }



            // store previous movement for next-frame comparison
            prevMoveRef.current = { x: moveX, y: moveY, z: moveZ };
            prevCamRef.current = { x: cam.x, y: cam.y, z: cam.z };

            // max pitch
            const maxPitch = Math.PI / 2 - 0.001;
            if (cam.pitch > maxPitch) cam.pitch = maxPitch;
            if (cam.pitch < -maxPitch) cam.pitch = -maxPitch;

            screenDraw(context, backgroundContext);
            animationFrameId = window.requestAnimationFrame(render2D);
        };

        animationFrameId = window.requestAnimationFrame(render2D);



        return () => {
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
            window.removeEventListener('blur', onWindowBlur);
            canvas.removeEventListener('mousedown', onPointerDown);
            canvas.removeEventListener('touchstart', onPointerDown);
            document.removeEventListener('mouseup', onPointerUp);
            document.removeEventListener('touchend', onPointerUp);
            document.removeEventListener('mousemove', onPointerMove);
            document.removeEventListener('touchmove', onPointerMove);
        };
    }, [wireframe, normalsView, resolutionExp]);

    // Dense HTML
    return (<div style={{ width: "100%", height: "100%", position: "relative" }}>
        <div style={{ width: "100%", height: "100%", position: "relative" }} >
            <canvas ref={backgroundCanvasRef} width={width} height={(height * 0.9)} style={{ width: "100%", height: "100%", top: "0", left: "0", position: "absolute" }} />
            <canvas ref={canvasRef} width={width} height={(height * 0.9)} style={{ width: "100%", height: "100%", top: "0", left: "0", position: "absolute" }} />
        </div>
        {/* Debug control panel (macOS 9 style) */}
        <div style={{ position: 'absolute', left: 12, top: 12, width: "15%", userSelect: 'none', zIndex: 999 }}>
            <div style={{ backgroundColor: 'rgb(204,204,204)', border: '1px solid rgb(119,119,119)' }}>
                <div style={{ height: 22, paddingLeft: 6, fontFamily: 'Charcoal, geneva, sans-serif', fontSize: 13, display: 'flex', alignItems: 'center' }}>
                    <strong>Renderer Setings</strong>
                </div>
                    <div style={{ padding: "0.5em", background: 'linear-gradient(180deg, #fff, #ddd)' }}>
                    <div style={{ display: 'inline', gap: 8, alignItems: 'center', marginBottom: "0.1em" }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: "0.1em" }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Charcoal' }}>
                                <input type="checkbox" checked={wireframe} onChange={(e) => setWireframe(e.target.checked)} />
                                <span>Wireframe</span>
                            </label>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: "0.1em" }}>

                            <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Charcoal' }}>
                                <input type="checkbox" checked={normalsView} onChange={(e) => setNormalsView(e.target.checked)} />
                                <span>Normals</span>
                            </label>
                        </div>
                    </div>

                    <div style={{ marginBottom: "0.1em" }}>
                        <div style={{ fontFamily: 'Charcoal', fontSize: 12, marginBottom: 4 }}>Model</div>
                        <select value={selectedModel || ''} onChange={(e) => setSelectedModel(e.target.value)} style={{ fontFamily: 'Charcoal', width: '100%' }}>
                            {modelList.length === 0 && <option value="">(no models)</option>}
                            {modelList.map((m) => (<option key={m} value={m}>{m}</option>))}
                        </select>
                    </div>

                    <div style={{  marginBottom: "0.1em" }}>
                    <label style={{ display: 'block', fontFamily: 'Charcoal', fontSize: 12, marginBottom: 0 }}>Resolution: {resolutionScale.toFixed(3)}x</label>
                    <input type="range" min={0} max={4} step={0.25} value={resolutionExp} onChange={(e) => setResolutionExp(Number(e.target.value))} style={{ width: '100%' }} />
                    <div style={{ fontFamily: 'Charcoal', fontSize: 11, marginTop: -10 }}>Internal: {Math.max(1, Math.floor(width * resolutionScale))} × {Math.max(1, Math.floor((height * resolutionScale)))} px</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontFamily: 'Charcoal', fontSize: 12 }}>FPS: <strong style={{ fontFamily: 'monospace' }}>{fps}</strong></div>
                        <button onClick={() => { cameraRef.current = { x: 0, y: 0, z: 1, pitch: 0, yaw: 0, fov: cameraRef.current.fov }; }} style={{ padding: '6px 8px', background: 'rgb(221,221,221)', border: '1px solid rgb(119,119,119)', fontFamily: 'Charcoal' }}>Reset</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
};

export default Renderer;