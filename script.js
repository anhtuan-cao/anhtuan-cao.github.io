// EN <-> VI toggle (remembered per visitor; ?lang=vi or ?lang=en in the URL forces a language)
(function () {
  var root = document.documentElement;
  var param = new URLSearchParams(location.search).get('lang');
  var saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) {}
  var lang = param || saved || ((navigator.language || '').toLowerCase().indexOf('vi') === 0 ? 'vi' : 'en');

  function apply(l) {
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l);
    try { localStorage.setItem('lang', l); } catch (e) {}
  }
  apply(lang === 'vi' ? 'vi' : 'en');

  var btn = document.getElementById('langBtn');
  if (btn) btn.addEventListener('click', function () {
    apply(root.getAttribute('data-lang') === 'en' ? 'vi' : 'en');
  });

  // Mobile menu
  var mb = document.getElementById('menuBtn'), menu = document.getElementById('menu');
  if (mb && menu) {
    mb.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      mb.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('.drop a')) { menu.classList.remove('open'); mb.setAttribute('aria-expanded', 'false'); }
    });
  }

  // Highlight current section in the menu
  var seg = location.pathname.split('/')[1];
  if (seg) document.querySelectorAll('.m-top').forEach(function (a) {
    if (a.getAttribute('href') === '/' + seg + '/') a.classList.add('active');
  });

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
