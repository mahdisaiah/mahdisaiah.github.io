/* THE FORGE — in-browser generative design studio (no server, no keys) */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var body = document.body, screen = $('#stScreen'), STORE = 'ms_forge';

  /* ============ seeded RNG ============ */
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var rng = mulberry32(1);
  function rand(a, b) { return a + rng() * (b - a); }
  function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }
  function chance(p) { return rng() < p; }

  /* ============ color utils ============ */
  function hsl(h, s, l) { // -> #hex
    h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
    var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2, r, g, b;
    if (h < 60) { r = c; g = x; b = 0; } else if (h < 120) { r = x; g = c; b = 0; } else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; } else if (h < 300) { r = x; g = 0; b = c; } else { r = c; g = 0; b = x; }
    var to = function (v) { return ('0' + Math.round((v + m) * 255).toString(16)).slice(-2); };
    return '#' + to(r) + to(g) + to(b);
  }
  function toRgb(hex) { hex = hex.replace('#', ''); if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join(''); return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)]; }
  function lin(c) { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function lum(hex) { var r = toRgb(hex); return 0.2126 * lin(r[0]) + 0.7152 * lin(r[1]) + 0.0722 * lin(r[2]); }
  function contrast(a, b) { var l1 = lum(a), l2 = lum(b), hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); }
  // adjust lightness of an HSL color until it meets target contrast vs bg
  function fitContrast(h, s, l, bg, target, preferDark) {
    var dir = preferDark ? -1 : 1, best = hsl(h, s, l), tries = 0;
    while (contrast(hsl(h, s, l), bg) < target && tries < 100) { l += dir * 2; if (l < 0 || l > 100) { l = Math.max(0, Math.min(100, l)); dir *= -1; } best = hsl(h, s, l); tries++; }
    return hsl(h, s, Math.max(0, Math.min(100, l)));
  }
  function bestText(bg) { return contrast('#ffffff', bg) >= contrast('#0a0a0a', bg) ? '#ffffff' : '#0a0a0a'; }

  /* ============ curated font pairings ============ */
  var PAIRS = [
    { d: "'Archivo'", b: "'Inter'", n: 'Archivo / Inter', v: ['bold', 'techno', 'calm'] },
    { d: "'Fraunces'", b: "'Inter'", n: 'Fraunces / Inter', v: ['editorial', 'playful', 'calm'] },
    { d: "'Playfair Display'", b: "'DM Sans'", n: 'Playfair / DM Sans', v: ['editorial', 'calm'] },
    { d: "'Sora'", b: "'Inter'", n: 'Sora / Inter', v: ['techno', 'bold'] },
    { d: "'Space Grotesk'", b: "'Inter'", n: 'Space Grotesk / Inter', v: ['techno', 'calm', 'bold'] },
    { d: "'Instrument Serif'", b: "'Space Grotesk'", n: 'Instrument / Grotesk', v: ['editorial', 'playful'] },
    { d: "'DM Sans'", b: "'DM Sans'", n: 'DM Sans', v: ['calm', 'playful', 'bold'] },
    { d: "'Sora'", b: "'DM Sans'", n: 'Sora / DM Sans', v: ['bold', 'playful', 'techno'] }
  ];

  /* ============ intent from prompt + vibe ============ */
  var HUES = { blue: 214, teal: 178, cyan: 190, green: 148, mint: 160, lime: 96, yellow: 48, amber: 38, orange: 26, red: 8, pink: 336, rose: 348, purple: 276, violet: 262, indigo: 246, magenta: 310 };
  function parseIntent(prompt, vibe) {
    var p = (prompt || '').toLowerCase();
    var it = { vibe: vibe || 'calm', hue: null, dark: false, sat: 62, round: 12, dense: 0, depth: 1 };
    var has = function (w) { return p.indexOf(w) >= 0; };
    if (has('dark') || has('night') || has('cyber') || has('neon')) it.dark = true;
    if (!vibe) {
      if (has('calm') || has('soft') || has('minimal') || has('zen') || has('clean') || has('fintech') || has('bank') || has('finance') || has('health')) it.vibe = 'calm';
      else if (has('bold') || has('strong') || has('loud') || has('sport') || has('startup')) it.vibe = 'bold';
      else if (has('play') || has('fun') || has('friend') || has('kid') || has('candy')) it.vibe = 'playful';
      else if (has('editor') || has('magazine') || has('luxury') || has('elegant') || has('serif') || has('fashion')) it.vibe = 'editorial';
      else if (has('tech') || has('crypto') || has('ai') || has('cyber') || has('neon') || has('data') || has('dev')) it.vibe = 'techno';
    }
    Object.keys(HUES).forEach(function (k) { if (has(k)) it.hue = HUES[k]; });
    if (has('warm')) it.hue = it.hue == null ? pick([26, 38, 8, 348]) : it.hue;
    if (has('cool')) it.hue = it.hue == null ? pick([214, 190, 262]) : it.hue;
    if (has('sharp') || has('square')) it.round = 2;
    if (has('round') || has('pill') || has('soft')) it.round = 20;
    // vibe presets
    var V = {
      calm: { hues: [200, 214, 190, 262, 178], sat: [30, 52], round: [12, 20], dense: 0, depth: 1, dark: false },
      bold: { hues: [8, 26, 214, 262, 336], sat: [70, 92], round: [8, 16], dense: 0, depth: 2, dark: chance(0.4) },
      playful: { hues: [336, 26, 48, 276, 160], sat: [72, 94], round: [16, 26], dense: 0, depth: 2, dark: false },
      editorial: { hues: [30, 210, 350, 0], sat: [8, 34], round: [2, 8], dense: 0, depth: 0, dark: false },
      techno: { hues: [160, 190, 262, 214, 130], sat: [55, 85], round: [8, 14], dense: 1, depth: 1, dark: chance(0.7) }
    };
    var v = V[it.vibe] || V.calm;
    if (it.hue == null) it.hue = pick(v.hues);
    it.sat = Math.round(rand(v.sat[0], v.sat[1]));
    it.round = it.round === 12 ? Math.round(rand(v.round[0], v.round[1])) : it.round;
    it.dense = v.dense; it.depth = v.depth;
    if (!has('dark') && !has('light')) it.dark = v.dark;
    if (has('light')) it.dark = false;
    it.pair = pick(PAIRS.filter(function (x) { return x.v.indexOf(it.vibe) >= 0; }) || PAIRS);
    return it;
  }

  /* ============ build a theme (accessible) ============ */
  function makeTheme(it) {
    var h = it.hue, s = it.sat, dark = it.dark;
    var t = {};
    if (dark) {
      t.bg = hsl(h, Math.min(s, 22), 8); t.surface = hsl(h, Math.min(s, 20), 13); t.surface2 = hsl(h, Math.min(s, 18), 19); t.inset = hsl(h, Math.min(s, 20), 10);
      t.text = hsl(h, 12, 95); t.muted = fitContrast(h, 14, 68, t.bg, 4.5, false); t.faint = hsl(h, 12, 52);
      t.border = 'rgba(255,255,255,.14)'; t.borderStrong = 'rgba(255,255,255,.32)';
      t.accent = hsl(h, Math.max(s, 55), 62); t.focus = hsl(h + 6, 80, 72);
    } else {
      t.bg = hsl(h, Math.min(s, 30), 97); t.surface = hsl(h, Math.min(s, 24), 100); t.surface2 = hsl(h, Math.min(s, 26), 93); t.inset = hsl(h, Math.min(s, 24), 95.5);
      t.text = fitContrast(h, 22, 14, t.bg, 8, true); t.muted = fitContrast(h, 16, 42, t.surface, 4.6, true); t.faint = hsl(h, 12, 58);
      t.border = 'rgba(15,15,15,.13)'; t.borderStrong = 'rgba(15,15,15,.30)';
      t.accent = fitContrast(h, s, 46, t.surface, 3.2, true); t.focus = hsl(h, 78, 46);
    }
    t.onAccent = bestText(t.accent);
    // semantic (fit contrast on surface)
    var refBg = dark ? t.surface : t.surface;
    t.success = fitContrast(148, dark ? 60 : 55, dark ? 62 : 34, refBg, 4.5, !dark);
    t.warning = fitContrast(40, dark ? 70 : 70, dark ? 62 : 36, refBg, 4.5, !dark);
    t.danger = fitContrast(6, dark ? 75 : 68, dark ? 66 : 42, refBg, 4.5, !dark);
    t.info = fitContrast(216, dark ? 75 : 70, dark ? 66 : 44, refBg, 4.5, !dark);
    t.successBg = dark ? hsl(148, 40, 14) : hsl(148, 45, 93);
    t.warningBg = dark ? hsl(40, 45, 14) : hsl(40, 60, 92);
    t.dangerBg = dark ? hsl(6, 45, 15) : hsl(6, 60, 94);
    t.infoBg = dark ? hsl(216, 50, 16) : hsl(216, 60, 94);
    // shadows by depth
    var shadowMul = it.depth; var sc = dark ? '0,0,0' : '15,15,15';
    t.sh1 = dark ? '0 1px 2px rgba(0,0,0,.5)' : '0 1px 2px rgba(15,15,15,.06)';
    t.sh2 = shadowMul === 0 ? '0 0 0 1px rgba(' + sc + ',.05)' : '0 8px 22px -10px rgba(' + sc + ',' + (dark ? 0.6 : 0.16 * shadowMul) + ')';
    t.sh3 = shadowMul === 0 ? '0 0 0 1px rgba(' + sc + ',.08)' : '0 26px 52px -18px rgba(' + sc + ',' + (dark ? 0.7 : 0.14 + 0.08 * shadowMul) + ')';
    t.radius = it.round; t.dense = it.dense; t.depth = it.depth;
    t.display = it.pair.d; t.body = it.pair.b; t.pairName = it.pair.n;
    t.hue = h; t.sat = s; t.dark = dark;
    // contrast readouts
    t.textRatio = Math.round(contrast(t.text, t.bg) * 10) / 10;
    t.accentRatio = Math.round(contrast(t.accent, t.onAccent) * 10) / 10;
    return t;
  }

  function applyTheme(t) {
    var r = Math.max(0, t.radius), br = t.radius <= 2 ? '6px' : t.radius >= 18 ? '999px' : (t.radius * 1.4) + 'px';
    var set = {
      '--lb-bg': t.bg, '--lb-surface': t.surface, '--lb-surface-2': t.surface2, '--lb-inset': t.inset,
      '--lb-text': t.text, '--lb-muted': t.muted, '--lb-faint': t.faint, '--lb-border': t.border, '--lb-border-strong': t.borderStrong,
      '--lb-accent': t.accent, '--lb-on-accent': t.onAccent, '--lb-focus': t.focus,
      '--lb-success': t.success, '--lb-warning': t.warning, '--lb-danger': t.danger, '--lb-info': t.info,
      '--lb-success-bg': t.successBg, '--lb-warning-bg': t.warningBg, '--lb-danger-bg': t.dangerBg, '--lb-info-bg': t.infoBg,
      '--lb-shadow-1': t.sh1, '--lb-shadow-2': t.sh2, '--lb-shadow-3': t.sh3,
      '--lb-r-sm': (r * 0.6 + 2) + 'px', '--lb-r-md': r + 'px', '--lb-r-lg': (r + 6) + 'px',
      '--lb-ctl-h': t.dense ? '38px' : '46px', '--gen-gap': t.dense ? '12px' : '18px', '--gen-btn-r': br,
      '--f-display': t.display, '--f-mono': t.body, '--gen-display': t.display, '--gen-body': t.body
    };
    Object.keys(set).forEach(function (k) { screen.style.setProperty(k, set[k]); });
    // keep user icon/text sizing across generations
    screen.style.setProperty('--gen-icon', state.icon + 'px');
    screen.style.setProperty('--gen-scale', state.scale);
    // inspector readouts
    paintTokens(t); state.theme = t; persist(); relayout();
  }

  /* ============ device presets + scale-to-fit ============ */
  var DEVICES = {
    'phone-app': { w: 390, chrome: 'phone-app', lead: '#i-phone', tall: true },
    'phone-web': { w: 390, chrome: 'phone-web', lead: '#i-phone', tall: true },
    'tablet-app': { w: 834, chrome: 'tablet-app', lead: '#i-phone' },
    'tablet-web': { w: 834, chrome: 'tablet-web', lead: '#i-phone' },
    'laptop-app': { w: 1280, chrome: 'laptop-app', lead: '#i-web' },
    'laptop-web': { w: 1280, chrome: 'laptop-web', lead: '#i-web' },
    'desktop-web': { w: 1512, chrome: 'desktop-web', lead: '#i-web' }
  };
  function statusBar() { return '<div class="stc-status"><span class="sig"><b>9:41</b></span><span class="island"></span><span style="display:inline-flex;gap:8px;align-items:center"><span class="stc-bars"><i></i><i></i><i></i><i></i></span><span class="stc-batt"><i></i></span></span></div>'; }
  function urlBar() { return '<div class="stc-url"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><use href="#i-lock"/></svg> forge.studio</div>'; }
  function winBar(web) { return '<div class="stc-win"><span class="stc-dots"><i></i><i></i><i></i></span>' + (web ? '<span class="stc-tab">New tab</span><span class="stc-winurl"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><use href="#i-lock"/></svg> forge.studio</span>' : '<span class="ttl">The Forge — Untitled</span>') + '</div>'; }
  function chromeHtml(key) {
    if (key === 'phone-app' || key === 'tablet-app') return statusBar();
    if (key === 'phone-web' || key === 'tablet-web') return statusBar() + urlBar();
    if (key === 'laptop-app') return winBar(false);
    return winBar(true);
  }
  function applyDevice(key) {
    var d = DEVICES[key] || DEVICES['laptop-web']; state.device = key;
    var frame = $('#stFrame'); frame.className = 'st-frame st-frame--' + key;
    $('#stFrameBar').innerHTML = chromeHtml(key);
    frame.style.width = d.w + 'px';
    screen.style.minHeight = d.tall ? '700px' : '260px';
    var lead = $('.st-devsel .lead use'); if (lead) lead.setAttribute('href', d.lead);
    var sel = $('#stDevice'); if (sel && sel.value !== key) sel.value = key;
    relayout(); persist();
  }
  function relayout() {
    var d = DEVICES[state.device] || DEVICES['laptop-web'];
    var canvas = $('#stCanvas'), frame = $('#stFrame'), scaler = $('#stScaler');
    if (!canvas || !frame) return;
    var pad = parseFloat(getComputedStyle(canvas).paddingLeft) || 24;
    var avail = Math.max(220, canvas.clientWidth - pad * 2);
    var scale = Math.min(1, avail / d.w);
    frame.style.transform = 'scale(' + scale + ')';
    var fh = frame.offsetHeight;
    scaler.style.width = (d.w * scale) + 'px';
    scaler.style.height = (fh * scale) + 'px';
    state._scale = scale;
    var z = $('#stZoom'); if (z) z.textContent = Math.round(scale * 100) + '%';
  }

  /* ============ inspector token swatches ============ */
  function paintTokens(t) {
    var pal = $('#stPalette'); if (!pal) return;
    var toks = [['Accent', t.accent], ['Text', t.text], ['Surface', t.surface], ['Muted', t.muted], ['Success', t.success], ['Warning', t.warning], ['Danger', t.danger], ['Info', t.info]];
    pal.innerHTML = toks.map(function (k) { return '<button class="st-tok" data-c="' + k[1] + '" title="Copy ' + k[1] + '"><i style="background:' + k[1] + '"></i><span>' + k[0] + '</span></button>'; }).join('');
    $('#stFonts').innerHTML = 'Type&nbsp; <b>' + t.pairName + '</b><br>Text contrast&nbsp; <b>' + t.textRatio + ':1</b>&nbsp; ·&nbsp; Accent&nbsp; <b>' + t.accentRatio + ':1</b>';
    $('#stRad').value = t.radius; $('#stRadOut').textContent = t.radius + 'px';
    $('#stDen').value = t.dense; $('#stDenOut').textContent = t.dense ? 'Compact' : 'Comfort';
    $('#stDep').value = t.depth; $('#stDepOut').textContent = ['Flat', 'Soft', 'Deep'][t.depth];
  }

  /* ============ components ============ */
  var CT = {
    eyebrow: { label: 'Eyebrow', def: { text: 'New release' }, fields: [['text', 'Text', 'text']], html: function (p) { return '<div class="gen-eyebrow">' + esc(p.text) + '</div>'; } },
    heading: { label: 'Heading', def: { text: 'Design that ships', level: 'h1' }, fields: [['text', 'Text', 'text'], ['level', 'Level', 'select', ['h1', 'h2']]], html: function (p) { return '<' + p.level + ' class="gen-' + p.level + '">' + esc(p.text) + '</' + p.level + '>'; } },
    text: { label: 'Text', def: { text: 'A calm, considered interface built from a single source of truth.' }, fields: [['text', 'Text', 'textarea']], html: function (p) { return '<p class="gen-text">' + esc(p.text) + '</p>'; } },
    image: { label: 'Image', def: {}, fields: [], html: function () { return '<div class="gen-img"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><use href="#i-img"/></svg></div>'; } },
    divider: { label: 'Divider', def: {}, fields: [], html: function () { return '<hr class="gen-divider">'; } },
    button: { label: 'Button', def: { label: 'Get started', variant: 'primary', size: 'md' }, fields: [['label', 'Label', 'text'], ['variant', 'Variant', 'select', ['primary', 'secondary', 'ghost', 'danger']], ['size', 'Size', 'select', ['sm', 'md', 'lg']]], html: function (p) { var v = p.variant === 'primary' ? '' : ' lb-btn--' + p.variant; var sz = p.size === 'md' ? '' : ' lb-btn--' + p.size; return '<div class="gen-row"><button class="lb-btn' + v + sz + '"><span class="lb-btn__label">' + esc(p.label) + '</span></button></div>'; } },
    input: { label: 'Input', def: { label: 'Email', placeholder: 'you@studio.com' }, fields: [['label', 'Label', 'text'], ['placeholder', 'Placeholder', 'text']], html: function (p) { return '<div class="gen-field"><label>' + esc(p.label) + '</label><input placeholder="' + esc(p.placeholder) + '"></div>'; } },
    toggle: { label: 'Toggle', def: { label: 'Notifications', on: true }, fields: [['label', 'Label', 'text'], ['on', 'On', 'bool']], html: function (p) { return '<label class="lb-switch" style="font-family:var(--gen-body)"><input type="checkbox" ' + (p.on ? 'checked' : '') + '><span class="lb-switch__track"></span> ' + esc(p.label) + '</label>'; } },
    segmented: { label: 'Segmented', def: { options: 'Day, Week, Month' }, fields: [['options', 'Options (comma)', 'text']], html: function (p) { var o = p.options.split(',').map(function (x) { return x.trim(); }); return '<div class="lb-seg" role="group" style="align-self:flex-start"><span class="lb-seg__thumb" style="width:' + (100 / o.length) + '%;transform:none;left:3px"></span>' + o.map(function (x, i) { return '<button type="button" aria-checked="' + (i === 0) + '">' + esc(x) + '</button>'; }).join('') + '</div>'; } },
    card: { label: 'Card', def: { title: 'Weekly digest', text: 'A short summary of what changed, delivered every Monday.', cta: 'Read more' }, fields: [['title', 'Title', 'text'], ['text', 'Text', 'textarea'], ['cta', 'Button', 'text']], html: function (p) { return '<div class="gen-card"><h3>' + esc(p.title) + '</h3><p class="gen-text">' + esc(p.text) + '</p>' + (p.cta ? '<div class="gen-row"><button class="lb-btn lb-btn--sm"><span class="lb-btn__label">' + esc(p.cta) + '</span></button></div>' : '') + '</div>'; } },
    feature: { label: 'Feature', def: { icon: 'Bolt', title: 'Fast by default', text: 'Built from tokens, so every screen stays consistent and quick.' }, fields: [['icon', 'Icon', 'select', ['Bolt', 'Shield', 'Heart', 'Globe', 'Lock', 'Bell', 'Spark']], ['title', 'Title', 'text'], ['text', 'Text', 'textarea']], html: function (p) { var m = { Bolt: 'i-zap', Shield: 'i-shield', Heart: 'i-heart', Globe: 'i-globe', Lock: 'i-lock', Bell: 'i-bell', Spark: 'i-spark' }; return '<div class="gen-feature"><span class="gen-feature__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><use href="#' + (m[p.icon] || 'i-zap') + '"/></svg></span><div class="gen-feature__b"><h3>' + esc(p.title) + '</h3><p>' + esc(p.text) + '</p></div></div>'; } },
    stat: { label: 'Stat', def: { value: '98%', label: 'Uptime' }, fields: [['value', 'Value', 'text'], ['label', 'Label', 'text']], html: function (p) { return '<div class="gen-stat"><b>' + esc(p.value) + '</b><span>' + esc(p.label) + '</span></div>'; } },
    statrow: { label: 'Stat row', def: { a: '12k', al: 'Users', b: '98%', bl: 'Uptime', c: '4.9', cl: 'Rating' }, fields: [['a', 'Value 1', 'text'], ['al', 'Label 1', 'text'], ['b', 'Value 2', 'text'], ['bl', 'Label 2', 'text'], ['c', 'Value 3', 'text'], ['cl', 'Label 3', 'text']], html: function (p) { return '<div class="gen-statrow"><div class="gen-stat"><b>' + esc(p.a) + '</b><span>' + esc(p.al) + '</span></div><div class="gen-stat"><b>' + esc(p.b) + '</b><span>' + esc(p.bl) + '</span></div><div class="gen-stat"><b>' + esc(p.c) + '</b><span>' + esc(p.cl) + '</span></div></div>'; } },
    badge: { label: 'Badges', def: {}, fields: [], html: function () { return '<div class="gen-row">' + ['success', 'warning', 'danger', 'info'].map(function (v) { return '<span class="lb-badge lb-badge--' + v + '">' + v[0].toUpperCase() + v.slice(1) + '</span>'; }).join('') + '</div>'; } },
    chiprow: { label: 'Chips', def: { chips: 'Design, Motion, Tokens, A11y' }, fields: [['chips', 'Chips (comma)', 'text']], html: function (p) { return '<div class="gen-row">' + p.chips.split(',').map(function (x) { return '<span class="lb-chip">' + esc(x.trim()) + '</span>'; }).join('') + '</div>'; } },
    avatar: { label: 'Avatars', def: {}, fields: [], html: function () { return '<div class="avatars"><span class="av">MS</span><span class="av">JD</span><span class="av">KC</span><span class="av">+9</span></div>'; } }
  };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ============ model ============ */
  var state = { nodes: [], sel: null, theme: null, seed: 1, prompt: '', vibe: null, device: 'laptop-web', icon: 18, scale: 1, layout: 'flow', _scale: 1 };
  var uid = 0; function nid() { return 'n' + (++uid); }

  function persist() { try { localStorage.setItem(STORE, JSON.stringify({ nodes: state.nodes, seed: state.seed, prompt: state.prompt, vibe: state.vibe, device: state.device, icon: state.icon, scale: state.scale, layout: state.layout, theme: state.theme })); } catch (e) {} }

  function renderCanvas() {
    if (!state.nodes.length) { screen.classList.add('empty'); screen.innerHTML = '<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" style="color:var(--lb-faint)"><use href="#i-spark"/></svg><span class="big">Start forging</span><span style="max-width:36ch;font-size:.9rem">Drag components in, or press Auto-build for a full screen, then Generate to theme it.</span>'; relayout(); return; }
    screen.classList.remove('empty');
    var free = state.layout === 'free';
    screen.classList.toggle('st-screen--free', free);
    screen.innerHTML = '';
    var bar = '<div class="st-node__bar">' +
      '<button data-act="up" aria-label="' + (free ? 'Bring forward' : 'Move up') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#i-up"/></svg></button>' +
      '<button data-act="down" aria-label="' + (free ? 'Send back' : 'Move down') + '"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#i-down"/></svg></button>' +
      '<button data-act="dup" aria-label="Duplicate"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><use href="#i-copy"/></svg></button>' +
      '<button data-act="del" aria-label="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><use href="#i-trash"/></svg></button>' +
      '</div>';
    state.nodes.forEach(function (node) {
      var shell = document.createElement('div');
      shell.className = 'st-node' + (state.sel === node.id ? ' selected' : '');
      shell.dataset.id = node.id;
      shell.setAttribute('draggable', free ? 'false' : 'true');
      var extra = free ? '<span class="st-node__resize" data-resize></span><span class="st-node__dims"></span>' : '';
      shell.innerHTML = bar + CT[node.type].html(node.props) + extra;
      if (free) {
        shell.style.left = (node.x || 0) + 'px'; shell.style.top = (node.y || 0) + 'px';
        shell.style.width = (node.w || 260) + 'px'; if (node.h) shell.style.height = node.h + 'px';
      }
      screen.appendChild(shell);
    });
    if (free) fitFreeHeight();
    relayout();
  }

  function fitFreeHeight() {
    var d = DEVICES[state.device] || DEVICES['laptop-web'];
    var maxB = 400;
    $$('.st-node', screen).forEach(function (el) { maxB = Math.max(maxB, el.offsetTop + el.offsetHeight); });
    screen.style.minHeight = (maxB + 40) + 'px';
  }

  function addNode(type, index, pos) {
    var node = { id: nid(), type: type, props: JSON.parse(JSON.stringify(CT[type].def)) };
    if (state.layout === 'free') {
      if (pos) { node.x = Math.max(0, Math.round(pos.x)); node.y = Math.max(0, Math.round(pos.y)); node.w = pos.w || 240; }
      else { var k = state.nodes.length % 8; node.x = 40 + k * 22; node.y = 40 + k * 22; node.w = 240; }
    }
    if (index == null || index >= state.nodes.length) state.nodes.push(node); else state.nodes.splice(index, 0, node);
    state.sel = node.id; renderCanvas(); renderInspector(); persist(); return node;
  }
  function nodeIndex(id) { for (var i = 0; i < state.nodes.length; i++) if (state.nodes[i].id === id) return i; return -1; }
  function act(id, a) {
    var i = nodeIndex(id); if (i < 0) return;
    if (a === 'del') { state.nodes.splice(i, 1); if (state.sel === id) state.sel = null; }
    else if (a === 'up' && i > 0) { state.nodes.splice(i - 1, 0, state.nodes.splice(i, 1)[0]); }
    else if (a === 'down' && i < state.nodes.length - 1) { state.nodes.splice(i + 1, 0, state.nodes.splice(i, 1)[0]); }
    else if (a === 'dup') { var c = { id: nid(), type: state.nodes[i].type, props: JSON.parse(JSON.stringify(state.nodes[i].props)) }; state.nodes.splice(i + 1, 0, c); state.sel = c.id; }
    renderCanvas(); renderInspector(); persist();
  }

  /* ============ inspector ============ */
  function renderInspector() {
    var el = $('#stInspector');
    var node = state.nodes.filter(function (n) { return n.id === state.sel; })[0];
    if (!node) { el.innerHTML = '<p class="st-insp__empty">Select a component on the canvas to edit its content and variant.</p>'; return; }
    var f = CT[node.type].fields;
    var head = '<p class="st-meta" style="margin-bottom:.8rem"><b>' + CT[node.type].label + '</b></p>';
    var pos = '';
    if (state.layout === 'free' && node.x != null) {
      var pf = function (k, lab, val, ph) { return '<label class="st-pf"><span>' + lab + '</span><input type="number" inputmode="numeric" data-pos="' + k + '" value="' + (val === '' || val == null ? '' : val) + '"' + (ph ? ' placeholder="' + ph + '"' : '') + '></label>'; };
      pos = '<span class="st-rail__h" style="margin-bottom:.5rem">Position &amp; size</span><div class="st-possize">' + pf('x', 'X', node.x) + pf('y', 'Y', node.y) + pf('w', 'W', node.w || 240) + pf('h', 'H', node.h == null ? '' : node.h, 'auto') + '</div>';
    }
    var fields = !f.length ? '<p class="st-insp__empty" style="margin-top:.7rem">No content fields. Use the toolbar and the corner handle.</p>' :
      ('<span class="st-rail__h" style="margin:1.1rem 0 .5rem">Content</span>' + f.map(function (fd) {
        var key = fd[0], lab = fd[1], type = fd[2], val = node.props[key];
        if (type === 'select') return '<div class="st-field"><label>' + lab + '</label><select data-k="' + key + '">' + fd[3].map(function (o) { return '<option ' + (o === val ? 'selected' : '') + '>' + o + '</option>'; }).join('') + '</select></div>';
        if (type === 'textarea') return '<div class="st-field"><label>' + lab + '</label><textarea data-k="' + key + '">' + esc(val) + '</textarea></div>';
        if (type === 'bool') return '<div class="st-field"><label class="lb-switch"><input type="checkbox" data-k="' + key + '" ' + (val ? 'checked' : '') + '><span class="lb-switch__track"></span> ' + lab + '</label></div>';
        return '<div class="st-field"><label>' + lab + '</label><input data-k="' + key + '" value="' + esc(val) + '"></div>';
      }).join(''));
    el.innerHTML = head + pos + fields;
    $$('[data-k]', el).forEach(function (inp) {
      inp.addEventListener('input', function () {
        node.props[inp.dataset.k] = inp.type === 'checkbox' ? inp.checked : inp.value; renderCanvas(); persist();
      });
    });
    $$('[data-pos]', el).forEach(function (inp) {
      inp.addEventListener('input', function () {
        var k = inp.dataset.pos;
        node[k] = inp.value === '' ? (k === 'h' ? null : 0) : Math.max(0, parseInt(inp.value, 10) || 0);
        var shell = screen.querySelector('.st-node[data-id="' + node.id + '"]');
        if (shell) { shell.style.left = (node.x || 0) + 'px'; shell.style.top = (node.y || 0) + 'px'; shell.style.width = (node.w || 240) + 'px'; shell.style.height = node.h ? node.h + 'px' : ''; }
        fitFreeHeight(); relayout(); persist();
      });
    });
  }

  /* ============ generate ============ */
  function generate(newSeed) {
    if (newSeed !== false) state.seed = Math.floor(Math.random() * 1e9);
    rng = mulberry32(state.seed);
    var it = parseIntent(state.prompt, state.vibe);
    var t = makeTheme(it);
    applyTheme(t);
    $('#stSeed').textContent = '#' + state.seed.toString(36).slice(0, 6);
    toast('success', 'Generated', it.vibe + ' · ' + t.pairName + ' · ' + t.textRatio + ':1 text');
  }

  /* ============ auto-build ============ */
  var TEMPLATES = [
    [['eyebrow', { text: 'Now in beta' }], ['heading', { text: 'A calmer place to focus', level: 'h1' }], ['text', {}], ['gen_buttons'], ['divider', {}], ['statrow', {}]],
    [['heading', { text: 'Create your account', level: 'h2' }], ['text', { text: 'Start free. No card, no noise.' }], ['input', { label: 'Email', placeholder: 'you@studio.com' }], ['input', { label: 'Password', placeholder: '••••••••' }], ['button', { label: 'Create account', variant: 'primary', size: 'lg' }], ['toggle', { label: 'Email me product updates', on: false }]],
    [['eyebrow', { text: 'Dashboard' }], ['heading', { text: 'This week', level: 'h2' }], ['statrow', {}], ['segmented', {}], ['card', {}], ['badge', {}]],
    [['image', {}], ['eyebrow', { text: 'Feature' }], ['heading', { text: 'Built from tokens', level: 'h1' }], ['text', {}], ['chiprow', {}], ['gen_buttons']]
  ];
  function autoBuild() {
    var tpl = pick(TEMPLATES.length ? TEMPLATES : TEMPLATES); state.nodes = []; state.sel = null; uid = 0;
    tpl.forEach(function (row) {
      if (row[0] === 'gen_buttons') { state.nodes.push({ id: nid(), type: 'button', props: { label: 'Get started', variant: 'primary', size: 'md' } }); return; }
      var type = row[0], over = row[1] || {};
      state.nodes.push({ id: nid(), type: type, props: Object.assign(JSON.parse(JSON.stringify(CT[type].def)), over) });
    });
    renderCanvas(); renderInspector();
    generate();
  }

  /* ============ drag & drop ============ */
  var dragType = null, dragId = null;
  $$('.st-pal__item').forEach(function (item) {
    item.addEventListener('click', function () { addNode(item.dataset.type); scrollBottom(); });
    item.addEventListener('dragstart', function (e) { dragType = item.dataset.type; dragId = null; e.dataTransfer.effectAllowed = 'copy'; try { e.dataTransfer.setData('text/plain', item.dataset.type); } catch (x) {} item.classList.add('dragging'); });
    item.addEventListener('dragend', function () { item.classList.remove('dragging'); clearInsert(); });
  });
  var insertLine = document.createElement('div'); insertLine.className = 'st-insert';
  function clearInsert() { if (insertLine.parentNode) insertLine.remove(); }
  function insertionIndex(y) {
    var kids = $$('.st-node', screen);
    for (var i = 0; i < kids.length; i++) { var r = kids[i].getBoundingClientRect(); if (y < r.top + r.height / 2) { screen.insertBefore(insertLine, kids[i]); return i; } }
    screen.appendChild(insertLine); return kids.length;
  }
  screen.addEventListener('dragover', function (e) { if (!dragType && !dragId) return; e.preventDefault(); e.dataTransfer.dropEffect = dragId ? 'move' : 'copy'; screen.classList.add('drop-active'); insertionIndex(e.clientY); });
  screen.addEventListener('dragleave', function (e) { if (!screen.contains(e.relatedTarget)) { screen.classList.remove('drop-active'); clearInsert(); } });
  screen.addEventListener('drop', function (e) {
    e.preventDefault(); screen.classList.remove('drop-active'); clearInsert();
    if (state.layout === 'free' && dragType) {
      var sr = screen.getBoundingClientRect(), s = state._scale || 1;
      addNode(dragType, null, { x: (e.clientX - sr.left) / s - 20, y: (e.clientY - sr.top) / s - 16, w: 240 });
      dragType = dragId = null; return;
    }
    var idx = insertionIndex(e.clientY); clearInsert();
    if (dragId) { var from = nodeIndex(dragId); if (from < 0) return; var n = state.nodes.splice(from, 1)[0]; if (from < idx) idx--; state.nodes.splice(idx, 0, n); renderCanvas(); persist(); }
    else if (dragType) { if (screen.classList.contains('empty')) idx = 0; addNode(dragType, idx); }
    dragType = dragId = null;
  });
  // node reorder + select + toolbar (event delegation)
  screen.addEventListener('dragstart', function (e) { var node = e.target.closest('.st-node'); if (!node) return; dragId = node.dataset.id; dragType = null; node.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', 'move'); } catch (x) {} });
  screen.addEventListener('dragend', function (e) { var node = e.target.closest('.st-node'); if (node) node.classList.remove('dragging'); clearInsert(); });
  screen.addEventListener('click', function (e) {
    if (suppressClick) return;
    var btn = e.target.closest('.st-node__bar button');
    var node = e.target.closest('.st-node'); if (!node) return;
    if (btn) { e.stopPropagation(); act(node.dataset.id, btn.dataset.act); return; }
    state.sel = node.dataset.id; renderCanvas(); renderInspector();
  });
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Delete' || e.key === 'Backspace') && state.sel && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); act(state.sel, 'del'); }
  });
  function scrollBottom() { var c = $('#stCanvas'); c.scrollTop = c.scrollHeight; }

  /* ============ free mode: layout switch + move/resize ============ */
  var suppressClick = false;
  function enterFree() {
    state.nodes.forEach(function (node) {
      if (node.x != null) return;
      var el = screen.querySelector('.st-node[data-id="' + node.id + '"]');
      if (el) { node.x = Math.round(el.offsetLeft); node.y = Math.round(el.offsetTop); node.w = Math.round(el.offsetWidth); }
      else { node.x = 40; node.y = 40; node.w = 240; }
    });
  }
  function setLayout(mode) {
    if (mode === state.layout) return;
    if (mode === 'free') enterFree();
    state.layout = mode; renderCanvas(); renderInspector(); persist();
  }
  (function freeDrag() {
    var mode = null, curId = null, sx = 0, sy = 0, ox = 0, oy = 0, ow = 0, oh = 0, moved = false, curEl = null;
    function findNode(id) { for (var i = 0; i < state.nodes.length; i++) if (state.nodes[i].id === id) return state.nodes[i]; }
    function down(e) {
      if (state.layout !== 'free' || (e.button != null && e.button !== 0)) return;
      var el = e.target.closest('.st-node'); if (!el || !screen.contains(el)) return;
      if (e.target.closest('.st-node__bar')) return;
      var node = findNode(el.dataset.id); if (!node) return;
      curEl = el; curId = node.id; sx = e.clientX; sy = e.clientY; moved = false;
      mode = e.target.closest('[data-resize]') ? 'resize' : 'move';
      ox = node.x || 0; oy = node.y || 0; ow = node.w || el.offsetWidth; oh = node.h || el.offsetHeight;
      try { el.setPointerCapture(e.pointerId); } catch (x) {}
      el.classList.add(mode === 'resize' ? 'rezing' : 'moving');
      e.preventDefault();
    }
    function move(e) {
      if (!mode) return;
      var s = state._scale || 1, dx = (e.clientX - sx) / s, dy = (e.clientY - sy) / s;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      var node = findNode(curId); if (!node) return;
      var snap = e.altKey ? 1 : 8, rnd = function (v) { return Math.round(v / snap) * snap; };
      var dims = curEl.querySelector('.st-node__dims');
      if (mode === 'move') {
        node.x = Math.max(0, rnd(ox + dx)); node.y = Math.max(0, rnd(oy + dy));
        curEl.style.left = node.x + 'px'; curEl.style.top = node.y + 'px';
        if (dims) dims.textContent = node.x + ', ' + node.y;
      } else {
        node.w = Math.max(40, rnd(ow + dx)); node.h = Math.max(28, rnd(oh + dy));
        curEl.style.width = node.w + 'px'; curEl.style.height = node.h + 'px';
        if (dims) dims.textContent = node.w + ' × ' + node.h;
      }
    }
    function up() {
      if (!mode) return; mode = null;
      if (curEl) curEl.classList.remove('moving', 'rezing');
      if (moved) { state.sel = curId; fitFreeHeight(); relayout(); renderInspector(); persist(); suppressClick = true; setTimeout(function () { suppressClick = false; }, 60); }
      curEl = null;
    }
    screen.addEventListener('pointerdown', down);
    screen.addEventListener('pointermove', move);
    screen.addEventListener('pointerup', up);
    screen.addEventListener('pointercancel', up);
  })();

  /* ============ segmented helper ============ */
  function initSeg(seg, onSel) {
    var btns = $$('button', seg), thumb = $('.lb-seg__thumb', seg);
    function layout() { var a = $('[aria-checked="true"]', seg); if (a && thumb) { thumb.style.width = a.offsetWidth + 'px'; thumb.style.transform = 'translateX(' + (a.offsetLeft - 3) + 'px)'; } }
    function sel(b) { btns.forEach(function (x) { x.setAttribute('aria-checked', x === b ? 'true' : 'false'); }); layout(); onSel && onSel(b); }
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { sel(b); });
      b.addEventListener('keydown', function (e) { var d = /Right|Down/.test(e.key) ? 1 : /Left|Up/.test(e.key) ? -1 : 0; if (!d) return; e.preventDefault(); var n = btns[(i + d + btns.length) % btns.length]; sel(n); n.focus(); });
    });
    layout(); window.addEventListener('resize', layout); return { layout: layout };
  }

  /* ============ toast ============ */
  function toast(type, title, msg) {
    var root = $('#toasts'); if (!root) return;
    var el = document.createElement('div'); el.className = 'lb-toast lb-toast--' + type; el.setAttribute('role', 'status');
    el.innerHTML = '<span class="lb-toast__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="' + (type === 'success' ? '#i-check' : '#i-code') + '"/></svg></span><div class="lb-toast__body"><b>' + title + '</b><br>' + msg + '</div><button class="lb-toast__x" aria-label="Dismiss"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#i-x"/></svg></button>';
    function go() { el.classList.add('out'); setTimeout(function () { el.remove(); }, 350); }
    $('.lb-toast__x', el).addEventListener('click', go); root.appendChild(el); setTimeout(go, 3200);
  }

  /* ============ export ============ */
  function buildTokens(t) {
    return [':root {', '  --bg: ' + t.bg + ';', '  --surface: ' + t.surface + ';', '  --surface-2: ' + t.surface2 + ';',
      '  --text: ' + t.text + ';', '  --muted: ' + t.muted + ';', '  --border: ' + t.border + ';',
      '  --accent: ' + t.accent + ';', '  --on-accent: ' + t.onAccent + ';', '  --focus: ' + t.focus + ';',
      '  --success: ' + t.success + ';', '  --warning: ' + t.warning + ';', '  --danger: ' + t.danger + ';', '  --info: ' + t.info + ';',
      '  --radius: ' + t.radius + 'px;', '  --font-display: ' + t.display + ';', '  --font-body: ' + t.body + ';', '}'].join('\n');
  }
  function buildJson(t) {
    return JSON.stringify({ color: { bg: t.bg, surface: t.surface, text: t.text, muted: t.muted, accent: t.accent, onAccent: t.onAccent, focus: t.focus, success: t.success, warning: t.warning, danger: t.danger, info: t.info }, radius: t.radius + 'px', shadow: t.sh2, type: { display: t.display.replace(/'/g, ''), body: t.body.replace(/'/g, '') }, meta: { seed: state.seed, textContrast: t.textRatio + ':1' } }, null, 2);
  }
  function buildHtml(t) {
    var dw = (DEVICES[state.device] || DEVICES['laptop-web']).w;
    var head = '<!-- Generated by The Forge · seed #' + state.seed.toString(36).slice(0, 6) + ' · ' + state.device + ' · ' + state.layout + ' -->\n';
    var base = '\n.screen :is(h1,h2){font-family:var(--font-display);letter-spacing:-.02em;margin:0}\n</style>\n';
    if (state.layout === 'free') {
      var h = 400;
      var inner = state.nodes.map(function (n) {
        var el = screen.querySelector('.st-node[data-id="' + n.id + '"]');
        if (el) h = Math.max(h, el.offsetTop + el.offsetHeight);
        var st = 'position:absolute;left:' + (n.x || 0) + 'px;top:' + (n.y || 0) + 'px;width:' + (n.w || 240) + 'px;' + (n.h ? 'height:' + n.h + 'px;' : '');
        return '    <div style="' + st + '">\n      ' + CT[n.type].html(n.props).replace(/\n/g, '\n      ') + '\n    </div>';
      }).join('\n');
      return head + '<style>\n' + buildTokens(t) + '\n.screen{position:relative;background:var(--bg);color:var(--text);font-family:var(--font-body);width:' + dw + 'px;height:' + (Math.round(h) + 40) + 'px;border-radius:calc(var(--radius) + 8px);margin:auto;overflow:hidden}' + base + '<div class="screen">\n' + inner + '\n</div>';
    }
    var inner2 = state.nodes.map(function (n) { return '    ' + CT[n.type].html(n.props).replace(/\n/g, '\n    '); }).join('\n');
    return head + '<style>\n' + buildTokens(t) + '\n.screen{background:var(--bg);color:var(--text);font-family:var(--font-body);padding:2rem;border-radius:calc(var(--radius) + 8px);display:flex;flex-direction:column;gap:' + (t.dense ? 12 : 18) + 'px;max-width:' + dw + 'px;margin:auto}' + base + '<div class="screen">\n' + inner2 + '\n</div>';
  }
  function openExport() {
    if (!state.theme) generate();
    $('#stCodeHtml').textContent = buildHtml(state.theme);
    $('#stCodeTokens').textContent = buildTokens(state.theme);
    $('#stCodeJson').textContent = buildJson(state.theme);
    $('#stSheet').classList.add('open');
    setTimeout(function () { var s = $('#stExportTabs'), a = $('[aria-checked=true]', s), th = $('.lb-seg__thumb', s); if (a && th) { th.style.width = a.offsetWidth + 'px'; th.style.transform = 'translateX(' + (a.offsetLeft - 3) + 'px)'; } }, 30);
  }
  function currentCode() { var b = $('#stExportTabs [aria-checked="true"]').dataset.fmt; return $('#stCode' + (b === 'html' ? 'Html' : b === 'tokens' ? 'Tokens' : 'Json')).textContent; }
  function copy(text, ok) { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { toast('success', 'Copied', ok); }).catch(function () {}); }

  /* ============ wiring ============ */
  $('#stGen').addEventListener('click', function () { generate(); });
  $('#stAuto').addEventListener('click', function () { autoBuild(); scrollBottom(); });
  $('#stExport').addEventListener('click', openExport);
  $('#stReset') && $('#stReset').addEventListener('click', function () { state.nodes = []; state.sel = null; renderCanvas(); renderInspector(); persist(); });
  $('#stPrompt').addEventListener('input', function () { state.prompt = this.value; });
  $('#stPrompt').addEventListener('keydown', function (e) { if (e.key === 'Enter') { state.vibe = null; $$('.st-vibe').forEach(function (v) { v.setAttribute('aria-pressed', 'false'); }); generate(); } });
  $$('.st-vibe').forEach(function (v) { v.addEventListener('click', function () { var on = v.getAttribute('aria-pressed') !== 'true'; $$('.st-vibe').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); }); v.setAttribute('aria-pressed', String(on)); state.vibe = on ? v.dataset.vibe : null; generate(); }); });

  // design-system sliders
  $('#stRad').addEventListener('input', function () { if (!state.theme) return; state.theme.radius = +this.value; applyTheme(state.theme); });
  $('#stDen').addEventListener('input', function () { if (!state.theme) return; state.theme.dense = +this.value; applyTheme(state.theme); });
  $('#stDep').addEventListener('input', function () { if (!state.theme) return; state.theme.depth = +this.value; state.theme = makeThemeKeep(state.theme); applyTheme(state.theme); });
  function makeThemeKeep(t) { // recompute shadows for new depth
    var it = { hue: t.hue, sat: t.sat, dark: t.dark, round: t.radius, dense: t.dense, depth: t.depth, pair: { d: t.display, b: t.body, n: t.pairName } };
    var nt = makeTheme(it); nt.radius = t.radius; nt.dense = t.dense; return nt;
  }
  $('#stPalette').addEventListener('click', function (e) { var b = e.target.closest('.st-tok'); if (b) copy(b.dataset.c, b.dataset.c + ' → clipboard'); });

  // device preset + sizing
  $('#stDevice').addEventListener('change', function () { applyDevice(this.value); });
  window.addEventListener('resize', relayout);
  $('#stIco').addEventListener('input', function () { state.icon = +this.value; screen.style.setProperty('--gen-icon', this.value + 'px'); $('#stIcoOut').textContent = this.value + 'px'; persist(); relayout(); });
  $('#stTxt').addEventListener('input', function () { state.scale = +this.value / 100; screen.style.setProperty('--gen-scale', state.scale); $('#stTxtOut').textContent = this.value + '%'; persist(); relayout(); });
  initSeg($('#stLayout'), function (b) { setLayout(b.dataset.layout); });
  // export tabs
  initSeg($('#stExportTabs'), function (b) { ['Html', 'Tokens', 'Json'].forEach(function (x, i) { $('#stCode' + x).hidden = (b.dataset.fmt === 'html' ? 0 : b.dataset.fmt === 'tokens' ? 1 : 2) !== i; }); });
  $('#stCopy').addEventListener('click', function () { copy(currentCode(), 'Code on your clipboard'); });
  $('#stSheetClose').addEventListener('click', function () { $('#stSheet').classList.remove('open'); });
  $('#stSheet').addEventListener('click', function (e) { if (e.target === $('#stSheet')) $('#stSheet').classList.remove('open'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('#stSheet').classList.remove('open'); });

  // chrome theme toggle
  $('#stChrome').addEventListener('click', function () {
    var dark = body.getAttribute('data-theme') !== 'dark'; body.setAttribute('data-theme', dark ? 'dark' : 'light');
    this.querySelector('use').setAttribute('href', dark ? '#i-sun' : '#i-moon');
  });

  // mobile palette strip = clone of palette items
  var palbar = $('#stPalbar');
  $$('.st-pal__item').slice(0, 12).forEach(function (it) { var c = it.cloneNode(true); c.removeAttribute('draggable'); c.addEventListener('click', function () { addNode(it.dataset.type); scrollBottom(); }); palbar.appendChild(c); });

  /* ============ init ============ */
  function syncSizers() {
    var ico = $('#stIco'), txt = $('#stTxt');
    if (ico) { ico.value = state.icon; $('#stIcoOut').textContent = state.icon + 'px'; screen.style.setProperty('--gen-icon', state.icon + 'px'); }
    if (txt) { txt.value = Math.round(state.scale * 100); $('#stTxtOut').textContent = Math.round(state.scale * 100) + '%'; screen.style.setProperty('--gen-scale', state.scale); }
  }
  var saved = null; try { saved = JSON.parse(localStorage.getItem(STORE) || 'null'); } catch (e) {}
  if (saved && saved.nodes && saved.nodes.length) {
    state.nodes = saved.nodes; state.seed = saved.seed || 1; state.prompt = saved.prompt || ''; state.vibe = saved.vibe || null;
    state.device = DEVICES[saved.device] ? saved.device : 'laptop-web'; state.icon = saved.icon || 18; state.scale = saved.scale || 1;
    state.layout = saved.layout === 'free' ? 'free' : 'flow';
    uid = state.nodes.length + 1;
    $('#stPrompt').value = state.prompt;
    if (state.vibe) { var vb = $('.st-vibe[data-vibe="' + state.vibe + '"]'); if (vb) vb.setAttribute('aria-pressed', 'true'); }
    $('#stDevice').value = state.device; syncSizers(); applyDevice(state.device);
    $$('#stLayout button').forEach(function (b) { b.setAttribute('aria-checked', b.dataset.layout === state.layout ? 'true' : 'false'); });
    renderCanvas(); renderInspector();
    if (saved.theme) { state.theme = saved.theme; applyTheme(saved.theme); $('#stSeed').textContent = '#' + state.seed.toString(36).slice(0, 6); }
    else generate(false);
  } else {
    $('#stDevice').value = state.device; syncSizers(); applyDevice(state.device);
    autoBuild();
  }
  function relayoutAll() { relayout(); $$('.lb-seg').forEach(function (s) { var a = $('[aria-checked=true]', s), th = $('.lb-seg__thumb', s); if (a && th && a.offsetWidth) { th.style.width = a.offsetWidth + 'px'; th.style.transform = 'translateX(' + (a.offsetLeft - 3) + 'px)'; } }); }
  window.addEventListener('load', relayoutAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayoutAll);
  setTimeout(relayoutAll, 140);
})();
