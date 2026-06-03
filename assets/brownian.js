/* ============================================================
   Brownian sample paths
   - Each path = a particle integrating  dX = μ dt + σ dW
     where μ is a slow time-varying drift and dW is gaussian.
   - Head: bright amber dot. Trail: stored points, drawn as a
     polyline whose alpha falls off linearly toward the tail.
   - Particles spawn from a screen edge, live for ~12-22s, then
     fade out before being reclaimed.
   - Population kept around N; new spawns staggered so the page
     never feels empty or busy.
   ============================================================ */

const canvas = document.getElementById('brownian');
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
  window.addEventListener('resize', resize);

  /* ---------- Gaussian sampler (Box-Muller) ---------- */
  function gauss() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /* ---------- Path ---------- */
  const TRAIL_MAX = 220;       /* max points kept */
  const SIGMA = 0.85;          /* noise scale (px / sqrt(frame)) */
  const DRIFT_SPEED = 0.55;    /* base drift speed (px / frame) */
  const FADE_IN  = 1.2;        /* seconds */
  const FADE_OUT = 1.8;        /* seconds */

  class Path {
    constructor() { this.respawn(); }

    respawn() {
      /* Pick an edge to enter from; aim drift roughly inward + along it. */
      const edge = Math.floor(Math.random() * 4);
      const t = Math.random();
      let x, y, hx, hy;
      const inset = 30;
      if (edge === 0) {                 /* top → drift down-ish */
        x = t * W; y = -inset; hx = (Math.random() - 0.5) * 0.6; hy = 1;
      } else if (edge === 1) {          /* right → drift left-ish */
        x = W + inset; y = t * H; hx = -1; hy = (Math.random() - 0.5) * 0.6;
      } else if (edge === 2) {          /* bottom → drift up-ish */
        x = t * W; y = H + inset; hx = (Math.random() - 0.5) * 0.6; hy = -1;
      } else {                          /* left → drift right-ish */
        x = -inset; y = t * H; hx = 1; hy = (Math.random() - 0.5) * 0.6;
      }
      const hl = Math.hypot(hx, hy) || 1;
      this.driftX = hx / hl;
      this.driftY = hy / hl;
      /* Slow rotation of the drift direction so the path curves naturally. */
      this.driftOmega = (Math.random() - 0.5) * 0.0015;
      this.driftPhase = Math.random() * Math.PI * 2;

      this.x = x; this.y = y;
      this.trail = [{ x, y }];
      this.age = 0;
      this.life = 12 + Math.random() * 10;     /* seconds */
      this.speed = DRIFT_SPEED * (0.7 + Math.random() * 0.6);
      this.sigma = SIGMA * (0.7 + Math.random() * 0.7);
      this.thickness = 0.9 + Math.random() * 0.7;
      this.dead = false;
    }

    step(dt) {
      this.age += dt;

      /* Drift direction rotates slowly so the trail curves. */
      const ang = Math.atan2(this.driftY, this.driftX) +
                  this.driftOmega * this.age * 60;
      const dx = Math.cos(ang);
      const dy = Math.sin(ang);

      this.x += dx * this.speed + gauss() * this.sigma;
      this.y += dy * this.speed + gauss() * this.sigma;

      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > TRAIL_MAX) this.trail.shift();

      /* Die when fully off-screen (with margin) or end of life. */
      const m = 60;
      const off = this.x < -m || this.x > W + m || this.y < -m || this.y > H + m;
      if (off || this.age > this.life) this.dead = true;
    }

    /* Envelope: fade in early, fade out near end of life. */
    envelope() {
      const fIn  = Math.min(1, this.age / FADE_IN);
      const tLeft = this.life - this.age;
      const fOut = Math.min(1, Math.max(0, tLeft / FADE_OUT));
      return Math.min(fIn, fOut);
    }

    draw() {
      const env = this.envelope();
      if (env <= 0 || this.trail.length < 2) return;

      /* Polyline with per-segment alpha (faint at tail, brighter at head). */
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const N = this.trail.length;
      for (let i = 1; i < N; i++) {
        const a = this.trail[i - 1], b = this.trail[i];
        const tNorm = i / (N - 1);                /* 0 = oldest, 1 = head */
        const alpha = 0.55 * env * tNorm;
        ctx.strokeStyle = `rgba(180, 83, 9, ${alpha.toFixed(3)})`;
        ctx.lineWidth = this.thickness * (0.5 + tNorm * 0.7);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      /* Head: bright amber dot + soft halo. */
      const h = this.trail[N - 1];
      ctx.fillStyle = `rgba(180, 83, 9, ${(0.85 * env).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(h.x, h.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(252, 211, 77, ${(0.25 * env).toFixed(3)})`;
      ctx.beginPath();
      ctx.arc(h.x, h.y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* ---------- Population control ---------- */
  function targetCount() {
    /* Scale gently with viewport area; clamp so it never gets busy. */
    return Math.round(Math.max(4, Math.min(9, (W * H) / 240000)));
  }

  const paths = [];
  /* Seed initial paths so the page isn't empty on load. */
  for (let i = 0; i < targetCount(); i++) {
    const p = new Path();
    /* Stagger: pretend they started at random ages in their life. */
    p.age = Math.random() * Math.min(p.life - FADE_OUT, 6);
    /* Pre-roll the trail a bit. */
    const preroll = 60 + Math.floor(Math.random() * 80);
    for (let k = 0; k < preroll; k++) p.step(1 / 60);
    paths.push(p);
  }

  const reduceMotion = window.matchMedia &&
                       window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    /* Step + cull. */
    for (let i = paths.length - 1; i >= 0; i--) {
      paths[i].step(dt);
      if (paths[i].dead) paths.splice(i, 1);
    }
    /* Top up to target with slight randomness so they don't all spawn together. */
    const want = targetCount();
    while (paths.length < want && Math.random() < 0.08) {
      paths.push(new Path());
    }

    ctx.clearRect(0, 0, W, H);
    for (const p of paths) p.draw();

    if (!reduceMotion) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
