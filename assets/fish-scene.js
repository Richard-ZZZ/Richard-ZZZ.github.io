/* ============================================================
   Cherry blossom petals falling
   - Petals spawn from top, drift down with gentle rotation
   - Each petal has its own sway pattern (wind simulation)
   - Soft pink and cream tones
   ============================================================ */

const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const lerp  = (a, b, t) => a + (b - a) * t;

const canvasFish  = document.getElementById('fish');
if (!canvasFish) {
  console.info('petal canvas not found, skipping animation');
} else {
  const ctx = canvasFish.getContext('2d');
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  function resizeCanvas() {
    const { innerWidth: w, innerHeight: h } = window;
    canvasFish.width  = Math.floor(w * DPR);
    canvasFish.height = Math.floor(h * DPR);
    canvasFish.style.width  = w + 'px';
    canvasFish.style.height = h + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  /* ---------- Cherry blossom petal ---------- */
  class Petal {
    constructor() {
      this.respawn();
    }

    respawn() {
      this.x = Math.random() * window.innerWidth;
      this.y = -20;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = 0.4 + Math.random() * 0.6;
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.04;
      this.size = 8 + Math.random() * 6;
      this.swayAmp = 15 + Math.random() * 20;
      this.swayFreq = 0.001 + Math.random() * 0.002;
      this.swayPhase = Math.random() * Math.PI * 2;
      this.opacity = 0.6 + Math.random() * 0.4;
      this.color = Math.random() < 0.6 ? '#FFB7C5' : '#FFF5F0';  // soft pink or cream
      this.life = 0;
    }

    update(t) {
      this.life++;
      const sway = Math.sin(t * this.swayFreq + this.swayPhase) * this.swayAmp;
      this.x += this.vx + sway * 0.01;
      this.y += this.vy;
      this.rotation += this.rotationSpeed;

      if (this.y > window.innerHeight + 20 || this.x < -50 || this.x > window.innerWidth + 50) {
        this.respawn();
      }
    }

    draw(ctx) {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.globalAlpha = this.opacity;

      // Draw 5-petal cherry blossom
      ctx.fillStyle = this.color;
      for (let i = 0; i < 5; i++) {
        const angle = (i * Math.PI * 2) / 5;
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.ellipse(this.size * 0.4, 0, this.size * 0.4, this.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Center dot
      ctx.fillStyle = '#FFE5CC';
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.15, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }

  const petals = [];
  function spawnPetals() {
    petals.length = 0;
    const count = Math.min(25, Math.floor((window.innerWidth * window.innerHeight) / 30000));
    for (let i = 0; i < count; i++) {
      const p = new Petal();
      p.y = Math.random() * window.innerHeight;  // initial spread
      p.life = Math.random() * 1000;
      petals.push(p);
    }
  }
  spawnPetals();
  window.addEventListener('resize', spawnPetals);

  const reduceMotion = window.matchMedia &&
                       window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let last = performance.now();
  function frame(now) {
    last = now;
    ctx.clearRect(0, 0, canvasFish.width, canvasFish.height);
    for (const p of petals) {
      p.update(now);
      p.draw(ctx);
    }
    if (!reduceMotion) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
