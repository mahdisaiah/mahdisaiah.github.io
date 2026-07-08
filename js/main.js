/* Mahdi Saiah — portfolio interactions */
(function () {
  'use strict';

  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var menu = document.getElementById('mobileMenu');

  /* Nav: translucent bg once scrolled, hide on scroll down, show on scroll up */
  var lastY = window.scrollY;

  var updateNav = function () {
    var y = window.scrollY;
    if (y > 40) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');

    var delta = y - lastY;
    if (!document.body.classList.contains('menu-open') && Math.abs(delta) > 6) {
      if (delta > 0 && y > 120) nav.classList.add('nav--hidden');   // scrolling down
      else if (delta < 0) nav.classList.remove('nav--hidden');      // scrolling up
      lastY = y;
    } else if (Math.abs(delta) > 6) {
      lastY = y;
    }
  };

  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* Mobile menu */
  var setMenu = function (open) {
    document.body.classList.toggle('menu-open', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) nav.classList.remove('nav--hidden');
  };
  burger.addEventListener('click', function () {
    setMenu(!document.body.classList.contains('menu-open'));
  });
  menu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setMenu(false);
  });

  /* Scroll reveals (whole blocks, no per-letter stagger) */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var reveals = document.querySelectorAll('.reveal');

  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  }
})();
