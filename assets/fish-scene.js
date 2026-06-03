/* ============================================================
   Loss-landscape ripples + fish
   - water canvas: moving contour lines from a Gaussian loss surface
   - fish canvas: follow-the-leader fish lightly guided by -∇f
   ============================================================ */

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp = (a, b, t) => a + (b - a) * t;

const canvasWater = document.getElementById('water');
const canvasFish = document.getElementById('fish');

if (!canvasWater || !canvasFish) {
  console.info('scene canvases not found, skipping animation');
} else {
  const ctxWater = canvasWater.getContext('2d');
  const ctxFish = canvasFish.getContext('2d');
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  let W = 0;
  let H = 0;

  function resizeCanvases() {
    W = window.innerWidth;
    H = window.innerHeight;
    [canvasWater, canvasFish].forEach((c) => {
      c.width = Math.floor(W * DPR);
      c.height = Math.floor(H * DPR);
      c.style.width = `${W}px`;
      c.style.height = `${H}px`;
    });
    ctxWater.setTransform(DPR, 0, 0, DPR, 0, 0);
    ctxFish.setTransform(DPR, 0, 0, DPR, 0, 0);
    rebuildLandscape();
    spawnFish();
  }

  const BUMP_COUNT = 7;
  let bumps = [];
  let bumpCache = [];

  function rebuildLandscape() {
    bumps = [];
    const margin = Math.min(W, H) * 0.12;
    for (let i = 0; i < BUMP_COUNT; i++) {
      const isWell = i % 2 === 0;
      bumps.push({
        cx0: margin + Math.random() * Math.max(1, W - margin * 2),
        cy0: margin + Math.random() * Math.max(1, H - margin * 2),
        ax: 30 + Math.random() * 80,
        ay: 25 + Math.random() * 65,
        wx: 0.000025 + Math.random() * 0.000045,
        wy: 0.000020 + Math.random() * 0.000040,
        phx: Math.random() * Math.PI * 2,
        phy: Math.random() * Math.PI * 2,
        sigma: 130 + Math.random() * 120,
        amp: (isWell ? -1 : 1) * (0.65 + Math.random() * 0.55),
      });
    }
  }

  function refreshLandscape(t) {
    bumpCache = bumps.map((b) => ({
      cx: b.cx0 + Math.cos(t * b.wx + b.phx) * b.ax,
      cy: b.cy0 + Math.sin(t * b.wy + b.phy) * b.ay,
      sigma2: b.sigma * b.sigma,
      amp: b.amp,
    }));
  }

  function field(x, y) {
    let value = 0;
    for (const b of bumpCache) {
      const dx = x - b.cx;
      const dy = y - b.cy;
      value += b.amp * Math.exp(-(dx * dx + dy * dy) / (2 * b.sigma2));
    }
    return value;
  }

  function grad(x, y) {
    let gx = 0;
    let gy = 0;
    for (const b of bumpCache) {
      const dx = x - b.cx;
      const dy = y - b.cy;
      const e = Math.exp(-(dx * dx + dy * dy) / (2 * b.sigma2));
      const g = b.amp * e;
      gx += -g * dx / b.sigma2;
      gy += -g * dy / b.sigma2;
    }
    return { gx, gy };
  }

  function descentFlow(x, y) {
    const { gx, gy } = grad(x, y);
    const norm = Math.hypot(gx, gy);
    if (norm < 1e-6) return { x: 0, y: 0, norm };
    return { x: -gx / norm, y: -gy / norm, norm };
  }

  function drawCaustics(t) {
    for (let i = 0; i < 5; i++) {
      const gx = (Math.sin(t * 0.00018 + i) * 0.35 + 0.5) * W;
      const gy = (Math.cos(t * 0.00013 + i * 0.7) * 0.35 + 0.5) * H;
      const r = Math.max(W, H) * (0.28 + i * 0.055);
      const g = ctxWater.createRadialGradient(gx, gy, 0, gx, gy, r);
      g.addColorStop(0, 'rgba(0, 60, 80, 0.035)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctxWater.fillStyle = g;
      ctxWater.beginPath();
      ctxWater.arc(gx, gy, r, 0, Math.PI * 2);
      ctxWater.fill();
    }
  }

  function drawContourRipples(t) {
    const cell = 24;
    const levels = [-0.95, -0.75, -0.55, -0.35, -0.15, 0.05, 0.25, 0.45, 0.65, 0.85];
    const cols = Math.ceil(W / cell) + 1;
    const rows = Math.ceil(H / cell) + 1;
    const grid = new Float32Array(cols * rows);

    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const x = i * cell;
        const y = j * cell;
        const shimmer = 0.018 * Math.sin(x * 0.018 + t * 0.0013) * Math.cos(y * 0.014 - t * 0.0011);
        grid[j * cols + i] = field(x, y) + shimmer;
      }
    }

    ctxWater.lineWidth = 1;
    ctxWater.lineCap = 'round';

    function interp(xa, ya, va, xb, yb, vb, level) {
      const denom = vb - va;
      const m = Math.abs(denom) < 1e-6 ? 0.5 : (level - va) / denom;
      return { x: xa + (xb - xa) * m, y: ya + (yb - ya) * m };
    }

    levels.forEach((level, levelIndex) => {
      const alpha = 0.12 + 0.025 * (levelIndex % 3);
      ctxWater.strokeStyle = level < 0
        ? `rgba(0, 88, 115, ${alpha})`
        : `rgba(180, 83, 9, ${alpha * 0.65})`;
      ctxWater.beginPath();

      for (let j = 0; j < rows - 1; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const v00 = grid[j * cols + i];
          const v10 = grid[j * cols + i + 1];
          const v11 = grid[(j + 1) * cols + i + 1];
          const v01 = grid[(j + 1) * cols + i];

          let mask = 0;
          if (v00 > level) mask |= 1;
          if (v10 > level) mask |= 2;
          if (v11 > level) mask |= 4;
          if (v01 > level) mask |= 8;
          if (mask === 0 || mask === 15) continue;

          const x0 = i * cell;
          const y0 = j * cell;
          const x1 = x0 + cell;
          const y1 = y0 + cell;
          const top = () => interp(x0, y0, v00, x1, y0, v10, level);
          const right = () => interp(x1, y0, v10, x1, y1, v11, level);
          const bottom = () => interp(x0, y1, v01, x1, y1, v11, level);
          const left = () => interp(x0, y0, v00, x0, y1, v01, level);

          let segs = null;
          switch (mask) {
            case 1: case 14: segs = [[left(), top()]]; break;
            case 2: case 13: segs = [[top(), right()]]; break;
            case 3: case 12: segs = [[left(), right()]]; break;
            case 4: case 11: segs = [[right(), bottom()]]; break;
            case 6: case 9: segs = [[top(), bottom()]]; break;
            case 7: case 8: segs = [[left(), bottom()]]; break;
            case 5: segs = [[left(), top()], [right(), bottom()]]; break;
            case 10: segs = [[top(), right()], [left(), bottom()]]; break;
          }
          if (!segs) continue;
          for (const [a, b] of segs) {
            ctxWater.moveTo(a.x, a.y);
            ctxWater.lineTo(b.x, b.y);
          }
        }
      }
      ctxWater.stroke();
    });
  }

  function fbm(t, seed = 0) {
    return 0.55 * Math.sin(0.7 * t + 1.1 + seed)
      + 0.30 * Math.sin(1.3 * t + 2.4 + seed)
      + 0.15 * Math.cos(2.1 * t + 0.6 + seed);
  }

  class Fish {
    constructor(x0, y0, len, color) {
      this.len = len;
      this.segCount = 32;
      this.segLen = this.len / (this.segCount - 1);
      this.spine = Array.from({ length: this.segCount }, (_, i) => ({ x: x0 - i * this.segLen, y: y0 }));
      this.theta = Math.random() * Math.PI * 2;
      this.baseSpeed = 0.75 + Math.random() * 0.45;
      this.speed = this.baseSpeed;
      this.noiseSeed = Math.random() * 1000;
      this.color = color;
      this.tailbeatFreq = lerp(0.025, 0.055, Math.random());
      this.tailbeatAmp = lerp(0.55, 0.85, Math.random());
    }

    radiusAt(i) {
      const s = i / (this.segCount - 1);
      const body = Math.sin(Math.PI * (1 - s));
      const tailTaper = Math.pow(1 - s, 1.6);
      const r0 = 0.16 * this.len;
      const rMinHead = 0.02 * this.len;
      return clamp(r0 * body * tailTaper + rMinHead * (1 - s), 1, 999);
    }

    update(t) {
      const head = this.spine[0];
      const flow = descentFlow(head.x, head.y);
      const wander = fbm(t * 0.0018, this.noiseSeed) * 0.030;
      let desiredAngle = this.theta + wander;

      if (flow.norm > 0.00008) {
        desiredAngle = Math.atan2(flow.y, flow.x) + wander * 0.75;
      }

      const margin = 90;
      if (head.x < margin) desiredAngle = lerpAngle(desiredAngle, 0, 0.25);
      if (head.x > W - margin) desiredAngle = lerpAngle(desiredAngle, Math.PI, 0.25);
      if (head.y < margin) desiredAngle = lerpAngle(desiredAngle, Math.PI / 2, 0.25);
      if (head.y > H - margin) desiredAngle = lerpAngle(desiredAngle, -Math.PI / 2, 0.25);

      this.theta = lerpAngle(this.theta, desiredAngle, 0.030);
      this.speed = this.baseSpeed * (1 + 0.20 * Math.sin(t * 0.002 + this.noiseSeed));
      head.x += this.speed * Math.cos(this.theta);
      head.y += this.speed * Math.sin(this.theta);

      const pad = 30;
      if (head.x < -pad) head.x = W + pad;
      if (head.x > W + pad) head.x = -pad;
      if (head.y < -pad) head.y = H + pad;
      if (head.y > H + pad) head.y = -pad;

      for (let i = 1; i < this.segCount; i++) {
        const prev = this.spine[i - 1];
        const curr = this.spine[i];
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const d = Math.hypot(dx, dy) || 1e-6;
        const ux = dx / d;
        const uy = dy / d;
        curr.x = prev.x + ux * this.segLen;
        curr.y = prev.y + uy * this.segLen;

        const s = i / (this.segCount - 1);
        const wig = this.tailbeatAmp * Math.sin(t * this.tailbeatFreq + s * 10 + this.noiseSeed);
        curr.x += -uy * wig * s * s;
        curr.y += ux * wig * s * s;
      }
    }

    draw(ctx) {
      const top = [];
      const bottom = [];

      for (let i = 0; i < this.spine.length; i++) {
        const p = this.spine[i];
        const p1 = i === 0 ? p : this.spine[i - 1];
        const p2 = i === this.spine.length - 1 ? p : this.spine[i + 1];
        let tx = p2.x - p1.x;
        let ty = p2.y - p1.y;
        const tl = Math.hypot(tx, ty) || 1e-6;
        tx /= tl;
        ty /= tl;
        const nx = -ty;
        const ny = tx;
        const r = this.radiusAt(i);
        top.push({ x: p.x + nx * r, y: p.y + ny * r });
        bottom.push({ x: p.x - nx * r, y: p.y - ny * r });
      }
      bottom.reverse();

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.moveTo(top[0].x, top[0].y);
      for (let i = 1; i < top.length; i++) ctx.lineTo(top[i].x, top[i].y);
      for (const p of bottom) ctx.lineTo(p.x, p.y);
      ctx.closePath();
      ctx.fill();

      const tail = this.spine[this.spine.length - 1];
      const prev = this.spine[this.spine.length - 2];
      let dx = tail.x - prev.x;
      let dy = tail.y - prev.y;
      const dl = Math.hypot(dx, dy) || 1e-6;
      dx /= dl;
      dy /= dl;
      const nx = -dy;
      const ny = dx;
      const tailLen = 0.16 * this.len;
      const tailSpan = 0.60 * this.radiusAt(this.spine.length - 1) + 3;
      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      ctx.lineTo(tail.x + dx * tailLen + nx * tailSpan, tail.y + dy * tailLen + ny * tailSpan);
      ctx.lineTo(tail.x + dx * tailLen - nx * tailSpan, tail.y + dy * tailLen - ny * tailSpan);
      ctx.closePath();
      ctx.fill();
    }
  }

  function lerpAngle(a, b, t) {
    const diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
    return a + diff * t;
  }

  let fish = [];
  const palette = ['#F6A04D', '#c2691d', '#B8DDD3', '#F597A2'];

  function spawnFish() {
    fish = [];
    const count = 4;
    for (let i = 0; i < count; i++) {
      fish.push(new Fish(
        W * (0.18 + i * 0.21),
        H * (0.25 + Math.random() * 0.5),
        64,
        palette[i % palette.length]
      ));
    }
  }

  resizeCanvases();

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function frame(now) {
    refreshLandscape(now);
    ctxWater.clearRect(0, 0, W, H);
    drawCaustics(now);
    drawContourRipples(now);

    ctxFish.clearRect(0, 0, W, H);
    for (const f of fish) {
      f.update(now);
      f.draw(ctxFish);
    }

    if (!reduceMotion) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
