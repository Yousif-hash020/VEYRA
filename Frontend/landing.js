/* ============================================================================
   VEYRA — Landing JS v4
   Lenis smooth scroll + GSAP ScrollTrigger animations
   No stacking · Clean element reveals · Page transition · Nav pill
   ============================================================================ */

'use strict';

/* ═══════════════════════════════════════════════════════════════════
   1. LENIS SMOOTH SCROLL + GSAP SYNC
═══════════════════════════════════════════════════════════════════ */
function initLenis() {
  const lenis = new Lenis({
    duration:   1.3,
    easing:     (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    direction:  'vertical',
    smooth:     true,
    smoothTouch: false,
  });

  // Sync Lenis scroll position with GSAP ScrollTrigger
  lenis.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // Expose lenis globally for anchor scrolling
  window._lenis = lenis;

  return lenis;
}

/* ═══════════════════════════════════════════════════════════════════
   2. PAGE TRANSITION — fade in on load, fade out on exit
═══════════════════════════════════════════════════════════════════ */
function initPageTransition() {
  // On load — fade the overlay out
  gsap.to('#page-transition', {
    opacity:  0,
    y:       -10,
    duration: 0.65,
    ease:    'power2.out',
    delay:    0.1,
    onComplete() {
      document.getElementById('page-transition').style.pointerEvents = 'none';
    },
  });

  // Intercept outbound link clicks for smooth exit
  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    // Skip anchor-only links and external
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('//')) return;

    link.addEventListener('click', (e) => {
      e.preventDefault();
      const destination = link.href;
      const overlay     = document.getElementById('page-transition');
      overlay.style.pointerEvents = 'all';

      gsap.to(overlay, {
        opacity:  1,
        y:        0,
        duration: 0.3,
        ease:    'power2.in',
        onComplete() {
          window.location.href = destination;
        },
      });
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   3. HERO — GSAP entrance on load (staggered)
═══════════════════════════════════════════════════════════════════ */
function initHeroAnimations() {
  const tl = gsap.timeline({ delay: 0.55 }); // after overlay fade

  tl.from('#h-eyebrow', { opacity: 0, y: 18, duration: 0.6, ease: 'power3.out' })
    .from('.hl-row',    { opacity: 0, y: 32, duration: 0.7, ease: 'power3.out', stagger: 0.08 }, '-=0.3')
    .from('#h-sub',     { opacity: 0, y: 18, duration: 0.6, ease: 'power3.out' }, '-=0.35')
    .from('#h-search',  { opacity: 0, y: 16, duration: 0.55, ease: 'power3.out' }, '-=0.3')
    .from('#h-chips',   { opacity: 0, y: 12, duration: 0.5, ease: 'power3.out' }, '-=0.25')
    .from('#h-visual',  { opacity: 0, scale: 0.9, x: 20, duration: 0.85, ease: 'power3.out' }, '-=0.9')
    .from('#scroll-cue',{ opacity: 0, y: 8,  duration: 0.5, ease: 'power2.out' }, '-=0.1');
}

/* ═══════════════════════════════════════════════════════════════════
   4. SCROLL-TRIGGER GSAP ANIMATIONS
   Elements with data-gsap="..." animate when scrolled into view.
   Types: fade-up  fade-left  fade-right  scale-in  slide-up
═══════════════════════════════════════════════════════════════════ */
function getAnimProps(type) {
  switch (type) {
    case 'fade-up':    return { opacity: 0, y: 36 };
    case 'fade-left':  return { opacity: 0, x: -36 };
    case 'fade-right': return { opacity: 0, x:  36 };
    case 'scale-in':   return { opacity: 0, scale: 0.88, y: 20 };
    case 'slide-up':   return { opacity: 0, y: 48, scale: 0.96 };
    default:           return { opacity: 0, y: 28 };
  }
}

function initScrollAnimations() {
  const els = document.querySelectorAll('[data-gsap]');

  els.forEach((el) => {
    const type  = el.getAttribute('data-gsap') || 'fade-up';
    const delay = parseFloat(el.getAttribute('data-gsap-delay') || 0);
    const from  = getAnimProps(type);

    gsap.from(el, {
      ...from,
      duration: 0.75,
      delay,
      ease:     'power3.out',
      scrollTrigger: {
        trigger:  el,
        start:    'top 85%',
        toggleActions: 'play none none none',
      },
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   5. ANIMATED NUMBER COUNTERS (hero ring + stats section)
═══════════════════════════════════════════════════════════════════ */
function animateNum(el, target, duration = 1600) {
  const isDecimal = el.classList.contains('stat-dec');
  const start     = performance.now();

  (function tick(now) {
    const t   = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = isDecimal
      ? (ease * target / 10).toFixed(1)
      : Math.round(ease * target);
    if (t < 1) requestAnimationFrame(tick);
  })(start);
}

function initCounters() {
  document.querySelectorAll('[data-target]').forEach((el) => {
    ScrollTrigger.create({
      trigger: el,
      start:   'top 80%',
      once:    true,
      onEnter: () => animateNum(el, +el.getAttribute('data-target')),
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   6. FLOATING PILL NAV — sliding indicator
═══════════════════════════════════════════════════════════════════ */
function initNavPill() {
  const pill = document.getElementById('nav-pill');
  const ind  = document.getElementById('nav-indicator');
  if (!pill || !ind) return;

  const links = pill.querySelectorAll('.nav-pill-link');

  function moveTo(el) {
    if (!el) return;
    const pr = pill.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    ind.style.left  = (er.left - pr.left + 4) + 'px';
    ind.style.width = (er.width - 8) + 'px';
  }

  // Initial position after layout paints
  requestAnimationFrame(() => moveTo(pill.querySelector('.active')));

  links.forEach((link) => {
    link.addEventListener('mouseenter', () => moveTo(link));
    link.addEventListener('click', () => {
      links.forEach((l) => l.classList.remove('active'));
      link.classList.add('active');
      moveTo(link);
    });
  });
  pill.addEventListener('mouseleave', () => moveTo(pill.querySelector('.active')));
}

/* ═══════════════════════════════════════════════════════════════════
   7. NAV SCROLL HIGHLIGHT — active section detection
═══════════════════════════════════════════════════════════════════ */
function initNavActive() {
  const nav   = document.getElementById('site-nav');
  const pill  = document.getElementById('nav-pill');
  const ind   = document.getElementById('nav-indicator');
  const links = document.querySelectorAll('.nav-pill-link');

  // Scrolled class for blur/border
  ScrollTrigger.create({
    start:  'top -1px',
    onUpdate(self) { nav && nav.classList.toggle('scrolled', self.progress > 0); },
  });

  // Section-based active link
  document.querySelectorAll('section[id]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start:   'top 50%',
      end:     'bottom 50%',
      onToggle(self) {
        if (!self.isActive) return;
        const id = section.id;
        links.forEach((link) => {
          const match = link.getAttribute('href') === `#${id}`;
          link.classList.toggle('active', match);
          if (match && pill && ind) {
            const pr = pill.getBoundingClientRect();
            const lr = link.getBoundingClientRect();
            ind.style.left  = (lr.left - pr.left + 4) + 'px';
            ind.style.width = (lr.width - 8) + 'px';
          }
        });
      },
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   8. MAGNETIC BUTTON
═══════════════════════════════════════════════════════════════════ */
function initMagneticBtn() {
  const btn = document.querySelector('.magnetic-btn');
  if (!btn) return;
  btn.addEventListener('mousemove', (e) => {
    const r = btn.getBoundingClientRect();
    btn.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
    btn.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
  });
}

/* ═══════════════════════════════════════════════════════════════════
   9. CHIP ACTIVE STATE
═══════════════════════════════════════════════════════════════════ */
function initChips() {
  document.querySelectorAll('.hero-chips .chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.hero-chips .chip').forEach((c) => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   10. PROPERTY SAVE TOGGLE
═══════════════════════════════════════════════════════════════════ */
function initSave() {
  document.querySelectorAll('.prop-save').forEach((btn) => {
    btn.addEventListener('click', () => {
      const saved = btn.classList.toggle('saved');
      const path  = btn.querySelector('svg path');
      if (path) { path.style.fill = saved ? '#EF6B40' : 'none'; }
      btn.style.color = saved ? '#EF6B40' : '';
      // Small bounce with GSAP
      gsap.from(btn, { scale: 0.75, duration: 0.35, ease: 'back.out(3)' });
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   11. SMOOTH ANCHOR SCROLL via Lenis
═══════════════════════════════════════════════════════════════════ */
function initAnchorScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const id  = a.getAttribute('href');
      const target = id !== '#' && document.querySelector(id);
      if (target) {
        e.preventDefault();
        if (window._lenis) {
          window._lenis.scrollTo(target, { offset: 0, duration: 1.4 });
        }
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   BOOT
═══════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Register GSAP plugin
  gsap.registerPlugin(ScrollTrigger);

  // Init Lenis first so ScrollTrigger gets smooth scroll position
  initLenis();

  // Page transition overlay fade out
  initPageTransition();

  // Hero entrance (after overlay clears)
  initHeroAnimations();

  // All scroll-driven animations
  initScrollAnimations();
  initCounters();
  initNavPill();
  initNavActive();
  initMagneticBtn();
  initChips();
  initSave();
  initAnchorScroll();
});
