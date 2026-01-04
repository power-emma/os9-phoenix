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
    const [normalsView, setNormalsView] = useState(false);
    const [fps, setFps] = useState(0);
    const framesRef2 = useRef(0);
    const lastFpsTimeRef = useRef(performance.now());
    const [useWebGL, setUseWebGL] = useState(false);

    // Reusable buffers
    const zbufRef = useRef(null);
    const imageDataRef = useRef(null);
    const triCacheRef = useRef(null);

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
                const res = await fetch('/teapot.obj');
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




    const screenDraw = (ctx, bctx) => {

        // Clear Screen
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // Oh god z bufferring on a cpu (you really should use a gpu for this... thats what theyre for)
        // Build list of candidate triangles (projected + camera-space data + normal)
        const drawList = [];
        const triangles = trianglesRef.current;
        for (let i = 0; i < triangles.length; i++) {
            const tri = triangles[i];
            const screenCoords = triangleToScreen(tri, cameraRef.current, ctx.canvas.width, ctx.canvas.height);
            // Skip triangles that are behind the camera
            if (!screenCoords.v1.onScreen && !screenCoords.v2.onScreen && !screenCoords.v3.onScreen) continue;

            // Edges in camera space
            const a3 = {
                x: screenCoords.v2.camX - screenCoords.v1.camX,
                y: screenCoords.v2.camY - screenCoords.v1.camY,
                z: screenCoords.v2.camZ - screenCoords.v1.camZ,
            };
            const b3 = {
                x: screenCoords.v3.camX - screenCoords.v1.camX,
                y: screenCoords.v3.camY - screenCoords.v1.camY,
                z: screenCoords.v3.camZ - screenCoords.v1.camZ,
            };
            // cross product (normal in camera space)
            const nx = a3.y * b3.z - a3.z * b3.y;
            const ny = a3.z * b3.x - a3.x * b3.z;
            const nz = a3.x * b3.y - a3.y * b3.x;

            // Determine facing by dotting the normal with vector from triangle to camera (camera at origin in camera space)
            // vector to camera = -v1_cam
            const toCamX = -screenCoords.v1.camX;
            const toCamY = -screenCoords.v1.camY;
            const toCamZ = -screenCoords.v1.camZ;
            const dot = nx * toCamX + ny * toCamY + nz * toCamZ;
            // front facing if dot > 0
            if (dot <= 0) continue;

            // per-vertex positive depth = -camZ
            const d1 = -screenCoords.v1.camZ;
            const d2 = -screenCoords.v2.camZ;
            const d3 = -screenCoords.v3.camZ;

            drawList.push({ tri, screenCoords, normal: { nx, ny, nz }, d1, d2, d3 });
        }

        // Prepare image buffer + z-buffer (reuse to avoid allocations)
        const w = ctx.canvas.width | 0;
        const h = ctx.canvas.height | 0;
        let imageData = imageDataRef.current;
        if (!imageData || imageData.width !== w || imageData.height !== h) {
            imageData = ctx.createImageData(w, h);
            imageDataRef.current = imageData;
            zbufRef.current = new Float32Array(w * h);
        }
        const data = imageData.data;
        const zbuf = zbufRef.current;
        // reset z-buffer quickly
        for (let i = 0, L = w * h; i < L; i++) zbuf[i] = 1e9;
        // clear image buffer to white so background doesn't show garbage/previous frames
        data.fill(255);

        // Precompute per-triangle raster variables
        const triCache = [];
        // does what it says on the tin
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
            if (Math.abs(denom) < 1e-6) continue; // degenerate
            const denomInv = 1 / denom;

            const minX = Math.max(0, Math.floor(Math.min(x1, x2, x3)));
            const maxX = Math.min(w - 1, Math.ceil(Math.max(x1, x2, x3)));
            const minY = Math.max(0, Math.floor(Math.min(y1, y2, y3)));
            const maxY = Math.min(h - 1, Math.ceil(Math.max(y1, y2, y3)));

            const r1 = 1 / Math.max(1e-6, item.d1);
            const r2 = 1 / Math.max(1e-6, item.d2);
            const r3 = 1 / Math.max(1e-6, item.d3);

            // base color from triangle; normals override only if not in wireframe mode
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

        // If wireframe only mode: skip rasterization and just stroke the triangles
        if (wireframe) {
            // fill background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, w, h);
            ctx.save();
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            // sort by average depth (farthest first) so nearer edges draw last
            drawList.sort((a, b) => ((a.d1 + a.d2 + a.d3) / 3) - ((b.d1 + b.d2 + b.d3) / 3));
            for (let item of drawList) {
                const s = item.screenCoords;
                ctx.beginPath();
                ctx.moveTo(s.v1.x, s.v1.y);
                ctx.lineTo(s.v2.x, s.v2.y);
                ctx.lineTo(s.v3.x, s.v3.y);
                ctx.closePath();
                ctx.stroke();
            }
            ctx.restore();
        } else {
            // Rasterize the precomputed triCache
            // Theres gotta be a better way
            for (let t = 0, tlen = triCache.length; t < tlen; t++) {
                const T = triCache[t];
                const { x1, y1, x2, y2, x3, y3, denomInv, minX, maxX, minY, maxY, r1, r2, r3, rgba } = T;
                for (let py = minY; py <= maxY; py++) {
                    const pyf = py + 0.5;
                    let base = py * w;
                    for (let px = minX; px <= maxX; px++) {
                        const sxf = px + 0.5;
                        // barycentric weights
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

            // Draw the image buffer to canvas
            ctx.putImageData(imageData, 0, 0);
        }

    }

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
    }, [useWebGL, wireframe, normalsView]);

    // Dense HTML
    return (<div style={{ width: "100%", height: "100%", position: "relative" }}>
        <div style={{ width: "100%", height: "100%", position: "relative" }} >
            <canvas ref={backgroundCanvasRef} width={width} height={(height * 0.9)} style={{ width: "100%", height: "100%", top: "0", left: "0", position: "absolute" }} />
            <canvas ref={canvasRef} width={width} height={(height * 0.9)} style={{ width: "100%", height: "100%", top: "0", left: "0", position: "absolute" }} />
        </div>
        {/* debug controls]) */}
        <div style={{ position: 'absolute', left: 8, top: 8, padding: 6, background: '#e0e0e0', border: '2px solid #808080', boxShadow: '2px 2px 0 #fff inset, -2px -2px 0 #000 inset', fontFamily: 'geneva, sans-serif', fontSize: 12 }}>
            <div style={{ marginBottom: 6, fontWeight: 'bold' }}>Debug</div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="checkbox" checked={wireframe} onChange={(e) => setWireframe(e.target.checked)} />
                <span>Wireframe</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                <input type="checkbox" checked={normalsView} onChange={(e) => setNormalsView(e.target.checked)} />
                <span>Normals</span>
            </label>
            <div style={{ marginTop: 6 }}>FPS: <strong style={{ fontFamily: 'monospace' }}>{fps}</strong></div>
        </div>
    </div>
    );
};

export default Renderer;