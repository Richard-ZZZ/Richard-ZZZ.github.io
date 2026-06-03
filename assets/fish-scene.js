/* ============================================================
   Fish + water scene (adapted from jyopari.github.io)
   - Water: 6 drifting radial gradients (caustics)
   - Fish: follow-the-leader spine with natural steering
   No lily pads (would need hand-drawn PNGs).
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

  /* ---------- Fish (follow-the-leader spine) ---------- */
  class Fish {
    constructor(x0, y0, L, color) {
      this.len = L;
      this.segCount = 32;
      this.segLen = this.len / (this.segCount - 1);
      this.spine = Array.from({ length: this.segCount }, (_, i) => ({
        x: x0 - i * this.segLen, y: y0,
      }));
      this.theta = 0;
      this.baseSpeed = 1.1 + Math.random() * 0.8;
      this.speed = this.baseSpeed;
      this.turnPower = 0.015;
      this.noiseSeed = Math.random() * 1000;
      this.color = color;
      this.tailbeatFreq = lerp(0.025, 0.06, Math.random());
      this.tailbeatAmp  = lerp(0.6, 0.9, Math.random());
    }

    radiusAt(i) {
      const s = i / (this.segCount - 1);
      const body = Math.sin(Math.PI * (1 - s));
      const tailTaper = Math.pow(1 - s, 1.6);
      const r0 = 0.16 * this.len;
      const rMinHead = 0.02 * this.len;
      return clamp(r0 * body * tailTaper + rMinHead * (1 - s), 1, 999);
    }

    steer(t) {
      const wander = fbm(t * 0.015, this.noiseSeed) * this.turnPower;
      const shimmy = 0.35 * this.turnPower * Math.sin(t * this.tailbeatFreq * 2.0 + this.noiseSeed);
      const banking = Math.sign(wander) * Math.abs(wander) * 0.8 * 0.02;
      const directionChange = Math.sin(t * 0.005 + this.noiseSeed * 3) *
                              Math.sin(t * 0.003 + this.noiseSeed * 7) * this.turnPower * 0.8;

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
        centerAttraction = diff * 0.009;
      }
      return wander + shimmy + banking + directionChange + centerAttraction;
    }

    update(t, W, H) {
      const head = this.spine[0];
      const edgeBuffer = 80;
      let avoid = 0;
      if (head.x < edgeBuffer)            avoid += (edgeBuffer - head.x) / edgeBuffer * 0.08;
      if (head.x > W - edgeBuffer)        avoid -= (head.x - (W - edgeBuffer)) / edgeBuffer * 0.08;
      if (head.y < edgeBuffer)            avoid += Math.sin(Math.PI / 2 - this.theta) * 0.06;
      if (head.y > H - edgeBuffer)        avoid += Math.sin(-Math.PI / 2 - this.theta) * 0.06;

      const speedVar = Math.sin(t * 0.012 + this.noiseSeed) * 0.3 +
                       Math.sin(t * 0.007 + this.noiseSeed * 2) * 0.2;
      this.speed = this.baseSpeed * (1 + 1.3 * speedVar);

      const naturalCurve = Math.sin(t * 0.008 + this.noiseSeed) * 0.015;
      this.theta += this.steer(t) + avoid + naturalCurve;

      head.x += this.speed * Math.cos(this.theta);
      head.y += this.speed * Math.sin(this.theta);

      const pad = 20;
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

        const s = i / (this.segCount - 1);
        const wig = this.tailbeatAmp * Math.sin(t * this.tailbeatFreq + s * 10 + this.noiseSeed);
        curr.x += (-uy) * wig * s * s;
        curr.y += ( ux) * wig * s * s;
      }
    }

    draw(ctx) {
      const top = [], bot = [];
      for (let i = 0; i < this.spine.length; i++) {
        const p  = this.spine[i];
        const p1 = (i === 0) ? p : this.spine[i - 1];
        const p2 = (i === this.spine.length - 1) ? p : this.spine[i + 1];
        let tx = p2.x - p1.x, ty = p2.y - p1.y;
        const tl = Math.hypot(tx, ty) || 1e-6;
        tx /= tl; ty /= tl;
        const nx = -ty, ny = tx;
        const r = this.radiusAt(i);
        top.push({ x: p.x + nx * r, y: p.y + ny * r });
        bot.push({ x: p.x - nx * r, y: p.y - ny * r });
      }
      bot.reverse();

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(top[0].x * DPR, top[0].y * DPR);
      for (let i = 1; i < top.length; i++) ctx.lineTo(top[i].x * DPR, top[i].y * DPR);
      for (let i = 0; i < bot.length; i++) ctx.lineTo(bot[i].x * DPR, bot[i].y * DPR);
      ctx.closePath();
      ctx.fill();

      // Caudal fin
      const tail = this.spine[this.spine.length - 1];
      const prev = this.spine[this.spine.length - 2];
      let dx = tail.x - prev.x, dy = tail.y - prev.y;
      const dl = Math.hypot(dx, dy) || 1e-6; dx /= dl; dy /= dl;
      const nx = -dy, ny = dx;
      const tailLen  = 0.16 * this.len;
      const tailSpan = 0.60 * this.radiusAt(this.spine.length - 1) + 3;
      ctx.beginPath();
      ctx.moveTo(tail.x * DPR, tail.y * DPR);
      ctx.lineTo((tail.x + dx * tailLen + nx * tailSpan) * DPR,
                 (tail.y + dy * tailLen + ny * tailSpan) * DPR);
      ctx.lineTo((tail.x + dx * tailLen - nx * tailSpan) * DPR,
                 (tail.y + dy * tailLen - ny * tailSpan) * DPR);
      ctx.closePath();
      ctx.fill();
    }
  }

  const palette = ['#F6A04D', '#c2691d', '#B8DDD3', '#F597A2'];  // darker orange, remove beige
  let fishes = [];
  function spawnFishes() {
    fishes = [];
    const count = 4;
    for (let i = 0; i < count; i++) {
      fishes.push(new Fish(
        window.innerWidth  * (0.2 + i * 0.2),  // spread across width
        window.innerHeight * (0.3 + Math.random() * 0.4),  // varied heights
        80,  // bigger fish (was 50)
        palette[i % palette.length]
      ));
    }
  }
  spawnFishes();
  window.addEventListener('resize', spawnFishes);

  const reduceMotion = window.matchMedia &&
                       window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let last = performance.now();
  function frame(now) {
    last = now;
    drawWater();
    ctxFish.clearRect(0, 0, canvasFish.width, canvasFish.height);
    for (const f of fishes) {
      f.update(now, canvasFish.width / DPR, canvasFish.height / DPR);
      f.draw(ctxFish);
    }
    if (!reduceMotion) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
