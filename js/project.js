/* Mahdi Saiah — project page interactions
   Video figures autoplay muted while in view; 3D Craft gallery opens an
   immersive lightbox. Reuses the reveal + nav logic from main.js. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Video figures: show first frame, play only when in view ---------- */
  var frames = Array.prototype.slice.call(document.querySelectorAll('.vframe'));

  frames.forEach(function (frame) {
    var v = frame.querySelector('video');
    if (!v) return;
    v.muted = true;
    v.playsInline = true;
    v.loop = true;

    // Nudge to the first frame so the frame isn't a black box before playback.
    var showFrame = function () {
      try { v.currentTime = Math.min(0.1, (v.duration || 1) - 0.05); } catch (e) {}
    };
    v.addEventListener('loadedmetadata', showFrame, { once: true });

    // Click the frame to toggle sound (a quick way to hear the gameplay).
    frame.addEventListener('click', function () {
      v.muted = !v.muted;
      if (!v.muted) { v.play().catch(function () {}); }
      frame.classList.toggle('sound-on', !v.muted);
    });
  });

  if ('IntersectionObserver' in window && !reduce) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target.querySelector('video');
        if (!v) return;
        if (entry.isIntersecting) { v.play().catch(function () {}); }
        else { v.pause(); }
      });
    }, { threshold: 0.4 });
    frames.forEach(function (f) { vio.observe(f); });
  } else {
    frames.forEach(function (f) {
      var v = f.querySelector('video');
      if (v) v.play().catch(function () {});
    });
  }

  /* ---------- Immersive lightbox (3D Craft) ---------- */
  var lb = document.getElementById('lb');
  if (!lb) return;

  var lbImg = lb.querySelector('.lb__img');
  var lbCount = lb.querySelector('.lb__count');
  var btnClose = lb.querySelector('.lb__close');
  var btnPrev = lb.querySelector('.lb__prev');
  var btnNext = lb.querySelector('.lb__next');

  var shots = Array.prototype.slice.call(document.querySelectorAll('.shot, .zoomable'));
  var sources = shots.map(function (s) {
    var img = s.querySelector('img');
    return { src: img.getAttribute('data-full') || img.currentSrc || img.src, alt: img.alt };
  });
  var idx = 0;
  var lastFocus = null;

  function show(i) {
    idx = (i + sources.length) % sources.length;
    lbImg.src = sources[idx].src;
    lbImg.alt = sources[idx].alt || '';
    if (lbCount) lbCount.textContent = String(idx + 1).padStart(2, '0') + ' / ' + String(sources.length).padStart(2, '0');
  }

  function open(i) {
    lastFocus = document.activeElement;
    show(i);
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (btnClose) btnClose.focus();
  }

  function close() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  shots.forEach(function (s, i) {
    s.addEventListener('click', function () { open(i); });
  });

  if (btnClose) btnClose.addEventListener('click', close);
  if (btnPrev) btnPrev.addEventListener('click', function (e) { e.stopPropagation(); show(idx - 1); });
  if (btnNext) btnNext.addEventListener('click', function (e) { e.stopPropagation(); show(idx + 1); });

  // click the scrim (not the image or a control) to close
  lb.addEventListener('click', function (e) {
    if (e.target === lb || e.target === lbImg) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(idx - 1);
    else if (e.key === 'ArrowRight') show(idx + 1);
  });
})();

/* ---------- Mémoire reader: live page indicator ---------- */
(function () {
  'use strict';
  var scroll = document.getElementById('readerScroll');
  var ind = document.getElementById('readerInd');
  if (!scroll || !ind) return;

  var pages = Array.prototype.slice.call(scroll.querySelectorAll('.reader__page'));
  var total = pages.length;
  var pad = function (n) { return String(n).padStart(2, '0'); };
  ind.textContent = pad(1) + ' / ' + pad(total);

  var last = 0;
  var update = function () {
    var mid = scroll.scrollTop + scroll.clientHeight / 2;
    var current = 1;
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].offsetTop <= mid) current = i + 1; else break;
    }
    if (current !== last) { last = current; ind.textContent = pad(current) + ' / ' + pad(total); }
  };
  scroll.addEventListener('scroll', update, { passive: true });
})();

/* ---------- 3D model: hide the "drag to orbit" hint once touched ---------- */
(function () {
  'use strict';
  var wrap = document.getElementById('jeep3d');
  if (!wrap) return;
  var mv = wrap.querySelector('model-viewer');
  if (!mv) return;
  var seen = false;
  var dismiss = function () {
    if (seen) return;
    seen = true;
    wrap.classList.add('interacted');
  };
  // A user drag fires camera-change with source "user-interaction".
  mv.addEventListener('camera-change', function (e) {
    if (e.detail && e.detail.source === 'user-interaction') dismiss();
  });
  wrap.addEventListener('pointerdown', dismiss);
})();
