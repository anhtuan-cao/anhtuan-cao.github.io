/* Giàn giáo bao che trên dầm I console (TCVN 5575:2012) — lõi tính toán. Đơn vị: kN, cm. */
(function (root) {
  // Tiết diện I hàn/cán: h, b, tw, tf (cm), bỏ qua góc lượn
  function isec(h, b, tw, tf) {
    var hw = h - 2 * tf;
    var Jx = (b * h * h * h - (b - tw) * hw * hw * hw) / 12;
    var Jy = (2 * tf * b * b * b + hw * tw * tw * tw) / 12;
    var Sx = b * tf * (h / 2 - tf / 2) + tw * (h / 2 - tf) * (h / 2 - tf) / 2;
    var It = (2 * b * tf * tf * tf + hw * tw * tw * tw) / 3;
    return { h: h, b: b, tw: tw, tf: tf, A: 2 * b * tf + hw * tw, Jx: Jx, Jy: Jy, Wx: Jx / (h / 2), Sx: Sx, It: It };
  }
  function parseI(name) { var a = String(name).split('x').map(parseFloat); return isec(a[0] / 10, a[1] / 10, a[2] / 10, a[3] / 10); }

  // Tải trọng một khoang giàn giáo (kG) — theo bảng tải của bảng tính gốc
  function loads(n, stair) {
    var dead = stair ? [
      ['Khung giáo 1,7 × 1,25 m', 'Frames 1.7 × 1.25 m', 12, n],
      ['Giằng chéo (cặp)', 'Cross braces (pairs)', 2.8, 2 * n],
      ['Mâm giáo', 'Scaffold decks', 10.39, 3 * n],
      ['Cầu thang giáo', 'Scaffold stairs', 20.07, n / 2],
      ['Ống giằng + khóa (m)', 'Tubes + couplers (m)', 2, n * 1.7 + 28.8],
      ['Console chắn vật rơi (m)', 'Debris-catch console (m)', 18.3, 1.6]] : [
      ['Khung giáo 1,7 × 1,25 m', 'Frames 1.7 × 1.25 m', 12, n],
      ['Giằng chéo (cặp)', 'Cross braces (pairs)', 2.8, 2 * n],
      ['Mâm giáo', 'Scaffold decks', 10.39, 4 * n],
      ['Ống giằng + khóa (m)', 'Tubes + couplers (m)', 2, n * 1.7 + 28.8],
      ['Console chắn vật rơi (m)', 'Debris-catch console (m)', 18.3, 1.6]];
    var live = stair ? [
      ['Người trên cầu thang', 'Workers on stairs', 75, 6],
      ['Người trên mâm', 'Workers on decks', 75, 6],
      ['Dụng cụ cầm tay', 'Hand tools', 25, 6]] : [
      ['Người trên mâm', 'Workers on decks', 75, 4],
      ['Người thi công console', 'Workers on console', 75, 2],
      ['Dụng cụ cầm tay', 'Hand tools', 25, 2]];
    return { dead: dead, live: live };
  }

  function psiCant(a) { return a <= 28 ? 1 + 0.16 * a : 4 + 0.05 * a; }

  /* p: {type:'coupler'|'ubolt', s (isec), f, fu, E, gc, P (kN/chân), L1, L2, L3 (lùi neo), Lt, H, dc (cm), Ec, fc, kc, Lc (cm),
        coupler: bolt {d (mm), A, Abn, fvb, ftb, fcb, gb, nv, tp (cm)}, n1, rows [cm], hw (cm), fwf, Rbt (kN/cm²), Lanc (cm)
        ubolt: nb (nhánh), Lanc } */
  function outrigger(p) {
    var s = p.s, E = p.E, EJ = E * s.Jx, a = Math.atan(p.Lt / p.H), ca = Math.cos(a), Ld = Math.sqrt(p.Lt * p.Lt + p.H * p.H);
    var Ac = Math.PI * p.dc * p.dc / 4;
    function fc(ai, x) { return ai <= x ? ai * ai * (3 * x - ai) / 6 : x * x * (3 * ai - x) / 6; }
    var num = 0, self;
    [p.L1, p.L2].forEach(function (ai) { num += fc(ai, p.Lt) + (p.type === 'ubolt' ? ai * p.L3 * p.Lt / 3 : 0); });
    self = p.type === 'ubolt' ? p.Lt * p.Lt * (p.L3 + p.Lt) / 3 : p.Lt * p.Lt * p.Lt / 3;
    var T = (p.P * num / EJ) / (Ld / (p.Ec * Ac * ca) + ca * self / EJ);
    T = Math.max(0, T);
    var Tv = T * ca;
    var M0 = p.P * (p.L1 + p.L2) - Tv * p.Lt;
    var Mt = p.P * (Math.max(0, p.L2 - p.Lt) + Math.max(0, p.L1 - p.Lt));
    var M = Math.max(Math.abs(M0), Mt), V = Math.max(Math.abs(2 * p.P - Tv), p.P);
    var fv = 0.58 * p.f;
    var rM = M / (s.Wx * p.f * p.gc), rV = V * s.Sx / (s.Jx * s.tw * fv * p.gc);
    var alpha = 1.54 * s.It / s.Jy * Math.pow(p.Lc / s.h, 2), psi = psiCant(alpha);
    var phi1 = psi * s.Jy / s.Jx * Math.pow(s.h / p.Lc, 2) * E / p.f, phib = phi1 <= 0.85 ? phi1 : Math.min(1, 0.68 + 0.21 * phi1);
    var rLTB = M / (phib * s.Wx * p.f * p.gc);
    var Tall = p.fc * Ac / p.kc, rT = T / Tall;
    var o = { a: a, Ld: Ld, T: T, Tv: Tv, M0: M0, Mt: Mt, M: M, V: V, rM: rM, rV: rV, alpha: alpha, psi: psi, phi1: phi1, phib: phib, rLTB: rLTB, Ac: Ac, Tall: Tall, rT: rT };
    function cone(h0, d) { var r1 = d / 2, r2 = r1 + h0, l = h0 * Math.SQRT2; return p.Rbt * Math.PI * (r1 + r2) * l; }
    if (p.type === 'coupler') {
      var b = p.bolt, n = p.n1 * (p.rows.length + 1), d = b.d / 10;
      var Nvb = b.fvb * b.gb * b.A * b.nv, Ncb = b.fcb * b.gb * d * b.tp, Ntb = b.ftb * b.Abn * b.gb;
      var lmax = Math.max.apply(null, p.rows), sl2 = p.rows.reduce(function (t, x) { return t + x * x; }, 0);
      var Nv = V / n, Nt = M * lmax / (p.n1 * sl2);
      // Đường hàn bản mã: cánh hàn hai phía (4 đường b − 1), bụng hai phía (2 đường h − 2tf − 1)
      var hh = p.hw, lf = s.b - 1, lw = s.h - 2 * s.tf - 1;
      var Jh = 4 * (hh * hh * hh * lf / 12 + hh * lf * Math.pow(s.h / 2 - s.tf / 2, 2)) + 2 * hh * lw * lw * lw / 12;
      var Wh = Jh / (s.h / 2), Awb = 2 * hh * lw, tw = Math.sqrt(Math.pow(M / Wh, 2) + Math.pow(V / Awb, 2));
      var fw = Math.min(0.7 * p.fwf, 0.45 * p.fu) * p.gc;
      var Pc = cone(p.Lanc, d);
      Object.assign(o, { n: n, Nvb: Nvb, Ncb: Ncb, Ntb: Ntb, Nv: Nv, Nt: Nt, rBv: Nv / Math.min(Nvb, Ncb), rBt: Nt / Ntb, Jh: Jh, Wh: Wh, Awb: Awb, tw: tw, fw: fw, rW: tw / fw, Pc: Pc, rPc: Nt / Pc });
    } else {
      var R = M0 / p.L3, Nb = R / p.nb, Ntb2 = p.ubolt.ftb * p.ubolt.Abn * p.ubolt.gb, Pc2 = cone(p.Lanc, p.ubolt.d / 10);
      Object.assign(o, { R: R, Nb: Nb, Ntb: Ntb2, rBt: Nb / Ntb2, Pc: Pc2, rPc: Nb / Pc2 });
    }
    return o;
  }
  var api = { isec: isec, parseI: parseI, loads: loads, outrigger: outrigger, psiCant: psiCant };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.SCAF = api;
})(this);
