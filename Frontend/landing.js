/* ============================================================================
   VEYRA — Landing Page JavaScript
   Scroll-triggered animations, navbar scroll effect
   ============================================================================ */

'use strict';

/* ─── NAVBAR: Scroll State ─────────────────────────────────────────── */
const nav = document.getElementById('site-nav');

function handleNavScroll() {
  if (window.scrollY > 20) {
    nav.classList.add('scrolled');
  } else {
    nav.classList.remove('scrolled');
  }
}

window.addEventListener('scroll', handleNavScroll, { passive: true });
handleNavScroll(); // run on init

/* ─── SCROLL REVEAL via IntersectionObserver ───────────────────────── */
const revealSelectors = [
  '.reveal-fade-up',
  '.reveal-scale-in',
  '.reveal-slide-right',
  '.reveal-slide-left',
];

const revealEls = document.querySelectorAll(revealSelectors.join(','));

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target); // fire once
      }
    });
  },
  {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px',
  }
);

revealEls.forEach((el) => revealObserver.observe(el));

/* ─── HERO: Animate elements on load (not waiting for scroll) ──────── */
document.addEventListener('DOMContentLoaded', () => {
  // Immediately visible hero elements should animate in
  const heroEls = document.querySelectorAll('.hero .reveal-fade-up, .hero .reveal-scale-in');
  heroEls.forEach((el, i) => {
    // Hero elements animate immediately on load with their own delay
    setTimeout(() => {
      el.classList.add('is-visible');
    }, 80); // small debounce so CSS delay takes over
  });
});

/* ─── SMOOTH ANCHOR SCROLL ─────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', (e) => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* ─── DESTINATION CHIP FILTER (visual only) ─────────────────────────── */
document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach((c) => c.classList.remove('chip--active'));
    chip.classList.add('chip--active');
  });
});

/* ─── PROPERTY SAVE BUTTON TOGGLE ──────────────────────────────────── */
document.querySelectorAll('.prop-card-save').forEach((btn) => {
  btn.addEventListener('click', () => {
    const svg = btn.querySelector('svg path');
    if (svg) {
      const filled = btn.classList.toggle('saved');
      svg.style.fill = filled ? '#EF6B40' : 'none';
      btn.style.color = filled ? '#EF6B40' : '';
    }
  });
});

/* ─── NAV ACTIVE LINK on scroll ─────────────────────────────────────── */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        navLinks.forEach((link) => {
          const href = link.getAttribute('href');
          link.classList.toggle('active', href === `#${id}`);
        });
      }
    });
  },
  { threshold: 0.4 }
);

sections.forEach((section) => sectionObserver.observe(section));
