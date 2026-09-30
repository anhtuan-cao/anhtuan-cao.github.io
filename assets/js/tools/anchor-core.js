/* Bu lông neo trong bê tông — TCVN 5575:2012 (thép, bám dính) và ACI 318-19 chương 17 (phá hoại bê tông). Đơn vị: N, mm, MPa. */
(function (root) {
  /* p: {nx, ny, s1, s2, cx1, cx2, cy1, cy2, ha, d, Ab, Abn (mm²), fvb, ftb, fub (MPa), L, L0, LH (mm), fc (MPa, trụ), Rbtn, cracked, psicV, N, V (kN tổng nhóm)} */
  function anchors(p) {
    var n = p.nx * p.ny, N1 = p.N * 1e3 / n, V1 = p.V * 1e3 / n, hef = p.L - p.L0, lam = 1;
    // TCVN 5575:2012
    var Ntb = p.ftb * p.Abn, Nvb = p.fvb * 0.9 * p.Ab, Nbond = 0.6 * 1.2 * p.Rbtn * Math.PI * p.d * (p.L - p.L0 + p.LH);
    var tc = { Ntb: Ntb / 1e3, Nvb: Nvb / 1e3, Nbond: Nbond / 1e3, rT: N1 / Ntb, rV: V1 / Nvb, rB: N1 / Nbond, rTV: Math.pow(N1 / Ntb, 2) + Math.pow(V1 / Nvb, 2) };
    // ACI 318-19
    var futa = Math.min(p.fub, 860), c15 = 1.5 * hef;
    var phiNsa = 0.75 * n * p.Abn * futa;
    var ANc = (Math.min(p.cx1, c15) + (p.nx - 1) * p.s1 + Math.min(p.cx2, c15)) * (Math.min(p.cy1, c15) + (p.ny - 1) * p.s2 + Math.min(p.cy2, c15));
    var ANco = 9 * hef * hef, camin = Math.min(p.cx1, p.cx2, p.cy1, p.cy2);
    var ped = camin >= c15 ? 1 : 0.7 + 0.3 * camin / c15, pcN = p.cracked ? 1 : 1.25;
    var Nb = 10 * lam * Math.sqrt(p.fc) * Math.pow(hef, 1.5);
    var Ncbg = Math.min(ANc / ANco, n) * ped * pcN * Nb, phiNcbg = 0.70 * Ncbg;
    var eh = Math.min(Math.max(p.LH, 3 * p.d), 4.5 * p.d), Np = 0.9 * p.fc * eh * p.d, phiNpn = 0.70 * (p.cracked ? 1 : 1.4) * Np * n;
    var phiVsa = 0.65 * n * 0.6 * p.Abn * futa;
    // Cắt hướng về mép cx1 (phương x)
    var ca1 = p.cx1, le = Math.min(hef, 8 * p.d);
    var Vb = Math.min(0.6 * Math.pow(le / p.d, 0.2) * Math.sqrt(p.d) * lam * Math.sqrt(p.fc) * Math.pow(ca1, 1.5), 3.7 * lam * Math.sqrt(p.fc) * Math.pow(ca1, 1.5));
    var AVc = (Math.min(p.cy1, 1.5 * ca1) + (p.ny - 1) * p.s2 + Math.min(p.cy2, 1.5 * ca1)) * Math.min(1.5 * ca1, p.ha), AVco = 4.5 * ca1 * ca1;
    var ca2 = Math.min(p.cy1, p.cy2), pedV = ca2 >= 1.5 * ca1 ? 1 : 0.7 + 0.3 * ca2 / (1.5 * ca1), phV = Math.max(1, Math.sqrt(1.5 * ca1 / p.ha));
    var Vcbg = Math.min(AVc / AVco, p.ny) * pedV * p.psicV * phV * Vb, phiVcbg = 0.70 * Vcbg;
    var phiVcpg = 0.70 * (hef >= 65 ? 2 : 1) * Ncbg;
    var Nua = p.N * 1e3, Vua = p.V * 1e3;
    var phiNn = Math.min(phiNsa, phiNcbg, phiNpn), phiVn = Math.min(phiVsa, phiVcbg, phiVcpg);
    var tN = Nua / phiNn, tV = Vua / phiVn, inter = (tN <= 0.2 || tV <= 0.2) ? Math.max(tN, tV) : (tN + tV) / 1.2;
    var sb = hef > 2.5 * camin;
    var aci = { hef: hef, ANc: ANc, ANco: ANco, ped: ped, Nb: Nb / 1e3, Ncbg: Ncbg / 1e3, phiNsa: phiNsa / 1e3, phiNcbg: phiNcbg / 1e3, eh: eh, phiNpn: phiNpn / 1e3,
      phiVsa: phiVsa / 1e3, Vb: Vb / 1e3, AVc: AVc, AVco: AVco, pedV: pedV, phV: phV, phiVcbg: phiVcbg / 1e3, phiVcpg: phiVcpg / 1e3, tN: tN, tV: tV, inter: inter, sideBlow: sb,
      rNsa: Nua / phiNsa, rNcb: Nua / phiNcbg, rNpn: Nua / phiNpn, rVsa: Vua / phiVsa, rVcb: Vua / phiVcbg, rVcp: Vua / phiVcpg };
    return { n: n, N1: N1 / 1e3, V1: V1 / 1e3, tc: tc, aci: aci };
  }
  var api = { anchors: anchors };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ANC = api;
})(this);
