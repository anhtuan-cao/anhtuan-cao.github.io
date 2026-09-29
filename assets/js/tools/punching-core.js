/* Chọc thủng sàn quanh cột / kingpost theo EN 1992-1-1 mục 6.4 — đơn vị: kN, m, MPa */
(function (root) {
  function check(p) {
    // p: pos('int'|'edge'|'corner'), cx, cy, ax, ay (m); hs, cover (m); phx, sx, phy, sy (mm); fck, fyk (MPa); gc; VEd (kN);
    //    phw (mm), st (mm), kmax; shear head: sh(bool), nC, AsC(cm2), fyC, gM, gC, nW, bh, hh(mm), lh(mm), fw(MPa)
    var o = {}, pi = Math.PI;
    var pmax = Math.max(p.phx, p.phy) / 1000, pmin = Math.min(p.phx, p.phy) / 1000;
    var d = ((p.hs - p.cover - pmax / 2) + (p.hs - p.cover - pmax - pmin / 2)) / 2; o.d = d;
    var fcd = p.fck / p.gc, nu = 0.6 * (1 - p.fck / 250), vRdmax = 0.5 * nu * fcd;
    o.fcd = fcd; o.nu = nu; o.vRdmax = vRdmax;
    var beta = { int: 1.15, edge: 1.4, corner: 1.5 }[p.pos]; o.beta = beta;
    var cx = p.cx, cy = p.cy, a2 = 2 * d, ax = Math.min(p.ax || 0, a2), ay = Math.min(p.ay || 0, a2);
    var u0, u1, distOut;
    if (p.pos === 'int') { u0 = 2 * (cx + cy); u1 = 2 * (cx + cy) + 2 * pi * a2; }
    else if (p.pos === 'edge') { u0 = Math.min(cy + 3 * d, cy + 2 * cx); u1 = 2 * cx + cy + pi * a2 + 2 * ax; }
    else { u0 = Math.min(3 * d, cx + cy); u1 = cx + cy + pi * a2 / 2 + ax + ay; }
    o.u0 = u0; o.u1 = u1;
    // flexural reinforcement ratio
    var rx = (pi * p.phx * p.phx / 4) / (p.sx * d * 1000), ry = (pi * p.phy * p.phy / 4) / (p.sy * d * 1000);
    var rho = Math.min(0.02, Math.sqrt(rx * ry)); o.rho = rho; o.rx = rx; o.ry = ry;
    var k = Math.min(2, 1 + Math.sqrt(200 / (d * 1000))); o.k = k;
    var CRdc = 0.18 / p.gc, vmin = 0.035 * Math.pow(k, 1.5) * Math.sqrt(p.fck);
    var vRdc = Math.max(vmin, CRdc * k * Math.cbrt(100 * rho * p.fck)); o.vmin = vmin; o.CRdc = CRdc; o.vRdc = vRdc;
    // shear head (thép hình C) — tùy chọn
    var Qh = 0, Qth = 0, Vred = 0;
    if (p.sh) {
      Qth = p.nC * p.gC * p.AsC * 100 * (0.58 * p.fyC / p.gM) / 1000;
      Qh = p.nW * p.bh * p.hh * p.lh * p.fw / 1000;
      Vred = Math.min(Qh, Qth);
    }
    o.Qth = Qth; o.Qh = Qh; o.Vred = Vred;
    var V = Math.max(p.VEd - Vred, 0); o.Vnet = V;
    var vEd0 = beta * V * 1000 / (u0 * d * 1e6);
    var vEd = beta * V * 1000 / (u1 * d * 1e6);
    o.vEd0 = vEd0; o.vEd = vEd;
    o.rMax = vEd0 / vRdmax;
    o.rC = vEd / vRdc;
    o.needRebar = vEd > vRdc;
    o.rKmax = vEd / (p.kmax * vRdc);
    // uout
    var uout = beta * V * 1000 / (d * vRdc * 1e6); o.uout = Math.max(uout, u1);
    if (p.pos === 'int') distOut = (o.uout - 2 * (cx + cy)) / (2 * pi);
    else if (p.pos === 'edge') distOut = (o.uout - 2 * cx - cy - 2 * ax) / pi;
    else distOut = (o.uout - cx - cy - ax - ay) / (pi / 2);
    o.distOut = distOut;
    // cốt đai
    var fywdef = Math.min(p.fyk / 1.15, 250 + 0.25 * d * 1000); o.fywdef = fywdef;
    var sr0 = Math.floor(0.5 * d * 1000 / 50) * 50, sr = Math.floor(0.75 * d * 1000 / 50) * 50; o.sr0 = sr0; o.sr = sr;
    var AswReq = Math.max(0, (vEd - 0.75 * vRdc) * sr * u1 * 1000 / (1.5 * fywdef)); o.AswReq = AswReq;
    var Aleg = pi * p.phw * p.phw / 4; o.Aleg = Aleg;
    var AswMin = 0.053 * sr * p.st * Math.sqrt(p.fck) / p.fyk; o.AswMin = AswMin;
    o.legs = Math.ceil(AswReq / Aleg);
    o.stMax = 1.5 * d * 1000;
    o.nPer = Math.ceil((Math.max(distOut - 1.5 * d, 2 * d) * 1000 - sr0) / sr) + 1;
    return o;
  }
  var api = { check: check };
  if (typeof module !== 'undefined') module.exports = api; else root.PUNCH = api;
})(this);
