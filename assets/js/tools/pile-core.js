/* Sức chịu tải cọc khoan nhồi theo TCVN 10304:2014 (Phụ lục G) — kN, m, kPa */
(function (root) {
  function interpN(spt, z) { // spt: [[z,N],...] tăng dần
    if (!spt.length) return 0;
    if (z <= spt[0][0]) return spt[0][1];
    for (var i = 0; i < spt.length - 1; i++) if (z <= spt[i + 1][0]) {
      var a = spt[i], b = spt[i + 1]; return a[1] + (z - a[0]) * (b[1] - a[1]) / (b[0] - a[0]);
    }
    return spt[spt.length - 1][1];
  }
  function layerAt(L, z) { for (var i = 0; i < L.length; i++) if (z < L[i].bot) return i; return L.length - 1; }
  var KSAND = { loose: 0.3, medium: 0.5, dense: 0.8 }, NQ = { loose: 25, medium: 60, dense: 100 }, ZLD = { loose: 6, medium: 8, dense: 15 };
  function ap(ratio) { if (!(ratio > 0.35)) return 1; if (ratio >= 0.8) return 0.5; return -1.1111 * ratio + 1.3889; }
  function alphaC(cu) { if (cu <= 40) return 1; if (cu >= 200) return 0.32; return -2e-7 * cu * cu * cu + 1e-4 * cu * cu - 0.0188 * cu + 1.613; }

  // p: D, zHead, zExc, gwl, layers[{bot, type:'R'|'D', state, g, gs, su}], spt[[z,N]], dz
  function profile(p) {
    var dz = p.dz || 0.1, zmax = Math.min(p.layers[p.layers.length - 1].bot, p.spt.length ? p.spt[p.spt.length - 1][0] : 0);
    var A = Math.PI * p.D * p.D / 4, u = Math.PI * p.D;
    var z0 = Math.max(p.zHead, p.zExc);
    // lưới tính
    var n = Math.floor(zmax / dz), sig = [0], N = [], cu = [], lay = [], sandTop = [];
    var s = 0, st = null;
    for (var i = 0; i <= n; i++) {
      var z = i * dz, zm = z + dz / 2;
      var li = layerAt(p.layers, zm), L = p.layers[li];
      lay.push(li);
      var Ni = Math.min(interpN(p.spt, zm), 50); N.push(Ni);
      cu.push(L.su > 0 ? L.su : 6.25 * Ni);
      // ứng suất hữu hiệu (tính từ cao độ đáy đào)
      if (zm > p.zExc) s += (zm < p.gwl ? L.g : L.gs) * dz;
      sig.push(s);
      if (L.type === 'R') { if (st === null) st = z; } else st = null;
      sandTop.push(st);
    }
    function sigAt(z) { var k = Math.min(Math.round(z / dz), sig.length - 1); return sig[k]; }
    // cộng dồn ma sát theo độ sâu
    var fJ = 0, fM = 0, fS = 0, out = [], tipOut = null;
    for (i = 0; i < n; i++) {
      var z1 = i * dz, zc = z1 + dz / 2, L2 = p.layers[lay[i]];
      if (zc > z0) {
        var sv = (sig[i] + sig[i + 1]) / 2;
        if (L2.type === 'R') {
          fJ += u * dz * 10 * N[i] / 3;
          fM += u * dz * N[i] * 1;
          var zl = ZLD[L2.state] * p.D, svl = sandTop[i] !== null ? sigAt(Math.min(zc, sandTop[i] + zl)) : sv;
          fS += u * dz * KSAND[L2.state] * svl;
        } else {
          var a = ap(sv > 0 ? cu[i] / sv : 0);
          fJ += u * dz * a * cu[i];
          fM += u * dz * a * cu[i];
          fS += u * dz * alphaC(cu[i]) * cu[i];
        }
      }
      var zt = z1 + dz;
      if (p.zTip && !tipOut && zt >= p.zTip - 1e-6) tipOut = tipRow(zt, fJ, fM, fS);
      if (zt > z0 + 0.5 && Math.abs(zt * 10 - Math.round(zt * 10)) < 1e-6 && Math.round(zt * 10) % 5 === 0) {
        out.push(tipRow(zt, fJ, fM, fS));
      }
    }
    function tipRow(zt, fJ, fM, fS) {
      var li = layerAt(p.layers, zt - 1e-6), L = p.layers[li];
      // Np: trung bình N từ 4D phía trên đến 1D phía dưới mũi
      var s = 0, c = 0; for (var zz = zt - 4 * p.D; zz <= zt + p.D + 1e-9; zz += 0.1) { s += Math.min(interpN(p.spt, zz), 50); c++; }
      var Np = s / c, Nt = Math.min(interpN(p.spt, zt), 50), cuT = L.su > 0 ? L.su : 6.25 * Nt;
      var qJ, qM, qS, svT = sigAt(zt);
      if (L.type === 'R') {
        qJ = 150 * Np; qM = 120 * Np;
        var st2 = sandTop[Math.min(Math.round(zt / dz) - 1, sandTop.length - 1)], zl = ZLD[L.state] * p.D;
        var svl = st2 !== null && st2 !== undefined ? sigAt(Math.min(zt, st2 + zl)) : svT;
        qS = svl * NQ[L.state];
      } else { qJ = 6 * cuT; qM = 6 * cuT; qS = 6 * cuT; }
      return { z: zt, layer: li, type: L.type, Np: Np, cuT: cuT, sv: svT,
        J: { f: fJ, q: qJ * A, R: fJ + qJ * A }, M: { f: fM, q: qM * A, R: fM + qM * A }, S: { f: fS, q: qS * A, R: fS + qS * A } };
    }
    return { A: A, u: u, z0: z0, rows: out, tip: tipOut };
  }
  function material(p) { // D (m), Rb (MPa), nb, db (mm), Rsc (MPa), gcb, gcb2, Eb (MPa), k (kN/m4), gc, l0
    var A = Math.PI * p.D * p.D / 4, I = Math.PI * Math.pow(p.D, 4) / 64, As = p.nb * Math.PI * p.db * p.db / 4 / 1e6;
    var bp = p.D >= 0.8 ? p.D + 1 : 1.5 * p.D + 0.5;
    var ae = Math.pow(p.k * bp / (p.gc * p.Eb * 1000 * I), 0.2);
    var l1 = p.l0 + 2 / ae, lam = l1 / Math.sqrt(I / A);
    var phi = lam <= 28 ? 1 : 1.028 - 0.0000288 * lam * lam - 0.0016 * lam;
    var R = phi * (p.gcb * p.gcb2 * p.Rb * 1000 * A + p.Rsc * 1000 * As);
    return { A: A, I: I, As: As, bp: bp, ae: ae, l1: l1, lam: lam, phi: phi, R: R };
  }
  var api = { profile: profile, material: material, interpN: interpN };
  if (typeof module !== 'undefined') module.exports = api; else root.PILE = api;
})(this);
