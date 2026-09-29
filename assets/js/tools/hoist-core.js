/* Vận thăng (hoist): tải trọng, móng độc lập trên nền, chống phụ khi đặt trên sàn. Đơn vị: kN, m, kPa. */
(function (root) {
  /* p: {nl, PLc (kg/lồng), BU (kg khung đế), mm (kg/đốt 1,5 m), H (m), kd} */
  function load(p) {
    var PL = p.nl * p.PLc, nk = p.H / 1.5, HM = Math.max(0, nk - 2) * p.mm, DL = PL + 2 * p.BU / 3;
    var MT = 0.1 * (PL + p.BU + DL + HM), G = PL + p.BU + HM + MT + DL;
    return { PL: PL, nk: nk, HM: HM, DL: DL, MT: MT, G: G, Ntc: G / 100, N: p.kd * G / 100 };
  }
  // Hệ số ứng suất tại tâm móng chữ nhật (Boussinesq), m = l/b, z độ sâu dưới đáy móng
  function k0(l, b, z) {
    if (z <= 1e-9) return 1;
    var m = l / b, n = 2 * z / b, r = Math.sqrt(1 + m * m + n * n);
    return 2 / Math.PI * (m * n * (1 + m * m + 2 * n * n) / (r * (m * m + n * n) * (1 + n * n)) + Math.asin(m / (Math.sqrt(m * m + n * n) * Math.sqrt(1 + n * n))));
  }
  /* Móng độc lập: p = {Ntc, N, b, l, h, a, am, Df, g1 (γ' trên đáy), g2 (γ dưới đáy), c, phi, m1, m2, ktc, Rb, Rbt (MPa), Rs, ds, s (mm),
       layers:[{z (đáy lớp, m dưới mặt đất), E (kPa)}], zw, Slim (cm), beta} */
  function footing(p) {
    var A = p.b * p.l, h0 = p.h - p.a, ph = p.phi * Math.PI / 180;
    var cA = 0.25 * Math.PI / (1 / Math.tan(ph) + ph - Math.PI / 2), cB = 1 + Math.PI / (1 / Math.tan(ph) + ph - Math.PI / 2), cD = Math.PI / Math.tan(ph) / (1 / Math.tan(ph) + ph - Math.PI / 2);
    var R = p.m1 * p.m2 / p.ktc * (cA * p.b * p.g2 + cB * p.Df * p.g1 + cD * p.c);
    var gtb = (p.h * 25 + (p.Df - p.h) * p.g1) / p.Df, sig = p.Ntc / A + gtb * p.Df;
    var pn = p.N / A, bp = p.am + 2 * h0, Pxt = pn * Math.max(0, A - bp * bp), Pcx = p.Rbt * 1000 * 4 * (p.am + h0) * h0;
    var Ml = pn * Math.pow(p.l - p.am, 2) / 8, Mb = pn * Math.pow(p.b - p.am, 2) / 8;
    function As(M) { var am = M * 1e6 / (p.Rb * 1000 * Math.pow(h0 * 1000, 2)); var x = 1 - Math.sqrt(Math.max(0, 1 - 2 * am)); return { am: am, As: x * p.Rb * 1000 * h0 * 1000 / p.Rs, ok: am < 0.5 }; }
    var Asl = As(Ml), Asb = As(Mb), Asp = Math.PI * p.ds * p.ds / 4 * 1000 / p.s;
    // Lún: cộng lớp phân tố hi = 0,2b, dừng khi σgl ≤ 0,2σbt
    var pgl = p.Ntc / A + (gtb - p.g2) * p.Df, hi = 0.2 * p.b, S = 0, z = 0, rows = [], zmax = p.layers.length ? p.layers[p.layers.length - 1].z - p.Df : 0;
    function Eat(zg) { for (var i = 0; i < p.layers.length; i++) if (zg <= p.layers[i].z + 1e-9) return p.layers[i].E; return p.layers.length ? p.layers[p.layers.length - 1].E : 1e9; }
    function sbt(zg) { var s0 = 0, step = 0.05; for (var t = 0; t < zg - 1e-9; t += step) { var zz = Math.min(zg, t + step); s0 += (zz - t) * (((t + zz) / 2) > p.zw ? p.g2 - 10 : p.g2); } return s0; }
    for (var k = 0; k < 200 && z < zmax - 1e-9; k++) {
      var z2 = Math.min(z + hi, zmax), s1 = k0(p.l, p.b, z) * pgl, s2 = k0(p.l, p.b, z2) * pgl, E = Eat(p.Df + (z + z2) / 2);
      var dS = p.beta * (s1 + s2) / 2 * (z2 - z) / E * 100, bt = sbt(p.Df + z2);
      rows.push({ z: z2, K: k0(p.l, p.b, z2), sgl: s2, sbt: bt, E: E, dS: dS }); S += dS; z = z2;
      if (s2 <= 0.2 * bt) break;
    }
    return { A: A, h0: h0, cA: cA, cB: cB, cD: cD, R: R, gtb: gtb, sig: sig, rB: sig / R, pn: pn, Pxt: Pxt, Pcx: Pcx, rP: Pxt / Pcx,
      Ml: Ml, Mb: Mb, Asl: Asl, Asb: Asb, Asp: Asp, rAl: Asl.As / Asp, rAb: Asb.As / Asp, pgl: pgl, S: S, rS: S / p.Slim, sett: rows };
  }
  /* Đặt trên sàn: p = {N, hs, a, am, Rbt, P (kN/cây), floors:[{name, a, b (ô sàn, m), SDL, LL, nS, nL, l1, b1}]} */
  function onslab(p) {
    var h0 = (p.hs - p.a) / 1000, Pcx = p.Rbt * 1000 * 4 * (p.am / 1000 + h0) * h0;
    var fl = p.floors, out = [], q = p.N / (fl[0].a * fl[0].b);
    for (var i = 0; i < fl.length; i++) {
      var F = fl[i], qtk = F.nS * F.SDL + F.nL * F.LL, r = { name: F.name, q: q, qtk: qtk, need: q > qtk };
      if (r.need) { r.Pp = (q - qtk) * F.l1 * F.b1; r.rP = r.Pp / p.P; out.push(r); if (i + 1 < fl.length) q = (q - qtk) * F.a * F.b / (fl[i + 1].a * fl[i + 1].b); else { r.left = (q - qtk); break; } }
      else { out.push(r); break; }
    }
    return { h0: h0, Pcx: Pcx, rPun: p.N / Pcx, q0: p.N / (fl[0].a * fl[0].b), rows: out };
  }
  var api = { load: load, k0: k0, footing: footing, onslab: onslab };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.HOIST = api;
})(this);
