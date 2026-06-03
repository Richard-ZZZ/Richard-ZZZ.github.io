/* ============================================================
   Fuji/Yamanakako scene effects
   - single cherry blossom petals drift down
   - petals create small ripples when they touch the lake
   - watercolor swan sprite swims slowly across the lake
   ============================================================ */

const canvas = document.getElementById('effects');

if (canvas) {
  const ctx = canvas.getContext('2d');
  const DPR = Math.min(2, window.devicePixelRatio || 1);
  const swanImg = new Image();
  swanImg.src = '/assets/img/swan-sprite.png';

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

  function lakeY(x) {
    return H * 0.78 + Math.sin(x * 0.006) * 4;
  }

  class Petal {
    constructor(initial = false) {
      this.reset(initial);
    }

    reset(initial = false) {
      this.x = rand(W * 0.08, W + 90);
      this.y = initial ? rand(-40, H * 0.55) : rand(-140, -20);
      this.size = rand(7, 12);
      this.vy = rand(0.18, 0.38);
      this.vx = rand(-0.20, 0.08);
      this.angle = rand(0, Math.PI * 2);
      this.spin = rand(-0.011, 0.011);
      this.swayAmp = rand(14, 38);
      this.swayFreq = rand(0.0009, 0.0017);
      this.phase = rand(0, Math.PI * 2);
      this.alpha = rand(0.34, 0.66);
      this.tint = Math.random() < 0.72 ? '#f3aeba' : '#fff0ea';
      this.narrow = rand(0.72, 1.08);
      this.curve = rand(0.86, 1.22);
    }

    update(t) {
      this.x += this.vx + Math.sin(t * this.swayFreq + this.phase) * 0.18;
      this.y += this.vy;
      this.angle += this.spin + 0.004 * Math.sin(t * 0.0012 + this.phase);

      const waterLine = lakeY(this.x);
      if (this.y >= waterLine && this.x > W * 0.12 && this.x < W + 40) {
        ripples.push(new Ripple(this.x, waterLine + rand(-2, 3), rand(20, 55), 0.16));
        this.reset(false);
        return;
      }

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
    constructor(x, y, maxR = rand(28, 82), alpha = 0.18) {
      this.x = x;
      this.y = y;
      this.r = 3;
      this.maxR = maxR;
      this.life = 0;
      this.maxLife = rand(2.6, 4.4);
      this.alpha = alpha;
    }

    update(dt) {
      this.life += dt;
      this.r = this.maxR * (this.life / this.maxLife);
      return this.life < this.maxLife;
    }

    draw(ctx) {
      const a = Math.max(0, 1 - this.life / this.maxLife);
      ctx.strokeStyle = `rgba(62, 116, 132, ${this.alpha * a})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(this.x, this.y, this.r, this.r * 0.23, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  const petals = Array.from({ length: 14 }, () => new Petal(true));
  const ripples = [];
  let rippleTimer = 0;

  function swanPosition(t) {
    const loop = (t * 0.000026) % 1;
    return {
      x: W * 0.76 - loop * W * 0.26,
      y: H * 0.84 + Math.sin(t * 0.0008) * 1.5,
    };
  }

  function drawSwan(t) {
    if (!swanImg.complete || swanImg.naturalWidth === 0) return;

    const { x, y } = swanPosition(t);
    const width = Math.max(32, Math.min(52, W * 0.034));
    const height = width * (swanImg.naturalHeight / swanImg.naturalWidth);
    const bob = Math.sin(t * 0.0018) * 0.8;

    ctx.save();
    ctx.globalAlpha = 0.52;
    ctx.drawImage(swanImg, x - width / 2, y - height * 0.84 + bob, width, height);
    ctx.restore();

    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.translate(x, y + height * 0.10 + bob * 0.3);
    ctx.scale(1, -0.28);
    ctx.drawImage(swanImg, -width / 2, -height * 0.15, width, height);
    ctx.restore();

    if (Math.random() < 0.012) {
      ripples.push(new Ripple(x + width * 0.25, y + 2, rand(24, 58), 0.18));
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
    if (rippleTimer > 1.9) {
      rippleTimer = 0;
      ripples.push(new Ripple(rand(W * 0.38, W * 0.96), rand(H * 0.76, H * 0.90), rand(44, 112), 0.18));
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
