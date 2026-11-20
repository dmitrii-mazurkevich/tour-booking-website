/* ==========================================================================
   Template kit: EN/RU switch, modal forms, carousel, filters, reveal, burger.
   Used by every page in sites/20-templates. Vanilla JS, no dependencies.
   Markup contract:
     data-t="k"            text node, Russian in window.TPL_RU[k]
     data-th="k"           innerHTML
     data-ta="attr:k|..."  attributes
     data-open="#id"       opens <dialog id>, data-close closes it
     data-form             validated demo form, shows [data-ok] inside it on submit
     data-carousel         wrapper with .car-track, [data-prev], [data-next]
     data-filters          chips with data-f, items in the same section with data-cat
     .rv                   fades up once when it enters the viewport
   ========================================================================== */
(function () {
  'use strict';
  var RU = window.TPL_RU || {};
  var root = document.documentElement;
  var KEY = 'tpl-lang';
  var cache = null;

  function nodes() { return document.querySelectorAll('[data-t],[data-th],[data-ta]'); }
  function remember() {
    if (cache) return;
    cache = [];
    nodes().forEach(function (el) {
      var r = { el: el };
      if (el.hasAttribute('data-t')) r.t = el.textContent;
      if (el.hasAttribute('data-th')) r.h = el.innerHTML;
      if (el.hasAttribute('data-ta')) {
        r.a = {};
        el.getAttribute('data-ta').split('|').forEach(function (p) { var a = p.split(':')[0]; r.a[a] = el.getAttribute(a); });
      }
      cache.push(r);
    });
  }
  function setLang(lang, save) {
    remember();
    cache.forEach(function (r) {
      if (r.t !== undefined) r.el.textContent = r.t;
      if (r.h !== undefined) r.el.innerHTML = r.h;
      if (r.a) Object.keys(r.a).forEach(function (a) { if (r.a[a] !== null) r.el.setAttribute(a, r.a[a]); });
    });
    if (lang === 'ru') {
      nodes().forEach(function (el) {
        var k = el.getAttribute('data-t'); if (k && RU[k] !== undefined) el.textContent = RU[k];
        var h = el.getAttribute('data-th'); if (h && RU[h] !== undefined) el.innerHTML = RU[h];
        var a = el.getAttribute('data-ta');
        if (a) a.split('|').forEach(function (p) { var x = p.split(':'); if (RU[x[1]] !== undefined) el.setAttribute(x[0], RU[x[1]]); });
      });
    }
    root.lang = lang; root.setAttribute('data-lang', lang); root.classList.remove('i18n-pending');
    document.querySelectorAll('[data-lang]').forEach(function (b) {
      if (b !== root) b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
    });
    if (save) { try { localStorage.setItem(KEY, lang); } catch (e) {} }
    try {
      var u = new URL(location.href);
      if (lang === 'en') u.searchParams.delete('lang'); else u.searchParams.set('lang', lang);
      history.replaceState(null, '', u.toString());
    } catch (e) {}
    document.dispatchEvent(new CustomEvent('langchange', { detail: lang }));
  }
  window.TPL = { lang: function () { return root.getAttribute('data-lang') || 'en'; }, setLang: setLang };

  var start = root.getAttribute('data-lang') || 'en';
  setLang(start, false);
  document.querySelectorAll('button[data-lang]').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang'), true); });
  });

  /* Modals ------------------------------------------------------------------ */
  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]');
    if (o) {
      var d = document.querySelector(o.getAttribute('data-open'));
      if (d && d.showModal) { e.preventDefault(); var pick = o.getAttribute('data-pick'); if (pick) { var s = d.querySelector('[name="service"]'); if (s) s.value = pick; } d.showModal(); }
    }
    if (e.target.closest('[data-close]')) { var dd = e.target.closest('dialog'); if (dd) dd.close(); }
    if (e.target.tagName === 'DIALOG') e.target.close();
  });

  /* Forms -------------------------------------------------------------------- */
  document.querySelectorAll('[data-form]').forEach(function (f) {
    f.setAttribute('novalidate', '');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      f.querySelectorAll('[required]').forEach(function (x) {
        var ok = x.type === 'checkbox' ? x.checked : x.value.trim().length > 0;
        x.classList.toggle('is-bad', !ok); if (!ok && !bad) bad = x;
      });
      if (bad) { bad.focus(); return; }
      var done = function () {
        var ok = f.querySelector('[data-ok]'), er = f.querySelector('[data-err]');
        if (er) er.hidden = true;
        f.classList.add('is-sent');
        if (ok) { ok.hidden = false; ok.setAttribute('tabindex', '-1'); ok.focus(); }
        f.reset();
      };
      /* data-endpoint="/api/lead.php": really send (FormData + time on page for the spam check); empty: demo */
      var ep = f.getAttribute('data-endpoint');
      if (!ep || !window.fetch) { done(); return; }
      var fd = new FormData(f), btn = f.querySelector('[type="submit"]');
      fd.append('elapsed', String(Math.round(window.performance ? performance.now() : 5000)));
      fd.append('page', location.pathname);
      fd.append('lang', root.getAttribute('data-lang') || 'en');
      if (btn) btn.disabled = true;
      f.classList.add('is-busy');
      fetch(ep, { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok || !j.ok) throw new Error(j.error || r.status); }); })
        .then(done, function () { var er = f.querySelector('[data-err]'); if (er) { er.hidden = false; er.setAttribute('tabindex', '-1'); er.focus(); } else done(); })
        .then(function () { if (btn) btn.disabled = false; f.classList.remove('is-busy'); });
    });
    f.addEventListener('input', function (e) { e.target.classList.remove('is-bad'); });
  });

  /* Burger ------------------------------------------------------------------- */
  var burger = document.querySelector('[data-burger]'), nav = document.querySelector('[data-nav]');
  if (burger && nav) {
    burger.addEventListener('click', function () { var o = !nav.classList.contains('is-open'); nav.classList.toggle('is-open', o); burger.setAttribute('aria-expanded', String(o)); });
    nav.addEventListener('click', function (e) { if (e.target.tagName === 'A') { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); } });
  }

  /* Carousel ----------------------------------------------------------------- */
  document.querySelectorAll('[data-carousel]').forEach(function (c) {
    var tr = c.querySelector('.car-track');
    var step = function (d) { var card = tr.firstElementChild; var w = card ? card.getBoundingClientRect().width + 20 : 300; tr.scrollBy({ left: d * w, behavior: 'smooth' }); };
    var p = c.querySelector('[data-prev]'), n = c.querySelector('[data-next]');
    if (p) p.addEventListener('click', function () { step(-1); });
    if (n) n.addEventListener('click', function () { step(1); });
  });

  /* Filters ------------------------------------------------------------------ */
  document.querySelectorAll('[data-filters]').forEach(function (g) {
    var scope = g.closest('section') || document;
    g.addEventListener('click', function (e) {
      var b = e.target.closest('[data-f]'); if (!b) return;
      var f = b.getAttribute('data-f');
      g.querySelectorAll('[data-f]').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      scope.querySelectorAll('[data-cat]').forEach(function (it) {
        var show = f === 'all' || it.getAttribute('data-cat').split(' ').indexOf(f) > -1;
        it.classList.toggle('is-hidden', !show);
      });
    });
  });

  /* Reveal ------------------------------------------------------------------- */
  var rv = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: .12 });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add('in'); });

  document.querySelectorAll('[data-year]').forEach(function (y) { y.textContent = new Date().getFullYear(); });
})();
