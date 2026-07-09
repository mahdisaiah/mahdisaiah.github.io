/* The Lab — interactive design-system playground */
(function () {
  'use strict';
  var body = document.body;
  var STORE = 'ms_lab';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------- persisted prefs ---------------- */
  var prefs = { theme: 'light', density: 'comfortable', motion: 'full' };
  try { Object.assign(prefs, JSON.parse(localStorage.getItem(STORE) || '{}')); } catch (e) {}
  function save() { try { localStorage.setItem(STORE, JSON.stringify(prefs)); } catch (e) {} }

  function applyTheme(t) { prefs.theme = t; body.setAttribute('data-theme', t); save(); refreshSwatches(); layoutAllSegs(); }
  function applyDensity(d) { prefs.density = d; body.setAttribute('data-density', d); save(); layoutAllSegs(); }
  function applyMotion(on) { prefs.motion = on ? 'full' : 'reduced'; body.setAttribute('data-motion', prefs.motion); save(); }

  /* ---------------- segmented controls ---------------- */
  function layoutSeg(seg) {
    var thumb = $('.lb-seg__thumb', seg);
    var active = $('[aria-checked="true"]', seg);
    if (!thumb || !active) return;
    thumb.style.width = active.offsetWidth + 'px';
    thumb.style.transform = 'translateX(' + (active.offsetLeft - 3) + 'px)';
  }
  function layoutAllSegs() { $$('.lb-seg').forEach(layoutSeg); }

  function initSeg(seg, onSelect) {
    var btns = $$('button', seg);
    function select(btn, focus) {
      btns.forEach(function (b) { b.setAttribute('aria-checked', b === btn ? 'true' : 'false'); });
      layoutSeg(seg);
      if (focus) btn.focus();
      if (onSelect) onSelect(btn);
    }
    btns.forEach(function (btn, i) {
      btn.addEventListener('click', function () { select(btn); });
      btn.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0);
        if (!d) return;
        e.preventDefault();
        select(btns[(i + d + btns.length) % btns.length], true);
      });
    });
    layoutSeg(seg);
  }

  var themeSeg = $('#themeSeg');
  if (themeSeg) {
    // reflect stored theme
    $$('button', themeSeg).forEach(function (b) { b.setAttribute('aria-checked', b.dataset.theme === prefs.theme ? 'true' : 'false'); });
    initSeg(themeSeg, function (b) { applyTheme(b.dataset.theme); });
  }
  var densitySeg = $('#densitySeg');
  if (densitySeg) {
    $$('button', densitySeg).forEach(function (b) { b.setAttribute('aria-checked', b.dataset.density === prefs.density ? 'true' : 'false'); });
    initSeg(densitySeg, function (b) { applyDensity(b.dataset.density); });
  }
  $$('#viewSeg, #labForm .lb-seg').forEach(function (s) { if (s.id !== 'themeSeg' && s.id !== 'densitySeg') initSeg(s); });

  // apply stored prefs on load
  body.setAttribute('data-theme', prefs.theme);
  body.setAttribute('data-density', prefs.density);
  body.setAttribute('data-motion', prefs.motion);

  var motionToggle = $('#motionToggle');
  if (motionToggle) { motionToggle.checked = prefs.motion === 'full'; motionToggle.addEventListener('change', function () { applyMotion(motionToggle.checked); }); }

  window.addEventListener('resize', layoutAllSegs);
  window.addEventListener('load', layoutAllSegs);

  /* ---------------- color helpers ---------------- */
  function readToken(name) { return getComputedStyle(body).getPropertyValue(name).trim(); }
  function hexToRgb(hex) {
    hex = hex.trim().replace('#', '');
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    if (!/^[0-9a-f]{6}$/i.test(hex)) return null;
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  }
  function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function lumFromRgb(r) { return 0.2126 * lin(r[0]) + 0.7152 * lin(r[1]) + 0.0722 * lin(r[2]); }
  function ratio(fg, bg) {
    var a = hexToRgb(fg), b = hexToRgb(bg);
    if (!a || !b) return null;
    var l1 = lumFromRgb(a), l2 = lumFromRgb(b);
    var hi = Math.max(l1, l2), lo = Math.min(l1, l2);
    return (hi + 0.05) / (lo + 0.05);
  }

  /* ---------------- swatch grid ---------------- */
  var TOKENS = [
    ['Surface', '--lb-surface'], ['Text', '--lb-text'], ['Muted', '--lb-muted'],
    ['Accent', '--lb-accent'], ['Success', '--lb-success'], ['Warning', '--lb-warning'],
    ['Danger', '--lb-danger'], ['Info', '--lb-info'], ['Focus', '--lb-focus']
  ];
  var swatchGrid = $('#swatchGrid');
  if (swatchGrid) {
    TOKENS.forEach(function (t) {
      var b = document.createElement('button');
      b.className = 'sw2'; b.type = 'button'; b.dataset.var = t[1];
      b.setAttribute('aria-label', 'Copy ' + t[0] + ' token');
      b.innerHTML = '<span class="sw2__chip" style="background:var(' + t[1] + ')"></span>' +
        '<span class="sw2__meta"><span class="sw2__name">' + t[0] + '</span>' +
        '<span class="sw2__val"><span class="v"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><use href="#i-copy"/></svg></span></span>';
      b.addEventListener('click', function () {
        var val = readToken(t[1]);
        copy(val); toast('info', 'Copied', val + ' → clipboard');
      });
      swatchGrid.appendChild(b);
    });
  }
  function refreshSwatches() {
    $$('.sw2').forEach(function (b) { var v = $('.v', b); if (v) v.textContent = readToken(b.dataset.var); });
  }
  refreshSwatches();

  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).catch(function () {}); return; }
    var ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(ta);
  }

  /* ---------------- motion curves ---------------- */
  var CURVES = [
    ['Standard', [0.2, 0.7, 0.2, 1], '200ms'],
    ['Decelerate', [0, 0.62, 0.34, 1], '320ms · enter'],
    ['Accelerate', [0.4, 0, 1, 0.5], '120ms · exit'],
    ['Spring', [0.34, 1.56, 0.64, 1], '320ms']
  ];
  var motionGrid = $('#motionGrid');
  if (motionGrid) {
    CURVES.forEach(function (c) {
      var p = c[1];
      // path in 0..100 viewBox, y flipped (0 top)
      var d = 'M0,100 C' + (p[0] * 100).toFixed(1) + ',' + (100 - p[1] * 100).toFixed(1) + ' ' +
        (p[2] * 100).toFixed(1) + ',' + (100 - p[3] * 100).toFixed(1) + ' 100,0';
      var card = document.createElement('button');
      card.className = 'curvecard'; card.type = 'button'; card.style.cursor = 'pointer';
      card.setAttribute('aria-label', 'Play ' + c[0] + ' easing');
      card.innerHTML = '<svg viewBox="-6 -6 112 112" preserveAspectRatio="none"><line class="cv-path" x1="0" y1="100" x2="100" y2="0"/><path class="cv-line" d="' + d + '"/></svg>' +
        '<div class="name">' + c[0] + '</div><div class="dur">cubic-bezier(' + p.join(', ') + ')</div>' +
        '<div class="curve-demo"><i></i></div>';
      var dot = $('.curve-demo i', card);
      card.addEventListener('click', function () {
        dot.style.transition = 'none'; dot.style.transform = 'translateX(0)';
        // force reflow
        void dot.offsetWidth;
        var reduced = body.getAttribute('data-motion') === 'reduced';
        dot.style.transition = 'transform ' + (reduced ? 0 : 600) + 'ms cubic-bezier(' + p.join(',') + ')';
        dot.style.transform = 'translateX(calc(100% * ' + (card.querySelector('.curve-demo').clientWidth - 14) + ' / ' + (card.querySelector('.curve-demo').clientWidth) + '))';
        dot.style.transform = 'translateX(' + (card.querySelector('.curve-demo').clientWidth - 14) + 'px)';
      });
      motionGrid.appendChild(card);
    });
  }

  /* ---------------- loading button demo ---------------- */
  function runLoad(btn, ok) {
    if (btn.classList.contains('is-loading') || btn.classList.contains('is-done')) return;
    var label = $('.lb-btn__label', btn); var orig = label ? label.textContent : '';
    btn.classList.add('is-loading'); btn.setAttribute('aria-busy', 'true');
    setTimeout(function () {
      btn.classList.remove('is-loading'); btn.removeAttribute('aria-busy');
      btn.classList.add('is-done'); if (label) label.textContent = ok || 'Done';
      setTimeout(function () { btn.classList.remove('is-done'); if (label) label.textContent = orig; }, 1400);
    }, 1300);
  }
  $$('[data-loading-demo]').forEach(function (b) { b.addEventListener('click', function () { runLoad(b, 'Saved'); }); });

  /* ---------------- form ---------------- */
  var form = $('#labForm');
  if (form) {
    // email validation on blur
    var email = $('#f-email'); var emailField = $('[data-field="email"]'); var emailHelp = $('#f-email-help');
    var emailDefault = emailHelp ? emailHelp.textContent : '';
    function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
    if (email) email.addEventListener('blur', function () {
      var v = email.value.trim();
      emailField.classList.remove('is-error', 'is-success');
      if (!v) { emailHelp.textContent = emailDefault; return; }
      if (validEmail(v)) { emailField.classList.add('is-success'); emailHelp.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#i-check"/></svg> Looks good'; }
      else { emailField.classList.add('is-error'); emailHelp.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#i-alert"/></svg> Enter a valid email'; }
    });
    email && email.addEventListener('input', function () { if (emailField.classList.contains('is-error') && validEmail(email.value.trim())) { emailField.classList.remove('is-error'); emailField.classList.add('is-success'); emailHelp.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#i-check"/></svg> Looks good'; } });

    // password toggle
    var pw = $('#f-pw'); var pwT = $('#pwToggle');
    if (pwT) pwT.addEventListener('click', function () {
      var show = pw.type === 'password'; pw.type = show ? 'text' : 'password';
      pwT.setAttribute('aria-pressed', String(show)); pwT.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
      pwT.querySelector('use').setAttribute('href', show ? '#i-eye-off' : '#i-eye');
    });

    // textarea counter
    var ta = $('#f-ta'); var taC = $('#taCount');
    if (ta) ta.addEventListener('input', function () { taC.textContent = ta.value.length; });

    // range
    var range = $('#labRange'); var rangeVal = $('#rangeVal');
    if (range) range.addEventListener('input', function () { rangeVal.textContent = range.value; });

    // search clear
    var searchWrap = $('#searchWrap'); var searchInput = $('#searchInput'); var searchClear = $('#searchClear');
    function syncSearch() { searchWrap.classList.toggle('has-val', searchInput.value.length > 0); }
    if (searchInput) { searchInput.addEventListener('input', syncSearch); searchClear.addEventListener('click', function () { searchInput.value = ''; syncSearch(); searchInput.focus(); }); }

    // submit
    var status = $('#formStatus');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = email ? email.value.trim() : '';
      if (!validEmail(v)) {
        emailField.classList.add('is-error'); emailHelp.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#i-alert"/></svg> Enter a valid email';
        email.focus(); toast('danger', 'Check the form', 'Email needs fixing.'); return;
      }
      var btn = form.querySelector('button[type="submit"]');
      runLoad(btn, 'Sent');
      setTimeout(function () { toast('success', 'Submitted', 'Your message is on its way.'); }, 1350);
    });
    form.addEventListener('reset', function () {
      setTimeout(function () {
        $$('.lb-field').forEach(function (f) { if (f.dataset.field !== 'ok') f.classList.remove('is-error', 'is-success'); });
        if (emailHelp) emailHelp.textContent = emailDefault;
        if (taC) taC.textContent = '0'; if (rangeVal) rangeVal.textContent = range.value; syncSearch && syncSearch();
      }, 0);
    });
  }

  /* ---------------- tabs ---------------- */
  var tabs = $('#labTabs');
  if (tabs) {
    var tabBtns = $$('[role="tab"]', tabs);
    var ink = $('.lb-tabs__ink', tabs);
    function layoutInk(btn) { ink.style.width = btn.offsetWidth + 'px'; ink.style.transform = 'translateX(' + btn.offsetLeft + 'px)'; }
    function selectTab(btn, focus) {
      tabBtns.forEach(function (b) {
        var sel = b === btn;
        b.setAttribute('aria-selected', String(sel)); b.tabIndex = sel ? 0 : -1;
        $('#' + b.getAttribute('aria-controls')).hidden = !sel;
      });
      layoutInk(btn); if (focus) btn.focus();
    }
    tabBtns.forEach(function (btn, i) {
      btn.addEventListener('click', function () { selectTab(btn); });
      btn.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (e.key === 'Home') { e.preventDefault(); return selectTab(tabBtns[0], true); }
        if (e.key === 'End') { e.preventDefault(); return selectTab(tabBtns[tabBtns.length - 1], true); }
        if (!d) return; e.preventDefault();
        selectTab(tabBtns[(i + d + tabBtns.length) % tabBtns.length], true);
      });
    });
    layoutInk(tabBtns[0]);
    window.addEventListener('resize', function () { var a = $('[aria-selected="true"]', tabs); if (a) layoutInk(a); });
    window.addEventListener('load', function () { var a = $('[aria-selected="true"]', tabs); if (a) layoutInk(a); });
  }

  /* ---------------- accordion (height animated) ---------------- */
  $$('#labAcc .lb-acc__btn').forEach(function (btn) {
    var panel = btn.nextElementSibling;
    var inner = $('.lb-acc__inner', panel);
    function set(open) {
      btn.setAttribute('aria-expanded', String(open));
      panel.style.height = open ? inner.offsetHeight + 'px' : '0px';
    }
    if (btn.getAttribute('aria-expanded') === 'true') panel.style.height = inner.offsetHeight + 'px';
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
    panel.addEventListener('transitionend', function () { if (btn.getAttribute('aria-expanded') === 'true') panel.style.height = 'auto'; });
    window.addEventListener('resize', function () { if (btn.getAttribute('aria-expanded') === 'true') { panel.style.height = 'auto'; } });
  });

  /* ---------------- chips (removable) ---------------- */
  var chipRow = $('#chipRow');
  if (chipRow) chipRow.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var chip = b.closest('.lb-chip'); chip.style.setProperty('--_w', chip.offsetWidth + 'px');
    chip.classList.add('is-removing');
    chip.addEventListener('animationend', function () { chip.remove(); }, { once: true });
    setTimeout(function () { if (chip.parentNode) chip.remove(); }, 400);
  });

  /* ---------------- toasts ---------------- */
  var toastRoot = $('#toasts');
  var ICONS = { success: '#i-check', danger: '#i-alert', info: '#i-info' };
  function toast(type, title, msg, withUndo) {
    if (!toastRoot) return;
    var el = document.createElement('div');
    el.className = 'lb-toast lb-toast--' + type; el.setAttribute('role', type === 'danger' ? 'alert' : 'status');
    el.innerHTML = '<span class="lb-toast__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="' + (ICONS[type] || '#i-info') + '"/></svg></span>' +
      '<div class="lb-toast__body"><b>' + title + '</b><br>' + msg + (withUndo ? '<br><button class="lb-toast__undo" type="button">Undo</button>' : '') + '</div>' +
      '<button class="lb-toast__x" aria-label="Dismiss"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#i-x"/></svg></button>';
    var timer;
    function dismiss() { clearTimeout(timer); el.classList.add('out'); el.addEventListener('animationend', function () { el.remove(); }, { once: true }); setTimeout(function () { if (el.parentNode) el.remove(); }, 400); }
    $('.lb-toast__x', el).addEventListener('click', dismiss);
    var undo = $('.lb-toast__undo', el); if (undo) undo.addEventListener('click', function () { dismiss(); toast('info', 'Undone', 'The action was reverted.'); });
    toastRoot.appendChild(el);
    timer = setTimeout(dismiss, withUndo ? 6000 : 4000);
  }
  $$('[data-toast]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = b.dataset.toast;
      if (t === 'success') toast('success', 'Saved', 'Your changes are live.');
      else if (t === 'danger') toast('danger', 'Item deleted', 'It has been removed.', true);
      else toast('info', 'Heads up', 'A background sync just finished.');
    });
  });

  /* ---------------- modal (focus trap) ---------------- */
  var modal = $('#labModal');
  if (modal) {
    var lastFocus = null;
    var FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
    function openModal() {
      lastFocus = document.activeElement;
      modal.classList.add('open'); body.style.overflow = 'hidden';
      // defer: the element isn't focusable until the visibility transition starts
      setTimeout(function () { var f = $$(FOCUSABLE, modal).filter(function (el) { return el.offsetParent !== null; }); if (f[0]) f[0].focus(); }, 40);
    }
    function closeModal() {
      modal.classList.remove('open'); body.style.overflow = '';
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    $('#openModal').addEventListener('click', openModal);
    $$('[data-close]', modal).forEach(function (el) { el.addEventListener('click', closeModal); });
    $('#modalConfirm').addEventListener('click', function () { closeModal(); toast('danger', 'Deleted', 'The project was removed.', true); });
    modal.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); return closeModal(); }
      if (e.key !== 'Tab') return;
      var f = $$(FOCUSABLE, modal).filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------------- contrast checker ---------------- */
  var ccFg = $('#ccFg'), ccBg = $('#ccBg'), ccFgHex = $('#ccFgHex'), ccBgHex = $('#ccBgHex');
  if (ccFg) {
    var ccPreview = $('#ccPreview'), ccRatio = $('#ccRatio'), ccBadges = $('#ccBadges');
    function badge(label, pass) {
      return '<span class="lb-badge lb-badge--' + (pass ? 'success' : 'danger') + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><use href="' + (pass ? '#i-check' : '#i-x') + '"/></svg>' + label + '</span>';
    }
    function normHex(v) { v = v.trim(); if (v[0] !== '#') v = '#' + v; return v; }
    function updateCC() {
      var fg = normHex(ccFgHex.value), bg = normHex(ccBgHex.value);
      var r = ratio(fg, bg);
      if (r == null) { ccRatio.textContent = '—'; ccBadges.innerHTML = ''; return; }
      ccPreview.style.background = bg; ccPreview.style.color = fg;
      ccRatio.textContent = (Math.round(r * 10) / 10).toFixed(1);
      ccBadges.innerHTML =
        badge('AA text', r >= 4.5) + badge('AA large', r >= 3) + badge('AAA text', r >= 7) + badge('AAA large', r >= 4.5);
    }
    function sync(fromPicker, which) {
      if (which === 'fg') { if (fromPicker) ccFgHex.value = ccFg.value.toUpperCase(); else if (hexToRgb(normHex(ccFgHex.value))) ccFg.value = normHex(ccFgHex.value); }
      else { if (fromPicker) ccBgHex.value = ccBg.value.toUpperCase(); else if (hexToRgb(normHex(ccBgHex.value))) ccBg.value = normHex(ccBgHex.value); }
      updateCC();
    }
    ccFg.addEventListener('input', function () { sync(true, 'fg'); });
    ccBg.addEventListener('input', function () { sync(true, 'bg'); });
    ccFgHex.addEventListener('input', function () { sync(false, 'fg'); });
    ccBgHex.addEventListener('input', function () { sync(false, 'bg'); });
    var ccUseTheme = $('#ccUseTheme');
    if (ccUseTheme) ccUseTheme.addEventListener('click', function () {
      var t = hexToRgb(readToken('--lb-text')) ? readToken('--lb-text') : '#0F0F0F';
      var s = hexToRgb(readToken('--lb-surface')) ? readToken('--lb-surface') : '#FFFFFF';
      ccFgHex.value = t.toUpperCase(); ccBgHex.value = s.toUpperCase();
      if (hexToRgb(t)) ccFg.value = t; if (hexToRgb(s)) ccBg.value = s;
      updateCC(); toast('info', 'Loaded theme', 'Text on surface, current theme.');
    });
    updateCC();
  }

  /* ---------------- progress drift (subtle life) ---------------- */
  var prog = $('#progBar');
  if (prog) {
    var vals = [66, 78, 54, 88, 72];
    var idx = 0;
    setInterval(function () { if (body.getAttribute('data-motion') === 'reduced') return; idx = (idx + 1) % vals.length; prog.style.width = vals[idx] + '%'; }, 2600);
  }
})();
