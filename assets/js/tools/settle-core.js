/* Lún móng cọc theo móng khối quy ước và móng nông — TCVN 9362:2012, TCVN 10304:2014. Đơn vị: kN, m. */
(function (root) {
  function k0(l, b, z) {
    if (z <= 1e-9) return 1;
    var m = l / b, n = 2 * z / b, r = Math.sqrt(1 + m * m + n * n);
    return 2 / Math.PI * (m * n * (1 + m * m + 2 * n * n) / (r * (m * m + n * n) * (1 + n * n)) + Math.asin(m / (Math.sqrt(m * m + n * n) * Math.sqrt(1 + n * n))));
  }
  /* layers: [{t (dày), g (γ), c, phi, E}] từ mặt đất; zw mực nước ngầm (sâu); */
  function profile(layers, zw) {
    var z = 0, L = layers.map(function (l) { var o = Object.assign({ top: z, bot: z + l.t }, l); z += l.t; return o; });
    function at(d) { for (var i = 0; i < L.length; i++) if (d <= L[i].bot + 1e-9) return L[i]; return L[L.length - 1]; }
    function sbt(d) { var s = 0, st = 0.05; for (var t = 0; t < d - 1e-9; t += st) { var zz = Math.min(d, t + st), m = (t + zz) / 2, g = at(m).g; s += (zz - t) * (m > zw ? g - 10 : g); } return s; }
    function avg(k, d1, d2) { var s = 0, st = 0.05, w = 0; for (var t = d1; t < d2 - 1e-9; t += st) { var zz = Math.min(d2, t + st); s += at((t + zz) / 2)[k] * (zz - t); w += zz - t; } return w ? s / w : 0; }
    return { L: L, at: at, sbt: sbt, avg: avg, total: z };
  }
  /* p: {mode:'pile'|'pad', unload (bool), ze (độ sâu đáy hố đào), layers, zw, B, Lc (kích thước đài/móng), hc (sâu đáy đài/móng từ mặt đất), hf (dày đài), D, n (cọc), Lp (dài cọc), N, Mx, My (kN, kN·m), m, Slim (cm), beta} */
  function settle(p) {
    var P = profile(p.layers, p.zw), pile = p.mode === 'pile';
    var Df = pile ? p.hc + p.Lp : p.hc, phiTb = pile ? P.avg('phi', p.hc, Df) : 0;
    var Bq = pile ? p.B - p.D + 2 * p.Lp * Math.tan(phiTb / 4 * Math.PI / 180) : p.B;
    var Lq = pile ? p.Lc - p.D + 2 * p.Lp * Math.tan(phiTb / 4 * Math.PI / 180) : p.Lc;
    var A = Bq * Lq;
    // Trọng lượng khối quy ước (đất + cọc + đài) phía trên mặt phẳng mũi cọc
    var Wc = p.B * p.Lc * p.hf * 25, Wp = 0, G;
    if (pile) {
      Wp = p.n * Math.PI * p.D * p.D / 4 * p.Lp * (25 - P.avg('g', p.hc, Df));
      G = A * (P.sbt(Df) - P.sbt(p.hc)) + Wp + Wc;
    } else G = A * (p.hf * 25 + Math.max(0, p.hc - p.hf) * P.avg('g', 0, p.hc));
    var s0 = (p.N + G) / A, ex = p.My / (p.N + G), ey = p.Mx / (p.N + G);
    var smax = s0 * (1 + 6 * ex / Bq + 6 * ey / Lq), smin = s0 * (1 - 6 * ex / Bq - 6 * ey / Lq);
    var ly = P.at(Df), ph = ly.phi * Math.PI / 180, den = 1 / Math.tan(ph) + ph - Math.PI / 2;
    var cA = 0.25 * Math.PI / den, cB = 1 + Math.PI / den, cD = Math.PI / Math.tan(ph) / den;
    var g1 = P.sbt(Df) / Df, g2 = ly.g > 0 && Df + 0.5 * Bq > p.zw ? ly.g - 10 : ly.g;
    var R = p.m * (cA * Bq * g2 + cB * Df * g1 + cD * ly.c);
    // Lún: cộng lớp phân tố từ mặt phẳng mũi cọc / đáy móng
    var ref = p.unload ? 0 : Math.max(0, p.ze || 0), bt = function (d) { return P.sbt(d) - P.sbt(ref); };
    var sbt0 = bt(Df), pgl = Math.max(0, s0 - sbt0), hi = 0.2 * Bq, S = 0, z = 0, rows = [], zmax = P.total - Df;
    for (var k = 0; k < 400 && z < zmax - 1e-9; k++) {
      var z2 = Math.min(z + hi, zmax), s1 = k0(Lq, Bq, z) * pgl, s2 = k0(Lq, Bq, z2) * pgl, E = P.at(Df + (z + z2) / 2).E;
      var dS = p.beta * (s1 + s2) / 2 * (z2 - z) / E * 100, bt2 = bt(Df + z2), lim = E < 5000 ? 0.1 : 0.2;
      rows.push({ z: z2, K: k0(Lq, Bq, z2), sgl: s2, sbt: bt2, E: E, dS: dS }); S += dS; z = z2;
      if (s2 <= lim * bt2) break;
    }
    var ended = rows.length && rows[rows.length - 1].sgl <= (rows[rows.length - 1].E < 5000 ? 0.1 : 0.2) * rows[rows.length - 1].sbt;
    return { Df: Df, phiTb: phiTb, Bq: Bq, Lq: Lq, A: A, G: G, Wp: Wp, Wc: Wc, s0: s0, smax: smax, smin: smin, ex: ex, ey: ey, cA: cA, cB: cB, cD: cD, g1: g1, g2: g2, R: R,
      sbt0: sbt0, pgl: pgl, S: S, rows: rows, ended: ended, rB: s0 / R, rBm: smax / (1.2 * R), rS: S / p.Slim };
  }
  var api = { settle: settle, k0: k0 };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SETL = api;
})(this);
