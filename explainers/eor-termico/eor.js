// EOR térmico — explainer in the "Low-Poly Faceted" style.
// One faceted block diorama at dawn: surface plant on top, the reservoir exposed on the cut face.
// Every frame is a pure function of t: explainer(ctx, 1280, 720, t).
(function () {
  const DURATION = 27.5;

  // ---------- tiny 3D pipeline (from the reference) ----------
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const scl = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const ICO = (() => {
    const t = (1 + Math.sqrt(5)) / 2;
    const v = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(norm);
    const f = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    return { v, f };
  })();
  function makeCamYaw(pos, yaw, pitch, f, W, Hh) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    return {
      pos,
      proj(p) {
        const dx = p[0] - pos[0], dy = p[1] - pos[1], dz = p[2] - pos[2];
        const x1 = dx * cy - dz * sy, z1 = dx * sy + dz * cy;
        const y2 = dy * cp + z1 * sp, z2 = -dy * sp + z1 * cp;
        return [W / 2 + (f * x1) / z2, Hh / 2 - (f * y2) / z2, z2];
      },
    };
  }

  // ---------- reference 2D pieces: cut-corner tag, two-tone ribbon arrow ----------
  function lpTag(ctx, x, y, text, o = {}) {
    ctx.save();
    ctx.font = o.font || '700 28px "Space Grotesk"';
    const fsz = parseInt((ctx.font.match(/(\d+)px/) || [0, 28])[1]);
    const w = ctx.measureText(text).width + fsz * 1.3, h = o.h || Math.round(fsz * 1.75), k = o.k ?? 1, ch = h * 0.32;
    ctx.translate(x, y); ctx.scale(k, k);
    const pts = [[-w / 2 + ch, -h / 2], [w / 2, -h / 2], [w / 2, h / 2 - ch], [w / 2 - ch, h / 2], [-w / 2, h / 2], [-w / 2, -h / 2 + ch]];
    ctx.fillStyle = o.shadow || 'rgba(40,20,70,0.35)'; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0] + 4, p[1] + 4) : ctx.moveTo(p[0] + 4, p[1] + 4)); ctx.closePath(); ctx.fill();
    const bg = H.hex(o.bg || '#fff6f0');
    ctx.fillStyle = H.rgba(bg); ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill();
    ctx.fillStyle = H.rgba(H.mix(bg, [255, 255, 255], 0.5)); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); ctx.lineTo(w / 2 - h * 0.6, 0); ctx.lineTo(-w / 2, 0); ctx.lineTo(pts[5][0], pts[5][1]); ctx.closePath(); ctx.fill();
    ctx.fillStyle = o.col || '#2a1f4f'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 1);
    ctx.restore();
  }
  // same tag, anchored by its left edge
  function lpTagL(ctx, x, y, text, o = {}) {
    ctx.save(); ctx.font = o.font || '700 28px "Space Grotesk"';
    const fsz = parseInt((ctx.font.match(/(\d+)px/) || [0, 28])[1]);
    const w = ctx.measureText(text).width + fsz * 1.3; ctx.restore();
    lpTag(ctx, x + w / 2 * (o.k ?? 1), y, text, o);
    return w;
  }
  function lpArrow(ctx, a, c, b, prog, colA, w = 12) {
    if (prog <= 0) return null;
    const q = (u) => [(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * c[0] + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * c[1] + u * u * b[1]];
    const N = 7, pts = []; for (let i = 0; i <= N; i++) pts.push(q(prog * i / N));
    const light = H.rgba(H.mix(colA, [255, 255, 255], 0.3)), dark = H.rgba(H.mix(colA, [40, 20, 70], 0.25));
    const end = pts.length - 1;
    for (let i = 0; i < end; i++) {
      const p0 = pts[i], p1 = pts[i + 1], dx = p1[0] - p0[0], dy = p1[1] - p0[1], L = Math.hypot(dx, dy) || 1;
      const nx = -dy / L * w / 2, ny = dx / L * w / 2;
      const shrink = i === end - 1 ? 0.35 : 0;
      const p1b = [p1[0] - dx * shrink, p1[1] - dy * shrink];
      ctx.fillStyle = light; ctx.beginPath(); ctx.moveTo(p0[0] + nx, p0[1] + ny); ctx.lineTo(p1b[0] + nx, p1b[1] + ny); ctx.lineTo(p1b[0], p1b[1]); ctx.lineTo(p0[0], p0[1]); ctx.closePath(); ctx.fill();
      ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(p0[0] - nx, p0[1] - ny); ctx.lineTo(p1b[0] - nx, p1b[1] - ny); ctx.lineTo(p1b[0], p1b[1]); ctx.lineTo(p0[0], p0[1]); ctx.closePath(); ctx.fill();
    }
    const e = pts[end], e0 = pts[end - 1], ang = Math.atan2(e[1] - e0[1], e[0] - e0[0]);
    ctx.save(); ctx.translate(e[0], e[1]); ctx.rotate(ang);
    ctx.fillStyle = light; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-w * 1.4, -w * 1.1); ctx.lineTo(-w * 1.4, 0); ctx.closePath(); ctx.fill();
    ctx.fillStyle = dark; ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-w * 1.4, w * 1.1); ctx.lineTo(-w * 1.4, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
    return q;
  }
  // hex verdict badge (reference check/cross)
  function hexBadge(ctx, x, y, k, right) {
    if (k <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(0.12);
    const hexR = 30; ctx.fillStyle = right ? '#3ccf9a' : '#ff5a4a';
    ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; ctx.lineTo(Math.cos(a) * hexR, Math.sin(a) * hexR); } ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(0, 0); for (let i = 3; i <= 6; i++) { const a = i / 6 * Math.PI * 2; ctx.lineTo(Math.cos(a) * hexR, Math.sin(a) * hexR); } ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.lineJoin = 'miter'; ctx.beginPath();
    if (right) { ctx.moveTo(-12, 0); ctx.lineTo(-4, 10); ctx.lineTo(13, -11); } else { ctx.moveTo(-10, -10); ctx.lineTo(10, 10); ctx.moveTo(10, -10); ctx.lineTo(-10, 10); }
    ctx.stroke(); ctx.restore();
  }

  // ---------- palette ----------
  const SUN_DIR = norm([0.75, 0.55, 0.45]);
  const SUN_COL = [255, 226, 190], AMB = [104, 98, 150];
  const FOG = [236, 160, 150], FOG_HI = [180, 140, 190];
  const INK = '#2a1f4f';
  const CORAL = [255, 112, 96], TEAL = [96, 196, 206], STEAM = [250, 236, 240];
  const COLD_OIL = [66, 46, 42], WARM_OIL = [206, 118, 58], HOT = [255, 214, 186];
  const WATER = -0.6;
  const XB = 64, ZB = 140, YB = -48; // block: x in [-XB, XB], z in [0, ZB], floor at YB; the cut face is z = 0

  const nz = H.makeNoise(31);
  // ---------- world ----------
  function height(x, z) {
    let h = 2 + nz.fbm2(x * 0.08, z * 0.08, 3) * 0.35;
    const back = H.smooth(22, 62, z);
    h += back * (8 + nz.fbm2(x * 0.045 + 3, z * 0.045, 4) * 11 + H.smooth(75, 135, z) * 16 + Math.pow(Math.abs(x) / XB, 2) * 6);
    const rv = Math.exp(-Math.pow((z - 40 - 4 * Math.sin(x * 0.06)) / 5.5, 2));
    return H.lerp(h, -1.6, rv * 0.92);
  }
  // rock column of the cut face (strata), y up
  function strata(x, y) {
    const w = nz.fbm2(x * 0.03, y * 0.05 + 7, 2) * 1.6, wr = nz.fbm2(x * 0.02, 9.3, 2) * 0.8, yy = y + w;
    if (y > -1.6 + w * 0.5) return [150, 112, 100];       // suelo
    if (yy > -8.5) return [226, 186, 140];                // arenisca
    if (yy > -12) return [146, 126, 146];                 // lutita
    if (yy > -17) return [204, 164, 128];                 // arenisca 2
    if (y > -22 + wr) return [106, 94, 126];              // sello (lutita)
    if (y > -32 + wr * 0.6) return COLD_OIL;              // yacimiento: arena con crudo pesado
    return [128, 114, 138];                               // basamento
  }
  const inRes = (x, y) => { const wr = nz.fbm2(x * 0.02, 9.3, 2) * 0.8; return y < -22 + wr && y > -32 + wr * 0.6; };

  // ---------- thermal states of the reservoir (pure functions of t) ----------
  const ph = (t, a, b) => H.clamp((t - a) / (b - a));
  const Ei = (t, a, b) => H.ease.inOut(ph(t, a, b));
  const steamS = (t) => Ei(t, 14.6, 16.8);
  const sagdS = (t) => Ei(t, 18.5, 20.8);
  const combXf = (t) => H.lerp(-23, 14, Ei(t, 22.3, 24.8));
  const sagdChamber = (s) => ({ top: -27.5 + 5.2 * H.clamp(s * 1.7), k: 0.55 + 2.2 * s });
  function faceColor(x, y, t, mode) {
    const base = strata(x, y);
    if (!inRes(x, y)) return { col: base };
    const j = nz.n2(x * 0.3, y * 0.3) * 1.5;
    if (mode === 0) {
      const s = steamS(t); if (s <= 0) return { col: base };
      const R = 3 + 21 * s, Ry = R * (0.55 + 0.45 * (y + 32) / 10), d = Math.abs(x) + j;
      for (const px of [-24, 24]) { const dp = Math.hypot(x - px, (y + 31) * 1.5); if (s > 0.55 && dp < 3 + 4 * (s - 0.55)) return { col: H.mix(WARM_OIL, COLD_OIL, 0.25) }; }
      if (d < Ry * 0.5) return { col: HOT };
      if (d < Ry) return { col: H.mix(HOT, WARM_OIL, H.smooth(Ry * 0.5, Ry, d)) };
      if (d < Ry + 5) return { col: H.mix(WARM_OIL, COLD_OIL, (d - Ry) / 5) };
      return { col: base };
    }
    if (mode === 1) {
      const s = sagdS(t), C = sagdChamber(s);
      const hw = (y + 28.6) * C.k + j * 0.4;
      if (y > -28.6 && y < C.top && Math.abs(x) < hw) return { col: H.mix(HOT, [255, 236, 226], H.clamp((y + 28) / 6)) };
      const ex = Math.abs(x) - Math.max(0, hw);
      if (y > -31.8 && ex < 2.6 + (y < -28 ? 1.4 : 0) && (y < C.top + 1.2 || y < -27)) return { col: H.mix(WARM_OIL, COLD_OIL, H.clamp(ex / 3.2)) };
      return { col: base };
    }
    const xf = combXf(t) + (y + 27) * 0.3 + j * 0.5, lit = t > 22.15;
    if (!lit || x <= -26) return { col: base };
    if (x < xf - 2.2 && x > -26) return { col: H.mix([214, 200, 186], [180, 160, 150], H.smooth(-26, xf - 2, x)) }; // zona quemada
    if (x < xf && x > -26) return { col: [255, 156, 72], emissive: true };                                       // frente de fuego
    if (x < xf + 6) return { col: H.mix([240, 170, 100], WARM_OIL, (x - xf) / 6) };                                // vapor + crudo liviano
    if (x < xf + 13) return { col: [44, 28, 26] };                                                                   // banco de crudo
    return { col: base };
  }
  // face facets flip in place at each method change (the medium's own scene change)
  const FLIPS = [17.6, 21.2];
  function faceFlip(x, t) {
    let mode = 0, scale = 1;
    FLIPS.forEach((T) => { const at = T + (x + XB) / (2 * XB) * 0.55, u = ph(t, at, at + 0.42); if (u >= 0.5) mode++; if (u > 0 && u < 1) scale = Math.abs(1 - 2 * u); });
    return { mode, scale };
  }

  // ---------- static geometry: terrain, cut face, side walls, trees, plant (cached) ----------
  let STATIC = null;
  function buildStatic() {
    const tris = [];
    const push = (a, b, c, col, opt = {}) => tris.push({ p: [a, b, c], col, ...opt });
    const jr = H.rng(5);
    // terrain grid
    const CELL = 4, nx = Math.round(2 * XB / CELL), nzc = Math.round(ZB / CELL), V = [];
    for (let j = 0; j <= nzc; j++) { const row = []; for (let i = 0; i <= nx; i++) { const x = -XB + i * CELL + (i > 0 && i < nx ? jr.range(-0.38, 0.38) * CELL : 0), z = j * CELL + (j > 0 && j < nzc ? jr.range(-0.38, 0.38) * CELL : 0); row.push([x, height(x, z), z]); } V.push(row); }
    const pad = (x, z) => (x > -30 && x < 6 && z > 3 && z < 16) || (x > 31 && x < 50 && z > 3 && z < 17);
    const tc = (y, slope, x, z) => {
      let c;
      if (y < WATER + 0.6) c = [214, 196, 150];
      else if (y < 6) c = H.mix([86, 160, 112], [60, 128, 96], H.clamp(y / 6));
      else if (y < 14) c = H.mix([60, 128, 96], [110, 112, 120], H.smooth(9, 14, y));
      else if (y < 22) c = [118, 110, 128]; else c = [244, 238, 248];
      if (slope > 0.55 && y > 3 && y < 22) c = H.mix(c, [124, 112, 124], 0.6);
      if (pad(x, z) && y < 3) c = [186, 176, 178];
      return c;
    };
    for (let j = 0; j < nzc; j++) for (let i = 0; i < nx; i++) {
      const a = V[j][i], b = V[j][i + 1], c = V[j + 1][i], d = V[j + 1][i + 1];
      const faces = (i + j) % 2 ? [[a, c, b], [b, c, d]] : [[a, c, d], [a, d, b]];
      for (const f of faces) {
        if (Math.max(f[0][1], f[1][1], f[2][1]) < WATER) { push(...f.map(p => [p[0], WATER + nz.n2(p[0] * 0.4, p[2] * 0.4) * 0.35, p[2]]), [96, 120, 190], { water: true }); continue; }
        let n = norm(cross(sub(f[1], f[0]), sub(f[2], f[0]))); if (n[1] < 0) n = scl(n, -1);
        const cx = (f[0][0] + f[1][0] + f[2][0]) / 3, cz = (f[0][2] + f[1][2] + f[2][2]) / 3;
        push(f[0], f[1], f[2], tc((f[0][1] + f[1][1] + f[2][1]) / 3, 1 - Math.abs(n[1]), cx, cz), { terrain: true });
      }
    }
    // cut face (z = 0): jittered grid from the floor to the terrain edge; coloured per frame
    {
      const CX = 2.6, cols = Math.round(2 * XB / CX), rows = 17, G = [];
      for (let i = 0; i <= cols; i++) {
        const x = -XB + i * CX + (i > 0 && i < cols ? jr.range(-0.35, 0.35) * CX : 0), top = height(x, 0), col = [];
        for (let r = 0; r <= rows; r++) { const y = r === rows ? top : YB + r * (top - YB) / rows + (r > 0 ? jr.range(-0.32, 0.32) * 2.5 : 0); col.push([x, y, 0]); }
        G.push(col);
      }
      for (let i = 0; i < cols; i++) for (let r = 0; r < rows; r++) {
        const a = G[i][r], b = G[i + 1][r], c = G[i][r + 1], d = G[i + 1][r + 1];
        const faces = (i + r) % 2 ? [[a, b, c], [b, d, c]] : [[a, b, d], [a, d, c]];
        for (const f of faces) { const cx = (f[0][0] + f[1][0] + f[2][0]) / 3, cy = (f[0][1] + f[1][1] + f[2][1]) / 3; push(f[0], f[1], f[2], null, { face: true, cx, cy, jit: jr() }); }
      }
    }
    // side walls x = ±XB (static strata)
    for (const sx of [-1, 1]) {
      const CZ = 4, cols = Math.round(ZB / CZ), rows = 10, G = [];
      for (let i = 0; i <= cols; i++) { const z = i * CZ, top = height(sx * XB, z), col = []; for (let r = 0; r <= rows; r++) col.push([sx * XB, r === rows ? top : YB + r * (top - YB) / rows + (r > 0 ? jr.range(-0.3, 0.3) * 3 : 0), z]); G.push(col); }
      for (let i = 0; i < cols; i++) for (let r = 0; r < rows; r++) {
        const a = G[i][r], b = G[i + 1][r], c = G[i][r + 1], d = G[i + 1][r + 1];
        for (const f of [[a, b, d], [a, d, c]]) { const cy = (f[0][1] + f[1][1] + f[2][1]) / 3, cz = (f[0][2] + f[1][2] + f[2][2]) / 3; push(f[0], f[1], f[2], strata(cz * 0.7 + sx * 50, cy), { side: true, nrm: [sx, 0, 0] }); }
      }
    }
    // trees
    const tr = H.rng(9);
    const cone = (base, r, h, col, rot) => { const vs = [add3(base, [0, h, 0])]; for (let i = 0; i < 5; i++) { const a = rot + i / 5 * Math.PI * 2; vs.push(add3(base, [Math.cos(a) * r, 0, Math.sin(a) * r])); } for (let i = 0; i < 5; i++) push(vs[0], vs[1 + i], vs[1 + (i + 1) % 5], col, { center: add3(base, [0, h * 0.3, 0]), tree: true }); };
    for (let kk = 0, placed = 0; kk < 1600 && placed < 150; kk++) {
      const x = tr.range(-XB + 3, XB - 3), z = tr.range(4, 120), y = height(x, z);
      if (y < 0.8 || y > 13) continue;
      if (z < 24 && Math.abs(x) < 54) continue;
      if (nz.fbm2(x * 0.05 + 40, z * 0.05, 2) < -0.08) continue;
      const s = tr.range(1.5, 2.4), g = H.mix([40, 110, 90], [70, 140, 100], tr()), rot = tr() * 6;
      cone([x, y - 0.2, z], s * 0.75, s * 1.6, g, rot); cone([x, y + s * 0.85, z], s * 0.55, s * 1.4, H.mix(g, [120, 180, 120], 0.25), rot + 0.6);
      placed++;
    }
    // surface plant
    const P = { obj: true };
    const prism = (cx, y0, cz, r, h, sides, col, rot = 0, opt = P) => {
      const vs = []; for (let i = 0; i < sides; i++) { const a = rot + i / sides * Math.PI * 2; vs.push([cx + Math.cos(a) * r, y0, cz + Math.sin(a) * r]); }
      for (let i = 0; i < sides; i++) { const a = rot + i / sides * Math.PI * 2; vs.push([cx + Math.cos(a) * r, y0 + h, cz + Math.sin(a) * r]); }
      const cen = [cx, y0 + h / 2, cz];
      for (let i = 0; i < sides; i++) { const j = (i + 1) % sides; push(vs[i], vs[j], vs[sides + j], col, { center: cen, ...opt }); push(vs[i], vs[sides + j], vs[sides + i], col, { center: cen, ...opt }); }
      for (let i = 1; i < sides - 1; i++) push(vs[sides], vs[sides + i], vs[sides + i + 1], col, { center: cen, ...opt });
    };
    const box = (x0, y0, z0, x1, y1, z1, col) => {
      const v = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
      const f = [[4, 5, 6], [4, 6, 7], [0, 1, 5], [0, 5, 4], [1, 2, 6], [1, 6, 5], [2, 3, 7], [2, 7, 6], [3, 0, 4], [3, 4, 7]];
      const cen = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
      for (const [i, j, k] of f) push(v[i], v[j], v[k], col, { center: cen, obj: true });
    };
    // tanque de agua tratada
    prism(-22, 2, 10, 3.4, 6, 10, [150, 186, 226], 0.2);
    { const vs = [[-22, 10, 10]]; for (let i = 0; i < 10; i++) { const a = 0.2 + i / 10 * Math.PI * 2; vs.push([-22 + Math.cos(a) * 3.4, 8, 10 + Math.sin(a) * 3.4]); } for (let i = 0; i < 10; i++) push(vs[0], vs[1 + i], vs[1 + (i + 1) % 10], [190, 210, 240], { center: [-22, 8.5, 10], obj: true }); }
    // caldera + chimenea
    box(-13, 2, 6, -5, 7.5, 12, [214, 92, 82]);
    box(-13.4, 7.5, 5.6, -4.6, 8.3, 12.4, [150, 70, 80]);
    prism(-7, 8.3, 10, 0.9, 7, 6, [160, 150, 176], 0.3);
    // planta de separación
    prism(40, 2, 11, 3.2, 5.5, 10, [236, 220, 196], 0.1);
    prism(46, 2, 9, 2.4, 8, 8, [236, 220, 196], 0.4);
    box(33, 2, 4, 38, 4.5, 8, [180, 176, 200]);
    // tuberías (cortas para ordenar bien)
    const tube = (a, b, r, col, seg = 2.5) => {
      const L = Math.hypot(...sub(b, a)), n = Math.max(1, Math.round(L / seg)), d = norm(sub(b, a));
      const u = norm(Math.abs(d[1]) > 0.9 ? cross(d, [1, 0, 0]) : cross(d, [0, 1, 0])), v = cross(d, u);
      for (let s = 0; s < n; s++) {
        const p0 = add3(a, scl(sub(b, a), s / n)), p1 = add3(a, scl(sub(b, a), (s + 1) / n)), cen = scl(add3(p0, p1), 0.5), ring = (p) => { const r6 = []; for (let i = 0; i < 6; i++) { const ang = i / 6 * Math.PI * 2; r6.push(add3(p, add3(scl(u, Math.cos(ang) * r), scl(v, Math.sin(ang) * r)))); } return r6; };
        const A = ring(p0), B = ring(p1);
        for (let i = 0; i < 6; i++) { const j = (i + 1) % 6; push(A[i], A[j], B[j], col, { center: cen, obj: true }); push(A[i], B[j], B[i], col, { center: cen, obj: true }); }
      }
    };
    tube([-18.6, 3.6, 10], [-13, 3.6, 10], 0.5, [176, 170, 196]);
    tube([-5, 5.5, 9], [0, 5.5, 9], 0.6, [244, 236, 244]);
    tube([0, 5.5, 9], [0, 5.5, 0.4], 0.6, [244, 236, 244]);
    tube([24, 3.4, 0.4], [24, 3.4, 7], 0.5, [176, 170, 196]);
    tube([24, 3.4, 7], [33, 3.4, 7], 0.5, [176, 170, 196]);
    tube([-24, 3.4, 0.4], [-24, 3.4, 18], 0.5, [176, 170, 196]);
    tube([-24, 3.4, 18], [33, 3.4, 18], 0.5, [176, 170, 196], 3);
    tube([33, 3.4, 18], [38, 3.4, 13], 0.5, [176, 170, 196]);
    STATIC = { tris };
  }

  // ---------- per-frame dynamic geometry (wells, particles, gem) ----------
  function makeDyn() {
    const tris = [];
    const push = (a, b, c, col, opt = {}) => tris.push({ p: [a, b, c], col, ...opt });
    const tube = (a, b, r, col, opt = {}, seg = 2.5, sides = 6) => {
      if (r <= 0.01) return;
      const L = Math.hypot(...sub(b, a)), n = Math.max(1, Math.round(L / seg)), d = norm(sub(b, a));
      const u = norm(Math.abs(d[1]) > 0.9 ? cross(d, [1, 0, 0]) : cross(d, [0, 1, 0])), v = cross(d, u);
      const ring = (p) => { const rr = []; for (let i = 0; i < sides; i++) { const ang = 0.3 + i / sides * Math.PI * 2; rr.push(add3(p, add3(scl(u, Math.cos(ang) * r), scl(v, Math.sin(ang) * r)))); } return rr; };
      for (let s = 0; s < n; s++) {
        const p0 = add3(a, scl(sub(b, a), s / n)), p1 = add3(a, scl(sub(b, a), (s + 1) / n)), cen = scl(add3(p0, p1), 0.5), A = ring(p0), B = ring(p1);
        for (let i = 0; i < sides; i++) { const j = (i + 1) % sides; push(A[i], A[j], B[j], col, { center: cen, obj: true, ...opt }); push(A[i], B[j], B[i], col, { center: cen, obj: true, ...opt }); }
        if (opt.cap && s === 0) for (let i = 1; i < sides - 1; i++) push(A[0], A[i], A[i + 1], H.mix(col, [40, 30, 60], 0.35), { center: cen, obj: true });
      }
    };
    const blob = (c, r, col, opt = {}, sy = 1) => { if (r <= 0.02) return; const vs = ICO.v.map(v => [c[0] + v[0] * r, c[1] + v[1] * r * sy, c[2] + v[2] * r]); for (const [i, j, k] of ICO.f) push(vs[i], vs[j], vs[k], col, { center: c, ...opt }); };
    const wellhead = (x, k, col) => { if (k <= 0.01) return; tube([x, 2, -1.2], [x, 2 + 3.2 * k, -1.2], 1.1 * k, [190, 184, 206]); tube([x - 1.6 * k, 4.2, -1.2], [x + 1.6 * k, 4.2, -1.2], 0.5 * k, col); blob([x, 5.4 * k + 2 * (1 - k), -1.2], 0.9 * k, col, { obj: true }); };
    return { tris, push, tube, blob, wellhead };
  }

  // ---------- camera flight ----------
  const KF = [
    [0, 0, 56, -98, 0, 0.42], [1.7, 0, 54, -94, 0, 0.42],
    [3.3, -5, -18.5, -52, 0, 0.035], [7.6, -3, -18, -48, 0, 0.035],
    [8.8, 10, 30, -46, 0.06, 0.5], [10.6, 8, 28, -42, 0.06, 0.5],
    [11.7, -9, 19, -34, -0.02, 0.4], [13.7, -7, 18, -32, -0.02, 0.4],
    [14.9, 2, -8, -64, 0, 0.12], [17.5, 2, -8.5, -66, 0, 0.12],
    [18.4, 8, -26, -30, -0.17, 0.0], [21.1, 8, -26, -29, -0.17, 0.0],
    [22.0, 2, -21, -52, 0, 0.05], [24.7, 2, -21, -54, 0, 0.05],
    [26.0, 0, 56, -98, 0, 0.42], [DURATION, 0, 55, -95, 0, 0.42],
  ];
  function camAt(t, W, H_) {
    let k = 0; while (k < KF.length - 2 && t > KF[k + 1][0]) k++;
    const A = KF[k], B = KF[k + 1], u = H.ease.inOut(H.clamp((t - A[0]) / (B[0] - A[0])));
    const L = (i) => H.lerp(A[i], B[i], u);
    return makeCamYaw([L(1), L(2), L(3)], L(4), L(5), 760, W, H_);
  }

  // ---------- shade, cull, project, sort, draw ----------
  function renderTris(ctx, tris, cam, t, W, H_, intro) {
    const out = [];
    for (const tri of tris) {
      const [a, b, c] = tri.p;
      let n = tri.nrm || norm(cross(sub(b, a), sub(c, a)));
      const cen = scl(add3(add3(a, b), c), 1 / 3);
      if (tri.terrain || tri.water) { if (n[1] < 0) n = scl(n, -1); }
      else if (tri.face) n = [0, 0, -1];
      else if (tri.center) { if (dot(n, sub(cen, tri.center)) < 0) n = scl(n, -1); }
      const toCam = sub(cam.pos, cen);
      if (tri.twoSided) { if (dot(n, toCam) < 0) n = scl(n, -1); }
      else if (dot(n, toCam) <= 0) continue;
      let pa = cam.proj(a), pb = cam.proj(b), pc = cam.proj(c);
      if (pa[2] < 0.5 || pb[2] < 0.5 || pc[2] < 0.5) continue;
      const mnx = Math.min(pa[0], pb[0], pc[0]), mxx = Math.max(pa[0], pb[0], pc[0]), mny = Math.min(pa[1], pb[1], pc[1]), mxy = Math.max(pa[1], pb[1], pc[1]);
      if (mxx < -20 || mnx > W + 20 || mxy < -20 || mny > H_ + 20) continue;
      const depth = (pa[2] + pb[2] + pc[2]) / 3 + (tri.bias || 0);
      // facet flips: intro (camera out to the horizon) and the face re-layouts
      let sq = 1, flash = 0, fmode = 0;
      if (intro && !tri.emissive) {
        const jit = (Math.sin(cen[0] * 12.9898 + cen[2] * 78.233) * 43758.5453) % 1;
        const at = 0.02 + H.clamp(depth / 260) * 0.95 + Math.abs(jit) * 0.15 + (tri.tree || tri.obj ? 0.25 : 0);
        sq = H.ease.out(ph(t, at, at + 0.36)); if (sq <= 0) continue; flash = (1 - sq) * 0.7;
      }
      if (tri.face) { const ff = faceFlip(tri.cx, t); fmode = ff.mode; if (ff.scale < 1) { sq *= ff.scale; flash = Math.max(flash, (1 - ff.scale) * 0.6); } if (sq <= 0.01) continue; }
      if (sq < 1) {
        const mx = (pa[0] + pb[0] + pc[0]) / 3, my = (pa[1] + pb[1] + pc[1]) / 3;
        const s2 = (p) => [mx + (p[0] - mx) * sq, my + (p[1] - my) * sq, p[2]];
        pa = s2(pa); pb = s2(pb); pc = s2(pc);
      }
      let col, emissive = tri.emissive;
      if (tri.face) {
        const fc = faceColor(tri.cx, tri.cy, t, fmode);
        emissive = fc.emissive;
        col = emissive ? H.mix(fc.col, [255, 236, 170], tri.jit * 0.45 * (0.5 + 0.5 * Math.sin(t * 19 + tri.cy * 3))) : scl(fc.col, 0.84 + 0.2 * tri.jit);
        col = H.mix(col, [255, 196, 178], 0.06);
      } else if (emissive) col = tri.col;
      else if (tri.gem) col = gemShade(tri, n, toCam, cen, t);
      else {
        const lam = Math.max(0, dot(n, SUN_DIR));
        let kk = tri.side ? 0.45 + 0.55 * lam : tri.obj ? 0.32 + 0.85 * lam : tri.puff ? 0.7 + 0.4 * lam : lam;
        if (tri.terrain && lam > 0) {
          const e2 = Math.max((pa[0] - pb[0]) ** 2 + (pa[1] - pb[1]) ** 2, (pb[0] - pc[0]) ** 2 + (pb[1] - pc[1]) ** 2, (pc[0] - pa[0]) ** 2 + (pc[1] - pa[1]) ** 2);
          const area2 = Math.abs((pb[0] - pa[0]) * (pc[1] - pa[1]) - (pc[0] - pa[0]) * (pb[1] - pa[1]));
          if (e2 > 3600) kk *= H.lerp(0.15, 1, H.smooth(0.06, 0.2, area2 / e2));
        }
        const fillP = tri.obj || tri.side ? Math.max(0, dot(n, norm([-0.55, 0.6, -0.6]))) * 0.45 : 0;
        col = [0, 1, 2].map(i => tri.col[i] * (AMB[i] / 255 * (tri.obj ? 0.6 : 0.85) + SUN_COL[i] / 255 * kk * 0.95 + [176, 186, 255][i] / 255 * fillP));
        if (tri.water) {
          const v = norm(toCam), rf = sub(scl(n, 2 * dot(n, v)), v);
          const spec = Math.pow(Math.max(0, dot(rf, norm([0.5, 0.2, 1]))), 12);
          col = H.mix(H.mix([120, 110, 190], [250, 170, 165], H.clamp(0.45 + n[0] * 4 + n[2] * 2)), [255, 236, 200], spec);
        }
        if (tri.puff) col = H.mix(col, [255, 220, 214], 0.2);
      }
      const fogK = emissive ? 0 : H.clamp(Math.pow(H.smooth(40, 260, depth), 1.15) * 0.9) * (tri.face || tri.gem || tri.sec ? 0.35 : 1);
      col = H.mix(col, H.mix(FOG, FOG_HI, H.clamp(cen[1] / 30)), fogK);
      if (flash) col = H.mix(col, [255, 236, 226], flash);
      out.push({ pa, pb, pc, depth, col, gem: tri.gem });
    }
    out.sort((p, q) => q.depth - p.depth);
    ctx.lineJoin = 'round';
    for (const o of out) {
      const fs = `rgb(${o.col[0] | 0},${o.col[1] | 0},${o.col[2] | 0})`;
      ctx.fillStyle = fs; ctx.lineWidth = 0.9;
      ctx.strokeStyle = o.gem ? `rgb(${Math.min(255, o.col[0] * 1.18 + 14) | 0},${Math.min(255, o.col[1] * 1.18 + 14) | 0},${Math.min(255, o.col[2] * 1.18 + 14) | 0})` : fs;
      if (o.gem) ctx.lineWidth = Math.max(1, Math.min(2, 1400 / o.depth / 20));
      ctx.beginPath(); ctx.moveTo(o.pa[0], o.pa[1]); ctx.lineTo(o.pb[0], o.pb[1]); ctx.lineTo(o.pc[0], o.pc[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
  }
  // the oil drop: reference cut-glass shading, ramp from cold black crude to hot amber
  let GEM_HEAT = 0, GEM_SPIN = 0;
  function gemShade(tri, n, toCam, cen, t) {
    const cold = H.mix([46, 32, 30], [96, 70, 92], H.clamp(0.4 + 0.6 * n[1]));
    const hot = H.mix(H.mix([196, 90, 40], [255, 186, 96], H.clamp(0.45 + 0.7 * n[1])), [255, 128, 96], H.clamp(-n[0] * 0.9) * 0.4);
    const base = H.mix(H.mix(cold, tri.col, 0.25), hot, GEM_HEAT);
    const lam = Math.max(0, dot(n, SUN_DIR));
    const v = norm(toCam), F2 = norm([-0.55, 0.6, -0.6]), fill = Math.max(0, dot(n, F2));
    const rl = sub(scl(n, 2 * dot(n, SUN_DIR)), SUN_DIR), spec = Math.pow(Math.max(0, dot(rl, v)), 20) * 0.6;
    const fl2 = sub(scl(n, 2 * dot(n, F2)), F2), spec2 = Math.pow(Math.max(0, dot(fl2, v)), 24) * 0.55;
    const rim = Math.pow(1 - Math.max(0, dot(n, v)), 3) * 0.28 * (0.4 + lam);
    const kk = 0.35 + 1.0 * lam, jit = 0.9 + 0.2 * (0.5 + 0.5 * Math.sin(cen[0] * 7.1 + cen[1] * 3.7 + cen[2] * 5.3 - GEM_SPIN * 9));
    let col = [0, 1, 2].map(i => base[i] * jit * (AMB[i] / 255 * 0.6 + SUN_COL[i] / 255 * kk * 0.75 + [176, 186, 255][i] / 255 * fill * 0.7));
    return H.mix(col, [255, 244, 236], H.clamp(spec + spec2 + rim));
  }
  let GEM_MESH = null;
  function gemMesh() {
    if (GEM_MESH) return GEM_MESH;
    const vs = ICO.v.map(v => v.slice()), fs = [], mid = {};
    const m = (a, b) => { const key = a < b ? a + '_' + b : b + '_' + a; if (mid[key] == null) { vs.push(scl(norm(add3(vs[a], vs[b])), 0.93)); mid[key] = vs.length - 1; } return mid[key]; };
    for (const [a, b, c] of ICO.f) { const ab = m(a, b), bc = m(b, c), ca = m(c, a); fs.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); }
    // teardrop: pull the top into a point
    GEM_MESH = { v: vs.map(([x, y, z]) => { const up = Math.max(0, y), s = 1 - 0.62 * Math.pow(up, 1.4); return [x * s, y * 1.05 + Math.pow(up, 3) * 1.15, z * s]; }), f: fs };
    return GEM_MESH;
  }

  // ---------- sky (reference) ----------
  function drawSky(ctx, W, H_, cam) {
    const sky = ctx.createLinearGradient(0, 0, 0, H_ * 0.62);
    sky.addColorStop(0, '#1b2350'); sky.addColorStop(0.38, '#4d3f84'); sky.addColorStop(0.7, '#c06a93'); sky.addColorStop(1, '#ffb08a');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H_);
    const R0 = H.rng(77);
    for (let i = 0; i < 90; i++) { const x = R0() * W, y = R0() * 160, a = (1 - y / 160) * R0() * 0.8; ctx.fillStyle = `rgba(255,240,255,${a})`; ctx.fillRect(x, y, 1, 1); }
    const sp = cam.proj([cam.pos[0] + 30, cam.pos[1] + 12, cam.pos[2] + 400]);
    const g = ctx.createRadialGradient(sp[0], sp[1], 30, sp[0], sp[1], 320);
    g.addColorStop(0, 'rgba(255,214,160,0.5)'); g.addColorStop(1, 'rgba(255,214,160,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H_);
    for (let i = 0; i < 14; i++) {
      const a0 = (i / 14) * Math.PI * 2, a1 = ((i + 1) / 14) * Math.PI * 2;
      ctx.fillStyle = H.rgba(H.mix('#ffd49a', '#fff4d8', 0.5 + 0.5 * Math.cos(a0 - 2.3)));
      ctx.beginPath(); ctx.moveTo(sp[0], sp[1]); ctx.lineTo(sp[0] + Math.cos(a0) * 50, sp[1] + Math.sin(a0) * 50); ctx.lineTo(sp[0] + Math.cos(a1) * 50, sp[1] + Math.sin(a1) * 50); ctx.closePath(); ctx.fill();
    }
  }

  // =============================== EXPLAINER ===============================
  const GEM = [-11, -15.5, -18];
  function explainer(ctx, W, H_, t) {
    const P = (a, b) => ph(t, a, b), E = (a, b) => Ei(t, a, b), EO = (a, b) => H.ease.out(P(a, b)), BK = (a, b) => H.ease.back(P(a, b));
    if (!STATIC) buildStatic();
    const cam = camAt(t, W, H_);
    const pr = (p) => cam.proj(p);
    const sz = (p, wu) => wu * 760 / p[2];
    drawSky(ctx, W, H_, cam);

    // ---------- dynamic objects (drawn as a second sorted pass, in front of the cut face) ----------
    const D = makeDyn();
    const steamK = 1 - E(17.6, 17.95), sagdK = EO(18.0, 18.45) * (1 - E(21.2, 21.5)), combK = EO(21.65, 22.1);
    const wellsIn = EO(0.9, 1.4);
    // vapor continuo: inyector (coral) + 2 productores (teal)
    if (steamK > 0) {
      const k = steamK * wellsIn;
      D.tube([0, 4, -1.2], [0, -27, -1.2], 0.8 * k, CORAL, { sec: true }, 3);
      for (const x of [-24, 24]) D.tube([x, 4, -1.2], [x, -30.5, -1.2], 0.8 * k, TEAL, { sec: true }, 3);
      D.wellhead(0, k, CORAL); D.wellhead(-24, k, TEAL); D.wellhead(24, k, TEAL);
      // steam puffs down the injector, then out into the formation
      for (let i = 0; i < 40; i++) {
        const te = 14.0 + i * 0.12; if (te > 17.3) break;
        const u = (t - te) / 0.9; if (u <= 0 || u > 1.7) continue;
        let p;
        if (u <= 1) p = [0, H.lerp(4.5, -26, u), -2.2];
        else { const v = u - 1, sd = i % 2 ? 1 : -1; p = [sd * v * 16, -24.5 - (i % 3) * 1.6 - v * 1.5, -1.6]; }
        D.blob(p, 0.95 * (u > 1 ? 1 - (u - 1) / 0.7 : 1) * steamK, STEAM, { puff: true, sec: true }, 0.85);
      }
      // mobile crude to the producers and up to the plant
      for (let i = 0; i < 40; i++) {
        const te = 15.3 + i * 0.1; if (te > 17.1) break;
        const u = (t - te) / 0.9; if (u <= 0 || u > 2.2) continue;
        const sd = i % 2 ? 1 : -1, x0 = sd * (5 + (i * 7) % 6), y0 = -23.5 - (i * 13) % 7;
        let p;
        if (u <= 1) { const e = H.ease.inOut(u); p = [H.lerp(x0, sd * 23.6, e), H.lerp(y0, -29.5, e), -2.2]; }
        else p = [sd * 24, H.lerp(-29.5, 4, (u - 1) / 1.2), -2.3];
        D.blob(p, 0.7 * steamK, [150, 82, 44], { obj: true, sec: true }, 1.25);
      }
    }
    // SAGD: two horizontal wells seen end-on, sticking out of the cut face
    if (sagdK > 0) {
      D.tube([0, -27.2, -7], [0, -27.2, 0.3], 0.95 * sagdK, CORAL, { sec: true, cap: true }, 2.5, 8);
      D.tube([0, -31, -7], [0, -31, 0.3], 0.95 * sagdK, TEAL, { sec: true, cap: true }, 2.5, 8);
      const s = sagdS(t), C = sagdChamber(s);
      for (let i = 0; i < 30; i++) {
        const te = 18.5 + i * 0.13; if (te > 20.9) break;
        const u = (t - te) / 1.1; if (u <= 0 || u > 1) continue;
        const yTop = Math.max(-26.5, C.top - 0.8), y = H.lerp(-26.4, yTop, H.ease.out(u)), hw = Math.max(0.3, (y + 28.6) * C.k);
        D.blob([((i * 0.37) % 1 - 0.5) * 1.4 * hw, y, -1.4], 0.75 * (1 - u * 0.4) * sagdK, STEAM, { puff: true, sec: true }, 0.85);
      }
      for (let i = 0; i < 30; i++) {
        const te = 18.9 + i * 0.12; if (te > 21.0) break;
        const u = (t - te) / 1.2; if (u <= 0 || u > 1) continue;
        const sd = i % 2 ? 1 : -1, yS = Math.max(-27, C.top - 0.6 - (i * 5) % 3), xS = sd * ((yS + 28.6) * C.k + 1.2);
        const e = H.ease.in(u), p = u < 0.8 ? [H.lerp(xS, sd * 1.8, e / H.ease.in(0.8)), H.lerp(yS, -30.2, e / H.ease.in(0.8)), -1.4] : [H.lerp(sd * 1.8, 0, (u - 0.8) / 0.2), -30.6, -1.4];
        D.blob(p, 0.62 * sagdK, [150, 82, 44], { obj: true, sec: true }, 1.25);
      }
    }
    // combustión in situ: inyector de aire (-24) y productor (+24)
    if (combK > 0) {
      const k = combK;
      D.tube([-24, 4, -1.2], [-24, -30, -1.2], 0.8 * k, [176, 206, 250], { sec: true }, 3);
      D.tube([24, 4, -1.2], [24, -30.5, -1.2], 0.8 * k, TEAL, { sec: true }, 3);
      D.wellhead(-24, k, [176, 206, 250]); D.wellhead(24, k, TEAL);
      const xf = combXf(t), lit = EO(22.1, 22.5);
      if (lit > 0) for (let r = 0; r < 5; r++) {
        const y = -31 + r * 2.1, x = xf + (y + 27) * 0.3 - 1.0, fl = (1 + Math.sin(t * 30 + r * 2) * 0.12) * lit * (1 + Math.sin(t * 47 + r) * 0.06);
        const flame = (len, rr, col) => { const v = [[x + 0.6, y + len * fl, -1.0]]; for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; v.push([x + Math.cos(a) * rr, y, -1.0 + Math.sin(a) * rr * 0.6]); } for (let i = 0; i < 6; i++) D.push(v[0], v[1 + i], v[1 + (i + 1) % 6], H.mix(col, [255, 255, 230], (i % 3) * 0.18), { emissive: true, center: [x, y + len * 0.3, -1], bias: -2 }); };
        flame(3.4, 1.3, [255, 140, 60]); flame(2.0, 0.85, [255, 220, 120]);
      }
      for (let i = 0; i < 40; i++) { // air
        const te = 21.9 + i * 0.11; if (te > 24.6) break;
        const u = (t - te) / 1.1; if (u <= 0 || u > 1.5) continue;
        const p = u <= 0.8 ? [-24, H.lerp(4, -27 - (i % 3), u / 0.8), -2.2] : [H.lerp(-24, xf - 2, (u - 0.8) / 0.7), -27 - (i % 3) - (i % 2) * 2, -1.8];
        D.blob(p, 0.55 * k, [200, 226, 255], { puff: true, sec: true }, 1);
      }
      for (let i = 0; i < 40; i++) { // displaced crude
        const te = 22.5 + i * 0.1; if (te > 24.8) break;
        const u = (t - te) / 1.0; if (u <= 0 || u > 2) continue;
        const x0 = xf + 7 + (i * 5) % 6, y0 = -24 - (i * 7) % 7;
        const p = u <= 1 ? [H.lerp(x0, 23.6, H.ease.inOut(u)), H.lerp(y0, -29.5, H.ease.inOut(u)), -2.2] : [24, H.lerp(-29.5, 4, u - 1), -2.3];
        D.blob(p, 0.7 * k, [70, 44, 36], { obj: true, sec: true }, 1.25);
      }
    }
    // the oil drop (beats 2-3)
    const gemK = EO(2.5, 3.2) * (1 - E(7.8, 8.4));
    GEM_HEAT = E(5.6, 7.0); GEM_SPIN = t * 0.4;
    if (gemK > 0) {
      const M = gemMesh(), r = 4.2 * gemK, wob = GEM_HEAT * Math.sin(t * 5) * 0.06;
      const cr = H.rng(44), pal = [[60, 40, 36], [90, 60, 80], [40, 30, 34], [120, 80, 60]];
      const c = [GEM[0], GEM[1] + Math.sin(t * 1.6) * 0.4, GEM[2]];
      const vs = M.v.map(([x, y, z]) => { const xr = x * Math.cos(GEM_SPIN) - z * Math.sin(GEM_SPIN), zr = x * Math.sin(GEM_SPIN) + z * Math.cos(GEM_SPIN); return [c[0] + xr * r * (1 + wob), c[1] + y * r * (1.15 - wob), c[2] + zr * r]; });
      M.f.forEach((f) => D.push(vs[f[0]], vs[f[1]], vs[f[2]], cr.pick(pal), { center: c, gem: true }));
      for (let i = 0; i < 3; i++) { // drips once it flows
        const te = 6.7 + i * 0.35, u = t - te; if (u <= 0 || u > 1.3) continue;
        D.blob([c[0] + (i - 1) * 0.8, c[1] - r * 1.1 - u * u * 9, c[2]], 0.75 * gemK, [200, 110, 50], { gem: true });
      }
    }

    // ---------- draw both passes ----------
    renderTris(ctx, STATIC.tris, cam, t, W, H_, t < 1.7);
    // boiler glow + flame glow
    { const p = pr([-9, 4, 5.8]); const on = EO(10.9, 11.3); if (p[2] > 1 && on > 0) { const r = sz(p, 6); const g = ctx.createRadialGradient(p[0], p[1], 2, p[0], p[1], r); g.addColorStop(0, `rgba(255,190,110,${0.5 * on})`); g.addColorStop(1, 'rgba(255,150,90,0)'); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(p[0] - r, p[1] - r, r * 2, r * 2); ctx.globalCompositeOperation = 'source-over'; } }
    renderTris(ctx, D.tris, cam, t, W, H_, false);
    if (combK > 0 && t > 22.1) { const p = pr([combXf(t) - 1, -27, -1]); if (p[2] > 1) { const r = sz(p, 13); const g = ctx.createRadialGradient(p[0], p[1], 2, p[0], p[1], r); g.addColorStop(0, `rgba(255,190,110,${0.55 * EO(22.1, 22.5)})`); g.addColorStop(1, 'rgba(255,140,90,0)'); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(p[0] - r, p[1] - r, r * 2, r * 2); ctx.globalCompositeOperation = 'source-over'; } }
    if (gemK > 0) { const p = pr(GEM); if (p[2] > 1) { const r = sz(p, 6.5); const g = ctx.createRadialGradient(p[0], p[1], r * 0.4, p[0], p[1], r * 1.6); g.addColorStop(0, `rgba(255,${180 + 40 * GEM_HEAT | 0},150,${(0.12 + 0.4 * GEM_HEAT) * gemK})`); g.addColorStop(1, 'rgba(255,200,150,0)'); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(p[0] - r * 2, p[1] - r * 2, r * 4, r * 4); ctx.globalCompositeOperation = 'source-over'; } }

    // ---------- overlays that land on the 3D objects ----------
    const fadeWin = (a0, a1, b0, b1) => BK(a0, a1) * (1 - E(b0, b1));
    // beat 2 — the problem
    if (t > 3.0 && t < 8.0) {
      const kRes = fadeWin(3.2, 3.55, 7.6, 7.95);
      const pR = pr([-33, -29.5, -1]); lpTag(ctx, pR[0], pR[1], 'yacimiento', { k: kRes, bg: INK, col: '#fff' });
      // magnifier callout: a spot on the reservoir to the drop
      const spot = pr([-6, -27, -0.5]), g = pr(GEM), gr = sz(g, 4.2);
      ctx.save(); ctx.globalAlpha = EO(3.3, 3.7) * (1 - E(7.6, 7.95)); ctx.strokeStyle = 'rgba(255,246,240,0.85)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(spot[0] - 14, spot[1]); ctx.lineTo(g[0] - gr * 0.9, g[1] + gr * 0.4); ctx.moveTo(spot[0] + 14, spot[1]); ctx.lineTo(g[0] + gr * 0.9, g[1] + gr * 0.4); ctx.stroke();
      ctx.beginPath(); for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI * 2; ctx.lineTo(spot[0] + Math.cos(a) * 15, spot[1] + Math.sin(a) * 10); } ctx.stroke(); ctx.restore();
      lpTag(ctx, g[0], g[1] - gr * 1.75, 'crudo pesado', { k: fadeWin(3.5, 3.85, 7.6, 7.95) });
    }
    // viscosity counter: 10 000 cP -> 10 cP
    if (t > 3.9 && t < 8.0) {
      const u = E(5.6, 7.0), v = Math.pow(10, 4 - 3 * u), vr = v >= 1000 ? Math.round(v / 100) * 100 : v >= 100 ? Math.round(v / 10) * 10 : Math.round(v);
      const txt = String(vr).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' cP';
      const hit = t > 7.0, pop = hit ? 1 + 0.2 * Math.sin(Math.min(1, (t - 7.0) / 0.35) * Math.PI) : 1;
      const k = fadeWin(3.9, 4.25, 7.6, 7.95) * pop, x = 905, y = 300;
      lpTag(ctx, x, y - 92, 'viscosidad', { k, bg: INK, col: '#fff' });
      lpTag(ctx, x, y, txt, { k, font: '700 72px "Space Grotesk"', h: 108, bg: hit ? '#ff7060' : '#fff6f0', col: hit ? '#fff' : INK });
      if (t > 7.0) { ctx.save(); ctx.globalAlpha = 1 - P(7.0, 7.7); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; const rr = 150 + 80 * EO(7.0, 7.7); ctx.beginPath(); for (let k2 = 0; k2 <= 6; k2++) { const a = k2 / 6 * Math.PI * 2; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.62); } ctx.stroke(); ctx.restore(); }
      lpTag(ctx, x, y + 92, 'agua ≈ 1 cP', { k: fadeWin(7.15, 7.45, 7.6, 7.95), font: '700 28px "Space Grotesk"' });
      // verdict: cold = no flow (wrong), hot = flows (right)
      const g = pr(GEM), gr = sz(g, 4.2);
      if (t < 5.75) { hexBadge(ctx, g[0] + gr * 1.05, g[1] - gr * 0.6, BK(4.4, 4.7) * (1 - E(5.5, 5.75)), false); lpTag(ctx, g[0], g[1] + gr * 1.75, 'no fluye', { k: BK(4.5, 4.8) * (1 - E(5.5, 5.75)), bg: '#ff5a4a', col: '#fff' }); }
      else { hexBadge(ctx, g[0] + gr * 1.05, g[1] - gr * 0.6, fadeWin(7.0, 7.3, 7.6, 7.95), true); lpTag(ctx, g[0], g[1] + gr * 1.75, 'fluye', { k: fadeWin(7.05, 7.35, 7.6, 7.95), bg: '#3ccf9a', col: '#fff' }); }
      // heat ribbon into the drop
      if (t > 5.3) { const a = [g[0] - gr * 2.9, g[1] + gr * 1.0], b = [g[0] - gr * 1.0, g[1] + gr * 0.1]; lpArrow(ctx, a, [a[0] + 40, b[1] - 6], b, E(5.3, 5.9) * (1 - E(7.6, 7.95)), CORAL, 13); lpTag(ctx, a[0], a[1] + 40, 'calor', { k: fadeWin(5.5, 5.8, 7.6, 7.95), bg: '#ff7060', col: '#fff' }); }
    }
    // beat 4 — five methods
    const METHODS = ['1 · Inyección continua de vapor', '2 · Estimulación cíclica (huff & puff)', '3 · SAGD: drenaje por gravedad con vapor', '4 · Combustión in situ', '5 · Agua caliente'];
    const LIST_Y = (i) => 196 + i * 78;
    if (t > 8.1 && t < 11.3) {
      METHODS.forEach((m, i) => {
        if (i === 0) return; // item 1 is drawn below (it becomes the chapter tag)
        const k = BK(8.3 + i * 0.32, 8.62 + i * 0.32) * (1 - E(10.4, 10.8));
        if (k <= 0) return;
        const w = lpTagL(ctx, 56, LIST_Y(i), m, { k, font: '700 30px "Space Grotesk"', bg: i === 4 ? '#e4dcea' : '#fff6f0', col: i === 4 ? '#6a5f80' : INK });
        if (i === 4) lpTagL(ctx, 56 + w * k + 16, LIST_Y(i), 'menos eficiente', { k: BK(9.95, 10.25) * (1 - E(10.4, 10.8)), bg: '#ff5a4a', col: '#fff' });
      });
    }
    // chapter tags (top-left, under the header)
    const CH_Y = 128;
    {
      const chap = (a, b, text, o = {}) => { if (t < a || t > b + 0.4) return; lpTagL(ctx, 48, CH_Y, text, { k: BK(a, a + 0.3) * (1 - E(b, b + 0.35)), font: '700 30px "Space Grotesk"', ...o }); };
      chap(2.6, 5.1, 'El problema');
      chap(5.25, 7.7, 'La solución: calentar', { bg: '#ff7060', col: '#fff' });
      chap(7.95, 10.5, 'Cinco métodos');
      // item 1 of the list flies up and becomes the chapter tag of beats 5-6
      if (t > 8.3 && t < 17.95) {
        const fly = E(10.45, 11.05), y = H.lerp(LIST_Y(0), CH_Y, fly);
        lpTagL(ctx, 56 - 8 * fly, y, METHODS[0], { k: BK(8.3, 8.62) * (1 - E(17.4, 17.75)), font: '700 30px "Space Grotesk"', bg: fly > 0.5 ? '#ff7060' : '#fff6f0', col: fly > 0.5 ? '#fff' : INK });
      }
      chap(17.75, 21.0, '3 · SAGD', { bg: '#ff7060', col: '#fff' });
      if (t > 17.9 && t < 21.4) lpTagL(ctx, 48, CH_Y + 62, 'drenaje por gravedad asistido por vapor', { k: BK(17.95, 18.25) * (1 - E(21.0, 21.35)) });
      chap(21.35, 24.6, '4 · Combustión in situ', { bg: '#ff7060', col: '#fff' });
    }
    // beat 5 — surface: water -> boiler -> steam -> injector
    if (t > 11.0 && t < 14.6) {
      const out = 1 - E(14.2, 14.6);
      const tank = pr([-22, 11, 10]), boil = pr([-9, 9, 9]), stack = pr([-7, 15.5, 10]), wh = pr([0, 6.5, -1.2]);
      const tb = pr([-22, 2, 5.5]); lpTag(ctx, tb[0] - 30, tb[1] + 44, 'agua tratada', { k: BK(11.2, 11.5) * out });
      const a1 = pr([-18.6, 6, 9]), b1 = pr([-13.2, 6.5, 8]);
      lpArrow(ctx, a1, [(a1[0] + b1[0]) / 2, Math.min(a1[1], b1[1]) - 40], b1, E(11.5, 12.0) * out, [150, 200, 240], 11);
      lpTag(ctx, boil[0] + 10, boil[1] + 120, 'caldera', { k: BK(11.9, 12.2) * out, bg: '#ff7060', col: '#fff' });
      const a2 = pr([-4, 8.5, 8]), b2 = pr([0, 7.5, -1.2]);
      lpArrow(ctx, a2, [(a2[0] + b2[0]) / 2 + 30, Math.min(a2[1], b2[1]) - 70], b2, E(12.3, 12.95) * out, [255, 246, 240], 12);
      lpTag(ctx, (a2[0] + b2[0]) / 2 + 40, Math.min(a2[1], b2[1]) - 92, 'vapor a alta presión', { k: BK(12.6, 12.9) * out });
      lpTag(ctx, wh[0] + 90, wh[1] + 70, 'inyector', { k: BK(13.0, 13.3) * out, bg: INK, col: '#fff' });
      void stack;
    }
    // beat 6 — down the well, heat to the crude, crude to producers and up
    if (t > 13.9 && t < 17.9) {
      const out = 1 - E(17.45, 17.8);
      const top = pr([2.5, 3, -1.2]), bot = pr([2.5, -22, -1.2]);
      lpArrow(ctx, [top[0] + 26, top[1]], [top[0] + 36, (top[1] + bot[1]) / 2], [bot[0] + 26, bot[1]], E(14.0, 14.8) * out, [255, 246, 240], 12);
      const hz = pr([0, -20, -1]); lpTag(ctx, hz[0], hz[1] - 6, 'cede su calor al crudo', { k: BK(15.0, 15.3) * out, bg: '#ff7060', col: '#fff' });
      for (const sd of [-1, 1]) { const a = pr([sd * 9, -30, -1]), b = pr([sd * 21, -30, -1]); lpArrow(ctx, a, [(a[0] + b[0]) / 2, a[1] + 26], b, E(15.5, 16.1) * out, [230, 140, 70], 12); }
      const cm = pr([0, -35.5, -1]); lpTag(ctx, cm[0], cm[1], 'crudo móvil', { k: BK(15.8, 16.1) * out });
      for (const sd of [-1, 1]) { const p = pr([sd * 24, -36, -1.2]); lpTag(ctx, p[0] + sd * 40, p[1], 'productor', { k: BK(16.0 + (sd + 1) * 0.08, 16.3 + (sd + 1) * 0.08) * out, bg: INK, col: '#fff' }); }
      const ua = pr([27.5, -20, -1.2]), ub = pr([27.5, 4, -1.2]);
      lpArrow(ctx, ua, [ua[0] + 12, (ua[1] + ub[1]) / 2], ub, E(16.4, 17.05) * out, [230, 140, 70], 12);
      const pl = pr([33, 9, 6]); lpTag(ctx, pl[0], Math.max(150, pl[1] - 20), 'a la planta', { k: BK(16.9, 17.2) * out });
    }
    // beat 7 — SAGD
    if (t > 18.2 && t < 21.5) {
      const out = 1 - E(21.0, 21.35);
      const pi = pr([0, -27.2, -7]), pp = pr([0, -31, -7]);
      lpTag(ctx, pi[0] - 150, pi[1] - 4, 'inyector', { k: BK(18.35, 18.65) * out, bg: '#ff7060', col: '#fff' });
      lpTag(ctx, pp[0] - 150, pp[1] + 24, 'productor', { k: BK(18.5, 18.8) * out, bg: '#4d9da5', col: '#fff' });
      const s = sagdS(t), C = sagdChamber(s);
      const ch = pr([0, (C.top - 27) / 2 + 0.5, -0.5]);
      if (t > 19.4) lpTag(ctx, ch[0] - 140, ch[1] - 6, 'cámara de vapor', { k: BK(19.4, 19.7) * out });
      // light steam rises, heavy crude drains
      const va = pr([0, -26, -1]), vb = pr([0, C.top - 0.2, -1]);
      if (t > 19.0) lpArrow(ctx, [va[0] + 60, va[1]], [va[0] + 70, (va[1] + vb[1]) / 2], [vb[0] + 60, vb[1] + 10], E(19.0, 19.6) * out, [255, 246, 240], 11);
      if (t > 19.7) lpTag(ctx, vb[0] + 250, vb[1] - 40, 'vapor liviano ↑', { k: BK(19.7, 20.0) * out });
      for (const sd of [-1, 1]) { const hw = (C.top - 0.6 + 28.6) * C.k + 1.4, a = pr([sd * hw, C.top - 0.6, -1]), b = pr([sd * 2, -30.4, -1]); lpArrow(ctx, a, [(a[0] + b[0]) / 2 + sd * 30, (a[1] + b[1]) / 2 + 10], b, E(20.0, 20.6) * out, [230, 140, 70], 11); }
      const ob = pr([12, -33.6, -1]); lpTag(ctx, ob[0] + 60, ob[1], 'crudo pesado ↓ por gravedad', { k: BK(20.3, 20.6) * out });
    }
    // beat 8 — in-situ combustion
    if (t > 21.8 && t < 25.2) {
      const out = 1 - E(24.6, 24.95);
      const ai = pr([-24, 6.5, -1.2]); lpTag(ctx, ai[0], ai[1] - 40, 'aire', { k: BK(21.9, 22.2) * out, bg: '#b0cefa', col: INK });
      const xf = combXf(t), fp = pr([xf - 1, -21, -1]);
      lpTag(ctx, fp[0], fp[1] - 24, 'frente de fuego', { k: BK(22.4, 22.7) * out, bg: '#ff7060', col: '#fff' });
      const ob = pr([xf + 9.5, -33.6, -1]); lpTag(ctx, ob[0], ob[1] + 4, 'crudo empujado', { k: BK(23.0, 23.3) * out });
      const a = pr([xf + 4, -27, -1]), b = pr([21, -27, -1]);
      if (t > 23.2) lpArrow(ctx, a, [(a[0] + b[0]) / 2, a[1] - 24], b, E(23.2, 23.7) * out, [230, 140, 70], 12);
      const pp = pr([24, 6.5, -1.2]); lpTag(ctx, pp[0], pp[1] - 40, 'productor', { k: BK(23.6, 23.9) * out, bg: INK, col: '#fff' });
      const bz = pr([-19, -21, -1]); lpTag(ctx, bz[0], bz[1] - 24, 'zona quemada', { k: BK(24.0, 24.3) * out, font: '700 28px "Space Grotesk"', bg: '#e4dcea', col: '#6a5f80' });
    }

    // ---------- hook -> header ----------
    {
      const sh = E(1.35, 2.3), a = EO(0.1, 0.6);
      const size = H.lerp(76, 32, sh);
      ctx.save(); ctx.globalAlpha = a; ctx.font = `700 ${size}px "Space Grotesk"`;
      const title = 'EOR térmico', w = ctx.measureText(title).width;
      const x = H.lerp(640 - w / 2, 48, sh), y = H.lerp(250, 66, sh) + (1 - a) * 24;
      if (sh > 0) { ctx.save(); ctx.globalAlpha = a * sh; ctx.translate(x - 16, y - size * 1.05); const pw = w + 32, phh = size * 1.75, c2 = 12; ctx.fillStyle = 'rgba(42,31,79,0.82)'; ctx.beginPath(); ctx.moveTo(c2, 0); ctx.lineTo(pw, 0); ctx.lineTo(pw, phh - c2); ctx.lineTo(pw - c2, phh); ctx.lineTo(0, phh); ctx.lineTo(0, c2); ctx.closePath(); ctx.fill(); ctx.restore(); }
      ctx.fillStyle = 'rgba(30,20,60,0.35)'; ctx.fillText(title, x + 3, y + 3);
      ctx.fillStyle = '#ffffff'; ctx.fillText(title, x, y);
      const uw = H.lerp(300, 120, sh), uy = y + size * 0.3;
      ctx.fillStyle = '#ff7060'; ctx.beginPath(); ctx.moveTo(x + 2, uy); ctx.lineTo(x + 2 + uw * 0.78, uy); ctx.lineTo(x + uw * 0.72, uy + size * 0.12); ctx.lineTo(x + 2, uy + size * 0.12); ctx.fill();
      ctx.fillStyle = '#ffb08a'; ctx.beginPath(); ctx.moveTo(x + 2 + uw * 0.78, uy); ctx.lineTo(x + uw, uy); ctx.lineTo(x + uw * 0.94, uy + size * 0.12); ctx.lineTo(x + uw * 0.72, uy + size * 0.12); ctx.fill();
      // subline: the question, gone as the title shrinks
      const qa = EO(0.35, 0.85) * (1 - E(1.3, 1.7));
      if (qa > 0) { ctx.globalAlpha = qa; ctx.font = '700 46px "Space Grotesk"'; const q = '¿Cómo mover un crudo que no fluye?', qw = ctx.measureText(q).width; ctx.fillStyle = 'rgba(30,20,60,0.35)'; ctx.fillText(q, 640 - qw / 2 + 3, 340 + 3 + (1 - qa) * 16); ctx.fillStyle = '#fff6f0'; ctx.fillText(q, 640 - qw / 2, 340 + (1 - qa) * 16); }
      ctx.restore();
    }
    // ---------- takeaway ----------
    if (t > 25.4) {
      const kk = H.ease.back(P(25.4, 25.85));
      ctx.save(); ctx.translate(640, 610); ctx.scale(kk, kk);
      lpTag(ctx, 0, 0, 'Más calor → menos viscosidad → más crudo', { font: '700 46px "Space Grotesk"', h: 84 });
      ctx.restore();
    }
  }

  window.DURATION = DURATION;
  window.explainer = explainer;
  window.EOR = { DURATION, lpTag, lpArrow };
})();
