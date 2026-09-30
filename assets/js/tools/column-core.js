/* Cột BTCT chữ nhật / tròn chịu nén lệch tâm xiên — TCVN 5574:2018.
   Khả năng chịu lực tính bằng mô hình thớ (khối ứng suất chữ nhật Rb, cốt thép đàn – dẻo, εb2 = 0,0035).
   Đơn vị: N, mm (đầu vào kN, kN·m được quy đổi). */
(function (root) {
  var EB2 = 0.0035;
  // Tạo tiết diện: thớ bê tông và vị trí thanh thép
  function rect(b, h, a, nx, ny, d) {
    var fib = [], N = 40, dx = b / N, dy = h / N, bars = [], Ab = Math.PI * d * d / 4;
    for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) fib.push([-b / 2 + (i + 0.5) * dx, -h / 2 + (j + 0.5) * dy, dx * dy]);
    var xs = b / 2 - a, ys = h / 2 - a;
    for (var k = 0; k < nx; k++) { var x = nx > 1 ? -xs + 2 * xs * k / (nx - 1) : 0; bars.push([x, ys, Ab]); bars.push([x, -ys, Ab]); }
    for (var m = 1; m < ny - 1; m++) { var y = -ys + 2 * ys * m / (ny - 1); bars.push([xs, y, Ab]); bars.push([-xs, y, Ab]); }
    return { type: 'rect', b: b, h: h, A: b * h, fib: fib, bars: bars, Ab: Ab, Ix: b * h * h * h / 12, Iy: h * b * b * b / 12 };
  }
  function circ(D, a, n, d) {
    var fib = [], N = 50, s = D / N, r = D / 2, bars = [], Ab = Math.PI * d * d / 4, rs = r - a;
    for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) { var x = -r + (i + 0.5) * s, y = -r + (j + 0.5) * s; if (x * x + y * y <= r * r) fib.push([x, y, s * s]); }
    var At = fib.reduce(function (t, f) { return t + f[2]; }, 0), A = Math.PI * r * r; fib.forEach(function (f) { f[2] *= A / At; });
    for (var k = 0; k < n; k++) { var t = 2 * Math.PI * k / n; bars.push([rs * Math.sin(t), rs * Math.cos(t), Ab]); }
    var I = Math.PI * Math.pow(D, 4) / 64;
    return { type: 'circ', D: D, A: A, fib: fib, bars: bars, Ab: Ab, Ix: I, Iy: I, rs: rs };
  }
  // Nội lực trong tiết diện ứng với trục trung hòa vuông góc hướng u (góc th), độ sâu vùng nén c (từ thớ nén ngoài cùng)
  function forces(S, M, th, c) {
    var ux = Math.sin(th), uy = Math.cos(th); // hướng từ trọng tâm tới thớ nén
    var pr = S.fib.map(function (f) { return f[0] * ux + f[1] * uy; }), top = Math.max.apply(null, pr);
    var Nn = 0, Mu = 0;
    S.fib.forEach(function (f, k) { var dep = top - pr[k]; if (dep <= 0.8 * c) { Nn += M.Rb * f[2]; Mu += M.Rb * f[2] * pr[k]; } });
    S.bars.forEach(function (b) {
      var p = b[0] * ux + b[1] * uy, dep = top - p, e = EB2 * (c - dep) / c, s = Math.max(-M.Rs, Math.min(M.Rsc, M.Es * e));
      if (dep <= 0.8 * c && s > 0) s -= M.Rb; // trừ phần bê tông bị thép chiếm chỗ
      Nn += s * b[2]; Mu += s * b[2] * p;
    });
    return { N: Nn, M: Mu };
  }
  function N0(S, M) { var As = S.bars.length * S.Ab; return M.Rb * (S.A - As) + M.Rsc * As; }
  // Khả năng chịu mô men tại lực dọc N (N dương = nén), theo hướng th
  function capM(S, M, th, N) {
    if (N >= N0(S, M)) return 0;
    var lo = 1e-3, hi = 50 * Math.max(S.b || S.D, S.h || S.D);
    if (forces(S, M, th, lo).N > N) return forces(S, M, th, lo).M;
    for (var i = 0; i < 80; i++) { var mid = (lo + hi) / 2; if (forces(S, M, th, mid).N > N) hi = mid; else lo = mid; }
    return forces(S, M, th, (lo + hi) / 2).M;
  }
  function curve(S, M, th) {
    var pts = [], H = S.type === 'rect' ? Math.abs(Math.sin(th)) * S.b + Math.abs(Math.cos(th)) * S.h : S.D;
    var cs = [1e-3]; for (var i = 1; i <= 60; i++) cs.push(H * Math.pow(i / 40, 1.6)); cs.push(H * 5, H * 20);
    cs.forEach(function (c) { var f = forces(S, M, th, c); pts.push([f.M / 1e6, f.N / 1e3]); });
    pts.push([0, N0(S, M) / 1e3]);
    return pts;
  }
  // Độ cứng D (công thức 46–48), hệ số η (44–45)
  function eta(S, M, ax, N, Mom, L0, rL, ea) {
    var I = ax === 'x' ? S.Ix : S.Iy, h = S.type === 'rect' ? (ax === 'x' ? S.h : S.b) : S.D, i = Math.sqrt(I / S.A), lam = L0 / i;
    var e0 = Math.max(Math.abs(Mom) / Math.max(N, 1e-9), ea), de = Math.min(1.5, Math.max(0.15, e0 / h));
    var Is = S.bars.reduce(function (t, b) { var y = ax === 'x' ? b[1] : b[0]; return t + b[2] * y * y; }, 0);
    var ys = S.bars.reduce(function (t, b) { return Math.max(t, Math.abs(ax === 'x' ? b[1] : b[0])); }, 0);
    var M1 = Math.abs(Mom) + N * ys, M1L = rL * M1, phiL = Math.min(2, 1 + M1L / M1);
    var kb = 0.15 / (phiL * (0.3 + de)), D = kb * M.Eb * I + 0.7 * M.Es * Is;
    var Ncr = Math.PI * Math.PI * D / (L0 * L0), et = lam <= 14 + 1e-6 ? 1 : (N < Ncr ? 1 / (1 - N / Ncr) : Infinity);
    return { i: i, lam: lam, e0: e0, de: de, Is: Is, phiL: phiL, kb: kb, D: D, Ncr: Ncr, eta: et, Md: N * e0 * et };
  }
  /* p: {sec:'rect'|'circ', b, h, D, a, nx, ny, n, d, Rb, Rbt, Rs, Rsc, Es, Eb, N, Mx, My, Vx, Vy, L, mu, rL, dw, sw, nwx, nwy, Rsw} (kN, kN·m, mm, m, MPa) */
  function column(p) {
    var S = p.sec === 'rect' ? rect(p.b, p.h, p.a, p.nx, p.ny, p.d) : circ(p.D, p.a, p.n, p.d);
    var M = { Rb: p.Rb, Rs: p.Rs, Rsc: p.Rsc, Es: p.Es, Eb: p.Eb }, N = p.N * 1e3, L0 = p.mu * p.L * 1000;
    var hx = S.type === 'rect' ? S.h : S.D, hy = S.type === 'rect' ? S.b : S.D;
    var eax = Math.max(p.L * 1000 / 600, hx / 30, 10), eay = Math.max(p.L * 1000 / 600, hy / 30, 10);
    var ex = eta(S, M, 'x', N, p.Mx * 1e6, L0, p.rL, eax), ey = eta(S, M, 'y', N, p.My * 1e6, L0, p.rL, eay);
    var Mdx = ex.Md, Mdy = ey.Md;
    if (S.type === 'circ') { // tiết diện tròn: gộp mô men
      var e1 = Math.sqrt(p.Mx * p.Mx + p.My * p.My) * 1e6; var ec = eta(S, M, 'x', N, e1, L0, p.rL, eax); Mdx = ec.Md; Mdy = 0; ex = ec; ey = ec;
    }
    var Md = Math.sqrt(Mdx * Mdx + Mdy * Mdy), th = Math.atan2(Mdy, Mdx || 1e-9); // th đo từ trục y (Mx gây nén thớ +y)
    var Mcap = capM(S, M, th, N), n0 = N0(S, M), rM = Md / Mcap;
    var Mux = capM(S, M, 0, N), Muy = capM(S, M, Math.PI / 2, N);
    var As = S.bars.length * S.Ab, mu = As / S.A * 100;
    var out = { S: S, ex: ex, ey: ey, eax: eax, eay: eay, Mdx: Mdx / 1e6, Mdy: Mdy / 1e6, Md: Md / 1e6, th: th, Mcap: Mcap / 1e6, Mux: Mux / 1e6, Muy: Muy / 1e6, N0: n0 / 1e3, rN: N / n0, rM: rM, As: As, mu: mu, curve: curve(S, M, th) };
    if (S.type === 'rect') {
      var Asw = function (n) { return n * Math.PI * p.dw * p.dw / 4; };
      function sh(V, b, h0, n) { var q = p.Rsw * Asw(n) / p.sw, use = q >= 0.25 * p.Rbt * b, Qb = 0.5 * p.Rbt * b * h0, Qs = use ? q * h0 : 0; return { q: q, use: use, Qb: Qb / 1e3, Qs: Qs / 1e3, Q: (Qb + Qs) / 1e3, r: Math.abs(V) / ((Qb + Qs) / 1e3) }; }
      out.shx = sh(p.Vx, S.b, S.h - p.a, p.nwx); out.shy = sh(p.Vy, S.h, S.b - p.a, p.nwy);
    }
    return out;
  }
  var api = { rect: rect, circ: circ, forces: forces, capM: capM, N0: N0, column: column };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.COL = api;
})(this);
