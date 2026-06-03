/* ============================================================
   Subtle Fuji/Yamanakako scene effects
   - single cherry blossom petals drifting down
   - lake ripples expanding on the right/lower half
   - a small watercolor-like swan swimming slowly
   ============================================================ */

const canvas = document.getElementById('effects');

if (canvas) {
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  let W = 0;
  let H = 0;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  resize();
  window.addEventListener('resize', resize);

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  class Petal {
    constructor(initial = false) {
      this.reset(initial);
    }

    reset(initial = false) {
      this.x = rand(W * 0.18, W + 80);
      this.y = initial ? rand(-40, H * 0.85) : rand(-120, -20);
      this.size = rand(7, 13);
      this.vy = rand(0.18, 0.42);
      this.vx = rand(-0.18, 0.08);
      this.angle = rand(0, Math.PI * 2);
      this.spin = rand(-0.012, 0.012);
      this.swayAmp = rand(14, 36);
      this.swayFreq = rand(0.0009, 0.0018);
      this.phase = rand(0, Math.PI * 2);
      this.alpha = rand(0.35, 0.72);
      this.tint = Math.random() < 0.7 ? '#f3aeba' : '#fff0ea';
      this.narrow = rand(0.72, 1.05);
      this.curve = rand(0.85, 1.2);
    }

    update(t) {
      this.x += this.vx + Math.sin(t * this.swayFreq + this.phase) * 0.18;
      this.y += this.vy;
      this.angle += this.spin + 0.004 * Math.sin(t * 0.0012 + this.phase);
      if (this.y > H + 40 || this.x < -80 || this.x > W + 120) this.reset(false);
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.scale(1, this.narrow);
      ctx.globalAlpha = this.alpha;

      const s = this.size;
      const g = ctx.createRadialGradient(0, s * 0.15, 0, 0, s * 0.15, s * 1.1);
      if (this.tint === '#f3aeba') {
        g.addColorStop(0, '#ffe2e7');
        g.addColorStop(0.7, '#f3aeba');
        g.addColorStop(1, '#e99cac');
      } else {
        g.addColorStop(0, '#fffaf6');
        g.addColorStop(0.75, '#fff0ea');
        g.addColorStop(1, '#f2d6cf');
      }
      ctx.fillStyle = g;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-s * 0.55, s * 0.20, -s * 0.52, s * 0.72 * this.curve, -s * 0.12, s * 1.05);
      ctx.bezierCurveTo(-s * 0.04, s * 0.92, s * 0.04, s * 0.92, s * 0.12, s * 1.05);
      ctx.bezierCurveTo(s * 0.52, s * 0.72 * this.curve, s * 0.55, s * 0.20, 0, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = this.tint === '#f3aeba' ? 'rgba(190, 88, 106, 0.16)' : 'rgba(180, 130, 120, 0.14)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.08);
      ctx.bezierCurveTo(-s * 0.04, s * 0.35, 0, s * 0.70, 0, s * 0.98);
      ctx.stroke();
      ctx.restore();
    }
  }

  class Ripple {
    constructor(x, y, maxR = rand(28, 82)) {
      this.x = x;
      this.y = y;
      this.r = 3;
      this.maxR = maxR;
      this.life = 0;
      this.maxLife = rand(2.8, 4.8);
    }

    update(dt) {
      this.life += dt;
      this.r = this.maxR * (this.life / this.maxLife);
      return this.life < this.maxLife;
    }

    draw(ctx) {
      const a = Math.max(0, 1 - this.life / this.maxLife);
      ctx.strokeStyle = `rgba(62, 116, 132, ${0.18 * a})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.r, this.r * 0.24, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const petals = Array.from({ length: 12 }, () => new Petal(true));
  const ripples = [];
  let rippleTimer = 0;

  function swanPosition(t) {
    const loop = (t * 0.000035) % 1;
    const x = W * 0.88 - loop * W * 0.34;
    const y = H * 0.70 + Math.sin(t * 0.0009) * 7;
    return { x, y, loop };
  }

  function drawSwan(t) {
    const { x, y, loop } = swanPosition(t);
    const dir = -1;
    const s = Math.max(0.55, Math.min(0.86, W / 1900));
    const bob = Math.sin(t * 0.002) * 1.6;

    ctx.save();
    ctx.translate(x, y + bob);
    ctx.scale(dir * s, s);
    ctx.globalAlpha = 0.78;

    ctx.fillStyle = 'rgba(255, 252, 246, 0.78)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 46, 16, -0.04, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 252, 246, 0.82)';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(28, -7);
    ctx.bezierCurveTo(34, -34, 54, -36, 50, -13);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 252, 246, 0.86)';
    ctx.beginPath();
    ctx.arc(50, -12, 6.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(198, 121, 55, 0.70)';
    ctx.beginPath();
    ctx.moveTo(56, -12);
    ctx.lineTo(68, -9);
    ctx.lineTo(56, -6);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(180, 150, 120, 0.18)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-24, -5);
    ctx.bezierCurveTo(-4, -14, 20, -12, 34, -4);
    ctx.stroke();

    ctx.restore();

    ctx.save();
    ctx.translate(x, y + 24 + bob * 0.5);
    ctx.scale(dir * s, -s * 0.35);
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = 'rgba(65, 106, 120, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 46, 16, -0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (loop > 0.02 && Math.random() < 0.018) {
      ripples.push(new Ripple(x + 35, y + 8, rand(35, 80)));
    }
  }

  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let last = performance.now();

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    ctx.clearRect(0, 0, W, H);

    for (const p of petals) {
      p.update(now);
      p.draw(ctx);
    }

    rippleTimer += dt;
    if (rippleTimer > 1.7) {
      rippleTimer = 0;
      ripples.push(new Ripple(rand(W * 0.54, W * 0.96), rand(H * 0.58, H * 0.84)));
    }

    for (let i = ripples.length - 1; i >= 0; i--) {
      if (!ripples[i].update(dt)) ripples.splice(i, 1);
    }
    for (const r of ripples) r.draw(ctx);

    drawSwan(now);

    if (!reduceMotion) requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}
