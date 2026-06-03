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
      this.color = Math.random() < 0.6 ? '#FFB7C5' : '#FFF5F0';
      this.life = 0;

      // Per-flower randomness for natural variation
      this.petalCount = Math.floor(4 + Math.random() * 3);  // 4-6 petals
      this.petalAngles = [];  // irregular spacing
      let angleSum = 0;
      for (let i = 0; i < this.petalCount; i++) {
        const irregularity = 0.7 + Math.random() * 0.6;  // 0.7x to 1.3x normal spacing
        this.petalAngles.push(angleSum);
        angleSum += (Math.PI * 2 / this.petalCount) * irregularity;
      }
      // Normalize so they wrap around 2π
      const scale = (Math.PI * 2) / angleSum;
      this.petalAngles = this.petalAngles.map(a => a * scale);

      this.petalSizes = [];  // each petal slightly different
      for (let i = 0; i < this.petalCount; i++) {
        this.petalSizes.push({
          length: 0.85 + Math.random() * 0.3,  // 85%-115% of base
          width: 0.75 + Math.random() * 0.35,  // 75%-110% of base
        });
      }
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

      // Draw petals with natural variation
      for (let i = 0; i < this.petalCount; i++) {
        const angle = this.petalAngles[i] - Math.PI / 2;
        const petalLength = this.size * this.petalSizes[i].length;
        const petalWidth = this.size * 0.85 * this.petalSizes[i].width;

        ctx.save();
        ctx.rotate(angle);

        // Petal with bezier curve (heart-shaped with notch at tip)
        const gradient = ctx.createRadialGradient(0, petalLength * 0.3, 0, 0, petalLength * 0.3, petalLength);
        if (this.color === '#FFB7C5') {
          gradient.addColorStop(0, '#FFD7E0');
          gradient.addColorStop(0.6, '#FFB7C5');
          gradient.addColorStop(1, '#FFa0b5');
        } else {
          gradient.addColorStop(0, '#FFFFFF');
          gradient.addColorStop(0.6, '#FFF5F0');
          gradient.addColorStop(1, '#FFE8DC');
        }
        ctx.fillStyle = gradient;

        ctx.beginPath();
        ctx.moveTo(0, 0);

        // Left side of petal - curves outward then inward
        ctx.bezierCurveTo(
          -petalWidth * 0.35, petalLength * 0.2,
          -petalWidth * 0.45, petalLength * 0.5,
          -petalWidth * 0.15, petalLength * 0.85
        );

        // Left side of notch
        ctx.bezierCurveTo(
          -petalWidth * 0.08, petalLength * 0.92,
          -petalWidth * 0.02, petalLength * 0.98,
          0, petalLength
        );

        // Right side of notch
        ctx.bezierCurveTo(
          petalWidth * 0.02, petalLength * 0.98,
          petalWidth * 0.08, petalLength * 0.92,
          petalWidth * 0.15, petalLength * 0.85
        );

        // Right side of petal - mirror of left
        ctx.bezierCurveTo(
          petalWidth * 0.45, petalLength * 0.5,
          petalWidth * 0.35, petalLength * 0.2,
          0, 0
        );

        ctx.closePath();
        ctx.fill();

        // Add subtle vein in center of petal
        ctx.strokeStyle = this.color === '#FFB7C5' ? 'rgba(255, 160, 181, 0.3)' : 'rgba(255, 232, 220, 0.4)';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(0, petalLength * 0.1);
        ctx.bezierCurveTo(
          0, petalLength * 0.4,
          0, petalLength * 0.7,
          0, petalLength * 0.92
        );
        ctx.stroke();

        ctx.restore();
      }

      // Center stamen (pistil + stamens)
      const centerGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 0.25);
      centerGrad.addColorStop(0, '#FFF9E6');
      centerGrad.addColorStop(0.6, '#FFE5B4');
      centerGrad.addColorStop(1, '#FFD98E');
      ctx.fillStyle = centerGrad;
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Tiny stamens around center (count matches petal count)
      ctx.fillStyle = '#E6C68A';
      const stamenCount = this.petalCount + 2;
      for (let i = 0; i < stamenCount; i++) {
        const a = (i / stamenCount) * Math.PI * 2 + Math.random() * 0.2;
        const r = this.size * (0.22 + Math.random() * 0.05);
        ctx.beginPath();
        ctx.arc(Math.cos(a) * r, Math.sin(a) * r, this.size * 0.035, 0, Math.PI * 2);
        ctx.fill();
      }

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
