/* Mahdi Saiah · portfolio
   Language (English in the DOM, French in data-fr), nav, reveals, the sticky
   phone story, the live token card, in-view video, copy email, gallery
   lightbox and the thesis reader. No dependencies. */
(function () {
  'use strict';
  var root = document.documentElement;
  root.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var darkMq = window.matchMedia('(prefers-color-scheme: dark)');

  /* ---------- segmented controls: the pill slides under the pressed button ---------- */
  function syncSeg(seg) {
    var btns = seg.querySelectorAll('button');
    var pill = seg.querySelector('.seg__pill');
    seg.style.setProperty('--n', btns.length);
    btns.forEach(function (b, i) {
      if (b.getAttribute('aria-pressed') === 'true' && pill) pill.style.transform = 'translateX(' + (i * 100) + '%)';
    });
  }
  function press(seg, btn) {
    seg.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
    syncSeg(seg);
  }
  document.querySelectorAll('.seg').forEach(syncSeg);

  /* ---------- language ---------- */
  var KEY = 'ms_lang';
  var titles = { en: root.getAttribute('data-title-en') || document.title, fr: root.getAttribute('data-title-fr') || document.title };

  function badges() {
    var fr = root.getAttribute('lang') === 'fr';
    document.querySelectorAll('[data-badge]').forEach(function (img) {
      img.src = 'media/connect/appstore-' + (darkMq.matches ? 'white' : 'black') + '-' + (fr ? 'fr-fr' : 'en-us') + '.svg';
      img.alt = fr ? "Télécharger dans l'App Store" : 'Download on the App Store';
    });
  }

  function apply(lang) {
    var fr = lang === 'fr';
    root.setAttribute('lang', lang);
    document.querySelectorAll('[data-fr]').forEach(function (el) {
      if (el.getAttribute('data-en') === null) el.setAttribute('data-en', el.innerHTML);
      el.innerHTML = fr ? el.getAttribute('data-fr') : el.getAttribute('data-en');
    });
    document.querySelectorAll('[data-fr-href]').forEach(function (el) {
      if (el.getAttribute('data-en-href') === null) el.setAttribute('data-en-href', el.getAttribute('href'));
      el.setAttribute('href', fr ? el.getAttribute('data-fr-href') : el.getAttribute('data-en-href'));
    });
    document.querySelectorAll('[data-fr-label]').forEach(function (el) {
      if (el.getAttribute('data-en-label') === null) el.setAttribute('data-en-label', el.getAttribute('aria-label') || '');
      el.setAttribute('aria-label', fr ? el.getAttribute('data-fr-label') : el.getAttribute('data-en-label'));
    });
    document.title = titles[fr ? 'fr' : 'en'];
    var seg = document.getElementById('lang');
    if (seg) press(seg, seg.querySelector('[data-lang="' + lang + '"]'));
    badges();
    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }

  var saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  var asked = (location.search.match(/[?&]lang=(en|fr)/) || [])[1];
  var initial = asked || saved || ((navigator.language || '').toLowerCase().indexOf('fr') === 0 ? 'fr' : 'en');
  apply(initial === 'fr' ? 'fr' : 'en');
  document.querySelectorAll('#lang button').forEach(function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-lang')); });
  });
  if (darkMq.addEventListener) darkMq.addEventListener('change', badges);

  /* ---------- nav: hides while reading down, comes back on the way up ---------- */
  var nav = document.getElementById('nav');
  var lastY = window.scrollY;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (nav) nav.classList.toggle('is-hidden', y > lastY && y > 240);
    lastY = y;
  }, { passive: true });

  /* ---------- reveals (whole blocks, no stagger) ---------- */
  var revealIo = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); revealIo.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    if (revealIo && !reduce) revealIo.observe(el); else el.classList.add('is-in');
  });

  /* ---------- videos play only while on screen ---------- */
  function playable(v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  var vidIo = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target;
      if (v.hasAttribute('data-stage-video')) return;
      if (e.isIntersecting) playable(v); else v.pause();
    });
  }, { threshold: .25 }) : null;
  document.querySelectorAll('video[data-inview], .hero video, .clip video').forEach(function (v) { if (vidIo) vidIo.observe(v); });

  /* ---------- sticky story: the phone shows the chapter you are reading ---------- */
  var stage = document.querySelector('.stage .dev__screen');
  var chaps = document.querySelectorAll('.chap');
  var activeChap = null;
  var stageVideo = stage ? stage.querySelector('video') : null;
  var stageVisible = false;

  function show(screen, key) {
    if (!screen) return;
    screen.querySelectorAll('[data-key]').forEach(function (el) { el.classList.toggle('on', el.getAttribute('data-key') === key); });
  }
  function setStage(key) {
    if (!stage) return;
    show(stage, key);
    if (stageVideo) { if (key === 'hero' && stageVisible) playable(stageVideo); else stageVideo.pause(); }
  }
  if (stageVideo) stageVideo.setAttribute('data-stage-video', '');

  if (stage && 'IntersectionObserver' in window) {
    var chapIo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { activeChap = e.target; setStage(activeChap.getAttribute('data-key')); }
      });
    }, { rootMargin: '-45% 0px -45% 0px' });
    chaps.forEach(function (c) { chapIo.observe(c); });
    new IntersectionObserver(function (es) {
      stageVisible = es[0].isIntersecting;
      if (activeChap) setStage(activeChap.getAttribute('data-key'));
    }).observe(stage);
  }

  // tabs inside a chapter swap its screen (inline on phones, the sticky one on desktop)
  document.querySelectorAll('.chap[data-tabs] .seg').forEach(function (seg) {
    var chap = seg.closest('.chap');
    seg.querySelectorAll('button').forEach(function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-show');
        press(seg, b);
        chap.setAttribute('data-key', key);
        show(chap.querySelector('.chap__dev .dev__screen'), key);
        if (activeChap === chap || !activeChap) setStage(key);
      });
    });
  });

  /* ---------- copy email ---------- */
  var copy = document.getElementById('copyMail');
  if (copy) copy.addEventListener('click', function () {
    var box = document.getElementById('mail');
    var done = function () { box.classList.add('is-copied'); setTimeout(function () { box.classList.remove('is-copied'); }, 1800); };
    if (navigator.clipboard) navigator.clipboard.writeText('mahdisaiahparis@gmail.com').then(done, function () {});
  });

  /* ---------- tilt: the phone leans toward the pointer (mouse only) ---------- */
  if (finePointer && !reduce) {
    document.querySelectorAll('[data-tilt]').forEach(function (dev) {
      var host = dev.parentElement;
      host.addEventListener('pointermove', function (e) {
        var r = dev.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        dev.style.transform = 'perspective(1400px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 8) + 'deg)';
        dev.style.setProperty('--gx', (x + .5) * 100 + '%');
        dev.style.setProperty('--gy', (y + .5) * 100 + '%');
        dev.classList.add('is-tilting');
      });
      host.addEventListener('pointerleave', function () { dev.style.transform = ''; dev.classList.remove('is-tilting'); });
    });
  }

  /* ---------- lightbox for galleries ---------- */
  var shots = Array.prototype.slice.call(document.querySelectorAll('[data-lb]'));
  if (shots.length) {
    var lb = document.createElement('div');
    lb.className = 'lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.innerHTML = '<img alt=""><button class="lb__btn lb__x" type="button" aria-label="Close"><svg class="i"><use href="media/icons.svg#x"/></svg></button>' +
      '<button class="lb__btn lb__prev" type="button" aria-label="Previous"><svg class="i"><use href="media/icons.svg#arrow-right"/></svg></button>' +
      '<button class="lb__btn lb__next" type="button" aria-label="Next"><svg class="i"><use href="media/icons.svg#arrow-right"/></svg></button><span class="lb__n"></span>';
    document.body.appendChild(lb);
    var img = lb.querySelector('img'), n = lb.querySelector('.lb__n'), at = 0, opener = null;
    var go = function (i) {
      at = (i + shots.length) % shots.length;
      var s = shots[at].querySelector('img');
      img.src = shots[at].getAttribute('data-lb') || s.src;
      img.alt = s.alt;
      n.textContent = (at + 1) + ' / ' + shots.length;
    };
    var close = function () { lb.classList.remove('is-open'); if (opener) opener.focus(); };
    shots.forEach(function (s, i) { s.addEventListener('click', function () { opener = s; go(i); lb.classList.add('is-open'); lb.querySelector('.lb__x').focus(); }); });
    lb.querySelector('.lb__x').addEventListener('click', close);
    lb.querySelector('.lb__prev').addEventListener('click', function (e) { e.stopPropagation(); go(at - 1); });
    lb.querySelector('.lb__next').addEventListener('click', function (e) { e.stopPropagation(); go(at + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') go(at - 1);
      if (e.key === 'ArrowRight') go(at + 1);
    });
  }

  /* ---------- thesis reader: live page number ---------- */
  var reader = document.getElementById('reader');
  if (reader) {
    var pages = reader.querySelectorAll('img');
    var out = document.getElementById('readerPage');
    reader.addEventListener('scroll', function () {
      var mid = reader.scrollTop + reader.clientHeight / 2, cur = 1;
      for (var i = 0; i < pages.length; i++) { if (pages[i].offsetTop <= mid) cur = i + 1; else break; }
      out.textContent = (cur < 10 ? '0' : '') + cur + ' / ' + pages.length;
    }, { passive: true });
  }
})();
