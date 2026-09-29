/* Cốp pha dầm sàn & chống phụ nhiều tầng — lõi tính toán (TCVN 4453:1995, TCVN 5575:2012)
   Đơn vị nội bộ: kN, m. Tiết diện nhập theo cm. */
(function (root) {
  // Thép hộp: b × h × t (mm), n thanh ghép. Uốn quanh trục mạnh (chiều cao h).
  function box(b, h, t, n) {
    b /= 10; h /= 10; t /= 10; n = n || 1; // cm
    var J = (b * h * h * h - (b - 2 * t) * Math.pow(h - 2 * t, 3)) / 12 * n;
    var S = (b * t * (h / 2 - t / 2) + 2 * (h / 2 - t) * t * (h / 4 - t / 2)) * n;
    return { J: J, W: J / (h / 2), S: S, t: t, n: n, h: h, b: b, A: n * (b * h - (b - 2 * t) * (h - 2 * t)) };
  }
  function parseBox(name, n) { var m = String(name).split('x').map(parseFloat); return box(m[0], m[1], m[2], n); }

  // Tải đứng theo Phụ lục A TCVN 4453:1995 (kN/m²)
  function vload(gam, h, q2, q3, q4) {
    var q1 = gam * h;
    return { q1: q1, tc: q1 + q2 + q3 + q4, tt: 1.2 * q1 + 1.1 * q2 + 1.3 * q3 + 1.3 * q4 };
  }
  // Áp lực ngang bê tông tươi (Phụ lục A, đầm dùi)
  function lateral(gam, H, V, R, k1, k2) {
    var P = H <= R ? gam * H : Math.min(gam * H, gam * (0.27 * V + 0.78) * k1 * k2);
    return P;
  }
  function chk(vi, en, val, lim, unit, d) { return { vi: vi, en: en, val: val, lim: lim, unit: unit, r: val / lim, d: d === undefined ? 1 : d }; }

  // Ván: dải rộng bw (m), dày tp (m), liên tục nhịp L
  function ply(p, ptc, L, tp, bw, f, E) {
    var J = bw * tp * tp * tp / 12, W = J / (tp / 2);
    var M = p * L * L / 10, s = M / W, d = ptc * Math.pow(L, 4) / (145 * E * J) * 1000;
    return { p: p, ptc: ptc, L: L, M: M, s: s, d: d, J: J, W: W,
      checks: [chk('Ứng suất ván', 'Sheathing stress', s / 1000, f / 1000, 'MPa', 2), chk('Độ võng ván', 'Sheathing deflection', d, L / 250 * 1000, 'mm', 2)] };
  }
  function tau(V, s) { return V * s.S / (s.J * 2 * s.t * s.n) * 1e4; } // kN/m²
  // Thanh thép hộp liên tục (q L²/10; δ = q L⁴ / 145EJ)
  function cont(p, ptc, L, s, f, E) {
    var M = p * L * L / 10, V = p * L / 2, sg = M / s.W * 1e6, tv = tau(V, s), d = ptc * Math.pow(L, 4) / (145 * E * s.J) * 1e11;
    return { p: p, ptc: ptc, L: L, M: M, V: V, sg: sg, tv: tv, d: d, scheme: 'cont', lim: L / 250 * 1000 };
  }
  function steelChecks(o, f, vi, en, limDiv) {
    return [chk('Uốn — ' + vi, 'Bending — ' + en, o.sg / 1000, f / 1000, 'MPa', 1), chk('Cắt — ' + vi, 'Shear — ' + en, o.tv / 1000, 0.58 * f / 1000, 'MPa', 1), chk('Độ võng — ' + vi, 'Deflection — ' + en, o.d, o.lim, 'mm', 2)];
  }

  /* SÀN: p = {hs, gam, q2,q3,q4, tp, fp, Ep, s2, L1, s3, L2, L2p, L3, P, f, E} */
  function slab(p) {
    var ld = vload(p.gam, p.hs, p.q2, p.q3, p.q4), f = p.f, E = p.E;
    var v = ply(ld.tt, ld.tc, p.L1, p.tp, 1, p.fp, p.Ep);
    var Ls = Math.max(p.L2, p.L2p);
    var sp = cont(ld.tt * p.L1, ld.tc * p.L1, Ls, p.s2, f, E);
    var mp = cont(ld.tt * (p.L2 + p.L2p) / 2, ld.tc * (p.L2 + p.L2p) / 2, p.L3, p.s3, f, E);
    var N = ld.tt * (p.L2 + p.L2p) / 2 * p.L3;
    return { ld: ld, ply: v, sec: sp, main: mp, N: N,
      groups: [
        { vi: 'Ván sàn', en: 'Slab sheathing', checks: v.checks },
        { vi: 'Xà gồ phụ', en: 'Secondary joists', checks: steelChecks(sp, f, 'xà gồ phụ', 'joist') },
        { vi: 'Xà gồ chính', en: 'Main bearers', checks: steelChecks(mp, f, 'xà gồ chính', 'bearer') },
        { vi: 'Cây chống', en: 'Props', checks: [chk('Lực vào 1 cây chống', 'Load per prop', N, p.P, 'kN', 2)] }] };
  }

  /* DẦM: p = {type:1|2|3, b, h, gam, q2..q4, tp, fp, Ep, s2, L1, s3, L2, L2p, L3, cons (bool), L3c, P, f, E,
       // U-console (type 3): hs, A1, A1p, A2, A2p
       // thành dầm: s4, L4, s5, L5, L6, dt (mm), ft (kN/m²), V, R, k1, k2, q3s } */
  function beam(p) {
    var f = p.f, E = p.E, b = p.b, L = p.L3;
    var ld = vload(p.gam, p.h, p.q2, p.q3, p.q4);
    var v = ply(ld.tt, ld.tc, p.L1, p.tp, 1, p.fp, p.Ep);
    var sp = cont(ld.tt * p.L1, ld.tc * p.L1, Math.max(p.L2, p.L2p), p.s2, f, E);
    var w = ld.tt * (p.L2 + p.L2p) / 2, wtc = ld.tc * (p.L2 + p.L2p) / 2; // kN/m dọc xà gồ chính
    var main, con = null, N, Pu = 0, Putc = 0, ldS = null, a = 0;
    function partial(extraM, extraV, extraD) {
      var M = w * b * L / 4 - w * b * b / 8 + extraM, V = w * b / 2 + extraV;
      var d = wtc * b * (8 * L * L * L - 4 * L * b * b + b * b * b) / (384 * E * p.s3.J) * 1e11 + extraD;
      return { p: w, ptc: wtc, L: L, M: M, V: V, sg: M / p.s3.W * 1e6, tv: tau(V, p.s3), d: d, lim: L / 250 * 1000 };
    }
    if (p.type === 1) {
      main = partial(0, 0, 0); N = w * b / 2;
    } else if (p.type === 2) {
      var M2 = w * L * L / 8, V2 = w * L / 2;
      main = { p: w, ptc: wtc, L: L, M: M2, V: V2, sg: M2 / p.s3.W * 1e6, tv: tau(V2, p.s3), d: 5 * wtc * Math.pow(L, 4) / (384 * E * p.s3.J) * 1e11, lim: L / 250 * 1000 };
      if (p.cons) { var c = p.L3c, Mc = w * c * c / 2, Vc = w * c; con = { M: Mc, V: Vc, sg: Mc / p.s3.W * 1e6, tv: tau(Vc, p.s3), d: wtc * Math.pow(c, 4) / (8 * E * p.s3.J) * 1e11, lim: c / 125 * 1000, L: c }; }
      var lim2 = p.cons ? (b <= L + p.L3c) : (b < 2 * L);
      N = lim2 ? ld.tt * (p.L2 + p.L2p) * b / 4 : ld.tt * (p.L2 + p.L2p) * L / 2;
    } else {
      ldS = vload(p.gam, p.hs, p.q2, p.q3, p.q4);
      Pu = ldS.tt * (p.A2 + p.A2p) * (p.A1 + p.A1p) / 4; Putc = Pu * ldS.tc / ldS.tt;
      if (!p.cons) {
        a = Math.max(0, (L - b) / 2 - p.A1p);
        main = partial(Pu * a, Pu, Putc * a * (3 * L * L - 4 * a * a) / (24 * E * p.s3.J) * 1e11);
      } else {
        main = partial(0, 0, 0); var cc = p.L3c;
        con = { M: Pu * cc, V: Pu, sg: Pu * cc / p.s3.W * 1e6, tv: tau(Pu, p.s3), d: Putc * cc * cc * cc / (3 * E * p.s3.J) * 1e11, lim: cc / 125 * 1000, L: cc };
      }
      N = ld.tt * (p.L2 + p.L2p) * b / 4 + Pu;
    }
    // Thành dầm
    var P = lateral(p.gam, p.h, p.V, p.R, p.k1, p.k2);
    var qs = 1.3 * P + 1.3 * p.q3s, qstc = P + p.q3s;
    var vs = ply(qs, qstc, p.L4, p.tp, 1, p.fp, p.Ep);
    var ss = cont(qs * p.L4, qstc * p.L4, p.L5, p.s4, f, E);
    var wm = qs * p.L5, wmtc = qstc * p.L5, L6 = p.L6, Mm = wm * L6 * L6 / 8, Vm = wm * L6 / 2;
    var ms = { p: wm, ptc: wmtc, L: L6, M: Mm, V: Vm, sg: Mm / p.s5.W * 1e6, tv: tau(Vm, p.s5), d: 5 * wmtc * Math.pow(L6, 4) / (384 * E * p.s5.J) * 1e11, lim: L6 / 250 * 1000 };
    var Nt = qs * L6 * p.L5, At = Math.PI * p.dt * p.dt / 4 / 1e6, st = Nt / At;
    var groups = [
      { vi: 'Ván đáy dầm', en: 'Beam soffit sheathing', checks: v.checks },
      { vi: 'Xà gồ phụ đáy dầm', en: 'Soffit joists', checks: steelChecks(sp, f, 'xà gồ phụ', 'joist') },
      { vi: 'Xà gồ chính đáy dầm', en: 'Soffit bearers', checks: steelChecks(main, f, 'nhịp giữa', 'main span') }];
    if (con) groups[2].checks = groups[2].checks.concat(steelChecks(con, f, 'console', 'cantilever'));
    groups.push({ vi: 'Cây chống', en: 'Props', checks: [chk('Lực vào 1 cây chống', 'Load per prop', N, p.P, 'kN', 2)] });
    groups.push({ vi: 'Ván thành dầm', en: 'Side sheathing', checks: vs.checks });
    groups.push({ vi: 'Xà gồ phụ thành dầm', en: 'Side studs', checks: steelChecks(ss, f, 'xà gồ phụ thành', 'stud') });
    groups.push({ vi: 'Xà gồ chính thành dầm', en: 'Side walers', checks: steelChecks(ms, f, 'xà gồ chính thành', 'waler') });
    groups.push({ vi: 'Ty giằng', en: 'Form tie', checks: [chk('Ứng suất ty giằng', 'Tie stress', st / 1000, p.ft / 1000, 'MPa', 1)] });
    return { ld: ld, ldS: ldS, Pu: Pu, a: a, ply: v, sec: sp, main: main, con: con, N: N, P: P, qs: qs, qstc: qstc, plyS: vs, secS: ss, mainS: ms, Nt: Nt, st: st, groups: groups };
  }

  /* CHỐNG PHỤ NHIỀU TẦNG
     p = {top:'slab'|'beam', h, b, gam, lo, bo, P, Rbt (MPa), c (m, bản đế), floors:[{name, hs, a, LL, SDL, nLL, nSDL, l1, b1, B}] } */
  function reshore(p) {
    var qtop = 1.2 * p.gam * p.h + 1.1 * 1 + 1.3 * 2 + 1.3 * 2.5;
    var fl = p.floors, out = [], q = p.top === 'beam' ? qtop * p.b / (fl[0].B / 1000) : qtop;
    var Pprev = qtop * p.lo * p.bo / 1e6, stop = false;
    for (var i = 0; i < fl.length && !stop; i++) {
      var F = fl[i], h0 = (F.hs - F.a) / 1000, last = i === fl.length - 1;
      var qtk = F.nSDL * F.SDL + F.nLL * F.LL;
      var Pxt = p.Rbt * 1000 * (4 * p.c + 4 * h0) * h0;
      var r = { name: F.name, q: q, qtk: qtk, h0: h0, Pin: Pprev, Pxt: Pxt, rPun: Pprev / Pxt, need: q > qtk && !last, last: last };
      if (r.need) {
        r.Pr = (q - qtk) * F.l1 * F.b1 / 1e6; r.rP = r.Pr / p.P; Pprev = r.Pr;
        var nx = fl[i + 1];
        q = p.top === 'beam' ? (q - qtk) * F.B / nx.B : (q - qtk);
      } else { stop = true; r.qdown = last ? q : 0; }
      out.push(r);
    }
    return { qtop: qtop, rows: out };
  }


  /* CỐP PHA ĐỨNG (móng ván, cột, vách): áp lực ngang → ván → xà gồ phụ → xà gồ chính → ty
     p = {H, V, R, k1, k2, gam, cap, qd, tp, fp, Ep, s2, L1, s3, L2, L2p, L3, f, E, dt, ft, lim (250|400)} */
  function vert(p) {
    var Praw = p.H <= p.R ? p.gam * p.H : p.gam * (0.27 * p.V + 0.78) * p.k1 * p.k2;
    var P = p.cap ? Math.min(Praw, p.gam * p.H) : Praw;
    var tc = P + p.qd, tt = 1.3 * P + 1.3 * p.qd, f = p.f, E = p.E;
    var v = ply(tt, tc, p.L1, p.tp, 1, p.fp, p.Ep); v.checks[1].lim = p.L1 / p.lim * 1000; v.checks[1].r = v.checks[1].val / v.checks[1].lim;
    var Ls = Math.max(p.L2, p.L2p);
    var sp = cont(tt * p.L1, tc * p.L1, Ls, p.s2, f, E); sp.lim = Ls / p.lim * 1000;
    var w = (p.L2 + p.L2p) / 2, mp = cont(tt * w, tc * w, p.L3, p.s3, f, E); mp.lim = p.L3 / p.lim * 1000;
    var Nt = tt * w * p.L3, Nu = Math.PI * p.dt * p.dt / 4 / 1e6 * p.ft;
    return { Praw: Praw, P: P, tc: tc, tt: tt, ply: v, sec: sp, main: mp, Ls: Ls, Nt: Nt, Nu: Nu,
      groups: [
        { vi: 'Ván', en: 'Sheathing', checks: v.checks },
        { vi: 'Xà gồ phụ', en: 'Studs', checks: steelChecks(sp, f, 'xà gồ phụ', 'stud') },
        { vi: 'Xà gồ chính', en: 'Walers', checks: steelChecks(mp, f, 'xà gồ chính', 'waler') },
        { vi: 'Ty giằng', en: 'Form ties', checks: [chk('Lực kéo ty giằng', 'Tie tension', Nt, Nu, 'kN', 2)] }] };
  }

  /* CỐP PHA MÓNG TÔN SÓNG chắn đất: áp lực đất chủ động → tôn → sườn phụ → sườn chính → cây chống xiên
     p = {H, phi, gs, q0, n, J1, W1, fs, Es, d2, L1, d3, L2, fr, Er, L3, alpha, N} */
  function tole(p) {
    var Ka = Math.pow(Math.tan((45 - p.phi / 2) * Math.PI / 180), 2);
    var ptc = Ka * (p.gs * p.H + p.q0), pt = p.n * ptc;
    var W1 = p.W1 * 1e-6, J1 = p.J1 * 1e-8;
    var M1 = pt * p.L1 * p.L1 / 10, s1 = M1 / W1, d1 = ptc * Math.pow(p.L1, 4) / (145 * p.Es * J1) * 1000;
    function bar(d) { d /= 10; return { J: Math.PI * Math.pow(d, 4) / 64 * 1e-8, W: Math.PI * Math.pow(d, 3) / 32 * 1e-6 }; }
    var b2 = bar(p.d2), b3 = bar(p.d3);
    var q2 = pt * p.L1, q2tc = ptc * p.L1, M2 = q2 * p.L2 * p.L2 / 8, s2 = M2 / b2.W, d2 = 5 * q2tc * Math.pow(p.L2, 4) / (384 * p.Er * b2.J) * 1000;
    var q3 = pt * p.L2, q3tc = ptc * p.L2, M3 = q3 * p.L3 * p.L3 / 8, s3 = M3 / b3.W, d3 = 5 * q3tc * Math.pow(p.L3, 4) / (384 * p.Er * b3.J) * 1000;
    var Np = q3 * p.L3 / Math.cos(p.alpha * Math.PI / 180);
    return { Ka: Ka, ptc: ptc, pt: pt, M1: M1, s1: s1, d1: d1, q2: q2, M2: M2, s2: s2, d2: d2, q3: q3, M3: M3, s3: s3, d3: d3, Np: Np,
      groups: [
        { vi: 'Tôn sóng', en: 'Corrugated sheet', checks: [chk('Ứng suất tôn', 'Sheet stress', s1 / 1000, p.fs / 1000, 'MPa', 1), chk('Độ võng tôn', 'Sheet deflection', d1, p.L1 / 250 * 1000, 'mm', 2)] },
        { vi: 'Sườn phụ (thép tròn)', en: 'Secondary ribs (bars)', checks: [chk('Ứng suất sườn phụ', 'Rib stress', s2 / 1000, p.fr / 1000, 'MPa', 1), chk('Độ võng sườn phụ', 'Rib deflection', d2, p.L2 / 250 * 1000, 'mm', 2)] },
        { vi: 'Sườn chính (thép tròn)', en: 'Main ribs (bars)', checks: [chk('Ứng suất sườn chính', 'Rib stress', s3 / 1000, p.fr / 1000, 'MPa', 1), chk('Độ võng sườn chính', 'Rib deflection', d3, p.L3 / 250 * 1000, 'mm', 2)] },
        { vi: 'Cây chống xiên', en: 'Raking props', checks: [chk('Lực vào 1 cây chống', 'Load per prop', Np, p.N, 'kN', 2)] }] };
  }

  var api = { vert: vert, tole: tole, box: box, parseBox: parseBox, vload: vload, lateral: lateral, slab: slab, beam: beam, reshore: reshore };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.FORM = api;
})(this);
