/* ============================================================================
   VEYRA — Landing JS v3
   Page-load animations · Sticky Stack Parallax · Counter · Nav pill · Magnetic
   ============================================================================ */

'use strict';

/* ═══════════════════════════════════════════════════════════════════
   1.  PAGE-LOAD ANIMATIONS
   Reads data-anim-delay from elements, sets transition-delay,
   then adds .page-loaded to body on next rAF.
═══════════════════════════════════════════════════════════════════ */
function initPageLoad() {
  document.querySelectorAll('[data-anim-delay]').forEach((el) => {
    const ms = parseInt(el.getAttribute('data-anim-delay'), 10) || 0;
    el.style.transitionDelay = ms + 'ms';
  });
  requestAnimationFrame(() =>
    requestAnimationFrame(() => document.body.classList.add('page-loaded'))
  );
}

/* ═══════════════════════════════════════════════════════════════════
   2.  STICKY STACKING PARALLAX
   Each .stack-frame is a scroll container.
   The .stack-panel inside is sticky (top:0, height:100vh).
   As you scroll, we calculate how far the NEXT section has advanced
   over the current one, and apply a scale() + slight opacity to the
   outgoing panel — creating the depth-stack illusion.
═══════════════════════════════════════════════════════════════════ */
function initStackParallax() {
  const frames = Array.from(document.querySelectorAll('.stack-frame'));
  if (frames.length === 0) return;

  // How far (in px) the incoming card travels over the outgoing card
  // before the outgoing card is fully compressed.
  const COMPRESS_DISTANCE = 280; // px of overlap scroll needed to reach min scale
  const MIN_SCALE   = 0.88;
  const START_NUDGE = 14;  // px gap from top during stack (offset stagger)

  function update() {
    const scrollY = window.scrollY;

    frames.forEach((frame, i) => {
      const panel = frame.querySelector('.stack-panel');
      if (!panel) return;

      const frameTop    = frame.getBoundingClientRect().top + scrollY;
      const frameBottom = frameTop + frame.offsetHeight;
      const panelH      = window.innerHeight;

      // Distance scrolled into this frame (0 when frame top aligns with viewport top)
      const entered = scrollY - frameTop;

      // Is the NEXT frame overlapping this panel?
      // That happens when scrollY > frameTop + (frameHeight - panelH)
      // i.e. the panel has used up its scroll travel and is being "crushed"
      const nextFrame  = frames[i + 1];
      let scaleProgress = 0; // 0 = full size, 1 = max compressed

      if (nextFrame) {
        const nextTop    = nextFrame.getBoundingClientRect().top + scrollY;
        const overlap    = scrollY - (nextTop - panelH); // how many px the next panel has scrolled over us
        if (overlap > 0) {
          scaleProgress = Math.min(overlap / COMPRESS_DISTANCE, 1);
        }
      }

      // Smoothed easing on scale progress
      const easedProgress = scaleProgress * scaleProgress * (3 - 2 * scaleProgress); // smoothstep

      const scale       = 1 - (1 - MIN_SCALE) * easedProgress;
      const nudgeY      = -START_NUDGE * easedProgress; // slight upward nudge
      const opacity     = 1 - 0.25 * easedProgress;

      panel.style.transform       = `scale(${scale}) translateY(${nudgeY}px)`;
      panel.style.opacity         = opacity;
      panel.style.transformOrigin = 'top center';

      // Round top corners more as panels get compressed (feels tactile)
      const baseR = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--stack-radius'), 10) || 28;
      const extraR = Math.round(baseR * easedProgress * 0.5);
      panel.style.borderRadius = `${baseR + extraR}px ${baseR + extraR}px 0 0`;
    });
  }

  // Throttle to rAF
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Initial call
  update();
}

/* ═══════════════════════════════════════════════════════════════════
   3.  NAV SCROLL STATE
═══════════════════════════════════════════════════════════════════ */
function initNavScroll() {
  const nav = document.getElementById('site-nav');
  if (!nav) return;
  function update() { nav.classList.toggle('scrolled', window.scrollY > 16); }
  window.addEventListener('scroll', update, { passive: true });
  update();
}

