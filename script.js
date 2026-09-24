// Language toggle: EN <-> VI. Choice remembered; ?lang=vi in the URL forces Vietnamese.
(function () {
  var root = document.documentElement;
  var param = new URLSearchParams(location.search).get('lang');
  var saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) {}
  var lang = param || saved || ((navigator.language || '').startsWith('vi') ? 'vi' : 'en');

  function apply(l) {
    root.setAttribute('data-lang', l);
    root.setAttribute('lang', l);
    try { localStorage.setItem('lang', l); } catch (e) {}
  }
  apply(lang === 'vi' ? 'vi' : 'en');

  document.getElementById('langBtn').addEventListener('click', function () {
    apply(root.getAttribute('data-lang') === 'en' ? 'vi' : 'en');
  });
  document.getElementById('yr').textContent = new Date().getFullYear();
})();
