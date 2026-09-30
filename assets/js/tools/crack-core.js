/* Nứt và võng cấu kiện BTCT chịu uốn — TCVN 5574:2018 mục 8.2. Đơn vị: N, mm, MPa (M kN·m, L m). */
(function (root) {
  /* p: {b, h, a, a2, As, As2, Md (kN·m, thường xuyên), Ml (tạm thời), psi (phần dài hạn của tạm thời), Rbser, Rbtser, Eb, Es, phicr, eps1L (εb1,red dài hạn), ds (mm),
        perm (bool hạn chế thấm), L (m), s (hệ số sơ đồ), flim (mm)} */
  function crackDefl(p) {
    var b = p.b, h = p.h, h0 = h - p.a, As = p.As, A2 = p.As2, Es = p.Es;
    var Mt = (p.Md + p.Ml) * 1e6, MlL = (p.Md + p.psi * p.Ml) * 1e6;
    // Tiết diện chưa nứt (quy đổi): trục trung hòa đo từ thớ chịu kéo
    var al = Es / p.Eb, A = b * h + al * (As + A2), S = b * h * h / 2 + al * (As * p.a + A2 * (h - p.a2)), yt = S / A;
    var I = b * h * h * h / 12 + b * h * Math.pow(h / 2 - yt, 2) + al * As * Math.pow(yt - p.a, 2) + al * A2 * Math.pow(h - p.a2 - yt, 2);
    var Mcrc = 1.3 * p.Rbtser * I / yt, cracked = Mt > Mcrc;
    // Tiết diện nứt: chiều cao vùng nén yc, mô men quán tính Ired
    function crackedSec(as1, as2) {
      var ms = As / (b * h0), ms2 = A2 / (b * h0), k = ms * as1 + ms2 * as2;
      var yc = h0 * (Math.sqrt(k * k + 2 * (ms * as1 + ms2 * as2 * p.a2 / h0)) - k);
      var Ir = b * yc * yc * yc / 3 + as1 * As * Math.pow(h0 - yc, 2) + as2 * A2 * Math.pow(yc - p.a2, 2);
      return { yc: yc, I: Ir };
    }
    var out = { h0: h0, al: al, yt: yt, Ired0: I, Mcrc: Mcrc / 1e6, cracked: cracked, Mt: Mt / 1e6, MlL: MlL / 1e6 };
    var Ebr = p.Rbser / 0.0015, as1 = Es / Ebr;
    if (cracked) {
      var cs = crackedSec(as1, as1);
      var yt2 = Math.min(Math.max(h - cs.yc, 2 * p.a), 0.5 * h), Abt = b * yt2;
      var ls = Math.min(Math.max(0.5 * Abt / As * p.ds, 10 * p.ds, 100), 40 * p.ds, 400);
      function sig(M) { return M * (h0 - cs.yc) * as1 / cs.I; }
      function acrc(M, f1) { var s = sig(M), ps = Math.max(0.2, 1 - 0.8 * Mcrc / M); return { s: s, ps: ps, a: f1 * 0.5 * 1 * ps * s / Es * ls }; }
      var c1 = acrc(MlL, 1.4), c2 = acrc(Mt, 1), c3 = acrc(MlL, 1);
      out.cs = cs; out.ls = ls; out.Abt = Abt; out.c1 = c1; out.c2 = c2; out.c3 = c3;
      out.aL = c1.a; out.aS = c1.a + c2.a - c3.a; out.limL = p.perm ? 0.2 : 0.3; out.limS = p.perm ? 0.3 : 0.4;
      // Độ cứng tiết diện nứt: ngắn hạn (εb1,red = 0,0015) và dài hạn (εb1,red theo độ ẩm)
      function Dcr(M, eps) { var Eb1 = p.Rbser / eps, ps = Math.max(0.2, 1 - 0.8 * Mcrc / M), Esr = Es / ps, s = crackedSec(Esr / Eb1, Es / Eb1); return { Eb1: Eb1, ps: ps, yc: s.yc, I: s.I, D: Eb1 * s.I }; }
      var D1 = Dcr(Mt, 0.0015), D2 = Dcr(MlL, 0.0015), D3 = Dcr(MlL, p.eps1L);
      out.D1 = D1; out.D2 = D2; out.D3 = D3;
      out.r = Mt / D1.D - MlL / D2.D + MlL / D3.D;
    } else {
      var Eb1s = 0.85 * p.Eb, Eb1l = p.Eb / (1 + p.phicr);
      function Iun(E1) { var a = Es / E1; return b * h * h * h / 12 + a * As * Math.pow(h / 2 - p.a, 2) + a * A2 * Math.pow(h / 2 - p.a2, 2); }
      var Ds = Eb1s * Iun(Eb1s), Dl = Eb1l * Iun(Eb1l);
      out.Ds = Ds; out.Dl = Dl; out.r = (Mt - MlL) / Ds + MlL / Dl;
    }
    out.f = p.s * Math.pow(p.L * 1000, 2) * out.r; out.flim = p.flim;
    return out;
  }
  // Độ võng giới hạn theo nhịp (TCVN 5574:2018, bảng M.1)
  function flim(L) {
    var T = [[1, 120], [3, 150], [6, 200], [24, 250], [36, 300]];
    if (L <= 1) return L * 1000 / 120; if (L >= 36) return L * 1000 / 300;
    for (var i = 0; i < T.length - 1; i++) if (L <= T[i + 1][0]) { var d = T[i][1] + (T[i + 1][1] - T[i][1]) * (L - T[i][0]) / (T[i + 1][0] - T[i][0]); return L * 1000 / d; }
  }
  var api = { crackDefl: crackDefl, flim: flim };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.CRK = api;
})(this);
