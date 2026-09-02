// ===== Shared UI =====
const mobileMenuBtn = document.getElementById("mobile-menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
if (mobileMenuBtn && mobileMenu) {
  mobileMenuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("open");
    mobileMenu.classList.toggle("hidden");
  });
  document.querySelectorAll("#mobile-menu a").forEach(link => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("open");
      mobileMenu.classList.add("hidden");
    });
  });
}

// ===== Achievement Modal =====
const achievementModal = document.getElementById("achievement-modal");
const achievementModalClose = document.getElementById("achievement-modal-close");
const achievementModalBody = document.getElementById("achievement-modal-body");

if (achievementModal && achievementModalClose && achievementModalBody) {
  document.addEventListener("click", (e) => {
    const card = e.target.closest(".achievement-card");
    if (!card) return;
    const title = card.querySelector(".font-display")?.textContent || "";
    const year = card.querySelector(".font-body.text-xs")?.textContent || "";
    const img = card.querySelector("img");
    const imgSrc = img ? img.src : "";
    achievementModalBody.innerHTML = `
      ${imgSrc ? `<img src="${imgSrc}" alt="${title}" class="w-full aspect-video object-contain bg-black/20 mb-4">` : ""}
      <h3 class="font-display text-2xl text-white mb-2">${title}</h3>
      <p class="font-body text-sm text-[color:var(--chrome)]">${year}</p>
    `;
    achievementModal.classList.add("active");
    document.body.style.overflow = "hidden";
  });

  achievementModalClose.addEventListener("click", closeAchievementModal);
  achievementModal.addEventListener("click", (e) => {
    if (e.target === achievementModal) closeAchievementModal();
  });

  function closeAchievementModal() {
    achievementModal.classList.remove("active");
    document.body.style.overflow = "";
  }
}

// ===== Particle System =====
const canvas = document.getElementById("particles");
let ctx, particles = [], W = 0, H = 0;
let mouse = { x: null, y: null, r: 80 };

function initParticles() {
  if (!canvas) return;
  ctx = canvas.getContext("2d");
  resizeCanvas();
  for (let i = 0; i < 55; i++) particles.push(new Particle());
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.addEventListener("mouseleave", () => { mouse.x = null; mouse.y = null; });
  animateParticles();
}

function resizeCanvas() {
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;
}

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.size = Math.random() * 1.6 + 0.4;
    this.speedX = (Math.random() - 0.5) * 0.26;
    this.speedY = (Math.random() - 0.5) * 0.26;
    this.opacity = Math.random() * 0.45 + 0.1;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(77, 205, 255, ${this.opacity})`;
    ctx.fill();
  }
}

function connectLines() {
  for (let a = 0; a < particles.length; a++) {
    for (let b = a + 1; b < particles.length; b++) {
      const dx = particles[a].x - particles[b].x;
      const dy = particles[a].y - particles[b].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 110) {
        const o = Math.min(0.85, 1 - dist / 110) * 0.18;
        ctx.strokeStyle = `rgba(77, 205, 255, ${o})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(particles[a].x, particles[a].y);
        ctx.lineTo(particles[b].x, particles[b].y);
        ctx.stroke();
      }
    }
    if (mouse.x !== null) {
      const dx = particles[a].x - mouse.x;
      const dy = particles[a].y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < mouse.r) {
        const o = (1 - dist / mouse.r) * 0.28;
        ctx.strokeStyle = `rgba(77, 205, 255, ${o})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(particles[a].x, particles[a].y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }
  }
}

function animateParticles() {
  if (!ctx) return;
  ctx.clearRect(0, 0, W, H);
  particles.forEach(p => { p.update(); p.draw(); });
  connectLines();
  requestAnimationFrame(animateParticles);
}

// ===== Scroll Reveal =====
const revealObserver = ("IntersectionObserver" in window)
  ? new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 })
  : null;

function observeReveals(root) {
  if (!revealObserver) {
    (root || document).querySelectorAll(".reveal").forEach(el => el.classList.add("visible"));
    return;
  }
  (root || document).querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));
}
window.__observeReveals = observeReveals;

observeReveals();

// ===== Animated Counters =====
const counters = document.querySelectorAll(".stat-counter");
const visibleStatIds = new Set();
window.__statVisibleIds = visibleStatIds;
if ("IntersectionObserver" in window) {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const counter = entry.target;
      const id = counter.id;
      if (entry.isIntersecting) {
        visibleStatIds.add(id);
        animateStat(id);
      } else {
        visibleStatIds.delete(id);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(counter => counterObserver.observe(counter));
}

function animateStat(id) {
  const counter = document.getElementById(id);
  if (!counter) return;
  const target = parseInt(counter.getAttribute("data-target")) || 0;
  const duration = 1800;
  const start = performance.now();
  function updateCounter(currentTime) {
    const elapsed = currentTime - start;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    counter.textContent = Math.floor(easeOut * target);
    if (progress < 1) {
      requestAnimationFrame(updateCounter);
    } else {
      counter.textContent = target;
    }
  }
  requestAnimationFrame(updateCounter);
}
window.__animateStat = animateStat;

// ===== Smooth scroll for anchor links =====
document.addEventListener("click", function (e) {
  const anchor = e.target.closest('a[href^="#"]');
  if (!anchor) return;
  const target = document.querySelector(anchor.getAttribute("href"));
  if (!target) return;
  e.preventDefault();
  target.scrollIntoView({ behavior: "smooth", block: "start" });
});

initParticles();
