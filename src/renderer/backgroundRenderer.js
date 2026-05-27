// ── 2026-trend background: aurora mesh + grain + star field ──────────────────
//
// Technique:
//   1. Deep base fill
//   2. 5 slow-drifting radial-gradient "aurora orbs" in purple/cyan/magenta
//   3. Subtle scanline-style grain overlay (composited via canvas noise pattern)
//   4. Tiny star-field (pre-seeded positions, twinkle each frame)
const NUM_ORBS = 5;
const NUM_STARS = 140;
const GRAIN_ALPHA = 0.032;
// Orb definition: base angle, radius fraction, speed fraction, color stops
const ORB_DEFS = [
    { angle0: 0.0, speed: 0.00018, rx: 0.55, ry: 0.50, color: '#990ae3', alpha: 0.28 },
    { angle0: 1.3, speed: 0.00011, rx: 0.48, ry: 0.42, color: '#00ccff', alpha: 0.14 },
    { angle0: 2.6, speed: 0.00023, rx: 0.52, ry: 0.44, color: '#cc00ff', alpha: 0.18 },
    { angle0: 4.0, speed: 0.00015, rx: 0.38, ry: 0.35, color: '#ff00aa', alpha: 0.10 },
    { angle0: 5.2, speed: 0.00020, rx: 0.44, ry: 0.40, color: '#3300cc', alpha: 0.20 },
];
// Pre-generate star positions (stable across frames)
const stars = [];
for (let i = 0; i < NUM_STARS; i++) {
    // Simple deterministic pseudo-random using index
    const t1 = Math.sin(i * 127.1) * 43758.5453;
    const t2 = Math.sin(i * 311.7) * 43758.5453;
    const t3 = Math.sin(i * 74.3) * 43758.5453;
    const t4 = Math.sin(i * 19.9) * 43758.5453;
    stars.push({
        x: (t1 - Math.floor(t1)),
        y: (t2 - Math.floor(t2)),
        phase: (t3 - Math.floor(t3)) * Math.PI * 2,
        size: 0.6 + (t4 - Math.floor(t4)) * 1.4,
    });
}
// Grain canvas (128×128) generated once, tiled via pattern
let grainPattern = null;
function ensureGrain(ctx) {
    if (grainPattern)
        return;
    const off = document.createElement('canvas');
    off.width = off.height = 128;
    const oc = off.getContext('2d');
    const img = oc.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255 | 0;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 255;
    }
    oc.putImageData(img, 0, 0);
    grainPattern = ctx.createPattern(off, 'repeat');
}
export function renderBackground(ctx, w, h, timestamp) {
    ensureGrain(ctx);
    // 1. Base fill
    ctx.fillStyle = '#0e0020';
    ctx.fillRect(0, 0, w, h);
    // 2. Aurora orbs
    ctx.save();
    for (let i = 0; i < NUM_ORBS; i++) {
        const def = ORB_DEFS[i];
        const a = def.angle0 + timestamp * def.speed;
        // Orb centre orbits slowly around canvas centre
        const cx = w / 2 + Math.cos(a) * w * def.rx * 0.5;
        const cy = h / 2 + Math.sin(a * 0.71) * h * def.ry * 0.5;
        const r = Math.min(w, h) * (0.35 + 0.1 * Math.sin(a * 0.4));
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, hexAlpha(def.color, def.alpha));
        g.addColorStop(0.5, hexAlpha(def.color, def.alpha * 0.4));
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
    // 3. Stars
    ctx.save();
    for (const s of stars) {
        const twinkle = 0.4 + 0.6 * Math.abs(Math.sin(timestamp * 0.0008 + s.phase));
        ctx.globalAlpha = twinkle * 0.85;
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 4;
        ctx.shadowColor = '#cc88ff';
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.restore();
    // 4. Grain overlay
    if (grainPattern) {
        ctx.save();
        ctx.globalAlpha = GRAIN_ALPHA;
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = grainPattern;
        // Shift the grain slightly each frame for animated noise feel
        const shift = (timestamp * 0.05) % 128 | 0;
        ctx.translate(shift, shift);
        ctx.fillRect(-shift, -shift, w + 128, h + 128);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.restore();
    }
}
// Convert '#rrggbb' + alpha 0-1 → 'rgba(r,g,b,a)'
function hexAlpha(hex, a) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
}