/* ═══════════════════════════════════════════════════════════════════
   4.  FLOATING PILL NAV — sliding indicator
═══════════════════════════════════════════════════════════════════ */
function initNavPill() {
  const pill      = document.getElementById('nav-pill');
  const indicator = document.getElementById('nav-indicator');
  if (!pill || !indicator) return;

  const links = pill.querySelectorAll('.nav-pill-link');

  function moveTo(el) {
    if (!el) return;
    const pr = pill.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    indicator.style.left  = (er.left - pr.left + 4) + 'px';
    indicator.style.width = (er.width - 8) + 'px';
  }

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
   5.  MAGNETIC BUTTON
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
   6.  SCROLL REVEAL — IntersectionObserver
═══════════════════════════════════════════════════════════════════ */
function initScrollReveal() {
  const els = document.querySelectorAll(
    '.reveal-fade-up, .reveal-slide-right, .reveal-slide-left'
  );
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-visible');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  els.forEach((el) => observer.observe(el));
}

/* ═══════════════════════════════════════════════════════════════════
   7.  ANIMATED NUMBER COUNTERS
   Works for integers and one-decimal (stat-decimal class uses /10).
═══════════════════════════════════════════════════════════════════ */
function animateCounter(el, target, duration) {
  const isDecimal = el.classList.contains('stat-decimal');
  const start     = performance.now();

  function step(now) {
    const t   = Math.min((now - start) / duration, 1);
    const e   = 1 - Math.pow(1 - t, 3); // ease-out cubic
    const val = e * target;

    el.textContent = isDecimal
      ? (val / 10).toFixed(1)   // e.g. 49 → 4.9
      : Math.round(val);

    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function initCounters() {
  const els = document.querySelectorAll('[data-target]');
  if (!els.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        animateCounter(e.target, +e.target.getAttribute('data-target'), 1600);
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });

  els.forEach((el) => observer.observe(el));
}

/* ═══════════════════════════════════════════════════════════════════
   8.  SMOOTH ANCHOR SCROLL
═══════════════════════════════════════════════════════════════════ */
function initAnchorScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      const t = document.querySelector(href);
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   9.  CHIP ACTIVE STATE
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
   10. PROPERTY SAVE BUTTON TOGGLE
═══════════════════════════════════════════════════════════════════ */
function initSaveButtons() {
  document.querySelectorAll('.prop-card-save').forEach((btn) => {
    btn.addEventListener('click', () => {
      const saved = btn.classList.toggle('saved');
      const path  = btn.querySelector('svg path');
      if (path) {
        path.style.fill  = saved ? '#EF6B40' : 'none';
        btn.style.color  = saved ? '#EF6B40' : '';
      }
    });
  });
}

/* ═══════════════════════════════════════════════════════════════════
   11. NAV ACTIVE HIGHLIGHT on scroll section change
═══════════════════════════════════════════════════════════════════ */
function initNavActiveScroll() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-pill-link');
  const pill     = document.getElementById('nav-pill');
  const ind      = document.getElementById('nav-indicator');
  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      navLinks.forEach((link) => {
        const match = link.getAttribute('href') === `#${id}`;
        link.classList.toggle('active', match);
        if (match && pill && ind) {
          const pr = pill.getBoundingClientRect();
          const lr = link.getBoundingClientRect();
          ind.style.left  = (lr.left - pr.left + 4) + 'px';
          ind.style.width = (lr.width - 8) + 'px';
        }
      });
    });
  }, { threshold: 0.45 });

  sections.forEach((s) => observer.observe(s));
}

/* ═══════════════════════════════════════════════════════════════════
   12. STACK-FRAME HEIGHT SETUP
   Each frame needs enough height so the sticky panel has scroll-room.
   We set each frame to 200vh (panel = 100vh + 100vh scroll travel)
   except the last which is 120vh.
═══════════════════════════════════════════════════════════════════ */
function setStackFrameHeights() {
  const frames = document.querySelectorAll('.stack-frame');
  frames.forEach((frame, i) => {
    const isLast = frame.classList.contains('stack-frame--last');
    // Give enough height so the sticky panel has room to travel
    frame.style.height = isLast ? '130vh' : '200vh';
  });
}

/* ═══════════════════════════════════════════════════════════════════
   BOOT
═══════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  setStackFrameHeights();
  initPageLoad();
  initNavScroll();
  initNavPill();
  initMagneticBtn();
  initScrollReveal();
  initCounters();
  initAnchorScroll();
  initChips();
  initSaveButtons();
  initNavActiveScroll();
  initStackParallax();
});
