/* Cẩu tháp: móng nông, móng cọc, bu lông neo chân tháp, thanh gông (TCVN 9362, 5574:2018, 5575:2012, ACI 318). Đơn vị: kN, m. */
(function (root) {
  function bearingR(p) {
    var ph = p.phi * Math.PI / 180, den = 1 / Math.tan(ph) + ph - Math.PI / 2;
    var A = 0.25 * Math.PI / den, B = 1 + Math.PI / den, D = Math.PI / Math.tan(ph) / den;
    return { A: A, B: B, D: D, R: p.m1 * p.m2 / p.ktc * (A * p.b * p.g2 + B * p.Df * p.g1 + D * p.c) };
  }
  function k0(l, b, z) {
    if (z <= 1e-9) return 1;
    var m = l / b, n = 2 * z / b, r = Math.sqrt(1 + m * m + n * n);
    return 2 / Math.PI * (m * n * (1 + m * m + 2 * n * n) / (r * (m * m + n * n) * (1 + n * n)) + Math.asin(m / (Math.sqrt(m * m + n * n) * Math.sqrt(1 + n * n))));
  }
  // Ba hướng gió/cần: theo cạnh b, theo cạnh l, theo đường chéo (M/√2 mỗi trục)
  function cases(L) {
    var s = Math.SQRT1_2;
    return [{ k: 'x', Mx: L.M, My: 0, Qx: L.Q, Qy: 0 }, { k: 'y', Mx: 0, My: L.M, Qx: 0, Qy: L.Q }, { k: 'd', Mx: s * L.M, My: s * L.M, Qx: s * L.Q, Qy: s * L.Q }];
  }
  /* Móng nông: p = {b, l, h, a, Df, bc, g1 (γ' trên đáy), g2 (γ dưới đáy), c, phi, m1, m2, ktc, ins {N,M,Q}, out {N,M,Q},
       Rb, Rbt (MPa), Rs, ds, s (mm), kt (hệ số tải 1,2), FSo, FSs, layers [{z, E}], zw, Slim (cm), beta} */
  function shallow(p) {
    var A = p.b * p.l, Wb = p.l * p.b * p.b / 6, Wl = p.b * p.l * p.l / 6, h0 = p.h - p.a;
    var br = bearingR(p), gtb = (p.h * 25 + (p.Df - p.h) * p.g1) / p.Df, R = br.R;
    var st = [], pmaxN = 0, pminN = 1e9, worst = { r: 0 };
    [['ins', p.ins], ['out', p.out]].forEach(function (S) {
      cases(S[1]).forEach(function (c) {
        var Mxt = c.Mx + c.Qx * p.h, Myt = c.My + c.Qy * p.h;
        var s0 = S[1].N / A + gtb * p.Df, smax = s0 + Mxt / Wb + Myt / Wl, smin = s0 - Mxt / Wb - Myt / Wl;
        var nmax = S[1].N / A + Mxt / Wb + Myt / Wl, nmin = S[1].N / A - Mxt / Wb - Myt / Wl;
        var o = { st: S[0], dir: c.k, s0: s0, smax: smax, smin: smin, r0: s0 / R, r1: smax / (1.2 * R), ok: smin >= 0 && s0 <= R && smax <= 1.2 * R };
        st.push(o); pmaxN = Math.max(pmaxN, nmax); pminN = Math.min(pminN, nmin);
      });
    });
    var Gf = A * p.h * 25;
    function ot(L) { var Mr = L.N * p.l / 2 + Gf * p.l / 2, Mo = L.M + L.Q * p.h; return { Mr: Mr, Mo: Mo, FS: Mr / Mo }; }
    function sl(L) { var Fr = L.N * Math.tan(p.phi * Math.PI / 180) + p.c * A, Fo = 1.2 * L.Q; return { Fr: Fr, Fo: Fo, FS: Fr / Fo }; }
    var oti = ot(p.ins), oto = ot(p.out), sli = sl(p.ins), slo = sl(p.out);
    // Áp lực tính toán thuần (không kể trọng lượng móng & đất), dùng cho chọc thủng và cốt thép
    var pmx = p.kt * pmaxN, pmn = p.kt * Math.max(0, pminN), L = Math.max(p.l, p.b);
    var cst = 0.5 * (L - p.bc - 2 * h0), p1 = pmn + (pmx - pmn) * (L + p.bc + 2 * h0) / (2 * L), pav = (p1 + pmx) / 2;
    var Pxt = Math.max(0, cst) * p.b * pav, Pcx = p.Rbt * 1000 * (p.bc + h0) * h0;
    var pf = pmn + (pmx - pmn) * (L + p.bc) / (2 * L), Mf = (2 * pmx + pf) * Math.pow(L - p.bc, 2) / 24;
    var am = Mf * 1e6 / (p.Rb * 1000 * Math.pow(h0 * 1000, 2)), xi = 1 - Math.sqrt(Math.max(0, 1 - 2 * am)), Asr = xi * p.Rb * 1000 * h0 * 1000 / p.Rs;
    var Asp = Math.PI * p.ds * p.ds / 4 * 1000 / p.s;
    // Lún
    var Nmax = Math.max(p.ins.N, p.out.N), pgl = Nmax / A + (gtb - p.g1) * p.Df, hi = 0.2 * p.b, S = 0, z = 0, sett = [];
    var zmax = p.layers.length ? p.layers[p.layers.length - 1].z - p.Df : 0;
    function Eat(zg) { for (var i = 0; i < p.layers.length; i++) if (zg <= p.layers[i].z + 1e-9) return p.layers[i].E; return p.layers.length ? p.layers[p.layers.length - 1].E : 1e9; }
    function sbt(zg) { var s0 = 0, d = 0.05; for (var t = 0; t < zg - 1e-9; t += d) { var zz = Math.min(zg, t + d); s0 += (zz - t) * (((t + zz) / 2) > p.zw ? p.g2 - 10 : (((t + zz) / 2) < p.Df ? p.g1 : p.g2)); } return s0; }
    for (var k = 0; k < 300 && z < zmax - 1e-9; k++) {
      var z2 = Math.min(z + hi, zmax), s1 = k0(p.l, p.b, z) * pgl, s2 = k0(p.l, p.b, z2) * pgl, E = Eat(p.Df + (z + z2) / 2);
      var dS = p.beta * (s1 + s2) / 2 * (z2 - z) / E * 100, bt = sbt(p.Df + z2);
      sett.push({ z: z2, K: k0(p.l, p.b, z2), sgl: s2, sbt: bt, E: E, dS: dS }); S += dS; z = z2;
      if (s2 <= 0.2 * bt) break;
    }
    return { A: A, h0: h0, br: br, R: R, gtb: gtb, st: st, Gf: Gf, oti: oti, oto: oto, sli: sli, slo: slo, pmx: pmx, pmn: pmn, cst: cst, pav: pav, Pxt: Pxt, Pcx: Pcx,
      Mf: Mf, am: am, Asr: Asr, Asp: Asp, pgl: pgl, S: S, sett: sett };
  }
  /* Móng cọc: p = {nx, ny, sx, sy, bx, by (kích thước đài), h, a, bc, Pc, Pt (sức chịu kéo), ins, out, kt, Rb, Rs, ds, s} */
  function piled(p) {
    var xs = [], ys = [], pts = [];
    for (var i = 0; i < p.nx; i++) xs.push((i - (p.nx - 1) / 2) * p.sx);
    for (var j = 0; j < p.ny; j++) ys.push((j - (p.ny - 1) / 2) * p.sy);
    xs.forEach(function (x) { ys.forEach(function (y) { pts.push([x, y]); }); });
    var n = pts.length, Sx2 = pts.reduce(function (t, q) { return t + q[0] * q[0]; }, 0), Sy2 = pts.reduce(function (t, q) { return t + q[1] * q[1]; }, 0);
    var Gc = p.bx * p.by * p.h * 25, h0 = p.h - p.a, out = [], Pmax = -1e9, Pmin = 1e9, Mface = 0;
    [['ins', p.ins], ['out', p.out]].forEach(function (S) {
      cases(S[1]).forEach(function (c) {
        var My = c.Mx + c.Qx * p.h, Mx = c.My + c.Qy * p.h; // Mx gây chênh theo x
        var R = pts.map(function (q) { return (S[1].N + Gc) / n + (Sx2 ? My * q[0] / Sx2 : 0) + (Sy2 ? Mx * q[1] / Sy2 : 0); });
        var mx = Math.max.apply(null, R), mn = Math.min.apply(null, R);
        out.push({ st: S[0], dir: c.k, max: mx, min: mn }); Pmax = Math.max(Pmax, mx); Pmin = Math.min(Pmin, mn);
        // Mô men tại mép thân tháp (tải tính toán, trừ trọng lượng đài)
        var Mf = 0; pts.forEach(function (q, k) { var d = q[0] - p.bc / 2; if (d > 0) Mf += p.kt * (R[k] - Gc / n) * d; });
        Mface = Math.max(Mface, Mf / p.by);
      });
    });
    var am = Mface * 1e6 / (p.Rb * 1000 * Math.pow(h0 * 1000, 2)), xi = 1 - Math.sqrt(Math.max(0, 1 - 2 * am)), Asr = xi * p.Rb * 1000 * h0 * 1000 / p.Rs;
    var Asp = Math.PI * p.ds * p.ds / 4 * 1000 / p.s;
    return { n: n, pts: pts, Gc: Gc, cases: out, Pmax: Pmax, Pmin: Pmin, rC: Pmax / p.Pc, rT: Pmin < 0 ? -Pmin / p.Pt : 0, Mface: Mface, am: am, Asr: Asr, Asp: Asp, h0: h0 };
  }
  /* Bu lông neo chân tháp: p = {T (kN, lực nhổ 1 chân), H (lực cắt 1 chân), n, kt, A, Abn (cm²), fvb, ftb (MPa), gb, d (mm), L, L0, LH (mm), Rbtn (MPa), beta, gam} */
  function anchors(p) {
    var N1 = p.kt * p.T / p.n, Q1 = p.kt * p.H / p.n;
    var Ntb = p.Abn * 1e-4 * p.ftb * 1e3, Nvb = p.fvb * 1e3 * p.A * 1e-4 * p.gb;
    var Nb = p.beta * p.gam * p.Rbtn * 1e3 * Math.PI * p.d * (p.L - p.L0 + p.LH) * 1e-6;
    return { N1: N1, Q1: Q1, Ntb: Ntb, Nvb: Nvb, Nb: Nb, rT: N1 / Ntb, rV: Q1 / Nvb, rB: N1 / Nb, rTV: Math.pow(N1 / Ntb, 2) + Math.pow(Q1 / Nvb, 2) };
  }
  // Hệ số uốn dọc φ (TCVN 5575:2012, công thức 8)
  function phi(lb, f, E) {
    var r = f / E;
    if (lb <= 2.5) return 1 - (0.073 - 5.53 * r) * lb * Math.sqrt(lb);
    if (lb <= 4.5) return 1.47 - 13 * r - (0.371 - 27.3 * r) * lb + (0.0275 - 5.53 * r) * lb * lb;
    return 332 / (lb * lb * (51 - lb));
  }
  /* Thanh gông: p = {s (isec cm), N, L (m), mu, lim, f (kN/cm²), fu, E, gc, bolt:{nb, d, A, fvb, fcb, gb, nv, t (mm)}, weld:{hf, lf (mm), n, fwf}, pin:{d (mm), nv, t (mm), fvb, fcb, gb},
       anc:{AVc, ca1, ca2, ha, le, da, fc (MPa), psic, phi}} */
  function tie(p) {
    var s = p.s, A = s.A, ix = Math.sqrt(s.Jx / A), iy = Math.sqrt(s.Jy / A), L0 = p.mu * p.L * 100;
    var lx = L0 / ix, ly = L0 / iy, lmax = Math.max(lx, ly), lb = lmax * Math.sqrt(p.f / p.E), ph = phi(lb, p.f, p.E);
    var sig = p.N / A, rS = sig / (p.f * p.gc), rB = p.N / (ph * A * p.f * p.gc), rL = lmax / p.lim;
    var b = p.bolt, Nvb = b.nb * b.fvb / 10 * b.gb * b.A * b.nv, Ncb = b.nb * b.d / 10 * b.fcb / 10 * b.gb * b.t / 10, rBo = p.N / Math.min(Nvb, Ncb);
    var w = p.weld, Aw = w.hf / 10 * w.lf / 10 * w.n, tw = p.N / Aw, fw = Math.min(0.7 * w.fwf, 0.45 * p.fu) * p.gc, rW = tw / fw;
    var q = p.pin, Ap = Math.PI * Math.pow(q.d / 10, 2) / 4, Nvp = q.fvb / 10 * q.gb * Ap * q.nv, Ncp = q.d / 10 * q.fcb / 10 * q.gb * q.t / 10, rP = p.N / Math.min(Nvp, Ncp);
    var c = p.anc, ca1 = c.ca1, AVco = 4.5 * ca1 * ca1;
    var ped = c.ca2 >= 1.5 * ca1 ? 1 : 0.7 + 0.3 * c.ca2 / (1.5 * ca1);
    var ph_ = Math.max(1, Math.sqrt(1.5 * ca1 / c.ha));
    var Vb = 0.6 * Math.pow(Math.min(c.le, 8 * c.da) / c.da, 0.2) * Math.sqrt(c.da) * Math.sqrt(c.fc) * Math.pow(ca1, 1.5) / 1000;
    var Vcbg = Math.min(1, c.AVc / AVco) * ped * c.psic * ph_ * Vb, Vd = c.phi * Vcbg, rA = p.N / Vd;
    return { ix: ix, iy: iy, lx: lx, ly: ly, lmax: lmax, lb: lb, ph: ph, sig: sig, rS: rS, rB: rB, rL: rL, Nvb: Nvb, Ncb: Ncb, rBo: rBo, Aw: Aw, tw: tw, fw: fw, rW: rW,
      Nvp: Nvp, Ncp: Ncp, rP: rP, AVco: AVco, ped: ped, phh: ph_, Vb: Vb, Vcbg: Vcbg, Vd: Vd, rA: rA };
  }
  var api = { bearingR: bearingR, k0: k0, shallow: shallow, piled: piled, anchors: anchors, phi: phi, tie: tie };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CRANE = api;
})(this);
