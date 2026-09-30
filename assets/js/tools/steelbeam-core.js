/* Dầm thép hình / tổ hợp chịu uốn — TCVN 5575:2012. Đơn vị: kN, cm. */
(function (root) {
  function isec(h, b, tw, tf) {
    var hw = h - 2 * tf, Jx = (b * h * h * h - (b - tw) * hw * hw * hw) / 12, Jy = (2 * tf * b * b * b + hw * tw * tw * tw) / 12;
    return { h: h, b: b, tw: tw, tf: tf, hw: hw, A: 2 * b * tf + hw * tw, Jx: Jx, Jy: Jy, Wx: Jx / (h / 2), Sx: b * tf * (h / 2 - tf / 2) + tw * hw * hw / 8, Sf: b * tf * (h / 2 - tf / 2), It: (2 * b * tf * tf * tf + hw * tw * tw * tw) / 3 };
  }
  // ψ theo Phụ lục E (TCVN 5575:2012)
  function psi(type, load, flange, a) {
    if (type === 'cant') return flange === 'top' ? (a <= 28 ? 1 + 0.16 * a : 4 + 0.05 * a) : 6.2 + 0.08 * a;
    if (type === 'braced') return a <= 40 ? 2.25 + 0.07 * a : 3.6 + 0.04 * a - 3.5e-5 * a * a;
    if (load === 'udl') return flange === 'top' ? (a <= 40 ? 1.6 + 0.08 * a : 3.15 + 0.04 * a - 2.7e-5 * a * a) : (a <= 40 ? 3.8 + 0.08 * a : 5.35 + 0.04 * a - 2.7e-5 * a * a);
    return flange === 'top' ? (a <= 40 ? 1.75 + 0.09 * a : 3.3 + 0.053 * a - 4.5e-5 * a * a) : (a <= 40 ? 5.05 + 0.09 * a : 6.6 + 0.053 * a - 4.5e-5 * a * a);
  }
  /* p: {s, f, E, gc, M (kN·m), V, F (lực tập trung cục bộ), bsub, r, lo (cm), type:'simple'|'braced'|'cant', load:'udl'|'pt', flange:'top'|'bot'} */
  function check(p) {
    var s = p.s, fv = 0.58 * p.f, M = p.M * 100;
    var rM = M / (s.Wx * p.f * p.gc), tau = p.V * s.Sx / (s.Jx * s.tw), rV = tau / (fv * p.gc);
    var a = Math.min(1.54 * s.It / s.Jy * Math.pow(p.lo / s.h, 2), 400), ps = psi(p.type, p.load, p.flange, Math.max(a, 0.1));
    var phi1 = ps * s.Jy / s.Jx * Math.pow(s.h / p.lo, 2) * p.E / p.f, phib = Math.min(1, phi1 <= 0.85 ? phi1 : 0.68 + 0.21 * phi1);
    var rL = M / (phib * s.Wx * p.f * p.gc);
    var b0 = (s.b - s.tw - 2 * p.r) / 2, lim = 0.5 * Math.sqrt(p.E / p.f), rF = b0 / s.tf / lim;
    var lw = s.hw / s.tw, limw = 3.2 * Math.sqrt(p.E / p.f), rW = lw / limw;
    var lz = p.bsub + 2 * (s.tf + p.r), sc = p.F / (s.tw * lz), rC = sc / (p.f * p.gc);
    var sx = M * (s.hw / 2) / s.Jx, t1 = p.V * s.Sf / (s.Jx * s.tw), seq = Math.sqrt(sx * sx + sc * sc - sx * sc + 3 * t1 * t1), rE = seq / (1.15 * p.f * p.gc);
    return { rM: rM, tau: tau, rV: rV, a: a, psi: ps, phi1: phi1, phib: phib, rL: rL, b0: b0, lim: lim, rF: rF, lw: lw, limw: limw, rW: rW, lz: lz, sc: sc, rC: rC, sx: sx, t1: t1, seq: seq, rE: rE };
  }
  var api = { isec: isec, psi: psi, check: check };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SBEAM = api;
})(this);
