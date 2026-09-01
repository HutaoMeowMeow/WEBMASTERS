// Achievement Modal
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

// Particle System
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");
let particles = [];

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

class Particle {
  constructor() {
    this.reset();
  }
  reset() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 2 + 0.5;
    this.speedX = (Math.random() - 0.5) * 0.3;
    this.speedY = (Math.random() - 0.5) * 0.3;
    this.opacity = Math.random() * 0.5 + 0.1;
  }
  update() {
    this.x += this.speedX;
    this.y += this.speedY;
    if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
      this.reset();
    }
  }
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(77, 205, 255, ${this.opacity})`;
    ctx.fill();
  }
}

for (let i = 0; i < 50; i++) {
  particles.push(new Particle());
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();

// Scroll Reveal
const revealElements = document.querySelectorAll(".reveal");
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, { threshold: 0.1 });

revealElements.forEach(el => revealObserver.observe(el));

// Animated Counters
const counters = document.querySelectorAll(".stat-counter");
const visibleStatIds = new Set();
window.__statVisibleIds = visibleStatIds;
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

function animateStat(id) {
  const counter = document.getElementById(id);
  if (!counter) return;
  const target = parseInt(counter.getAttribute("data-target")) || 0;
  const duration = 2000;
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

counters.forEach(counter => counterObserver.observe(counter));

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});
