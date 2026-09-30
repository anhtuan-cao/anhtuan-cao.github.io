/* Sức chịu tải cọc khoan nhồi / kingpost thép hình theo TCVN 10304:2014 (Phụ lục G) — kN, m, kPa
   kind: 'bored' (cọc khoan nhồi) | 'driven' (kingpost thép hình, hệ số cọc đóng/ép) */
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
  var KSAND = { loose: 0.3, medium: 0.5, dense: 0.8 }, NQ = { loose: 25, medium: 60, dense: 100 },
    KSAND_D = { loose: 0.8, medium: 1.0, dense: 1.5 }, NQ_D = { loose: 60, medium: 100, dense: 180 }, ZLD = { loose: 6, medium: 8, dense: 15 };
  function ap(ratio) { if (!(ratio > 0.35)) return 1; if (ratio >= 0.8) return 0.5; return -1.1111 * ratio + 1.3889; }
  function alphaC(cu) { if (cu <= 40) return 1; if (cu >= 200) return 0.32; return -2e-7 * cu * cu * cu + 1e-4 * cu * cu - 0.0188 * cu + 1.613; }

  // Hệ số f_L theo tỷ số chiều sâu / cạnh cọc (cọc đóng, G.2)
  function fL(r) { if (r <= 50) return 1; if (r >= 120) return 0.7; return -0.0043 * r + 1.2149; }
  // p: D (đường kính / bề rộng cánh), zHead, zExc, gwl, layers[{bot, type:'R'|'D', state, g, gs, su}], spt[[z,N]], dz, kind, A, u (ghi đè diện tích mũi, chu vi)
  function profile(p) {
    var dz = p.dz || 0.1, zmax = Math.min(p.layers[p.layers.length - 1].bot, p.spt.length ? p.spt[p.spt.length - 1][0] : 0);
    var dr = p.kind === 'driven', A = p.A || Math.PI * p.D * p.D / 4, u = p.u || Math.PI * p.D;
    var Ks = dr ? KSAND_D : KSAND, Nq = dr ? NQ_D : NQ;
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
          fM += u * dz * N[i] * (dr ? 2 : 1);
          var zl = ZLD[L2.state] * p.D, svl = sandTop[i] !== null ? sigAt(Math.min(zc, sandTop[i] + zl)) : sv;
          fS += u * dz * Ks[L2.state] * svl;
        } else {
          var a = ap(sv > 0 ? cu[i] / sv : 0) * (dr ? fL(zc / p.D) : 1);
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
        qJ = (dr ? 300 : 150) * Np; qM = (dr ? Math.min(400, 40 * zt / p.D) : 120) * Np;
        var st2 = sandTop[Math.min(Math.round(zt / dz) - 1, sandTop.length - 1)], zl = ZLD[L.state] * p.D;
        var svl = st2 !== null && st2 !== undefined ? sigAt(Math.min(zt, st2 + zl)) : svT;
        qS = svl * Nq[L.state];
      } else { var kc = dr ? 9 : 6; qJ = kc * cuT; qM = kc * cuT; qS = kc * cuT; }
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
  // Tiết diện chữ H: h, b, tw, tf (mm) → m, m², m⁴
  function hsec(h, b, tw, tf) {
    h /= 1000; b /= 1000; tw /= 1000; tf /= 1000;
    var A = b * h - (b - tw) * (h - 2 * tf), Ix = (b * h * h * h - (b - tw) * Math.pow(h - 2 * tf, 3)) / 12, Iy = (2 * tf * b * b * b + (h - 2 * tf) * tw * tw * tw) / 12;
    return { A: A, Ix: Ix, Iy: Iy, rx: Math.sqrt(Ix / A), ry: Math.sqrt(Iy / A), u: 4 * b + 2 * h - 2 * tw, Ap: b * h, up: 2 * (b + h) };
  }
  // Hệ số uốn dọc φ theo độ mảnh quy ước (TCVN 5575:2012)
  function phiS(lb, f, E) {
    var r = f / E;
    if (lb <= 2.5) return 1 - (0.073 - 5.53 * r) * lb * Math.sqrt(lb);
    if (lb <= 4.5) return 1.47 - 13 * r - (0.371 - 27.3 * r) * lb + (0.0275 - 5.53 * r) * lb * lb;
    return 332 / (lb * lb * (51 - lb));
  }
  // Kingpost thép: sec (hsec), b (m), f, E (MPa), gcb, gcb2, k, gc, l0
  function steel(p) {
    var s = p.sec, bp = p.b >= 0.8 ? p.b + 1 : 1.5 * p.b + 0.5;
    var ae = Math.pow(p.k * bp / (p.gc * p.E * 1000 * s.Ix), 0.2), l1 = p.l0 + 2 / ae, r = Math.min(s.rx, s.ry);
    var lam = l1 / r, lb = lam * Math.sqrt(p.f / p.E), phi = Math.min(1, phiS(lb, p.f, p.E));
    return { A: s.A, I: s.Ix, r: r, bp: bp, ae: ae, l1: l1, lam: lam, lb: lb, phi: phi, R: phi * p.gcb * p.gcb2 * p.f * 1000 * s.A, Rk: p.f * 1000 * s.A };
  }
  var api = { profile: profile, material: material, interpN: interpN, hsec: hsec, steel: steel, phiS: phiS };
  if (typeof module !== 'undefined') module.exports = api; else root.PILE = api;
})(this);
