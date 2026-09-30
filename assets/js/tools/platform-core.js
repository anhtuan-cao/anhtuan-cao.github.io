/* Sàn tiếp liệu (loading platform) console có cáp neo — lõi tính toán. Đơn vị: kN, m (tiết diện cm). */
(function (root) {
  function box(b, h, t) { b /= 10; h /= 10; t /= 10; var J = (b * h * h * h - (b - 2 * t) * Math.pow(h - 2 * t, 3)) / 12; return { J: J, W: J / (h / 2), S: b * t * (h / 2 - t / 2) + 2 * (h / 2 - t) * t * (h / 4 - t / 2), tw: 2 * t, A: b * h - (b - 2 * t) * (h - 2 * t) }; }
  function isec(h, b, tw, tf) { h /= 10; b /= 10; tw /= 10; tf /= 10; var hw = h - 2 * tf, J = (b * h * h * h - (b - tw) * hw * hw * hw) / 12; return { J: J, W: J / (h / 2), S: b * tf * (h / 2 - tf / 2) + tw * (h / 2 - tf) * (h / 2 - tf) / 2, tw: tw, A: 2 * b * tf + hw * tw }; }
  function parse(name) { var a = String(name).split('x').map(parseFloat); return a.length === 3 ? box(a[0], a[1], a[2]) : isec(a[0], a[1], a[2], a[3]); }
  function chk(vi, en, v, lim, u, d) { return { vi: vi, en: en, val: v, lim: lim, unit: u, r: v / lim, d: d }; }
  // Dầm đơn giản chịu tải phân bố
  function ss(w, wtc, L, s, f, E, lim) {
    var M = w * L * L / 8, V = w * L / 2, sg = M / s.W * 1e3, tv = V * s.S / (s.J * s.tw) * 10, d = 5 * wtc * Math.pow(L, 4) / (384 * E * s.J) * 1e8;
    return { w: w, M: M, V: V, sg: sg, tv: tv, d: d, dl: L * 1000 / lim };
  }
  /* p: {B, L, P (kg), t (mm), f, E (MPa), gc, lim, pur (tên), L1, sec, L2, main, a, Lt, H, dc (mm), fc (MPa), kc, Ec (GPa), nb, Abn (cm²), ftb (MPa)} */
  function platform(p) {
    var f = p.f, E = p.E, gc = p.gc, fv = 0.58 * f;
    var gp = 78.5 * p.t / 1000, qP = p.P / 100 / (p.B * p.L);
    var q = 1.1 * gp + 1.2 * qP, qtc = gp + qP;
    // Tôn / thép tấm: dải 1 m liên tục nhịp L1
    var W1 = Math.pow(p.t, 2) / 6 * 1000 * 1e-9, J1 = Math.pow(p.t, 3) / 12 * 1000 * 1e-12; // m³, m⁴
    var M1 = q * p.L1 * p.L1 / 10, s1 = M1 / W1 / 1000, d1 = qtc * Math.pow(p.L1, 4) / (145 * E * 1000 * J1) * 1000;
    var sp = parse(p.pur), sc = parse(p.sec), sm = parse(p.main);
    var gP = 78.5 * sp.A * 1e-4, gS = 78.5 * sc.A * 1e-4, gM = 78.5 * sm.A * 1e-4;
    var w2 = q * p.L1 + gP, w2t = qtc * p.L1 + gP, o2 = ss(w2, w2t, p.L2, sp, f, E, p.lim);
    var w3 = w2 * p.L2 / p.L1 + gS, w3t = w2t * p.L2 / p.L1 + gS, o3 = ss(w3, w3t, p.B, sc, f, E, p.lim);
    var w4 = w3 * p.B / 2 / p.L2 + gM, w4t = w3t * p.B / 2 / p.L2 + gM;
    // Dầm chính: gối tại mép sàn, bu lông giữ lùi a, cáp tại Lt; tìm T theo tương thích
    var EJ = E * 1000 * sm.J * 1e-8, L = p.L, a = p.a, x = p.Lt, al = Math.atan(p.Lt / p.H), ca = Math.cos(al), Ld = Math.sqrt(p.Lt * p.Lt + p.H * p.H);
    var Ac = Math.PI * p.dc * p.dc / 4 * 1e-6, EA = p.Ec * 1e6 * Ac;
    function dq(w) { return (w * L * L / 2 * a / 3 * x + w * x * x * (6 * L * L - 4 * L * x + x * x) / 24) / EJ; }
    var T = Math.max(0, dq(w4t) / (Ld / (EA * ca) + ca * x * x * (a + x) / (3 * EJ)));
    var Tu = T * w4 / w4t, Tv = Tu * ca;
    var Mmax = 0, Vmax = 0;
    for (var i = 0; i <= 400; i++) { var xx = L * i / 400, M = w4 * (L - xx) * (L - xx) / 2 - (xx < x ? Tv * (x - xx) : 0), V = w4 * (L - xx) - (xx < x ? Tv : 0); Mmax = Math.max(Mmax, Math.abs(M)); Vmax = Math.max(Vmax, Math.abs(V)); }
    var M0 = w4 * L * L / 2 - Tv * x, Rb = Math.max(0, M0 / a), Re = w4 * L + Rb - Tv;
    var sg4 = Mmax / sm.W * 1e3, tv4 = Vmax * sm.S / (sm.J * sm.tw) * 10;
    var Tall = p.fc * 1000 * Ac / p.kc, Nb = Rb / p.nb, Ntb = p.ftb * 1000 * p.Abn * 1e-4;
    var groups = [
      { vi: 'Tôn / thép tấm sàn', en: 'Deck plate', checks: [chk('Ứng suất', 'Stress', s1, f * gc, 'MPa', 1), chk('Độ võng', 'Deflection', d1, p.L1 * 1000 / p.lim, 'mm', 2)] },
      { vi: 'Xà gồ', en: 'Purlins', checks: [chk('Uốn', 'Bending', o2.sg, f * gc, 'MPa', 1), chk('Cắt', 'Shear', o2.tv, fv * gc, 'MPa', 1), chk('Độ võng', 'Deflection', o2.d, o2.dl, 'mm', 2)] },
      { vi: 'Dầm phụ', en: 'Secondary beams', checks: [chk('Uốn', 'Bending', o3.sg, f * gc, 'MPa', 1), chk('Cắt', 'Shear', o3.tv, fv * gc, 'MPa', 1), chk('Độ võng', 'Deflection', o3.d, o3.dl, 'mm', 2)] },
      { vi: 'Dầm chính', en: 'Main beams', checks: [chk('Uốn', 'Bending', sg4, f * gc, 'MPa', 1), chk('Cắt', 'Shear', tv4, fv * gc, 'MPa', 1)] },
      { vi: 'Cáp neo', en: 'Tie cable', checks: [chk('Lực kéo cáp', 'Cable tension', Tu, Tall, 'kN', 2)] },
      { vi: 'Bu lông giữ đuôi dầm', en: 'Hold-down bolts', checks: [chk('Kéo 1 bu lông', 'Tension per bolt', Nb, Ntb, 'kN', 2)] }];
    return { q: q, qtc: qtc, M1: M1, s1: s1, d1: d1, w2: w2, o2: o2, w3: w3, o3: o3, w4: w4, T: Tu, Tv: Tv, al: al, Mmax: Mmax, Vmax: Vmax, M0: M0, Rb: Rb, Re: Re, sg4: sg4, tv4: tv4, Tall: Tall, Nb: Nb, Ntb: Ntb, groups: groups };
  }
  var api = { platform: platform, parse: parse };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PLAT = api;
})(this);
