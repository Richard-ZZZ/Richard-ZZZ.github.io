/* ============================================================
   Aurora — soft warm light bands drifting along the bottom.
   - Several bands stacked at slightly different heights, each
     with its own crest profile (sum of a few sines, irrational
     frequencies) so the silhouette never repeats.
   - Each band is rendered as a vertical gradient (hot near the
     top edge of the band, transparent at the page top), drawn
     with `lighter` composite so overlaps glow rather than smudge.
   - Color drifts through a small palette of warm hues over
     minutes, so the page feels alive without ever flashing.
   ============================================================ */

const canvas = document.getElementById('aurora');
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

  /* ---------- Bands ----------
     Each band has:
       baseY  : center line as fraction of H (0 = top, 1 = bottom)
       reach  : how far up the glow extends, fraction of H
       waves  : list of { amp, freq, phase, speed } sines stacked to
                shape the crest
       hue    : the band's primary warm hue
       alpha  : peak opacity of the band's gradient
       vshift : per-band slow vertical drift speed (tiny) */
  const BANDS = [
    {
      baseY: 0.94, reach: 0.55, hueA: 28,  hueB: 18,  alpha: 0.42,
      waves: [
        { amp: 90,  freq: 0.0018, phase: 0.4, speed: 0.000040 },
        { amp: 38,  freq: 0.0042, phase: 1.7, speed: 0.000070 },
        { amp: 18,  freq: 0.0085, phase: 3.1, speed: 0.000120 },
      ],
      vshift: { amp: 14, speed: 0.000050, phase: 0.2 },
    },
    {
      baseY: 0.86, reach: 0.45, hueA: 38,  hueB: 24,  alpha: 0.30,
      waves: [
        { amp: 70,  freq: 0.0021, phase: 2.2, speed: 0.000055 },
        { amp: 30,  freq: 0.0050, phase: 0.9, speed: 0.000090 },
        { amp: 14,  freq: 0.0098, phase: 2.6, speed: 0.000150 },
      ],
      vshift: { amp: 10, speed: 0.000038, phase: 1.9 },
    },
    {
      baseY: 0.78, reach: 0.36, hueA: 14,  hueB: 350, alpha: 0.22,
      waves: [
        { amp: 110, freq: 0.0014, phase: 4.1, speed: 0.000028 },
        { amp: 28,  freq: 0.0060, phase: 5.8, speed: 0.000080 },
        { amp: 12,  freq: 0.0110, phase: 1.0, speed: 0.000140 },
      ],
      vshift: { amp: 18, speed: 0.000022, phase: 3.4 },
    },
  ];

  /* y(x, t) for a band: vertical position of the band's crest. */
  function crestY(b, x, t) {
    let y = b.baseY * H;
    for (const w of b.waves) {
      y += w.amp * Math.sin(w.freq * x + w.phase + w.speed * t);
    }
    y += b.vshift.amp * Math.sin(b.vshift.speed * t + b.vshift.phase);
    return y;
  }

  /* Slow hue drift in [0,1], used to interpolate hueA ↔ hueB. */
  function hueMix(t, b, i) {
    return 0.5 + 0.5 * Math.sin(t * 0.000035 + i * 1.7);
  }

  function drawBand(b, i, t) {
    /* Sample the crest along x; we'll close the path along the bottom. */
    const STEP = 6;                       /* px between samples */
    const cols = Math.ceil(W / STEP) + 1;

    /* Build the upper edge of the band. */
    ctx.beginPath();
    let firstX = 0, firstY = crestY(b, 0, t);
    ctx.moveTo(firstX, firstY);
    for (let k = 1; k < cols; k++) {
      const x = k * STEP;
      ctx.lineTo(x, crestY(b, x, t));
    }
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();

    /* Fill with a vertical gradient that fades toward the band crest
       (so the brightest line sits along the silhouette, then bleeds
       upward into nothing and downward into the page bottom). */
    const topY = b.baseY * H - b.reach * H;
    const grad = ctx.createLinearGradient(0, topY, 0, H);
    const mix = hueMix(t, b, i);
    const hue = b.hueA * (1 - mix) + b.hueB * mix;

    /* Stops:
         0.00 : transparent      (top of glow)
         0.55 : peak warm color  (just below crest)
         0.80 : softer, deeper warm
         1.00 : near-transparent (page bottom; lets bg show through) */
    grad.addColorStop(0.00, `hsla(${hue}, 80%, 65%, 0)`);
    grad.addColorStop(0.45, `hsla(${hue}, 85%, 62%, ${b.alpha * 0.55})`);
    grad.addColorStop(0.62, `hsla(${hue}, 80%, 55%, ${b.alpha})`);
    grad.addColorStop(0.85, `hsla(${hue + 8}, 70%, 45%, ${b.alpha * 0.35})`);
    grad.addColorStop(1.00, `hsla(${hue + 8}, 60%, 40%, 0)`);

    ctx.fillStyle = grad;
    ctx.fill();
  }

  /* A faint horizon glow that always sits at the very bottom — keeps
     the page feeling grounded even when bands drift up. */
  function drawHorizon(t) {
    const grad = ctx.createLinearGradient(0, H * 0.7, 0, H);
    const breathe = 0.5 + 0.5 * Math.sin(t * 0.00006);
    const a = 0.10 + 0.05 * breathe;
    grad.addColorStop(0,   'hsla(30, 80%, 60%, 0)');
    grad.addColorStop(0.7, `hsla(28, 75%, 55%, ${a * 0.6})`);
    grad.addColorStop(1,   `hsla(20, 70%, 45%, ${a})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, H * 0.7, W, H * 0.3);
  }

  const reduceMotion = window.matchMedia &&
                       window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function frame(now) {
    ctx.clearRect(0, 0, W, H);

    drawHorizon(now);

    /* Additive blending so overlapping bands brighten naturally. */
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < BANDS.length; i++) drawBand(BANDS[i], i, now);
    ctx.globalCompositeOperation = 'source-over';

    if (!reduceMotion) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
