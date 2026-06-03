/* ============================================================
   Butterflies + water scene (adapted from jyopari fish)
   - Water: 6 drifting radial gradients (caustics)
   - Butterflies: follow-the-leader body with flapping wings
   ============================================================ */

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp  = (a, b, t) => a + (b - a) * t;

const canvasWater = document.getElementById('water');
const canvasFish  = document.getElementById('fish');
if (!canvasWater || !canvasFish) {
  console.info('fish scene canvases not found, skipping animation');
} else {
  const ctxWater = canvasWater.getContext('2d');
  const ctxFish  = canvasFish.getContext('2d');
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  function resizeCanvases() {
    const { innerWidth: w, innerHeight: h } = window;
    [canvasWater, canvasFish].forEach((c) => {
      c.width  = Math.floor(w * DPR);
      c.height = Math.floor(h * DPR);
      c.style.width  = w + 'px';
      c.style.height = h + 'px';
    });
  }
  resizeCanvases();
  window.addEventListener('resize', resizeCanvases);

  /* ---------- Water (soft drifting caustics) ---------- */
  let waterT = 0;
  function drawWater() {
    waterT += 0.0025;
    const w = canvasWater.width, h = canvasWater.height;
    ctxWater.clearRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) {
      const gx = (Math.sin(waterT * 1.2 + i) * 0.35 + 0.5) * w;
      const gy = (Math.cos(waterT * 0.9 + i * 0.7) * 0.35 + 0.5) * h;
      const r  = Math.max(w, h) * (0.35 + i * 0.06);
      const g  = ctxWater.createRadialGradient(gx, gy, 0, gx, gy, r);
      g.addColorStop(0, 'rgba(0,60,80,0.05)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctxWater.fillStyle = g;
      ctxWater.beginPath();
      ctxWater.arc(gx, gy, r, 0, Math.PI * 2);
      ctxWater.fill();
    }
  }

  /* ---------- Smooth pseudo-noise for wandering ---------- */
  function fbm(t, seed = 0) {
    return 0.55 * Math.sin(0.7 * t + 1.1 + seed)
         + 0.30 * Math.sin(1.3 * t + 2.4 + seed)
         + 0.15 * Math.cos(2.1 * t + 0.6 + seed);
  }

  /* ---------- Butterfly (follow-the-leader body) ---------- */
  class Butterfly {
    constructor(x0, y0, L, color) {
      this.len = L;
      this.segCount = 12;  // shorter body than fish
      this.segLen = this.len / (this.segCount - 1);
      this.spine = Array.from({ length: this.segCount }, (_, i) => ({
        x: x0 - i * this.segLen, y: y0,
      }));
      this.theta = 0;
      this.baseSpeed = 0.8 + Math.random() * 0.6;
      this.speed = this.baseSpeed;
      this.turnPower = 0.020;
      this.noiseSeed = Math.random() * 1000;
      this.color = color;
      this.wingBeatFreq = lerp(0.08, 0.14, Math.random());
      this.wingPhase = Math.random() * Math.PI * 2;
    }

    steer(t) {
      const wander = fbm(t * 0.012, this.noiseSeed) * this.turnPower;
      const shimmy = 0.25 * this.turnPower * Math.sin(t * this.wingBeatFreq * 2.0 + this.noiseSeed);
      const banking = Math.sign(wander) * Math.abs(wander) * 0.6 * 0.02;

      const cx = window.innerWidth * 0.5;
      const cy = window.innerHeight * 0.5;
      const head = this.spine[0];
      const dx = cx - head.x, dy = cy - head.y;
      const distToCenter = Math.hypot(dx, dy);
      const maxInf = Math.min(window.innerWidth, window.innerHeight) * 0.4;
      let centerAttraction = 0;
      if (distToCenter > maxInf) {
        const targetAngle = Math.atan2(dy, dx);
        const diff = ((targetAngle - this.theta + Math.PI) % (2 * Math.PI)) - Math.PI;
        centerAttraction = diff * 0.008;
      }
      return wander + shimmy + banking + centerAttraction;
    }

    update(t, W, H) {
      const head = this.spine[0];
      const edgeBuffer = 100;
      let avoid = 0;
      if (head.x < edgeBuffer)            avoid += (edgeBuffer - head.x) / edgeBuffer * 0.1;
      if (head.x > W - edgeBuffer)        avoid -= (head.x - (W - edgeBuffer)) / edgeBuffer * 0.1;
      if (head.y < edgeBuffer)            avoid += Math.sin(Math.PI / 2 - this.theta) * 0.08;
      if (head.y > H - edgeBuffer)        avoid += Math.sin(-Math.PI / 2 - this.theta) * 0.08;

      const speedVar = Math.sin(t * 0.010 + this.noiseSeed) * 0.2;
      this.speed = this.baseSpeed * (1 + speedVar);

      this.theta += this.steer(t) + avoid;

      head.x += this.speed * Math.cos(this.theta);
      head.y += this.speed * Math.sin(this.theta);

      const pad = 30;
      if (head.x < -pad)   head.x = W + pad;
      if (head.x > W + pad) head.x = -pad;
      if (head.y < -pad)   head.y = H + pad;
      if (head.y > H + pad) head.y = -pad;

      for (let i = 1; i < this.segCount; i++) {
        const prev = this.spine[i - 1];
        const curr = this.spine[i];
        const dx = curr.x - prev.x, dy = curr.y - prev.y;
        const d  = Math.hypot(dx, dy) || 1e-6;
        const ux = dx / d, uy = dy / d;
        curr.x = prev.x + ux * this.segLen;
        curr.y = prev.y + uy * this.segLen;
      }
    }

    draw(ctx, t) {
      const head = this.spine[0];
      const body = this.spine[Math.floor(this.segCount / 2)];

      // Wing flap angle
      const flapAngle = Math.sin(t * this.wingBeatFreq + this.wingPhase) * 0.5 + 0.3;

      // Body direction
      const dx = body.x - head.x, dy = body.y - head.y;
      const bodyAngle = Math.atan2(dy, dx);
      const perpX = -Math.sin(bodyAngle), perpY = Math.cos(bodyAngle);

      // Draw wings (two pairs, slightly offset)
      ctx.globalAlpha = 0.85;

      // Front wings (larger)
      const frontWingX = head.x + (body.x - head.x) * 0.3;
      const frontWingY = head.y + (body.y - head.y) * 0.3;
      const frontWingSize = this.len * 1.4;

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.ellipse(
        frontWingX * DPR + perpX * frontWingSize * Math.cos(flapAngle) * DPR,
        frontWingY * DPR + perpY * frontWingSize * Math.cos(flapAngle) * DPR,
        frontWingSize * 0.6 * DPR,
        frontWingSize * 1.0 * DPR,
        bodyAngle + Math.PI / 2 - flapAngle,
        0, Math.PI * 2
      );
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(
        frontWingX * DPR - perpX * frontWingSize * Math.cos(flapAngle) * DPR,
        frontWingY * DPR - perpY * frontWingSize * Math.cos(flapAngle) * DPR,
        frontWingSize * 0.6 * DPR,
        frontWingSize * 1.0 * DPR,
        bodyAngle + Math.PI / 2 + flapAngle,
        0, Math.PI * 2
      );
      ctx.fill();

      // Rear wings (smaller)
      const rearWingX = head.x + (body.x - head.x) * 0.6;
      const rearWingY = head.y + (body.y - head.y) * 0.6;
      const rearWingSize = this.len * 1.0;

      ctx.fillStyle = this.color;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.ellipse(
        rearWingX * DPR + perpX * rearWingSize * Math.cos(flapAngle) * DPR,
        rearWingY * DPR + perpY * rearWingSize * Math.cos(flapAngle) * DPR,
        rearWingSize * 0.5 * DPR,
        rearWingSize * 0.8 * DPR,
        bodyAngle + Math.PI / 2 - flapAngle,
        0, Math.PI * 2
      );
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(
        rearWingX * DPR - perpX * rearWingSize * Math.cos(flapAngle) * DPR,
        rearWingY * DPR - perpY * rearWingSize * Math.cos(flapAngle) * DPR,
        rearWingSize * 0.5 * DPR,
        rearWingSize * 0.8 * DPR,
        bodyAngle + Math.PI / 2 + flapAngle,
        0, Math.PI * 2
      );
      ctx.fill();

      ctx.globalAlpha = 1;

      // Body (thin ellipse)
      ctx.fillStyle = '#3a2817';
      ctx.beginPath();
      ctx.ellipse(
        body.x * DPR, body.y * DPR,
        this.len * 0.12 * DPR, this.len * 0.5 * DPR,
        bodyAngle, 0, Math.PI * 2
      );
      ctx.fill();

      // Head (small circle)
      ctx.fillStyle = '#2a1a0a';
      ctx.beginPath();
      ctx.arc(head.x * DPR, head.y * DPR, this.len * 0.18 * DPR, 0, Math.PI * 2);
      ctx.fill();

      // Antennae
      ctx.strokeStyle = '#2a1a0a';
      ctx.lineWidth = 1.2;
      const antLen = this.len * 0.3;
      const antAngle = bodyAngle - Math.PI;
      ctx.beginPath();
      ctx.moveTo(head.x * DPR, head.y * DPR);
      ctx.lineTo((head.x + Math.cos(antAngle - 0.3) * antLen) * DPR,
                 (head.y + Math.sin(antAngle - 0.3) * antLen) * DPR);
      ctx.moveTo(head.x * DPR, head.y * DPR);
      ctx.lineTo((head.x + Math.cos(antAngle + 0.3) * antLen) * DPR,
                 (head.y + Math.sin(antAngle + 0.3) * antLen) * DPR);
      ctx.stroke();
    }
  }

  const palette = ['#FF6B9D', '#FFA07A', '#87CEEB', '#FFD700'];  // butterfly colors
  let butterflies = [];
  function spawnButterflies() {
    butterflies = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      butterflies.push(new Butterfly(
        window.innerWidth  * (0.15 + i * 0.18),
        window.innerHeight * (0.2 + Math.random() * 0.6),
        35,  // butterfly size
        palette[i % palette.length]
      ));
    }
  }
  spawnButterflies();
  window.addEventListener('resize', spawnButterflies);

  const reduceMotion = window.matchMedia &&
                       window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let last = performance.now();
  function frame(now) {
    last = now;
    drawWater();
    ctxFish.clearRect(0, 0, canvasFish.width, canvasFish.height);
    for (const b of butterflies) {
      b.update(now, canvasFish.width / DPR, canvasFish.height / DPR);
      b.draw(ctxFish, now * 0.001);
    }
    if (!reduceMotion) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
