/* Mahdi Saiah — EN/FR language toggle
   English lives in the DOM; French lives in data-fr attributes.
   On switch we swap innerHTML and cache the original English in data-en. */
(function () {
  'use strict';

  var KEY = 'ms_lang';
  var toggles = document.querySelectorAll('[data-lang]');
  var nodes = document.querySelectorAll('[data-fr]');

  var TITLES = {
    en: 'Mahdi Saiah · Product designer, building Connect',
    fr: 'Mahdi Saiah · Product designer, je construis Connect'
  };

  function apply(lang) {
    var isFr = lang === 'fr';
    document.documentElement.setAttribute('lang', lang);

    nodes.forEach(function (el) {
      if (el.getAttribute('data-en') === null) {
        el.setAttribute('data-en', el.innerHTML); // cache original English once
      }
      el.innerHTML = isFr ? el.getAttribute('data-fr') : el.getAttribute('data-en');
    });

    document.title = TITLES[isFr ? 'fr' : 'en'];

    toggles.forEach(function (b) {
      var active = b.getAttribute('data-lang') === lang;
      b.classList.toggle('on', active);
      b.setAttribute('aria-pressed', active ? 'true' : 'false');
    });

    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }

  var saved;
  try { saved = localStorage.getItem(KEY); } catch (e) {}
  apply(saved === 'fr' ? 'fr' : 'en');

  toggles.forEach(function (b) {
    b.addEventListener('click', function () { apply(b.getAttribute('data-lang')); });
  });
})();
