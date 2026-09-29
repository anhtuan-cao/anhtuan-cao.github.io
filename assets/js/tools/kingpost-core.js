/* Kiểm tra cột thép chữ I/H chịu nén lệch tâm theo TCVN 5575:2012
   Đơn vị nội bộ: kN, cm. (c) Anh Tuan Cao — công cụ tham khảo */
(function (root) {
  // Bảng D.10 – hệ số φe (x1000): hàng = λ̄, cột = me
  var PE_M = [0, 0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 8, 9, 10, 12, 14, 17, 20];
  var PE = [
    [0.5, 967, 967, 922, 850, 782, 722, 669, 620, 577, 538, 469, 417, 370, 337, 307, 280, 260, 237, 222, 210, 183, 164, 150, 125, 106, 90, 77],
    [1, 925, 925, 854, 778, 711, 653, 600, 563, 520, 484, 427, 382, 341, 307, 283, 259, 240, 225, 209, 196, 175, 157, 142, 121, 103, 86, 74],
    [1.5, 875, 875, 804, 716, 647, 593, 548, 507, 470, 439, 388, 347, 312, 283, 262, 240, 223, 207, 195, 182, 163, 148, 134, 114, 99, 82, 70],
    [2, 813, 813, 742, 653, 587, 536, 496, 457, 425, 397, 352, 315, 286, 260, 240, 222, 206, 193, 182, 170, 153, 138, 125, 107, 94, 79, 67],
    [2.5, 742, 742, 672, 587, 526, 480, 442, 410, 383, 357, 317, 287, 262, 238, 220, 204, 190, 178, 168, 158, 144, 130, 118, 101, 90, 76, 65],
    [3, 667, 667, 597, 520, 465, 425, 395, 365, 342, 320, 287, 260, 238, 217, 202, 187, 175, 166, 156, 147, 135, 123, 112, 97, 86, 73, 63],
    [3.5, 587, 587, 522, 455, 408, 375, 350, 325, 303, 287, 258, 233, 216, 198, 183, 172, 162, 153, 145, 137, 125, 115, 106, 92, 82, 69, 60],
    [4, 505, 505, 447, 394, 356, 330, 309, 289, 270, 256, 232, 212, 197, 181, 168, 158, 149, 140, 135, 127, 118, 108, 98, 88, 78, 66, 57],
    [4.5, 418, 418, 382, 342, 310, 288, 272, 257, 242, 229, 208, 192, 178, 165, 155, 146, 137, 130, 125, 118, 110, 101, 93, 83, 75, 64, 55],
    [5, 354, 354, 326, 295, 273, 253, 239, 225, 215, 205, 188, 175, 162, 150, 143, 135, 126, 120, 117, 111, 103, 95, 88, 79, 72, 62, 53],
    [5.5, 302, 302, 280, 256, 240, 224, 212, 200, 192, 184, 170, 158, 148, 138, 132, 124, 117, 112, 108, 104, 95, 89, 84, 75, 69, 60, 51],
    [6, 258, 258, 244, 223, 210, 198, 190, 178, 172, 166, 153, 145, 137, 128, 120, 115, 109, 104, 100, 96, 89, 84, 79, 72, 66, 57, 49],
    [6.5, 223, 223, 213, 196, 185, 176, 170, 160, 155, 149, 140, 132, 125, 117, 112, 106, 101, 97, 94, 89, 83, 80, 74, 68, 62, 54, 47],
    [7, 194, 194, 186, 173, 163, 157, 152, 145, 141, 136, 127, 121, 115, 108, 102, 98, 94, 91, 87, 83, 78, 74, 70, 64, 59, 52, 45],
    [7.5, 152, 152, 146, 138, 133, 128, 121, 117, 115, 113, 106, 100, 95, 91, 87, 83, 81, 78, 76, 74, 68, 65, 62, 57, 53, 47, 41],
    [8, 122, 122, 117, 112, 107, 103, 100, 98, 96, 93, 88, 85, 82, 79, 75, 72, 69, 66, 65, 64, 61, 58, 55, 51, 48, 43, 38],
    [8.5, 100, 100, 97, 93, 91, 90, 85, 81, 80, 79, 75, 72, 70, 69, 65, 62, 60, 59, 58, 57, 55, 52, 49, 46, 43, 39, 35],
    [9, 83, 83, 79, 77, 76, 75, 73, 71, 69, 68, 63, 62, 61, 60, 57, 55, 53, 52, 51, 50, 48, 46, 44, 40, 38, 35, 32],
    [9.5, 69, 69, 67, 64, 63, 62, 60, 59, 59, 58, 55, 54, 53, 52, 51, 50, 49, 48, 47, 46, 44, 42, 40, 37, 35, 32, 29],
    [10, 62, 62, 61, 54, 53, 52, 51, 51, 50, 49, 49, 48, 48, 47, 45, 44, 43, 42, 41, 41, 39, 38, 37, 35, 33, 30, 27],
    [10.5, 52, 52, 49, 49, 48, 48, 47, 47, 46, 45, 44, 43, 43, 42, 41, 40, 40, 39, 39, 38, 37, 36, 36, 34, 32, 29, 26]
  ];
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function idx(arr, v) { // i sao cho arr[i] <= v <= arr[i+1]
    for (var i = 0; i < arr.length - 1; i++) if (v <= arr[i + 1]) return i;
    return arr.length - 2;
  }
  function phiE(lam, me) { // nội suy song tuyến
    var L = PE.map(function (r) { return r[0]; });
    lam = clamp(lam, L[0], L[L.length - 1]); me = clamp(me, 0, 20);
    var i = idx(L, lam), j = idx(PE_M, me);
    var tx = (me - PE_M[j]) / (PE_M[j + 1] - PE_M[j]);
    var a = PE[i][j + 1] + tx * (PE[i][j + 2] - PE[i][j + 1]);
    var b = PE[i + 1][j + 1] + tx * (PE[i + 1][j + 2] - PE[i + 1][j + 1]);
    var ty = (lam - L[i]) / (L[i + 1] - L[i]);
    return (a + ty * (b - a)) / 1000;
  }
  function phi(lb, f, E) { // 7.3.2.1
    var r = f / E;
    if (lb <= 2.5) return 1 - (0.073 - 5.53 * r) * Math.pow(lb, 1.5);
    if (lb <= 4.5) return 1.47 - 13 * r - (0.371 - 27.3 * r) * lb + (0.0275 - 5.53 * r) * lb * lb;
    return 332 / (lb * lb * (51 - lb));
  }
  function eta5(r, lb, m) { // Bảng D.9, tiết diện I, uốn trong mặt phẳng bụng
    m = Math.max(m, 0.1);
    if (r < 0.5) { if (lb > 5 || m > 5) return 1.2; return (1.45 - 0.05 * m) - 0.01 * (5 - m) * lb; }
    if (r < 1) { if (lb > 5 || m > 5) return 1.25; return (1.75 - 0.1 * m) - 0.02 * (5 - m) * lb; }
    if (lb > 5) return 1.3; if (m > 5) return 1.4 - 0.2 * lb;
    return (1.9 - 0.1 * m) - 0.02 * (6 - m) * lb;
  }
  function eta8(r, lb, m) { // Bảng D.9, tiết diện I, uốn trong mặt phẳng cánh
    m = Math.max(m, 0.1);
    if (lb > 5 || m > 5) return 1;
    if (r < 0.5) return (0.75 + 0.05 * m) + 0.01 * (5 - m) * lb;
    if (r < 1) return (0.5 + 0.1 * m) + 0.02 * (5 - m) * lb;
    return (0.25 + 0.15 * m) + 0.03 * (5 - m) * lb;
  }
  function interp1(xs, ys, x) { x = clamp(x, xs[0], xs[xs.length - 1]); var i = idx(xs, x); return ys[i] + (x - xs[i]) * (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]); }

  function section(h, b, tw, tf) { // cm
    var hw = h - 2 * tf;
    var A = 2 * b * tf + hw * tw;
    var Ix = b * Math.pow(h, 3) / 12 - (b - tw) * Math.pow(hw, 3) / 12;
    var Iy = 2 * tf * Math.pow(b, 3) / 12 + hw * Math.pow(tw, 3) / 12;
    return {
      A: A, Af: b * tf, Aw: hw * tw, hw: hw, Ix: Ix, Iy: Iy, Wx: Ix / (h / 2), Wy: Iy / (b / 2),
      Sx: b * tf * (h - tf) / 2 + tw * hw * hw / 8, Sy: tf * b * b / 4 + hw * tw * tw / 8,
      ix: Math.sqrt(Ix / A), iy: Math.sqrt(Iy / A),
      It: 0.433 * (2 * b * Math.pow(tf, 3) + hw * Math.pow(tw, 3))
    };
  }

  function check(p) {
    // p: h,b,tw,tf (cm); f, E (kN/cm2); gc; N (kN); Mx,My (kNm); V2,V3 (kN); Lx,Ly (m); mux,muy; lamLim; dynamic(bool)
    var s = section(p.h, p.b, p.tw, p.tf), f = p.f, E = p.E, gc = p.gc, fv = 0.58 * f;
    var N = p.N, Mx = p.Mx * 100, My = p.My * 100; // kNcm
    var r = {}, st = {};
    st.sec = s;
    var l0x = p.Lx * p.mux * 100, l0y = p.Ly * p.muy * 100;
    var lx = l0x / s.ix, ly = l0y / s.iy;
    st.lx = lx; st.ly = ly;
    r.slender = Math.max(lx, ly) / p.lamLim;
    // Độ bền (7.4.1.2)
    var AfAw = s.Af / s.Aw;
    var cx = AfAw > 2 ? 1.04 : interp1([0, 0.25, 0.5, 1, 2], [1.19, 1.19, 1.12, 1.07, 1.04], AfAw), cy = 1.47, n = 1.5;
    var plast = Math.pow(N / (s.A * gc * f), n) + Mx / (cx * s.Wx * f * gc) + My / (cy * s.Wy * f * gc);
    var elast = (N / s.A + Mx / s.Wx + My / s.Wy) / (gc * f);
    var tau = Math.max(p.V2 * s.Sx / s.Ix / p.tw, p.V3 * s.Sy / s.Iy / (2 * p.tf)) / fv;
    var sig = N / s.A / f;
    // Ổn định cục bộ cánh (dùng cho điều kiện áp dụng dẻo)
    var lbx = Math.max(lx * Math.sqrt(f / E), 0.5), lby = Math.max(ly * Math.sqrt(f / E), 0.5);
    var b0 = (p.b - p.tw) / 2, flLim = (0.36 + 0.1 * clamp(lbx, 0.8, 4)) * Math.sqrt(E / f);
    var usePlastic = !p.dynamic && (sig > 0.1 ? tau <= 0.5 : (b0 / p.tf) <= flLim);
    r.strength = usePlastic ? plast : elast;
    st.cx = cx; st.plast = plast; st.elast = elast; st.usePlastic = usePlastic; st.tau = tau; st.sig = sig;
    // Cắt (7.2.1.2)
    r.shear2 = p.V2 * s.Sx / (s.Ix * p.tw * fv * gc);
    r.shear3 = p.V3 * s.Sy / (s.Iy * 2 * p.tf * fv * gc);
    // Ổn định
    var ex = N > 0 ? Mx / N : 0, ey = N > 0 ? My / N : 0;
    var mx = ex * s.A / s.Wx, my = ey * s.A / s.Wy;
    st.lbx = lbx; st.lby = lby; st.mx = mx; st.my = my; st.ex = ex; st.ey = ey;
    // 4.1 trong mặt phẳng x-x
    var e5 = eta5(AfAw, lbx, mx), mex = e5 * mx, phex = phiE(lbx, mex);
    r.inX = N / (phex * s.A * f * gc);
    st.eta5 = e5; st.mex = mex; st.phex = phex;
    // 4.2 ngoài mặt phẳng (y-y) do Mx
    var phy = phi(lby, f, E), lamc = 3.14 * Math.sqrt(E / f), phc = phi(3.14, f, E);
    var alpha = mx <= 1 ? 0.7 : 0.65 + 0.05 * Math.min(mx, 5);
    var beta = ly <= lamc ? 1 : Math.sqrt(phc / phy);
    var c;
    if (mx <= 5) c = beta / (1 + alpha * mx);
    else if (mx >= 10) c = 1 / (1 + mx * phy);
    else { var c5 = beta / (1 + alpha * 5), c10 = 1 / (1 + 10 * phy); c = c5 * (2 - 0.2 * mx) + c10 * (0.2 * mx - 1); }
    var hh = p.h - p.tf;
    var mu = 2 + 0.156 * s.It * ly * ly / (s.A * hh * hh), rho = (s.Ix + s.Iy) / (s.A * hh * hh), del = 4 * rho / mu;
    var cmax = 2 / (1 + del + Math.sqrt(Math.pow(1 - del, 2) + (16 / mu) * Math.pow(ex / hh, 2)));
    var cUse = ly > lamc ? Math.min(c, cmax) : c;
    r.outY = N / (phy * cUse * s.A * gc * f);
    st.phy = phy; st.lamc = lamc; st.phc = phc; st.alpha = alpha; st.beta = beta; st.c = c; st.cmax = cmax; st.cUse = cUse;
    // 4.3 trong mặt phẳng y-y (My)
    var e8 = eta8(s.Aw / s.Af, lby, my), mey = e8 * my, phey = phiE(lby, mey);
    r.inY = N / (phey * s.A * f * gc);
    st.eta8 = e8; st.mey = mey; st.phey = phey;
    // 4.4 ngoài mặt phẳng (x-x) do My
    var phx = phi(lbx, f, E);
    r.outX = N / (phx * s.A * f * gc); st.phx = phx;
    // 4.5 uốn hai phương (7.4.2.8)
    var phexy = phey * (0.6 * Math.cbrt(cUse) + 0.4 * Math.pow(cUse, 0.25));
    r.biax = N / (phexy * s.A * f * gc); st.phexy = phexy;
    // Ổn định cục bộ bụng (Bảng 33) & cánh (Bảng 35)
    var k = Math.sqrt(E / f);
    var w0 = lbx < 2 ? (1.3 + 0.15 * lbx * lbx) * k : Math.min((1.2 + 0.35 * lbx) * k, 2.3 * k);
    var w1 = lbx < 2 ? (1.3 + 0.15 * lbx * lbx) * k : Math.min((1.2 + 0.35 * lbx) * k, 3.1 * k);
    var wLim = mx >= 1 ? w1 : w0 + (w1 - w0) * mx;
    r.web = (s.hw / p.tw) / wLim; st.wLim = wLim;
    r.flange = (b0 / p.tf) / flLim; st.flLim = flLim; st.b0 = b0;
    return { r: r, st: st };
  }
  var api = { check: check, section: section, phi: phi, phiE: phiE };
  if (typeof module !== 'undefined') module.exports = api; else root.KP = api;
})(this);
