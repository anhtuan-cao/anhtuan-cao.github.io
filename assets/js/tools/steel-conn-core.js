/* Liên kết bu lông và liên kết hàn theo TCVN 5575:2012 — đơn vị kN, cm (kN/cm2) trừ khi ghi khác */
(function (root) {
  // Bảng B.4: diện tích thân A và diện tích thực Abn (cm2)
  var BOLT = { 12: [1.13, 0.84], 14: [1.54, 1.15], 16: [2.01, 1.57], 18: [2.54, 1.92], 20: [3.14, 2.45], 22: [3.8, 3.03], 24: [4.52, 3.52], 27: [5.72, 4.59], 30: [7.06, 5.6], 36: [10.17, 8.16], 42: [13.85, 11.2], 48: [18.09, 14.72] };
  // Bảng 10: fvb, ftb (MPa) theo cấp bền
  var CLS = { '4.6': [150, 170], '4.8': [160, 160], '5.6': [190, 210], '5.8': [200, 200], '6.6': [230, 250], '8.8': [320, 400], '10.9': [400, 500] };
  // Bảng 11: fcb (MPa) theo fu của thép liên kết: [fu, bu lông tinh, bu lông thô/thường]
  var FCB = [[340, 435, 395], [380, 515, 465], [400, 560, 505], [420, 600, 540], [440, 650, 585], [450, 675, 605], [480, 745, 670], [500, 795, 710], [520, 850, 760], [540, 905, 805]];
  // Thép: [fu, fy(t≤20), f(t≤20), fy(20<t≤40), f(20<t≤40)] (MPa)
  var STEEL = { CCT34: [340, 220, 210, 210, 200], CCT38: [380, 240, 230, 230, 220], CCT42: [420, 260, 245, 250, 240], SS400: [400, 245, 223, 245, 223], SS490: [490, 275, 250, 275, 250], Q235: [370, 235, 214, 235, 214], Q345: [510, 345, 314, 345, 314], S235: [340, 235, 214, 235, 214], S275: [410, 275, 250, 275, 250], S355: [490, 355, 323, 355, 323] };
  function fcbOf(fu, fine) { var r = FCB[0]; for (var i = 0; i < FCB.length; i++) if (fu >= FCB[i][0]) r = FCB[i]; return fine ? r[1] : r[2]; }
  function steel(g, t) { var s = STEEL[g]; return { fu: s[0], fy: t <= 20 ? s[1] : s[3], f: t <= 20 ? s[2] : s[4] }; }

  function bolt(p) {
    // p: grade, cls, fine, d, t (mm, Σt nhỏ nhất trượt về một phía), nv, n, m (bu lông dãy ngoài), L[] (mm), gb, gc, N, V (kN), M1, M2 (kNm)
    var st = steel(p.grade, p.t), b = BOLT[p.d], c = CLS[p.cls];
    var A = b[0], Abn = b[1], fvb = c[0] / 10, ftb = c[1] / 10, fcb = fcbOf(st.fu, p.fine) / 10;
    var Nvb = fvb * p.gb * A * p.nv, Ncb = fcb * p.gb * (p.d / 10) * (p.t / 10), Nmin = Math.min(Nvb, Ncb), Ntb = ftb * Abn;
    var L = (p.L || []).filter(function (x) { return x > 0; }), sumL2 = L.reduce(function (s, x) { return s + x * x; }, 0) / 100, Lmax = L.length ? Math.max.apply(null, L) / 10 : 0;
    var r = {};
    var NV = p.V / (p.n * p.gc);
    var NM1 = (p.M1 > 0 && sumL2 > 0) ? p.M1 * 100 * Lmax / (p.m * p.gc * sumL2) : 0;
    var NM2 = (p.M2 > 0 && sumL2 > 0) ? p.M2 * 100 * Lmax / (p.m * p.gc * sumL2) : 0;
    var NN = p.N / (p.n * p.gc);
    var Nsh = Math.sqrt(NV * NV + NM1 * NM1);
    var Nt = NN + NM2;
    return { fu: st.fu, A: A, Abn: Abn, fvb: fvb, ftb: ftb, fcb: fcb, Nvb: Nvb, Ncb: Ncb, Nmin: Nmin, Ntb: Ntb, NV: NV, NM1: NM1, NM2: NM2, NN: NN, Nsh: Nsh, Nt: Nt,
      rShear: Nsh / Nmin, rTension: Nt / Ntb, nMin: p.V > 0 ? 2 * Math.ceil(p.V / (p.gc * Nmin) / 2) : 0 };
  }

  // Bảng 37: βf, βs
  function betas(method, pos, hf, d) {
    if (method === 'manual') return [0.7, 1];
    if (method === 'auto' && d >= 3 && d <= 5) {
      if (pos === 'trough') return hf >= 18 ? [0.7, 1] : [1.1, 1.15];
      return hf >= 18 ? [0.7, 1] : (hf >= 9 ? [0.9, 1.05] : [1.1, 1.15]);
    }
    if (pos === 'trough') return hf >= 18 ? [0.7, 1] : (hf >= 14 ? [0.8, 1] : [0.9, 1.05]);
    return hf >= 14 ? [0.7, 1] : (hf >= 9 ? [0.8, 1] : [0.9, 1.05]);
  }
  // Bảng 2.5 (hfmin theo tmax), cột t = 4..41 mm
  var HFMIN = {
    d_man_430: [4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10],
    d_man_530: [5, 5, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 12],
    d_aut_430: [3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 9],
    d_aut_530: [4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10],
    s_man: [5, 5, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 9, 9, 10, 10, 10, 10, 10, 10, 10, 10, 12],
    s_aut: [4, 4, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 7, 7, 7, 7, 7, 7, 8, 8, 8, 8, 8, 8, 8, 8, 8, 8, 9, 9, 9, 9, 9, 9, 9, 9, 10]
  };
  function hfmin(sides, method, fy, tmax) {
    var k = sides === 2 ? ('d_' + (method === 'manual' ? 'man' : 'aut') + '_' + (fy <= 430 ? '430' : '530')) : ('s_' + (method === 'manual' ? 'man' : 'aut'));
    var i = Math.max(0, Math.min(Math.floor(tmax) - 4, HFMIN[k].length - 1));
    return HFMIN[k][i];
  }
  var FWF = { N42: 180, N46: 200, N50: 215, E43: 330, E43b: 350, E51: 410 };
  function fillet(p) {
    // p: grade, elec, method, pos, sides, tmin, tmax, sumL (mm), m (số đường hàn), hf, d (mm que/dây), N, V (kN), M (kNm), gc
    var st = steel(p.grade, p.tmin), bs = betas(p.method, p.pos, p.hf, p.d);
    var lw = p.sumL - 10 * p.m; // trừ 10 mm mỗi đường hàn
    var Awf = bs[0] * lw * p.hf, Aws = bs[1] * lw * p.hf; // mm2
    var Wwf = bs[0] * p.hf * lw * lw / 6 / p.m, Wws = bs[1] * p.hf * lw * lw / 6 / p.m; // mm3
    var fwf = FWF[p.elec] / 10, fws = 0.45 * st.fu / 10;
    var tf = Math.sqrt(Math.pow(p.N / (Awf / 100) + p.M * 100 / (Wwf / 1000), 2) + Math.pow(p.V / (Awf / 100), 2));
    var ts = Math.sqrt(Math.pow(p.N / (Aws / 100) + p.M * 100 / (Wws / 1000), 2) + Math.pow(p.V / (Aws / 100), 2));
    var hmin = hfmin(p.sides, p.method, st.fy, p.tmax), hmax = 1.2 * p.tmin;
    return { fu: st.fu, fy: st.fy, bf: bs[0], bs: bs[1], lw: lw, Awf: Awf, Aws: Aws, Wwf: Wwf, Wws: Wws, fwf: fwf, fws: fws, tf: tf, ts: ts,
      rf: tf / (fwf * p.gc), rs: ts / (fws * p.gc), hmin: hmin, hmax: hmax };
  }
  function butt(p) {
    // p: grade, qc('phys'|'visual'), t (mm), l (mm), N (kN, + kéo, - nén), V, M, gc
    var st = steel(p.grade, p.t), lw = p.l - 2 * p.t, Aw = lw * p.t / 100, Ww = p.t * lw * lw / 6 / 1000; // cm2, cm3
    var fwc = st.f / 10, fwt = p.qc === 'phys' ? fwc : 0.85 * fwc, fwv = 0.58 * fwc;
    var sN = Math.abs(p.N) / Aw, sM = p.M * 100 / Ww, tau = p.V / Aw;
    var fN = p.N >= 0 ? fwt : fwc;
    var eq = Math.sqrt(Math.pow(sN + sM, 2) + 3 * tau * tau);
    return { f: st.f, lw: lw, Aw: Aw, Ww: Ww, fwc: fwc, fwt: fwt, fwv: fwv, sN: sN, sM: sM, tau: tau,
      rN: sN / (fN * p.gc), rV: tau / (fwv * p.gc), rM: sM / (fwt * p.gc), rEq: eq / (1.15 * fwt * p.gc), eq: eq };
  }
  var api = { fcbOf: fcbOf, bolt: bolt, fillet: fillet, butt: butt, BOLT: BOLT, CLS: CLS, STEEL: STEEL };
  if (typeof module !== 'undefined') module.exports = api; else root.CONN = api;
})(this);
