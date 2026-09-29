/* Giao diện chung cho các công cụ tính (song ngữ) */
(function () {
  var T = {};
  T.bi = function (vi, en) { return '<span class="l-vi">' + vi + '</span><span class="l-en">' + (en || vi) + '</span>'; };
  T.fmt = function (v, d) {
    if (v === undefined || v === null || !isFinite(v)) return '—';
    d = d === undefined ? 3 : d;
    var a = Math.abs(v);
    if (a !== 0 && (a < 1e-3 || a >= 1e6)) return v.toExponential(2);
    return (+v.toFixed(d)).toLocaleString('en-US', { maximumFractionDigits: d });
  };
  T.val = function (id) { var el = document.getElementById(id); if (!el) return NaN; if (el.type === 'checkbox') return el.checked; var x = parseFloat(String(el.value).replace(',', '.')); return x; };
  // Một dòng kiểm tra: tỷ số sử dụng ratio (<=1 là đạt)
  T.check = function (vi, en, ratio, note) {
    var ok = isFinite(ratio) && ratio <= 1;
    var pct = isFinite(ratio) ? Math.min(ratio, 1.5) / 1.5 * 100 : 100;
    return '<div class="ck ' + (ok ? 'ok' : 'ng') + '"><div class="ck-top"><span class="ck-name">' + T.bi(vi, en) + '</span>' +
      '<span class="ck-val">' + T.fmt(ratio, 3) + '</span><span class="badge">' + (ok ? T.bi('Đạt', 'OK') : T.bi('Không đạt', 'NOT OK')) + '</span></div>' +
      '<div class="ck-bar"><i style="width:' + pct + '%"></i><b></b></div>' + (note ? '<div class="ck-note">' + note + '</div>' : '') + '</div>';
  };
  // Dòng kiểm tra dạng hệ số an toàn FS >= FSreq
  T.fs = function (vi, en, FS, req, note) {
    var ok = isFinite(FS) && FS >= req;
    var pct = isFinite(FS) ? Math.min(FS / (req * 2), 1) * 100 : 0;
    return '<div class="ck ' + (ok ? 'ok' : 'ng') + '"><div class="ck-top"><span class="ck-name">' + T.bi(vi, en) + '</span>' +
      '<span class="ck-val">FS = ' + T.fmt(FS, 2) + ' ' + (ok ? '≥' : '<') + ' ' + T.fmt(req, 2) + '</span><span class="badge">' + (ok ? T.bi('Đạt', 'OK') : T.bi('Không đạt', 'NOT OK')) + '</span></div>' +
      '<div class="ck-bar fsbar"><i style="width:' + pct + '%"></i><b style="left:50%"></b></div>' + (note ? '<div class="ck-note">' + note + '</div>' : '') + '</div>';
  };
  T.verdict = function (ok, vi, en) {
    return '<div class="verdict ' + (ok ? 'ok' : 'ng') + '"><span class="v-ic">' + (ok ? '✓' : '!') + '</span><div><b>' +
      (ok ? T.bi('Tất cả điều kiện đều đạt', 'All checks satisfied') : T.bi('Có điều kiện không đạt', 'Some checks are not satisfied')) +
      '</b><small>' + T.bi(vi, en) + '</small></div></div>';
  };
  T.row = function (sym, vi, en, v, unit, d) {
    return '<tr><td class="sym">' + sym + '</td><td>' + T.bi(vi, en) + '</td><td class="num">' + (typeof v === 'string' ? v : T.fmt(v, d)) + '</td><td class="unit">' + (unit || '') + '</td></tr>';
  };
  T.table = function (rows) { return '<table class="calc-tbl"><tbody>' + rows.join('') + '</tbody></table>'; };
  T.bind = function (formId, run) {
    var f = document.getElementById(formId); if (!f) return;
    f.addEventListener('input', run); f.addEventListener('change', run);
    var rs = f.querySelector('[data-reset]');
    if (rs) rs.addEventListener('click', function (e) {
      e.preventDefault();
      f.querySelectorAll('input,select').forEach(function (el) {
        if (el.type === 'checkbox') el.checked = el.defaultChecked; else if (el.tagName === 'SELECT') { el.value = el.querySelector('option[selected]') ? el.querySelector('option[selected]').value : el.options[0].value; } else el.value = el.defaultValue;
      });
      run();
    });
    run();
  };
  window.TOOL = T;
})();
