/* Dầm, sàn BTCT chịu uốn và cắt — TCVN 5574:2018. Đơn vị: N, mm, MPa (M kN·m, Q kN). */
(function (root) {
  /* p: {b, h, c (lớp bảo vệ tới mép thép), M, Q, Rb, Rbt, g1 (γb1), Rs, Rsc, Es, Rsw,
        t1:{n,d}, t2:{n,d}, cp:{n,d}, sw:{n,d,s}, slab (bool: b = 1000, thép Ø@s)} */
  function beam(p) {
    var Rb = p.g1 * p.Rb, Rbt = p.g1 * p.Rbt, b = p.b, h = p.h;
    var xiR = 0.8 / (1 + p.Rs / p.Es / 0.0035), aR = xiR * (1 - 0.5 * xiR);
    var A1 = p.t1.n * Math.PI * p.t1.d * p.t1.d / 4, A2 = p.t2.n * Math.PI * p.t2.d * p.t2.d / 4, As = A1 + A2;
    var y1 = p.c + p.t1.d / 2, y2 = p.c + p.t1.d + Math.max(p.t1.d, p.t2.d, 25) + p.t2.d / 2;
    var a = As > 0 ? (A1 * y1 + A2 * y2) / As : y1, h0 = h - a;
    var Asc = p.cp.n * Math.PI * p.cp.d * p.cp.d / 4, ac = p.c + p.cp.d / 2;
    var M = Math.abs(p.M) * 1e6, Q = Math.abs(p.Q) * 1e3;
    // Thép yêu cầu (với h0 theo bố trí)
    var am = M / (Rb * b * h0 * h0), req = {};
    if (am <= aR) { var xi = 1 - Math.sqrt(1 - 2 * am); req = { am: am, xi: xi, As: xi * Rb * b * h0 / p.Rs, Asc: 0, dbl: false }; }
    else { var Ascr = (M - aR * Rb * b * h0 * h0) / (p.Rsc * (h0 - ac)); req = { am: am, xi: xiR, As: (xiR * Rb * b * h0 + p.Rsc * Ascr) / p.Rs, Asc: Ascr, dbl: true }; }
    // Khả năng chịu uốn với thép bố trí
    var x = (p.Rs * As - p.Rsc * Asc) / (Rb * b), Mu, mode;
    if (Asc > 0 && x < 2 * ac) { var x0 = Math.min(p.Rs * As / (Rb * b), xiR * h0); Mu = Math.max(p.Rs * As * (h0 - ac), Rb * b * x0 * (h0 - x0 / 2)); mode = 'x<2a\''; x = x0; }
    else {
      if (x < 0) x = 0;
      if (x > xiR * h0) { x = xiR * h0; mode = 'ξ>ξR'; } else mode = 'ξ≤ξR';
      Mu = Rb * b * x * (h0 - x / 2) + p.Rsc * Asc * (h0 - ac);
    }
    // Chịu cắt
    var Qmax = 0.3 * p.Rb * p.g1 * b * h0;
    var qsw = p.sw && p.sw.n > 0 ? p.Rsw * p.sw.n * Math.PI * p.sw.d * p.sw.d / 4 / p.sw.s : 0;
    var useSw = qsw >= 0.25 * Rbt * b, best = { Q: Infinity };
    for (var k = 0; k <= 200; k++) {
      var cc = h0 + 2 * h0 * k / 200;
      var Qb = Math.min(2.5 * Rbt * b * h0, Math.max(0.5 * Rbt * b * h0, 1.5 * Rbt * b * h0 * h0 / cc));
      var c0 = Math.min(cc, 2 * h0), Qs = useSw ? 0.75 * qsw * c0 : 0;
      if (Qb + Qs < best.Q) best = { Q: Qb + Qs, Qb: Qb, Qs: Qs, c: cc };
    }
    var mu = As / (b * h0) * 100;
    return { xiR: xiR, aR: aR, As: As, Asc: Asc, a: a, h0: h0, ac: ac, req: req, x: x, Mu: Mu / 1e6, mode: mode, rM: M / Mu, qsw: qsw, useSw: useSw, sh: { Q: best.Q / 1e3, Qb: best.Qb / 1e3, Qs: best.Qs / 1e3, c: best.c },
      rQ: Q / best.Q, Qmax: Qmax / 1e3, rS: Q / Qmax, mu: mu, rMin: 0.1 / mu };
  }
  var api = { beam: beam };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RCB = api;
})(this);
