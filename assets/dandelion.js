/* ============================================================
   Dandelion + click-to-blow
   - One stem with a head of seeds packed in a disk.
   - Click anywhere → a radial wind impulse spawns from the click;
     the gust decays over ~1.2s, kicking nearby seeds loose.
   - Loose seeds drift, spin, lose lift, fade off-screen.
   - Head slowly regrows a few seeds when it gets sparse.
   - Idle: only a tiny breeze sway.
   ============================================================ */

const canvas = document.getElementById('dandelion');
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

  /* ---------- Stem + head position ---------- */
  let head = { x: 0, y: 0 };
  let stemBase = { x: 0, y: 0 };
  let headRadius = 60;
  function placeStem() {
    /* Right-hand side, comfortably below the bio block. */
    head.x = Math.max(W - 220, W * 0.78);
    head.y = Math.max(H - 320, H * 0.55);
    stemBase.x = head.x + 6;
    stemBase.y = H + 20;
    headRadius = Math.min(70, Math.max(48, Math.min(W, H) * 0.07));
  }
  placeStem();

  window.addEventListener('resize', () => {
    resize();
    placeStem();
    rebuildHead();
  });

  /* ---------- Wind ----------
     gusts: list of decaying radial impulses from click points.
     ambient: a tiny global breeze, slowly modulated. */
  const gusts = [];
  let ambientT = 0;

  function ambientWind(t) {
    /* Slow horizontal drift + gentle vertical bob. */
    const wx = 0.06 * Math.sin(t * 0.0006) + 0.04 * Math.sin(t * 0.0013 + 0.7);
    const wy = -0.02 + 0.02 * Math.sin(t * 0.0009 + 1.3);
    return { wx, wy };
  }

  function windAt(x, y, t) {
    const a = ambientWind(t);
    let wx = a.wx, wy = a.wy;
    for (const g of gusts) {
      const dx = x - g.x, dy = y - g.y;
      const d2 = dx * dx + dy * dy;
      const d = Math.sqrt(d2) + 1e-3;
      const reach = g.reach;
      if (d > reach * 1.5) continue;
      /* Strength: peak then decay, falls off with distance. */
      const radial = Math.exp(-d2 / (2 * reach * reach));
      const f = g.power * radial;
      wx += (dx / d) * f;
      wy += (dy / d) * f;
    }
    return { wx, wy };
  }

  function spawnGust(x, y) {
    gusts.push({
      x, y,
      power: 7.5,
      reach: 220,
      life: 0,
      maxLife: 1.2,        /* seconds */
    });
  }

  /* Click anywhere on the page (canvas covers the viewport). */
  canvas.addEventListener('pointerdown', (e) => {
    spawnGust(e.clientX, e.clientY);
  });

  /* ---------- Seeds ----------
     Two states: ATTACHED (sitting on the head, only tiny jitter)
     and FLYING (free, integrating wind). */
  const ATTACHED = 0, FLYING = 1;

  class Seed {
    constructor(opts = {}) {
      this.state = ATTACHED;
      /* Polar offset on the head disk. */
      this.r = opts.r ?? Math.sqrt(Math.random()) * (headRadius * 0.95);
      this.phi = opts.phi ?? Math.random() * Math.PI * 2;
      /* Stem direction from seed center → head center, kept for drawing. */
      this.angle = this.phi + Math.PI;          /* fluff radiates outward */
      this.spin = 0;
      this.spinV = 0;
      this.x = head.x + Math.cos(this.phi) * this.r;
      this.y = head.y + Math.sin(this.phi) * this.r;
      this.vx = 0; this.vy = 0;
      this.alpha = 1;
      this.size = 0.85 + Math.random() * 0.5;   /* visual scale */
      this.detachThreshold = 0.65 + Math.random() * 0.5;
    }

    detach(force) {
      this.state = FLYING;
      this.vx = force.wx * 0.7;
      this.vy = force.wy * 0.7 - 0.3;           /* tiny upward kick */
      this.spinV = (Math.random() - 0.5) * 0.06;
    }

    update(t, dt) {
      if (this.state === ATTACHED) {
        /* Sit on the head; jitter slightly with ambient + nearby gusts. */
        const w = windAt(this.x, this.y, t);
        const force = Math.hypot(w.wx, w.wy);
        this.x = head.x + Math.cos(this.phi) * this.r + w.wx * 0.4;
        this.y = head.y + Math.sin(this.phi) * this.r + w.wy * 0.4;
        if (force > this.detachThreshold) this.detach(w);
        return true;
      }

      const w = windAt(this.x, this.y, t);
      /* Light air resistance, a touch of gravity, lift from wind. */
      this.vx += (w.wx * 0.9 - this.vx * 0.06) * dt * 60;
      this.vy += (w.wy * 0.9 - this.vy * 0.06 + 0.02) * dt * 60;
      this.x += this.vx;
      this.y += this.vy;
      this.spin += this.spinV + (this.vx * 0.002);
      this.angle = Math.atan2(this.vy, this.vx) + Math.PI / 2;

      /* Fade out near edges, kill when off-screen. */
      const margin = 40;
      if (this.x < -margin || this.x > W + margin ||
          this.y < -margin || this.y > H + margin) {
        return false;
      }
      const edgeFade = Math.min(
        1,
        Math.min(this.x, W - this.x, this.y, H - this.y) / 60,
      );
      this.alpha = Math.max(0.15, edgeFade);
      return true;
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle + this.spin);
      ctx.globalAlpha = this.alpha;

      /* Tiny seed body (an oval). */
      ctx.fillStyle = '#7a4f1d';
      ctx.beginPath();
      ctx.ellipse(0, 4 * this.size, 1.2 * this.size, 3.2 * this.size, 0, 0, Math.PI * 2);
      ctx.fill();

      /* Pappus: 8 fine filaments fanned out. */
      ctx.strokeStyle = 'rgba(120, 80, 40, 0.55)';
      ctx.lineWidth = 0.7;
      const N = 8;
      const len = 7 * this.size;
      for (let i = 0; i < N; i++) {
        const a = -Math.PI / 2 + (i - (N - 1) / 2) * (Math.PI / 14);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a) * len, Math.sin(a) * len);
        ctx.stroke();
      }
      /* Soft fluff halo. */
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
      ctx.beginPath();
      ctx.arc(0, -len * 0.55, 3.5 * this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  let seeds = [];
  function rebuildHead() {
    seeds = [];
    const N = 70;
    for (let i = 0; i < N; i++) seeds.push(new Seed());
  }
  rebuildHead();

  /* ---------- Stem drawing ---------- */
  function drawStem(t) {
    const sway = Math.sin(t * 0.0009) * 6 + ambientWind(t).wx * 4;
    ctx.strokeStyle = '#6b8e3d';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(stemBase.x, stemBase.y);
    /* Quadratic curve toward head, with a slight breeze-driven sway. */
    const cx = (stemBase.x + head.x) / 2 + sway;
    const cy = (stemBase.y + head.y) / 2;
    ctx.quadraticCurveTo(cx, cy, head.x + sway * 0.4, head.y);
    ctx.stroke();

    /* Two tiny leaves. */
    ctx.fillStyle = 'rgba(107, 142, 61, 0.85)';
    const ly1 = stemBase.y - (stemBase.y - head.y) * 0.55;
    const lx1 = (stemBase.x + cx) / 2 + sway * 0.5;
    ctx.beginPath();
    ctx.ellipse(lx1 - 8, ly1, 10, 3.2, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(lx1 + 8, ly1 - 18, 8, 2.6, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }

  /* ---------- Frame loop ---------- */
  let lastT = performance.now();
  let regrowAccum = 0;
  const reduceMotion = window.matchMedia &&
                       window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function frame(now) {
    const dt = Math.min(0.04, (now - lastT) / 1000);
    lastT = now;
    ambientT = now;

    /* Decay gusts. */
    for (let i = gusts.length - 1; i >= 0; i--) {
      const g = gusts[i];
      g.life += dt;
      const k = 1 - g.life / g.maxLife;
      g.power = 7.5 * Math.max(0, k * k);
      g.reach = 220 + g.life * 120;             /* expands as it weakens */
      if (g.life > g.maxLife) gusts.splice(i, 1);
    }

    ctx.clearRect(0, 0, W, H);
    drawStem(now);

    /* Update seeds; drop those that left. */
    for (let i = seeds.length - 1; i >= 0; i--) {
      if (!seeds[i].update(now, dt)) seeds.splice(i, 1);
    }
    for (const s of seeds) s.draw();

    /* Slowly regrow attached seeds (1 every ~1.5s) up to capacity. */
    const attachedCount = seeds.reduce((n, s) => n + (s.state === ATTACHED), 0);
    regrowAccum += dt;
    if (regrowAccum > 1.5 && attachedCount < 70) {
      regrowAccum = 0;
      seeds.push(new Seed());
    }

    if (!reduceMotion) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
