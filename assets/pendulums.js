/* ============================================================
   Pendulum waves
   - N small pendulums hanging from a horizontal rail near the
     top of the page. Lengths are tuned so that during a fixed
     loop period T_loop, pendulum k completes exactly (N0 + k)
     cycles. That makes the whole system synchronously realign
     every T_loop seconds while passing through snake, double
     wave, "chaos", quadruple wave, etc.
   - Each pendulum swings in a vertical plane; we draw the rod
     and bob in 2D, ignoring 3D depth — the classic demo is
     usually filmed from the side anyway.
   - The angle uses a small-amplitude assumption: θ(t) = A cos(ω t)
     with ω = 2π (N0 + k) / T_loop.
   - Rod length in *pixels* derived from ω so that the visible
     length difference matches the physics: ℓ = g / ω².
   - Color: warm amber palette so it sits inside the page's tone.
   ============================================================ */

const canvas = document.getElementById('pendulums');
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
  window.addEventListener('resize', () => { resize(); rebuild(); });

  /* ---------- Tuning ----------
     Picking N0 and T_loop sets the visual rhythm.
     - T_LOOP large = slower, more meditative (suggested 24-40s).
     - N0 controls cycle count of the SLOWEST pendulum during T_LOOP.
       A larger N0 means the pendulums look more similar in length;
       smaller N0 makes the right-most ones spin much faster. */
  const N        = 16;
  const N0       = 28;        /* slowest pendulum: 28 cycles in T_LOOP */
  const T_LOOP   = 32;        /* seconds for full realignment */
  const AMPLITUDE = 0.55;     /* radians (~31°) — small enough for the
                                 small-angle ≈ assumption to feel right */

  let railY = 0;              /* y of the suspension rail */
  let xs = [];                /* x of each pendulum's pivot */
  let lengths = [];           /* rod length in px */
  let bobR = 6;               /* bob radius */

  function rebuild() {
    /* Place rail along the top, well above the page content area.
       Page content has a max-width of 56rem and starts at 48px top
       padding; we keep the rail in the upper ~22% of the viewport. */
    railY = Math.max(60, Math.min(H * 0.18, 160));

    /* Distribute pivots horizontally over the full viewport; the
       longest rod must still fit above the bottom edge (and below
       the rail), so cap the maximum length. */
    const margin = Math.max(40, W * 0.05);
    const usableW = Math.max(W - 2 * margin, 1);
    xs = [];
    for (let k = 0; k < N; k++) {
      xs.push(margin + (usableW * k) / (N - 1));
    }

    /* Convert "k-th pendulum has angular freq ω_k = 2π(N0+k)/T_LOOP"
       into a screen-space length using ℓ = g / ω², then rescale so
       the longest rod fits comfortably in the available height. */
    const g = 9.81;
    const omegas = Array.from({ length: N }, (_, k) =>
      (2 * Math.PI * (N0 + k)) / T_LOOP
    );
    const physLen = omegas.map((w) => g / (w * w));   /* metres-ish */

    const maxAvail = H - railY - 80;                  /* px below rail */
    const longest = physLen[0];
    const shortest = physLen[N - 1];
    /* Map physical length range → [shortest_screen_px, maxAvail].
       We want shortest_screen_px to still be visibly a pendulum, not
       a stub, so floor it. */
    const minScreen = Math.max(60, maxAvail * 0.45);
    const maxScreen = maxAvail;
    lengths = physLen.map((L) => {
      const t = (L - shortest) / (longest - shortest);  /* 0..1 */
      return minScreen + t * (maxScreen - minScreen);
    });

    bobR = Math.max(4, Math.min(8, W / 200));
  }
  rebuild();

  /* Warm amber gradient across the row, from dark amber on the left
     to lighter golden on the right — keeps each bob distinguishable
     without screaming. */
  function bobColor(k) {
    const t = k / (N - 1);
    /* HSL: 18° (red-orange) → 38° (amber) */
    const h = 18 + 20 * t;
    const s = 70;
    const l = 38 + 14 * t;
    return `hsl(${h.toFixed(0)}, ${s}%, ${l}%)`;
  }
  function rodColor() { return 'rgba(140, 90, 40, 0.45)'; }

  const reduceMotion = window.matchMedia &&
                       window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function drawRail() {
    ctx.strokeStyle = 'rgba(120, 80, 40, 0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(0, railY);
    ctx.lineTo(W, railY);
    ctx.stroke();
    /* Tiny knot at each pivot. */
    ctx.fillStyle = 'rgba(120, 80, 40, 0.7)';
    for (const x of xs) {
      ctx.beginPath();
      ctx.arc(x, railY, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(now) {
    const t = now / 1000;
    ctx.clearRect(0, 0, W, H);
    drawRail();

    /* Rods first, then bobs on top. */
    ctx.lineCap = 'round';
    for (let k = 0; k < N; k++) {
      const omega = (2 * Math.PI * (N0 + k)) / T_LOOP;
      const theta = AMPLITUDE * Math.cos(omega * t);
      const px = xs[k];
      const py = railY;
      const bx = px + lengths[k] * Math.sin(theta);
      const by = py + lengths[k] * Math.cos(theta);

      ctx.strokeStyle = rodColor();
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(bx, by);
      ctx.stroke();

      ctx.fillStyle = bobColor(k);
      ctx.beginPath();
      ctx.arc(bx, by, bobR, 0, Math.PI * 2);
      ctx.fill();
      /* Tiny highlight to give the bob a hint of weight. */
      ctx.fillStyle = 'rgba(255, 240, 210, 0.6)';
      ctx.beginPath();
      ctx.arc(bx - bobR * 0.35, by - bobR * 0.35, bobR * 0.30, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!reduceMotion) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
