/* ============================================================
   Loss landscape + gradient descent trajectories
   Field: sum of Gaussian bumps & wells, centers drift slowly.
   Contours: marching squares on a coarse grid.
   Walkers: gradient descent on the analytic field; respawn
   when they reach a basin (small ‖∇f‖).
   ============================================================ */

const canvas = document.getElementById('landscape');
if (canvas) {
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  let W = 0, H = 0;
  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', () => { resize(); rebuildField(); });

  /* --------- Field: sum of a few moving Gaussians ---------
     amp > 0 → well (attractor), amp < 0 → hill (repeller).
     Each bump drifts on its own slow Lissajous path so the
     landscape morphs without ever looking random. */
  const BUMPS_N = 6;
  let bumps = [];
  function rebuildField() {
    bumps = [];
    const margin = Math.min(W, H) * 0.15;
    for (let i = 0; i < BUMPS_N; i++) {
      bumps.push({
        cx0: margin + Math.random() * (W - 2 * margin),
        cy0: margin + Math.random() * (H - 2 * margin),
        ax: 40 + Math.random() * 80,
        ay: 30 + Math.random() * 80,
        wx: 0.00007 + Math.random() * 0.00010,
        wy: 0.00006 + Math.random() * 0.00009,
        phx: Math.random() * Math.PI * 2,
        phy: Math.random() * Math.PI * 2,
        sigma: 140 + Math.random() * 120,
        amp: (i % 2 === 0 ? 1 : -1) * (0.7 + Math.random() * 0.6),
      });
    }
  }
  rebuildField();

  function bumpCenter(b, t) {
    return {
      cx: b.cx0 + Math.cos(t * b.wx + b.phx) * b.ax,
      cy: b.cy0 + Math.sin(t * b.wy + b.phy) * b.ay,
    };
  }

  /* Cache centers per frame so f & grad reuse them. */
  let cache = [];
  function refreshCache(t) {
    cache = bumps.map((b) => {
      const { cx, cy } = bumpCenter(b, t);
      return { cx, cy, sigma2: b.sigma * b.sigma, amp: b.amp };
    });
  }

  function field(x, y) {
    let v = 0;
    for (const b of cache) {
      const dx = x - b.cx, dy = y - b.cy;
      v += b.amp * Math.exp(-(dx * dx + dy * dy) / (2 * b.sigma2));
    }
    return v;
  }

  function grad(x, y) {
    let gx = 0, gy = 0;
    for (const b of cache) {
      const dx = x - b.cx, dy = y - b.cy;
      const g = b.amp * Math.exp(-(dx * dx + dy * dy) / (2 * b.sigma2));
      gx += -g * dx / b.sigma2;
      gy += -g * dy / b.sigma2;
    }
    return { gx, gy };
  }

  /* --------- Marching squares ---------
     For each cell, look up the 4-bit corner mask and emit
     line segments interpolated to the iso-level. */
  const CELL = 28;                    // grid cell size in CSS px
  const LEVELS = [-0.95, -0.75, -0.55, -0.35, -0.15, 0.05, 0.25, 0.45, 0.65, 0.85]; // denser contours

  function drawContours() {
    const cols = Math.ceil(W / CELL) + 1;
    const rows = Math.ceil(H / CELL) + 1;

    /* Sample field once on the grid. */
    const grid = new Float32Array(cols * rows);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        grid[j * cols + i] = field(i * CELL, j * CELL);
      }
    }

    ctx.lineWidth = 1.2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.28)';   // amber-700, more visible

    for (const c of LEVELS) {
      ctx.beginPath();
      for (let j = 0; j < rows - 1; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const v00 = grid[j * cols + i];
          const v10 = grid[j * cols + i + 1];
          const v11 = grid[(j + 1) * cols + i + 1];
          const v01 = grid[(j + 1) * cols + i];

          let m = 0;
          if (v00 > c) m |= 1;
          if (v10 > c) m |= 2;
          if (v11 > c) m |= 4;
          if (v01 > c) m |= 8;
          if (m === 0 || m === 15) continue;

          const x0 = i * CELL, y0 = j * CELL;
          const x1 = x0 + CELL, y1 = y0 + CELL;

          /* Linear interpolation along each cell edge. */
          const eT = () => ({ x: x0 + CELL * (c - v00) / (v10 - v00), y: y0 });
          const eR = () => ({ x: x1, y: y0 + CELL * (c - v10) / (v11 - v10) });
          const eB = () => ({ x: x0 + CELL * (c - v01) / (v11 - v01), y: y1 });
          const eL = () => ({ x: x0, y: y0 + CELL * (c - v00) / (v01 - v00) });

          let segs;
          switch (m) {
            case 1:  case 14: segs = [[eL(), eT()]]; break;
            case 2:  case 13: segs = [[eT(), eR()]]; break;
            case 3:  case 12: segs = [[eL(), eR()]]; break;
            case 4:  case 11: segs = [[eR(), eB()]]; break;
            case 6:  case 9:  segs = [[eT(), eB()]]; break;
            case 7:  case 8:  segs = [[eL(), eB()]]; break;
            case 5:  segs = [[eL(), eT()], [eR(), eB()]]; break;  // saddle
            case 10: segs = [[eT(), eR()], [eL(), eB()]]; break;  // saddle
            default: segs = null;
          }
          if (!segs) continue;
          for (const [a, b] of segs) {
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
          }
        }
      }
      ctx.stroke();
    }
  }

  /* --------- Walkers (gradient descent) --------- */
  class Walker {
    constructor() { this.respawn(); }
    respawn() {
      const margin = Math.min(W, H) * 0.12;
      this.x = margin + Math.random() * (W - 2 * margin);
      this.y = margin + Math.random() * (H - 2 * margin);
      this.trail = [];
      this.life = 0;
      this.maxLife = 800 + Math.random() * 600;     /* frames — slower */
      this.stuckFrames = 0;                          /* count frames at minimum */
      this.wasStuck = false;
    }
    step() {
      const { gx, gy } = grad(this.x, this.y);
      const speed = 1.0;                             /* slower descent */
      const norm = Math.hypot(gx, gy) + 1e-6;
      this.x -= gx / norm * speed;
      this.y -= gy / norm * speed;

      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 140) this.trail.shift(); /* longer trail */
      this.life++;

      const stuck = norm < 0.0008;
      if (stuck) {
        this.stuckFrames++;
        this.wasStuck = true;
      } else {
        this.stuckFrames = 0;
      }

      const offscreen = this.x < -20 || this.x > W + 20 || this.y < -20 || this.y > H + 20;
      /* Stay at the minimum for ~90 frames to make it visible, then respawn. */
      if (offscreen || this.life > this.maxLife || this.stuckFrames > 90) {
        this.respawn();
      }
    }
    draw() {
      if (this.trail.length < 2) return;

      /* Trail: gradient from faint (tail) to bright (head). */
      for (let i = 1; i < this.trail.length; i++) {
        const a = this.trail[i - 1], b = this.trail[i];
        const t = i / (this.trail.length - 1);   /* 0 = tail, 1 = head */
        const alpha = 0.25 + 0.50 * t;
        ctx.strokeStyle = `rgba(180, 83, 9, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1.2 + 1.0 * t;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      /* Head: bright dot. If stuck, add a pulsing glow. */
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3.6, 0, Math.PI * 2);
      ctx.fill();

      if (this.wasStuck && this.stuckFrames > 0 && this.stuckFrames < 90) {
        const pulse = 0.5 + 0.5 * Math.sin(this.stuckFrames * 0.15);
        ctx.fillStyle = `rgba(252, 211, 77, ${(0.6 * pulse).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8 + 4 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  const walkers = Array.from({ length: 3 }, () => new Walker());

  /* Respect reduced-motion preference. */
  const reduceMotion = window.matchMedia &&
                       window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function frame(now) {
    refreshCache(now);
    ctx.clearRect(0, 0, W, H);
    drawContours();
    for (const w of walkers) {
      w.step();
      w.draw();
    }
    if (!reduceMotion) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
