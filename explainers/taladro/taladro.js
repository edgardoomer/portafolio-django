// Taladro de perforación — explainer in the "16-Bit Pixel Odyssey" style (SNES cutscene).
// 320x180 internal buffer, hand-placed pixels, scaled x4 nearest-neighbour. Every frame is a pure function of t.
(function () {
  const LW = 320, LH = 180;
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
  const bay = (x, y) => BAYER[(y & 3) * 4 + (x & 3)];
  const C = (h) => H.hex(h);
  const DURATION = 33.2;

  // master palette: the reference's SNES rows + a few rows for steel, earth, mud and sea
  const P = {
    sky: ['#140c34', '#1e1146', '#2c1658', '#43206a', '#632a78', '#8c357c', '#b8457a', '#e05c72', '#f6806a', '#ffaa6e', '#ffd28a'].map(C),
    star: C('#fff4d8'), starDim: C('#a88ac8'),
    sunHi: C('#fff6c2'), sunMid: C('#ffd27a'), sunLo: C('#ff9a5c'),
    cloud: C('#7a3478'), cloudLit: C('#e8687a'), cloudHot: C('#ffb08a'),
    mtFar: C('#6a3478'), mtFarLit: C('#b0507e'), mtNear: C('#3e1f5e'), mtNearLit: C('#7a3670'),
    bldBack: C('#2a1850'), bldBackLit: C('#4a2a6a'), bldFront: C('#170d30'), bldFrontLit: C('#38205a'),
    winY: C('#ffd27a'), winC: C('#6ef0ff'), winP: C('#ff6ab0'),
    core: C('#c8fcff'), coreMid: C('#4ad8ff'), coreDeep: C('#1a78c8'),
    roofRim: C('#d0607a'),
    K: C('#0a0618'),
    // steel
    s0: C('#2a2a4a'), s1: C('#4a4a7a'), s2: C('#8a8ab8'), s3: C('#c8c8e8'),
    // rig yellow (derrick, blocks)
    y0: C('#ffd27a'), y1: C('#c8803a'), y2: C('#7a4a2a'),
    // equipment blue
    b0: C('#3a6ad8'), b1: C('#22408a'),
    // BOP red
    r0: C('#ff3a4a'), r1: C('#a01a3a'), r2: C('#ff8a8a'),
    // mud + cuttings
    mud: C('#c8a070'), mudD: C('#8a6a4a'), cut: C('#5a3a2a'),
    // earth
    e0: C('#b06a5a'), e1: C('#7a4a4a'), e2: C('#5a3040'), e3: C('#46263e'), e4: C('#3a1e3a'), e5: C('#2c1632'),
    cap: C('#6a5a7a'), capD: C('#4a3e5e'), sand: C('#a0643a'), sandL: C('#d08a4a'), oil: C('#24101e'),
    // sea (light to deep)
    sea: ['#4ad8ff', '#2a8ad8', '#1a5ab0', '#16408a', '#122c6a', '#0c1a4a'].map(C), foam: C('#c8fcff'),
    green: C('#6aff8a'), greenD: C('#1a7a3a'),
  };
  const white = C('#f8f8ff'), gold = C('#ffd27a'), ink = C('#0a0618'), grey = C('#9aa0c8'), red = C('#ff3a4a'), green = C('#6aff8a'), cyan = C('#6ef0ff'), dimG = C('#5a5a7a');
  const WB = ['#4060d0', '#3450bc', '#2a42a6', '#22358e', '#1a2a78', '#142064'].map(C);

  // ---------- sprites ----------
  // the driller (hard hat, coveralls with reflective tape), faces right
  const DRILLER = [
    '.....KKKKK.....',
    '....KYYYYyK....',
    '...KYYYYYyYK...',
    '...KYYYYYYYK...',
    '..KKKKKKKKKKKK.',
    '...KSSSSSSSK...',
    '...KSSSSSKSK...',
    '...KSSSSSSSK...',
    '....KSSSSSK....',
    '.....KKSSKK....',
    '....KJJJJJJK...',
    '...KJJWJJJJK...',
    '..KJJJWJJJJSK..',
    '..KJJJWJJJKSK..',
    '..KJWWWWWWKKK..',
    '...KJJJJJJK....',
    '...KccccccK....',
    '...KJJJKJJJK...',
    '...KJJjKJJJK...',
    '...KJJK.KJJK...',
    '..KBBBK.KBBBK..',
    '..KKKKK.KKKKK..',
  ];
  const DRILLER_WALK = DRILLER.slice(0, 18).concat(['..KJJK..KJJK...', '.KBBBK...KBBK..', '.KBBBBK..KBBBBK', '..KKKK....KKKK.']);
  const DRILLER_PAL = { K: '#0a0618', Y: '#ffd27a', y: '#fff6c2', S: '#ffc8a0', J: '#3a6ad8', j: '#22408a', W: '#e8eef8', c: '#2a1a44', B: '#7a4a2a' };
  // system icons (9x9)
  const ICON = {
    izaje: ['...KKK...', '..KYYYK..', '..KYKYK..', '..KYYYK..', '...KYK...', '...KYK...', 'KK.KYK...', 'KYKKYK...', '.KYYK....'],
    rot: ['..KKKKK..', '.KCCCCCK.', 'KCKKKKKCK', 'KCK...KCK', 'KCK..KKCKK', 'KCK..KCCCK', 'KCKK..KCK.', '.KCCK..K..', '..KK......'],
    circ: ['....K....', '...KMK...', '...KMK...', '..KMMMK..', '.KMMWMMK.', '.KMWMMMK.', '.KMMMMMK.', '..KMMMK..', '...KKK...'],
    pot: ['....KKKK.', '...KYYK..', '..KYYK...', '.KYYYKKK.', 'KYYYYYYK.', '.KKKYYK..', '...KYK...', '..KYK....', '..KK.....'],
    ctrl: ['KKKKKKKKK', 'KRRRRRRRK', 'KRWRRRRRK', 'KRRRRRRRK', 'KRRRRRRRK', '.KRRRRRK.', '.KRRRRRK.', '..KRRRK..', '...KKK...'],
  };
  const ICON_PAL = { K: '#0a0618', Y: '#ffd27a', C: '#6ef0ff', M: '#c8a070', W: '#fff4d8', R: '#ff3a4a' };
  const ICON_GREY = { K: '#0a0618', Y: '#5a5a7a', C: '#5a5a7a', M: '#5a5a7a', W: '#8a8aa8', R: '#5a5a7a' };
  const SYS = [
    { id: 'izaje', name: 'IZAJE' },
    { id: 'rot', name: 'ROTACIÓN' },
    { id: 'circ', name: 'CIRCULACIÓN' },
    { id: 'pot', name: 'POTENCIA' },
    { id: 'ctrl', name: 'CONTROL DE POZO' },
  ];
  // BOP stack for the battle (annular on top, two ram bodies, drilling spool with side outlets)
  const BOP_OPEN = [
    '....KKKKKK....',
    '...KRRRRRRK...',
    '..KRRWWRRRRK..',
    '..KRRRRRRRRK..',
    '...KKKbbKKK...',
    'KKKKKKbbKKKKKK',
    'KSKRRRbbRRRKSK',
    'KSKRWRbbRRRKSK',
    'KKKKKKbbKKKKKK',
    'KSKRRRbbRRRKSK',
    'KSKRWRbbRRRKSK',
    'KKKKKKbbKKKKKK',
    '...KSSbbSSK...',
    '.KKKSSbbSSKKK.',
    '.KSKSSbbSSKSK.',
    '.KKKSSbbSSKKK.',
    '...KSSbbSSK...',
    '...KKKKKKKK...',
  ];
  const BOP_CLOSED = BOP_OPEN.map((r, j) => (j >= 5 && j <= 11 ? r.replace(/bb/g, j === 5 || j === 8 || j === 11 ? 'KK' : 'RR') : r));
  const BOP_PAL = { K: '#0a0618', R: '#ff3a4a', W: '#ff8a8a', S: '#8a8ab8', b: '#24101e' };
  // the kick (brote): a blob of formation gas and oil
  const BROTE = [
    '.....KKKKK......',
    '...KKOOOOOKK....',
    '..KOOYOOOOOOK...',
    '.KOOOOOOOOOOOK..',
    '.KOOWWOOOWWOOK..',
    'KOOOWKOOOWKOOOK.',
    'KOOOOOOOOOOOOOK.',
    'KOOOKKKKKKOOOOK.',
    'KROOOOOOOOOOORK.',
    '.KRROOOOOOORRK..',
    '..KRRRRRRRRRK...',
    '...KKKKKKKKK....',
  ];
  const BROTE_PAL = { K: '#0a0618', O: '#3a1a2e', Y: '#ffd27a', W: '#fff4d8', R: '#ff3a4a' };
  // tricone bit, side view (two of the three cones visible)
  const TRICONE = [
    ['.....KKKKKK.....', '.....KSsSSK.....', '.....KSsSSK.....', '...KKKKKKKKKK...', '..KSSSSSSSSSSK..', '.KSsSSSSSSSSSSK.', '.KSSKSSSSSSKSSK.', 'KGGKKSSSSSSKKGGK', 'KGgGGKSSSSKGGgGK', 'KGGGgGKSSKGgGGGK', '.KGgGGGKKGGGgGK.', '..KGGgKKKKgGGK..', '...KGGK..KGGK...', '....KK....KK....'],
    ['.....KKKKKK.....', '.....KSSsSK.....', '.....KSSsSK.....', '...KKKKKKKKKK...', '..KSSSSSSSSSSK..', '.KSSSSSSSSSsSSK.', '.KSSKSSSSSSKSSK.', 'KgGKKSSSSSSKKGgK', 'KGGgGKSSSSKGgGGK', 'KgGGGgKSSKgGGGgK', '.KGGgGGKKGGgGGK.', '..KgGGKKKKGGgK..', '...KGgK..KgGK...', '....KK....KK....'],
  ];
  const TRICONE_PAL = { K: '#0a0618', S: '#8a8ab8', s: '#c8c8e8', G: '#ffd27a', g: '#c8803a' };
  const BIT_SMALL = ['KYYYYYK', '.KYyYK.', '..KYK..'];
  const BIT_PAL = { K: '#0a0618', Y: '#ffd27a', y: '#c8803a' };
  const PX_ARROW = ['KK.....', 'KYK....', 'KYYK...', 'KYYYK..', 'KYYYYK.', 'KYYYK..', 'KYYK...', 'KYK....', 'KK.....'];
  const HAND = ['.KKKK...', 'KWWWWKKK', 'KWWWWWWK', 'KWWWWKKK', '.KKKK...'];

  // ---------- text rasteriser (thresholded so glyphs are pure pixels), cached once the font is in ----------
  // Press Start 2P draws accented capitals as small lowercase forms, so accents are placed by hand as pixel marks
  // over the plain capital (the font is monospaced: one cell = size px).
  const tcan = H.layer(LW, 80), tctx = tcan.getContext('2d', { willReadFrequently: true });
  const glyphs = new Map(), capTops = {};
  const ACC = { 'Á': ['A', 'acute'], 'É': ['E', 'acute'], 'Í': ['I', 'acute'], 'Ó': ['O', 'acute'], 'Ú': ['U', 'acute'], 'Ñ': ['N', 'tilde'] };
  const MARK = { acute: [[4, -3], [3, -2]], tilde: [[1, -2], [2, -3], [3, -3], [4, -2], [5, -2], [6, -3]] };
  function glyph(str, size) {
    const key = size + '|' + str; let g = glyphs.get(key); if (g) return g;
    const font = size + 'px "Press Start 2P"', HR = size;
    const base = [...str].map((ch) => (ACC[ch] ? ACC[ch][0] : ch)).join('');
    tctx.font = font; tctx.textBaseline = 'top'; tctx.fillStyle = '#fff';
    if (capTops[size] == null) { tctx.clearRect(0, 0, LW, 80); tctx.fillText('H', 0, HR); const d = tctx.getImageData(0, 0, size, size * 3).data; let r = HR; for (let j = 0; j < size * 3; j++) { let any = 0; for (let i = 0; i < size; i++) any |= d[(j * size + i) * 4 + 3] > 110; if (any) { r = j; break; } } capTops[size] = r; }
    tctx.clearRect(0, 0, LW, 80); tctx.fillText(base, 0, HR);
    const cw = Math.min(LW, Math.ceil(tctx.measureText(base).width) + 2), hh = HR + size + 4, d = tctx.getImageData(0, 0, cw, hh).data;
    const mask = new Uint8Array(cw * hh); for (let i = 0; i < cw * hh; i++) mask[i] = d[i * 4 + 3] > 110 ? 1 : 0;
    const s = size / 8, top = capTops[size];
    [...str].forEach((ch, i) => { if (!ACC[ch]) return; for (const [mx, my] of MARK[ACC[ch][1]]) for (let a = 0; a < s; a++) for (let b = 0; b < s; b++) { const x = i * size + mx * s + a, y = top + my * s + b; if (x >= 0 && x < cw && y >= 0) mask[y * cw + x] = 1; } });
    g = { w: cw - 2, cw, hh, mask, oy: top };
    if (document.fonts && document.fonts.check(font, base)) glyphs.set(key, g); else delete capTops[size];
    return g;
  }

  const NZ = H.makeNoise(77);
  const mixc = (a, b, k) => H.mix(a, b, k).map(Math.round);

  // ================= the explainer =================
  // Beat boundaries (seconds). Transitions straddle them.
  const B = { well: 5.0, roster: 7.8, kick: 20.0, battle: 23.2, types: 26.6, imp: 31.0 };

  function explainer(ctx, W, H_, t) {
    const T = Math.floor(t * 12 + 1e-6) / 12; // 12 fps game tick
    const prog = (a, b) => H.clamp((T - a) / (b - a));
    const step = (a, b, n) => Math.floor(prog(a, b) * n) / n; // stepped progress (whole-pixel SNES moves)
    const buf = new Uint8ClampedArray(LW * LH * 4);
    let CX = 0, CY = 0; // camera (world -> view)
    const vput = (x, y, c) => { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= LW || y >= LH) return; const i = (y * LW + x) * 4; buf[i] = c[0]; buf[i + 1] = c[1]; buf[i + 2] = c[2]; buf[i + 3] = 255; };
    const vget = (x, y) => { const i = (y * LW + x) * 4; return [buf[i], buf[i + 1], buf[i + 2]]; };
    const put = (x, y, c) => vput(Math.round(x) - CX, Math.round(y) - CY, c);
    const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) put(x + i, y + j, c); };
    const vrect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) vput(x + i, y + j, c); };
    const dput = (x, y, c1, c2, a) => put(x, y, a > bay(Math.round(x), Math.round(y)) ? c2 : c1);
    const vdput = (x, y, c1, c2, a) => vput(x, y, a > bay(x, y) ? c2 : c1);
    const line = (x0, y0, x1, y1, c, pf = put) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) pf(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), c); };
    const spriteF = (pf) => (rows, pal, ox, oy, flip, scale = 1) => {
      const cp = {}; for (const k in pal) cp[k] = C(pal[k]);
      rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === '.') return; const xx = flip ? row.length - 1 - i : i; for (let a = 0; a < scale; a++) for (let b = 0; b < scale; b++) pf(ox + xx * scale + a, oy + j * scale + b, cp[ch]); }));
    };
    const sprite = spriteF(put), vsprite = spriteF(vput);
    const textW = (str, size = 8) => glyph(str, size).w;
    const text = (str, x, y, col, shadow, size = 8, outline = null) => {
      if (!str) return 0;
      const g = glyph(str, size), { cw, hh, mask } = g, oy = y - g.oy;
      if (outline) for (let j = 0; j < hh; j++) for (let i = 0; i < cw; i++) if (mask[j * cw + i]) for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) vput(x + i + b, oy + j + a, outline);
      if (shadow) for (let j = 0; j < hh; j++) for (let i = 0; i < cw; i++) if (mask[j * cw + i]) vput(x + i + 1, oy + j + 1, shadow);
      for (let j = 0; j < hh; j++) for (let i = 0; i < cw; i++) if (mask[j * cw + i]) vput(x + i, oy + j, col);
      return g.w;
    };
    const win = (x0, y0, w, h) => { // SNES RPG window (view coords)
      for (let y = y0; y < y0 + h; y++) { const f = ((y - y0) / h) * (WB.length - 1), i = Math.min(WB.length - 2, Math.floor(f)), a = H.smooth(0.7, 1, f - i); for (let x = x0; x < x0 + w; x++) { if ((x === x0 || x === x0 + w - 1) && (y === y0 || y === y0 + h - 1)) continue; vdput(x, y, WB[i], WB[i + 1], a); } }
      for (let x = x0 + 1; x < x0 + w - 1; x++) { vput(x, y0, white); vput(x, y0 + h - 1, white); vput(x, y0 + 1, grey); vput(x, y0 + h - 2, grey); vput(x, y0 - 1, ink); vput(x, y0 + h, ink); }
      for (let y = y0 + 1; y < y0 + h - 1; y++) { vput(x0, y, white); vput(x0 + w - 1, y, white); vput(x0 + 1, y, grey); vput(x0 + w - 2, y, grey); vput(x0 - 1, y, ink); vput(x0 + w, y, ink); }
    };
    // window that snaps open in 4 steps (height grows from the middle)
    const winOpen = (x0, y0, w, h, t0) => { const op = step(t0, t0 + 0.25, 4); if (op <= 0) return 0; const bh = Math.max(4, Math.round(h * op)); win(x0, y0 + Math.round((h - bh) / 2), w, bh); return op; };
    const hand = (x, y) => vsprite(HAND, { K: '#0a0618', W: '#f8f8ff' }, x, y);
    // arrow drawn on from (x0,y0) to (x1,y1) by fraction k; view coords; 1px line with ink shadow and a pixel head
    const arrow = (x0, y0, x1, y1, k, col = gold) => {
      if (k <= 0) return;
      const ex = x0 + (x1 - x0) * k, ey = y0 + (y1 - y0) * k;
      line(x0 + 1, y0 + 1, ex + 1, ey + 1, ink, vput); line(x0, y0, ex, ey, col, vput);
      const L = Math.hypot(x1 - x0, y1 - y0) || 1, dx = (x1 - x0) / L, dy = (y1 - y0) / L;
      for (let s = 0; s < 4; s++) for (let w = -s; w <= s; w++) { const px = Math.round(ex - dx * s - dy * w), py = Math.round(ey - dy * s + dx * w); vput(px + 1, py + 1, ink); }
      for (let s = 0; s < 4; s++) for (let w = -s; w <= s; w++) vput(Math.round(ex - dx * s - dy * w), Math.round(ey - dy * s + dx * w), col);
    };
    // a label in its own little window that lands (drops 3px then settles) at t0; arrow draws on after it
    const label = (str, x, y, t0, col = white, size = 8, tgt = null, t1 = 1e9) => {
      if (T < t0 || T >= t1) return;
      const k = T - t0, drop = k < 1 / 12 - 1e-6 ? -3 : k < 2 / 12 - 1e-6 ? 1 : 0, w = textW(str, size);
      win(x - 5, y - 4 + drop, w + 10, size + 8);
      text(str, x, y + drop, col, ink, size);
      if (tgt) arrow(tgt[0], tgt[1], tgt[2], tgt[3], prog(t0 + 0.08, t0 + 0.33), col);
    };
    const pop = (str, x, y, t0, col, shadowCol, size = 16) => { // damage-number style pop with bounce
      if (T < t0) return; const k = T - t0, by = Math.round(-Math.max(0, 8 - k * 40) + (k < 0.2 ? -Math.sin(k * 15) * 5 : 0));
      text(str, x, y + by, col, shadowCol, size, ink);
    };

    // ---- backdrop kit (from the reference): banded dithered sky, stars, striped sun, lit cloud streaks, rim-lit fbm mountains
    const sky = (c0, c1, hz) => {
      for (let vy = 0; vy < LH; vy++) {
        const y = vy + CY; if (y > hz + 2) continue;
        const f = Math.pow(H.clamp(y / hz), 1.2) * 5, i = Math.min(4, Math.floor(f)), cA = mixc(c0, c1, i / 5), cB = mixc(c0, c1, (i + 1) / 5), a = H.smooth(0.6, 1, f - i);
        for (let x = 0; x < LW; x++) vput(x, vy, a > bay(x, y) ? cB : cA);
      }
    };
    const stars = (n, seed, par = 0.5) => { const r = H.rng(seed); for (let s = 0; s < n; s++) { const x = r.int(0, LW - 1), y = r.int(0, 90), ph = r() * 6.28; if (Math.sin(T * 3 + ph) > -0.3) vput(x, y - Math.round(CY * par), y < 40 ? P.star : P.starDim); } };
    const mountains = (base, amp, freq, seed, scroll, col, lit, sunX, yMax = LH) => {
      const hgt = [];
      for (let x = -1; x <= LW + 1; x++) { const u = (x + scroll) * freq; hgt.push(Math.round(base - amp * (Math.abs(NZ.fbm2(u, seed, 3)) * 1.6 + 0.35 * NZ.n2(u * 3.1, seed + 9)))); }
      for (let x = 0; x < LW; x++) {
        const top = hgt[x + 1], facing = hgt[x + 2] < hgt[x + 1] ? 0 : 1;
        for (let y = Math.max(0, top); y < Math.min(LH, yMax); y++) { const d = y - top; if (d < 2 && (facing || Math.abs(x - sunX) < 40)) vput(x, y, lit); else if (d < 5 && facing) vdput(x, y, col, lit, 0.5 - d * 0.1); else vput(x, y, col); }
      }
    };
    const cloud = (cx, cy, w, h) => {
      for (let y = cy - h; y <= cy + h; y++) for (let x = Math.round(cx - w); x <= cx + w; x++) {
        const dx = (x - cx) / w, dy = (y - cy) / h, lump = 1 + 0.25 * Math.sin(x * 0.35 + cx);
        if (dx * dx + (dy * dy) / lump > 1) continue;
        vput(x, y, dy > 0.55 ? P.cloudHot : dy > 0.15 ? P.cloudLit : P.cloud);
      }
    };
    const sun = (sx, sy, sr, yMax = LH) => {
      for (let y = sy - sr; y <= Math.min(sy + sr, yMax); y++) {
        const ry = (y - (sy - sr)) / (2 * sr);
        if (y > sy - 4) { const k = y - (sy - 4), gap = 1 + Math.floor(k / 9); if ((k % 7) < gap) continue; }
        for (let x = sx - sr; x <= sx + sr; x++) {
          if ((x - sx) ** 2 + (y - sy) ** 2 > sr * sr) continue;
          vput(x, y, ry < 0.45 ? (ry < 0.3 ? P.sunHi : (0.3 + 0.15 * bay(x, y) > ry ? P.sunHi : P.sunMid)) : (ry < 0.55 ? P.sunMid : (ry - 0.55) * 3 > bay(x, y) ? P.sunLo : P.sunMid));
        }
      }
    };
    const haze = (y0, y1, amt) => { const ym = (y0 + y1) / 2, hw = (y1 - y0) / 2; for (let y = Math.max(0, y0); y < Math.min(LH, y1); y++) { const a = amt * (1 - Math.abs(y - ym) / hw); for (let x = 0; x < LW; x++) if (a > bay(x, y)) { const c = vget(x, y); if (c[0] + c[1] + c[2] < 300) vput(x, y, mixc(c, P.cloudLit, 0.35)); } } };
    const SMK = [C('#b8a0b8'), C('#7a6a8a')];
    const smoke = (x, y, seed) => { for (let k = 0; k < 4; k++) { const ph = (T * 0.7 + k / 4 + seed * 0.37) % 1, px = x + ph * 7 + Math.sin(ph * 6 + seed) * 1.5, py = y - ph * 20, r = 1.4 + ph * 2.6; for (let j = -4; j <= 4; j++) for (let i = -4; i <= 4; i++) if (i * i + j * j <= r * r && (1.25 - ph) > bay(Math.round(px + i), Math.round(py + j))) put(px + i, py + j, j < 0 && ph < 0.5 ? SMK[0] : SMK[1]); } };

    // ---------------------------------------------------------------- SURFACE WORLD (hook, well path, takeaway)
    const G1 = 112, WELLX = 200;
    const dome = (x) => 192 - 22 * Math.exp(-(((x - WELLX) / 78) ** 2)), OWC = 186; // anticline trap, flat oil-water contact
    const rigSil = (x, g) => { // land rig on the horizon: lattice derrick, substructure, doghouse, tanks, gensets; work lights on
      const sb = g - 10, top = g - 78, lx = (y) => x - (3 + 13 * (y - top) / (sb - top)), rx = (y) => 2 * x - lx(y);
      rect(x - 22, sb, 44, 10, P.bldFront); rect(x - 22, sb, 44, 1, P.roofRim);
      for (let k = 0; k < 4; k++) line(x - 22 + k * 11, sb + 1, x - 11 + k * 11, g - 1, P.bldFrontLit);
      rect(x - 34, sb - 8, 12, 8, P.bldFront); rect(x - 34, sb - 8, 12, 1, P.roofRim); put(x - 30, sb - 5, P.winY); put(x - 27, sb - 5, P.winY); // doghouse
      for (let y = top; y <= sb; y++) { put(lx(y), y, P.bldFront); put(lx(y) + 1, y, P.bldFront); put(rx(y), y, P.roofRim); put(rx(y) - 1, y, P.bldFront); }
      for (let y = top + 10; y < sb; y += 10) { line(lx(y), y, rx(y), y, P.bldFront); line(lx(y), y, rx(y + 10), y + 10, P.bldFrontLit); line(rx(y), y, lx(y + 10), y + 10, P.bldFrontLit); }
      rect(x - 5, top - 5, 10, 5, P.bldFront); rect(x - 5, top - 5, 10, 1, P.roofRim);
      if (Math.sin(T * 4) > 0) { put(x, top - 6, P.r0); put(x - 1, top - 6, P.r2); }
      for (let y = top + 14; y < sb; y += 16) { put(lx(y) - 1, y, P.winY); put(rx(y) + 1, y + 6, P.winY); }
      rect(x + 26, g - 9, 34, 9, P.bldFront); rect(x + 26, g - 9, 34, 1, P.roofRim); rect(x + 62, g - 7, 12, 7, P.bldFront); rect(x + 62, g - 7, 12, 1, P.roofRim); // pits + pump
      rect(x - 76, g - 8, 30, 8, P.bldFront); rect(x - 76, g - 8, 30, 1, P.roofRim); rect(x - 62, g - 13, 2, 5, P.bldFront); rect(x - 52, g - 13, 2, 5, P.bldFront); // gensets
      smoke(x - 61, g - 15, 1); smoke(x - 51, g - 15, 2);
    };
    const sceneSurface = (camY, drill, showRes) => {
      CX = 0; CY = Math.round(camY);
      sky(C('#140c34'), C('#e05c72'), G1); stars(46, 3, 0.5);
      sun(268, G1 - 6 - CY, 22, G1 - CY);
      const cd = T * 2, cy = -Math.round(CY * 0.6);
      cloud(((40 + cd) % 380) - 30, 30 + cy, 30, 2); cloud(((250 + cd * 1.1) % 380) - 30, 22 + cy, 22, 2); cloud(((150 + cd * 0.7) % 380) - 30, 62 + cy, 38, 2); cloud(((300 + cd * 0.9) % 380) - 30, 76 + cy, 26, 2);
      mountains(G1 - 2 - CY, 26, 0.018, 3.3, T * 2, P.mtFar, P.mtFarLit, 268, G1 - CY + 1);
      mountains(G1 + 2 - CY, 12, 0.03, 8.1, T * 3, P.mtNear, P.mtNearLit, 268, G1 - CY + 1);
      haze(G1 - 14 - CY, G1 + 2 - CY, 0.4);
      // ground and the cross-section underneath (cut-away like a mining game)
      for (let x = 0; x < LW; x++) {
        const b1 = 124 + 2 * NZ.n2(x * 0.03, 1.7), b2 = 146 + 3 * NZ.n2(x * 0.02, 5.1), dm = dome(x), cap0 = dm - 9, resB = dm + 14 + 2 * NZ.n2(x * 0.05, 2.2);
        for (let vy = 0; vy < LH; vy++) {
          const y = vy + CY; if (y < G1) continue;
          let c;
          if (y < G1 + 1) c = P.e0;
          else if (y < G1 + 6) c = ((x * 3 + y) % 11 === 0) ? P.e0 : P.e1;
          else if (y < b1) c = (y - (G1 + 6) < 2 && 0.5 > bay(x, y)) ? P.e1 : P.e2;
          else if (y < b2) c = (y - b1 < 2 && 0.5 > bay(x, y)) ? P.e2 : (((x * 7 + y * 3) % 23) === 0 ? P.e2 : P.e3);
          else if (y < cap0) c = (y - b2 < 2 && 0.5 > bay(x, y)) ? P.e3 : P.e4;
          else if (y < dm) c = ((y - Math.round(cap0)) % 3 === 2) ? P.capD : P.cap; // shale seal, laminated
          else if (y < resB) {
            if (y < OWC) { c = 0.55 > bay(x, y) ? P.oil : P.sand; if (((x * 13 + y * 7) % 37) === 0 && Math.sin(T * 5 + x) > 0.2) c = P.y0; }
            else c = ((x + y) % 5 === 0) ? P.sandL : P.sand;
          } else c = (y - resB < 2 && 0.5 > bay(x, y)) ? P.sand : P.e5;
          vput(x, vy, c);
        }
      }
      rigSil(WELLX, G1);
      // the well: drilled from the rig down to the top of the trap
      if (drill > 0) {
        const yb = G1 + drill * (dome(WELLX) + 5 - G1);
        for (let y = G1; y < yb; y++) { put(WELLX - 2, y, P.K); put(WELLX + 2, y, P.K); put(WELLX - 1, y, P.mudD); put(WELLX + 1, y, P.mudD); put(WELLX, y, P.s2); }
        if (drill < 1) { sprite(BIT_SMALL, BIT_PAL, WELLX - 3, yb - 1); if (Math.floor(T * 12) % 2) { put(WELLX - 4, yb + 1, P.mud); put(WELLX + 4, yb, P.mud); } }
        else rect(WELLX - 1, yb - 1, 3, 2, P.y0);
      }
    };

    // ---------------------------------------------------------------- RIG WORLD (the five systems)
    const G = 180, F = 150, RX = 200, BIT = 236, SPX = 226, PUMPX = 332;
    const lxD = (y) => RX - (5 + 15 * (y - 26) / (F - 26)), rxD = (y) => 2 * RX - lxD(y);
    const polyLen = (pts) => { let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };
    const polyAt = (pts, s) => { for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (s <= l) { const k = l ? s / l : 0; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]; } s -= l; } return pts[pts.length - 1]; };
    const hoseAt = (s, tdy) => { const x0 = SPX - 2, y0 = 94, x1 = RX + 5, y1 = tdy + 5; return [x0 + (x1 - x0) * s, y0 + (y1 - y0) * s + 12 * Math.sin(Math.PI * s)]; };
    const sceneRig = (st) => {
      CX = Math.round(st.cx); CY = Math.round(st.cy);
      const tdy = Math.round(st.tdy), rot = st.rot, focus = st.focus;
      sky(C('#140c34'), C('#e05c72'), G); stars(50, 3, 0.4);
      sun(Math.round(330 - CX * 0.4), G - 12 - CY, 24, G - CY);
      const cd = T * 2, cyo = -Math.round(CY * 0.5), cxo = -Math.round(CX * 0.3);
      cloud(((60 + cd + cxo) % 380 + 380) % 380 - 30, 36 + cyo, 32, 2); cloud(((240 + cd * 1.2 + cxo) % 380 + 380) % 380 - 30, 24 + cyo, 24, 2); cloud(((150 + cd * 0.8 + cxo) % 380 + 380) % 380 - 30, 84 + cyo, 40, 2);
      mountains(G - 8 - CY, 34, 0.016, 3.3, CX * 0.4 + T * 1.5, P.mtFar, P.mtFarLit, Math.round(330 - CX * 0.4), G - CY + 1);
      mountains(G - 2 - CY, 16, 0.03, 8.1, CX * 0.6 + T * 2.5, P.mtNear, P.mtNearLit, Math.round(330 - CX * 0.4), G - CY + 1);
      haze(G - 20 - CY, G - CY, 0.36);
      // ground + cross-section
      for (let vx = 0; vx < LW; vx++) {
        const x = vx + CX, b1 = G + 16 + 2 * NZ.n2(x * 0.03, 1.1), b2 = G + 34 + 3 * NZ.n2(x * 0.025, 4.2), b3 = G + 54 + 2 * NZ.n2(x * 0.04, 7.7);
        for (let vy = 0; vy < LH; vy++) {
          const y = vy + CY; if (y < G) continue;
          let c;
          if (y < G + 1) c = P.e0; else if (y < G + 5) c = ((x * 3 + y) % 11 === 0) ? P.e0 : P.e1;
          else if (y < b1) c = (y - G - 5 < 2 && 0.5 > bay(x, y)) ? P.e1 : P.e2;
          else if (y < b2) c = (y - b1 < 2 && 0.5 > bay(x, y)) ? P.e2 : (((x * 7 + y * 3) % 23) === 0 ? P.e2 : P.e3);
          else if (y < b3) c = (y - b2 < 2 && 0.5 > bay(x, y)) ? P.e3 : P.e4;
          else c = ((y - Math.round(b3)) % 3 === 2) ? P.capD : P.cap;
          vput(vx, vy, c);
        }
      }
      // ---- POWER: diesel-electric gensets + control house (VFD), cables to the big consumers
      const genset = (x0, seed) => {
        const y0 = G - 14; rect(x0 - 1, G - 2, 47, 2, P.s0);
        rect(x0, y0 + 2, 30, 11, P.s1); rect(x0, y0 + 2, 30, 1, P.s2);
        for (let y = y0 + 4; y < G - 2; y += 2) for (let x = x0 + 1; x < x0 + 6; x++) put(x, y, P.s0);
        for (let x = x0 + 9; x < x0 + 28; x += 4) rect(x, y0 + 4, 2, 6, P.s0);
        rect(x0 + 30, y0 + 3, 14, 10, P.b0); rect(x0 + 30, y0 + 3, 14, 1, P.s3); rect(x0 + 43, y0 + 3, 1, 10, P.b1);
        rect(x0 + 21, y0 - 7, 3, 9, P.s0); put(x0 + 21, y0 - 7, P.s2);
        for (let x = x0 - 1; x < x0 + 46; x++) put(x, G - 1, P.K);
        smoke(x0 + 22, y0 - 9, seed);
      };
      genset(22, 1); genset(80, 2);
      rect(136, G - 18, 26, 18, P.s1); rect(136, G - 18, 26, 1, P.s3); rect(161, G - 17, 1, 17, P.s2); rect(140, G - 12, 5, 12, P.s0); rect(149, G - 14, 9, 5, P.winY); // control house
      const cDW = [[162, G - 3], [166, G - 3], [166, F + 2], [170, F - 3]];
      const cTD = [[162, G - 6], [178, G - 6], [178, F - 2], [lxD(96) + 1, 96], [RX - 6, tdy + 6]];
      const cMP = [[162, G - 1], [PUMPX + 4, G - 1]];
      [cDW, cTD, cMP].forEach((pts) => { for (let i = 1; i < pts.length; i++) line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1], P.K); });
      // ---- substructure
      const SB = [164, 176, 224, 236];
      SB.forEach((x) => { for (let y = F + 3; y < G; y++) { put(x, y, P.y1); put(x + 1, y, P.y2); } });
      [[164, 176], [224, 236]].forEach(([a, b]) => { line(a, F + 4, b, G - 1, P.y1); line(b, F + 4, a, G - 1, P.y1); });
      line(164, F + 16, 236, F + 16, P.y2);
      // ---- BOP stack + wellhead
      const bopFlash = st.bopFlash && Math.floor(T * 12) % 2 === 0;
      const R0 = bopFlash ? white : P.r0;
      rect(RX - 6, F + 5, 12, 5, R0); put(RX - 6, F + 5, P.K); put(RX + 5, F + 5, P.K); rect(RX - 6, F + 10, 12, 1, P.K);
      for (const yy of [F + 11, F + 16]) { rect(RX - 8, yy, 16, 4, R0); rect(RX - 11, yy + 1, 3, 2, P.s2); rect(RX + 8, yy + 1, 3, 2, P.s2); rect(RX - 8, yy + 4, 16, 1, P.K); }
      if (st.bopClosed) { rect(RX - 1, F + 11, 2, 4, P.r1); rect(RX - 1, F + 16, 2, 4, P.r1); }
      rect(RX - 5, F + 21, 10, 6, P.s1); rect(RX - 9, F + 23, 4, 2, P.s2); rect(RX + 5, F + 23, 4, 2, P.s2);
      rect(RX - 6, G - 3, 12, 3, P.s2);
      line(RX + 9, F + 24, RX + 30, F + 24, P.s1); // choke line
      // ---- well, casing and the drill string (cut-away)
      for (let y = G; y <= BIT; y++) { put(RX - 4, y, y < G + 24 ? P.s2 : P.K); put(RX + 4, y, y < G + 24 ? P.s2 : P.K); for (let x = RX - 3; x <= RX + 3; x++) put(x, y, P.mudD); }
      const pipeTop = tdy + 16;
      for (let y = pipeTop; y < BIT - 3; y++) { const s = ((y + rot) % 6 + 6) % 6; put(RX - 1, y, P.s1); put(RX, y, s < 3 ? P.s3 : P.s2); put(RX + 1, y, s < 3 ? P.s2 : P.s1); }
      sprite(BIT_SMALL, BIT_PAL, RX - 3, BIT - 3);
      // ---- rig floor, rotary table, drawworks
      rect(160, F, 80, 3, P.s1); rect(160, F, 80, 1, P.s2); rect(160, F + 3, 80, 1, P.K);
      for (const x of [160, 168, 232, 239]) for (let y = F - 6; y < F; y++) put(x, y, P.y1);
      for (let x = 160; x < 169; x++) put(x, F - 6, P.y0); for (let x = 232; x < 240; x++) put(x, F - 6, P.y0);
      rect(RX - 7, F - 2, 14, 2, P.s0); put(RX - 6 + (((rot >> 1) % 12) + 12) % 12, F - 2, P.s3);
      rect(162, F - 12, 22, 12, P.b1); rect(162, F - 12, 22, 1, P.b0);
      const drum = Math.round(st.drum);
      for (let x = 165; x < 179; x++) for (let y = F - 10; y < F - 3; y++) put(x, y, ((x + drum) % 3 + 3) % 3 === 0 ? P.s0 : (y === F - 10 ? P.s3 : P.s2));
      rect(180, F - 11, 4, 10, P.b0);
      // ---- derrick (mast): two lattice legs, girts, X-bracing, monkey board, crown block and gin pole
      for (let y = 26; y <= F; y++) { put(lxD(y), y, P.y1); put(lxD(y) + 1, y, P.y2); put(rxD(y), y, P.y0); put(rxD(y) - 1, y, P.y1); }
      for (let y = 26 + 15.5; y < F; y += 15.5) { const ya = Math.round(y), yb = Math.round(Math.min(F, y + 15.5)); line(lxD(ya), ya, rxD(ya), ya, P.y1); line(lxD(ya), ya + 1, rxD(ya), ya + 1, P.y2); line(lxD(ya), ya, rxD(yb), yb, P.y1); line(rxD(ya), ya, lxD(yb), yb, P.y1); }
      rect(lxD(70) - 9, 70, 10, 2, P.y0); rect(lxD(70) - 9, 72, 10, 1, P.K);
      line(RX - 4, 17, RX, 9, P.y1); line(RX + 4, 17, RX, 9, P.y1);
      rect(RX - 9, 17, 18, 8, P.s1); rect(RX - 9, 17, 18, 1, P.s3); rect(RX - 9, 25, 18, 1, P.K);
      for (let x = RX - 7; x <= RX + 7; x += 3) put(x, 21, P.s0);
      // ---- drilling line: fast line to the drum, 4 lines to the travelling block, dead line to its anchor
      line(RX - 8, 23, 172, F - 10, P.s3);
      line(RX + 8, 23, RX + 16, F - 1, P.s2); rect(RX + 14, F - 2, 5, 2, P.s0);
      for (const dx of [-3, -1, 1, 3]) for (let y = 26; y < tdy - 11; y++) put(RX + dx, y, P.s3);
      // travelling block (yellow) + hook + top drive (blue)
      rect(RX - 5, tdy - 12, 10, 10, P.y0); rect(RX - 5, tdy - 12, 10, 1, P.sunHi); rect(RX + 4, tdy - 11, 1, 9, P.y1);
      for (const dx of [-3, -1, 1, 3]) rect(RX + dx, tdy - 10, 1, 3, P.y2);
      rect(RX - 5, tdy - 2, 10, 1, P.K); rect(RX - 1, tdy - 1, 3, 2, P.s1);
      rect(RX - 5, tdy + 1, 10, 13, P.b0); rect(RX - 5, tdy + 1, 10, 3, P.b1); rect(RX - 5, tdy + 1, 10, 1, P.s3); rect(RX + 4, tdy + 1, 1, 13, P.b1);
      rect(RX - 1, tdy + 14, 3, 3, ((rot >> 1) % 2) ? P.s3 : P.s2);
      // ---- standpipe + rotary hose; mud pumps + discharge line; flowline, shale shaker, mud pits
      for (let y = 94; y < G - 5; y++) { put(SPX, y, P.s2); put(SPX + 1, y, P.s1); }
      put(SPX - 1, 93, P.s2); put(SPX - 2, 94, P.s2);
      for (let i = 0; i <= 40; i++) { const [hx, hy] = hoseAt(i / 40, tdy); put(hx, hy, P.K); put(hx, hy + 1, P.s0); }
      for (let x = SPX; x < PUMPX; x++) { put(x, G - 6, P.s1); put(x, G - 5, P.s0); }
      [252, 290].forEach((x) => rect(x, G - 4, 1, 4, P.s0));
      const fl0 = [RX + 6, F + 4], fl1 = [248, G - 25];
      line(fl0[0], fl0[1], fl1[0], fl1[1], P.s1); line(fl0[0], fl0[1] + 1, fl1[0], fl1[1] + 1, P.s0);
      for (const [x0, w] of [[246, 38], [288, 38]]) {
        rect(x0, G - 16, w, 16, P.s1); rect(x0, G - 16, w, 1, P.s3); rect(x0 + w - 1, G - 15, 1, 15, P.s2); rect(x0, G - 1, w, 1, P.K);
        const lvl = Math.round(st.pitGain || 0);
        rect(x0 + 2, G - 11 - lvl, w - 4, 9 + lvl, P.mudD); for (let x = x0 + 2; x < x0 + w - 2; x++) put(x, G - 12 - lvl, ((x + Math.floor(T * 6)) % 5) ? P.mud : P.sunLo);
        rect(x0 + 8, G - 20, 4, 4, P.b1); rect(x0 + 26, G - 20, 4, 4, P.b1);
      }
      const shk = st.flowOn && Math.floor(T * 12) % 2 ? 1 : 0;
      rect(248 + shk, G - 25, 20, 3, P.s2); rect(248 + shk, G - 25, 20, 1, P.s3); rect(249, G - 22, 2, 6, P.s0); rect(265, G - 22, 2, 6, P.s0);
      rect(270, G - 22, 9, 6, P.cut); rect(270, G - 22, 9, 1, P.e1); // cuttings box
      rect(PUMPX, G - 14, 28, 14, P.b1); rect(PUMPX, G - 14, 28, 1, P.b0); rect(PUMPX, G - 14, 9, 14, P.s2);
      for (let k = 0; k < 3; k++) rect(PUMPX + 1, G - 12 + k * 4, 7, 2, P.s1);
      rect(PUMPX + 3, G - 19, 5, 5, P.r0); put(PUMPX + 4, G - 18, P.r2);
      const wa = (st.pumpPh || 0); for (let k = 0; k < 18; k++) { const a = k / 18 * 6.283; put(PUMPX + 19 + Math.cos(a) * 5, G - 7 + Math.sin(a) * 5, P.s3); }
      line(PUMPX + 19, G - 7, PUMPX + 19 + Math.cos(wa) * 4, G - 7 + Math.sin(wa) * 4, P.y0);
      rect(PUMPX, G - 1, 28, 1, P.K);
      // ---- mud circulation: pump -> standpipe -> hose -> top drive -> down the pipe -> bit -> up the annulus -> flowline -> shaker -> pits -> pump
      if (st.flowK > 0) {
        const hose = []; for (let i = 0; i <= 8; i++) hose.push(hoseAt(i / 8, tdy));
        const pathDn = [[PUMPX, G - 6], [SPX, G - 6], [SPX, 94]].concat(hose, [[RX, tdy + 8], [RX, BIT - 2]]);
        const pathUp = [[RX + 2, BIT - 2], [RX + 2, F + 6], [fl0[0], fl0[1] - 1], [fl1[0], fl1[1] - 1], [266, G - 26], [270, G - 14], [300, G - 12], [PUMPX - 2, G - 8]];
        const Ld = polyLen(pathDn), Lu = polyLen(pathUp), Ltot = Ld + Lu, shown = st.flowK * Ltot, off = (T * 30) % 6;
        for (let s = off; s < Math.min(shown, Ltot); s += 6) {
          const up = s > Ld, [px, py] = up ? polyAt(pathUp, s - Ld) : polyAt(pathDn, s);
          const c = up ? (Math.floor(s / 6) % 2 ? P.cut : P.sunLo) : P.mud;
          put(px, py, c); put(px + 1, py, c); put(px, py + 1, P.K);
        }
        if (st.flowK < 1) { const [hx, hy] = shown > Ld ? polyAt(pathUp, shown - Ld) : polyAt(pathDn, shown); rect(hx - 1, hy - 1, 3, 3, white); }
        if (st.flowOn) for (let k = 0; k < 3; k++) { const ph = (T * 2 + k / 3) % 1; put(271 + k * 2, G - 25 + ph * 3, P.cut); }
      }
      // ---- electricity: sparks run from the control house to drawworks, top drive and pumps
      if (st.powK > 0) {
        [cDW, cTD, cMP].forEach((pts, ci) => {
          const L = polyLen(pts), shown = st.powK * L, off = (T * 40 + ci * 3) % 9;
          for (let s = off; s < shown; s += 9) { const [px, py] = polyAt(pts, s); put(px, py, white); put(px + 1, py, P.y0); put(px - 1, py, P.y0); }
          if (st.powK < 1) { const [hx, hy] = polyAt(pts, shown); rect(hx - 1, hy - 1, 3, 3, white); }
        });
      }
      // ---- the kick: formation gas/oil bubbles rising up the annulus toward the BOP
      if (st.kick > 0) {
        const head = BIT - st.kick * (BIT - (F + 22));
        for (let y = BIT - 2; y > head; y -= 3) { const w = Math.sin(y * 0.7 + T * 9); put(RX + (w > 0 ? 2 : -2), y, (y % 2) ? P.r0 : P.y0); put(RX + (w > 0 ? 3 : -3), y - 1, P.r0); }
        rect(RX - 3, Math.round(head) - 1, 7, 2, (Math.floor(T * 12) % 2) ? P.y0 : P.r0);
      }
      // focus pulse: the system that the beat is about blinks white for its first ticks
      if (focus && st.focusK > 0 && st.focusK < 0.25 && Math.floor(T * 12) % 2 === 0) {
        const z = { izaje: [[RX - 6, tdy - 13, 12, 12], [162, F - 12, 22, 12]], rot: [[RX - 5, tdy + 1, 10, 13], [RX - 7, F - 2, 14, 2]], circ: [[PUMPX, G - 14, 28, 14], [246, G - 16, 80, 16]], pot: [[22, G - 14, 46, 13], [80, G - 14, 46, 13]], ctrl: [[RX - 8, F + 5, 16, 16]] }[focus] || [];
        z.forEach(([x, y, w, h]) => { for (let i = 0; i < w; i++) { put(x + i, y - 1, white); put(x + i, y + h, white); } for (let j = 0; j < h; j++) { put(x - 1, y + j, white); put(x + w, y + j, white); } });
      }
    };

    // ---------------------------------------------------------------- PARTY ROSTER ("5 SISTEMAS")
    const sceneRoster = () => {
      CX = 0; CY = 0;
      sky(C('#0c0a2a'), C('#3a1e6a'), 150); stars(60, 8, 0);
      mountains(150, 24, 0.018, 3.3, T * 2, P.mtFar, P.mtFarLit, 260);
      mountains(158, 12, 0.03, 8.1, T * 3, P.mtNear, P.mtNearLit, 260);
      for (let y = 160; y < LH; y++) for (let x = 0; x < LW; x++) vdput(x, y, P.e2, P.e3, (y - 160) / 20);
    };

    // ---------------------------------------------------------------- BATTLE (kick vs BOP)
    const sceneBattle = () => {
      CX = 0; CY = 0;
      sky(C('#1a0c3a'), C('#b8457a'), 100); stars(24, 5, 0);
      cloud(((20 + T * 3) % 380) - 30, 30, 34, 2); cloud(((200 + T * 2) % 380) - 30, 58, 28, 2); cloud(((120 + T * 2.5) % 380) - 30, 74, 40, 2);
      mountains(92, 30, 0.016, 5.7, T * 1.5, P.mtFar, P.mtFarLit, 160, 120);
      mountains(102, 16, 0.028, 2.2, T * 3, P.mtNear, P.mtNearLit, 160, 120);
      // the rig on the horizon (silhouette), so the fight happens at the well
      { const sv = CY; CY = -8; rigSil(160, 106); CY = sv; }
      const hillA = C('#2e1650'), hillB = C('#43206a'), hillLit = C('#9a4a86'), field = [C('#3e1f5e'), C('#4c2468')];
      const hTop = []; for (let x = 0; x < LW; x++) hTop.push(Math.round(108 + 3 * NZ.n2((x + T * 6) * 0.025, 4.4) + 2 * Math.sin((x + T * 6) * 0.07)));
      for (let x = 0; x < LW; x++) for (let y = hTop[x]; y < 116; y++) { const d = y - hTop[x]; vput(x, y, d < 1 ? hillLit : d < 3 ? (0.5 > bay(x, y) ? hillLit : hillB) : hillA); }
      for (let y = 116; y < 136; y++) { const dz = 30 / (y - 100) + T * 1.2, band = Math.floor(dz) & 1, fr = dz - Math.floor(dz); for (let x = 0; x < LW; x++) { const c0 = field[band], c1 = field[band ^ 1]; vput(x, y, fr > 0.82 && (fr - 0.82) * 5.5 > bay(x, y) ? c1 : c0); } }
      for (let x = 0; x < LW; x++) vput(x, 116, C('#24103e'));
    };

    // ---------------------------------------------------------------- RIG TYPES (land + offshore)
    const sceneTypes = (rise) => {
      CX = 0; CY = 0;
      const SEA = 118;
      sky(C('#140c34'), C('#f6806a'), SEA); stars(40, 11, 0);
      sun(300, SEA - 8, 20, SEA - 1);
      cloud(((50 + T * 2) % 380) - 30, 30, 30, 2); cloud(((220 + T * 1.4) % 380) - 30, 54, 36, 2);
      mountains(SEA - 4, 18, 0.02, 3.3, T * 2, P.mtFar, P.mtFarLit, 300, 116);
      // land on the left, a coastline, a shallow shelf, then the deep slope
      const bed = (x) => x < 72 ? 114 : x < 92 ? 114 + (x - 72) * 1.8 : x < 150 ? 150 + 2 * NZ.n2(x * 0.05, 3) : 150 + (x - 150) * 0.9;
      for (let x = 0; x < LW; x++) {
        const b = bed(x);
        for (let y = 100; y < LH; y++) {
          if (x < 72 && y >= 114) { vput(x, y, y < 115 ? P.e0 : y < 119 ? P.e1 : (0.4 > bay(x, y) ? P.e3 : P.e2)); continue; }
          if (y >= b) { vput(x, y, y - b < 2 ? P.sandL : (0.5 > bay(x, y) ? P.sand : P.e1)); continue; }
          if (y < SEA) continue;
          const d = (y - SEA) / 62, i = Math.min(4, Math.floor(d * 5)), a = H.smooth(0.6, 1, d * 5 - i);
          vput(x, y, a > bay(x, y) ? P.sea[i + 1] : P.sea[i]);
          if (y === SEA && ((x + Math.floor(T * 8)) % 9) < 3) vput(x, y, P.foam);
        }
      }
      const ry = (k) => Math.round((1 - H.ease.out(k)) * 60); // rigs rise into place in whole-pixel steps
      const mast = (x, g, h, w) => { for (let y = g - h; y <= g; y++) { const hw = 1 + (w - 1) * (y - (g - h)) / h; put(x - hw, y, P.y1); put(x + hw, y, P.y0); } for (let y = g - h + 5; y < g; y += 5) { const hw = 1 + (w - 1) * (y - (g - h)) / h; line(x - hw, y, x + hw, y, P.y1); } rect(x - 2, g - h - 3, 4, 3, P.s1); if (Math.sin(T * 4 + x) > 0) put(x, g - h - 4, P.r0); };
      // 1. land rig
      if (rise[0] > 0) { const o = ry(rise[0]); CY = o; rect(26, 104, 30, 10, P.s1); rect(26, 104, 30, 1, P.s3); for (let k = 0; k < 3; k++) line(26 + k * 10, 105, 36 + k * 10, 113, P.y1); mast(41, 104, 36, 7); rect(12, 107, 12, 7, P.b1); rect(58, 108, 12, 6, P.s1); CY = 0; }
      // 2. jack-up: hull jacked up above the waves, three lattice legs standing on the seabed (spudcans)
      if (rise[1] > 0) { const o = ry(rise[1]); CY = o; const hx = 100, hy = 96;
        for (const lx of [hx + 3, hx + 21, hx + 37]) { for (let y = hy - 16; y < 150; y++) { put(lx, y, P.y1); put(lx + 2, y, P.y1); if (y % 4 === 0) put(lx + 1, y, P.y0); } rect(lx - 1, 150, 5, 2, P.s1); }
        rect(hx, hy, 42, 7, P.s1); rect(hx, hy, 42, 1, P.s3); rect(hx, hy + 7, 42, 1, P.K); rect(hx + 32, hy - 5, 8, 5, P.b1);
        mast(hx + 12, hy, 30, 6); CY = 0; }
      // 3. semisubmersible: deck on columns, pontoons below the waterline, catenary mooring lines to anchors
      if (rise[2] > 0) { const o = ry(rise[2]); CY = o; const sx = 176, sy = 100;
        for (const cx of [sx + 4, sx + 34]) { rect(cx, sy + 6, 6, 22, P.s1); rect(cx, sy + 6, 1, 22, P.s2); }
        rect(sx - 2, sy + 26, 48, 6, P.r1); rect(sx - 2, sy + 26, 48, 1, P.r0);
        rect(sx, sy, 44, 6, P.s1); rect(sx, sy, 44, 1, P.s3); rect(sx, sy + 6, 44, 1, P.K); rect(sx + 34, sy - 6, 9, 6, P.b1);
        mast(sx + 20, sy, 32, 6);
        for (const [x0, dir] of [[sx - 2, -1], [sx + 46, 1]]) for (let k = 0; k <= 30; k++) { const s = k / 30, x = x0 + dir * s * 34, y = sy + 28 + s * 60 - Math.sin(s * Math.PI) * 10; if (k % 2 === 0) put(x, y, P.s3); }
        CY = 0; }
      // 4. drillship: hull with the derrick midships, riser down through the moon pool, held by thrusters
      if (rise[3] > 0) { const o = ry(rise[3]); CY = o; const dx = 246, dy = 112;
        rect(dx, dy, 66, 8, P.s1); rect(dx, dy, 66, 1, P.s3); for (let k = 0; k < 6; k++) rect(dx + 66 + k, dy + k, 1, 8 - k, P.s1);
        rect(dx, dy + 6, 72, 2, P.r1);
        rect(dx + 2, dy - 9, 12, 9, P.s3); rect(dx + 4, dy - 7, 8, 2, P.coreDeep); rect(dx + 56, dy - 3, 12, 3, P.b1);
        mast(dx + 32, dy, 32, 6);
        for (let y = dy + 8; y < LH; y++) if (y % 2 === 0) put(dx + 32, y, P.s3);
        CY = 0; }
    };

    // ---------------------------------------------------------------- WHY IT MATTERS (status screen)
    const sceneImp = () => {
      CX = 0; CY = 0;
      sky(C('#0c0a2a'), C('#e05c72'), 180); stars(40, 8, 0);
      cloud(((80 + T * 2) % 380) - 30, 136, 40, 2); cloud(((260 + T * 1.6) % 380) - 30, 128, 30, 2);
      mountains(152, 22, 0.018, 3.3, T * 2, P.mtFar, P.mtFarLit, 240);
      mountains(162, 14, 0.03, 8.1, T * 3, P.mtNear, P.mtNearLit, 240);
      { const sv = CY; CY = 0; rigSil(250, 172); CY = sv; }
      haze(146, 162, 0.36);
    };

    // ================= timeline =================
    // rig-tour camera keyframes: [t, cx, cy]
    const CAM = [[7.8, -40, 0], [10.3, -40, 0], [10.8, -24, 70], [12.9, -24, 70], [13.4, 48, 60], [15.9, 48, 60], [16.4, 20, 60], [18.1, 20, 60], [18.6, 40, 90], [20.5, 40, 90]];
    const camAt = (tt) => { for (let i = 1; i < CAM.length; i++) if (tt < CAM[i][0]) { const [t0, x0, y0] = CAM[i - 1], [t1, x1, y1] = CAM[i], k = H.ease.inOut(H.clamp((tt - t0) / (t1 - t0))); return [H.lerp(x0, x1, k), H.lerp(y0, y1, k)]; } const l = CAM[CAM.length - 1]; return [l[1], l[2]]; };
    const tdyAt = (tt) => tt < 8.4 ? 104 : tt < 9.4 ? H.lerp(104, 46, H.ease.inOut(prog(8.4, 9.4))) : tt < 9.7 ? 46 : tt < 10.6 ? H.lerp(46, 100, H.ease.inOut(prog(9.7, 10.6))) : H.lerp(100, 108, prog(10.6, 18.4));

    let headerFade = null; // a window drawn above the brightness fade (label that carries over)

    if (T < B.well) {
      // BEAT 1-2: dusk desert, rig on the horizon; camera sinks into the ground and the well is drilled to the trap
      const camY = 60 * H.ease.inOut(step(2.6, 3.5, 9));
      sceneSurface(camY, prog(3.0, 4.3), true);
      // the driller walks in (2-frame cycle) and stops by the rig
      const wk = prog(0.15, 1.0), walking = wk > 0 && wk < 1, dx = Math.round(-34 + 104 * wk);
      sprite(walking && Math.floor(T * 8) % 2 ? DRILLER_WALK : DRILLER, DRILLER_PAL, dx, G1 - 44 - (walking && Math.floor(T * 8) % 2 ? 1 : 0), false, 2);
      for (let x = dx + 4; x < dx + 26; x++) put(x, G1 + 1, P.K);
      // beat 2 labels + depth counter
      if (T >= 3.0) {
        const yb = Math.round(G1 + prog(3.0, 4.3) * (dome(WELLX) + 5 - G1));
        label('SUPERFICIE', 236, G1 - CY - 26, 3.1, gold, 8, [276, G1 - CY - 15, 284, G1 - CY - 2]);
        label('YACIMIENTO', 226, Math.round(dome(WELLX) + 26 - CY), 4.35, gold, 8, [222, Math.round(dome(WELLX) + 26 - CY), 206, yb - CY - 1]);
        win(8, 132, 124, 40); text('PROFUNDIDAD', 16, 137, cyan, ink);
        const m = Math.round(3000 * H.ease.inOut(prog(3.0, 4.3)) / 10) * 10;
        text(String(m).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' m', 16, 151, white, ink, 16);
      }
    } else if (T < B.roster) {
      // BEAT 3: party roster — the big 5 stamps on, then the five systems join one by one
      sceneRoster();
      const land = 5.35, k = T - land;
      if (T >= land) { const by = k < 1 / 12 ? -18 : k < 2 / 12 ? -6 : k < 3 / 12 ? 2 : 0; text('5', 16, 10 + by, gold, C('#7a4a2a'), 32, ink); }
      if (T >= 5.55) { text('SISTEMAS', 58, 12, white, ink, 16); text('EN CONJUNTO', 58, 32, cyan, ink); }
      if (winOpen(6, 50, 308, 124, 5.7) >= 1) {
        SYS.forEach((s, i) => {
          const t0 = 5.95 + i * 0.3; if (T < t0) return;
          const y = 58 + i * 23, kk = T - t0, dy = kk < 1 / 12 ? -4 : 0;
          const sel = T >= 7.25 && i === 0, blink = sel && T < 7.5 && Math.floor(T * 12) % 2 === 0;
          vsprite(ICON[s.id], ICON_PAL, 30, y + dy, false, 2);
          if (!(T >= 7.5 && i === 0)) text(s.name, 54, y + 2 + dy, blink ? white : sel ? gold : white, ink, 16);
        });
        if (T >= 7.1 && T < 7.5) hand(12 + (Math.floor(T * 6) % 2), 64);
      }
      // the chosen label rises into the header slot (it carries over the fade into the rig)
      if (T >= 7.5) { const k2 = step(7.5, 7.75, 5); headerFade = { name: 'IZAJE', icon: 'izaje', x: Math.round(H.lerp(30, 10, k2)), y: Math.round(H.lerp(58, 8, k2)), sub: null }; }
    } else if (T < B.kick) {
      // BEATS 4-8: one rig, camera travels from system to system
      const [cx, cy] = camAt(T), tdy = tdyAt(T);
      const rotOn = T >= 10.6 && T < 18.8, rot = rotOn ? Math.floor((T - 10.6) * 24) : 0;
      const beat = T < 10.55 ? 0 : T < 13.15 ? 1 : T < 16.15 ? 2 : T < 18.35 ? 3 : 4;
      const bStart = [7.8, 10.55, 13.15, 16.15, 18.35][beat];
      sceneRig({
        cx, cy, tdy, rot, drum: tdy * 0.9,
        flowK: prog(13.6, 15.0), flowOn: T >= 13.6 && T < 18.8,
        powK: prog(16.7, 17.4), kick: prog(18.9, 19.6), bopFlash: T >= 19.55 && T < 20.0, bopClosed: false,
        pitGain: T >= 18.9 ? Math.min(3, Math.floor((T - 18.9) * 5)) : 0, pumpPh: T >= 13.4 && T < 18.8 ? T * 8 : 0,
        focus: SYS[beat].id, focusK: T - bStart - 0.15,
      });
      const v = (x, y) => [Math.round(x - CX), Math.round(y - CY)];
      if (beat === 0) {
        const [bx, by] = v(RX - 6, tdy - 7), [dwx, dwy] = v(170, F - 7);
        label('BLOQUE VIAJERO', 92, 76, 8.5, gold, 8, [206, 80, bx - 1, by]);
        label('MALACATE', 120, dwy - 26, 9.1, gold, 8, [170, dwy - 15, dwx - 2, dwy - 4]);
      } else if (beat === 1) {
        const [tx, ty] = v(RX - 6, tdy + 7), [mx, my] = v(RX - 8, F - 1), [bx, by] = v(RX - 4, BIT - 2);
        label('TOP DRIVE', 243, ty + 12, 11.0, gold, 8, [256, ty + 7, tx + 13, ty + 2]);
        label('MESA ROTARIA', 112, my - 18, 11.5, gold, 8, [208, my - 8, mx, my]);
        // inset: the bit, big, turning against the rock
        const op = winOpen(8, 92, 108, 84, 11.9);
        if (op >= 1) {
          text('BARRENA', 20, 98, gold, ink);
          for (let y = 153; y < 172; y++) for (let x = 12; x < 112; x++) vput(x, y, ((x * 7 + y * 3) % 13 === 0) ? P.e2 : (y - 153 < 2 ? P.e0 : (0.5 > bay(x, y) ? P.e3 : P.e4)));
          for (let y = 108; y < 112; y++) { vput(58, y, P.s1); vput(59, y, P.s3); vput(60, y, P.s3); vput(61, y, P.s2); }
          vsprite(TRICONE[Math.floor(T * 8) % 2], TRICONE_PAL, 36, 111, false, 3);
          if (Math.floor(T * 12) % 2) { vput(30, 150, P.cut); vput(90, 148, P.cut); vput(26, 144, P.e1); vput(94, 142, P.e1); } else { vput(32, 146, P.e1); vput(88, 151, P.cut); vput(96, 145, P.cut); vput(24, 149, P.cut); }
          vsprite(PX_ARROW, { K: '#0a0618', Y: '#6ef0ff' }, 94, 118 + (Math.floor(T * 6) % 2), false);
          arrow(112, 162, bx - 3, by, prog(12.15, 12.4), gold);
        }
      } else if (beat === 2) {
        const [px, py] = v(PUMPX + 14, G - 14), [kx, ky] = v(286, G - 12), [lx, ly] = v(RX - 2, G + 20), [ux, uy] = v(RX + 3, G + 40), [sx, sy] = v(258, G - 26);
        label('LODO', 98, ly, 13.9, gold, 8, [135, ly + 4, lx - 1, ly + 4]);
        label('RECORTES', 176, uy, 14.5, C('#ffb08a'), 8, [171, uy + 4, ux + 1, uy - 6]);
        label('BOMBA', px - 20, py + 30, 14.1, gold, 8, [px, py + 25, px, py + 15]);
        label('PRESAS', kx - 50, ky + 28, 14.8, gold, 8, [kx - 26, ky + 23, kx - 26, ky + 13]);
      } else if (beat === 3) {
        const [gx, gy] = v(48, G - 16);
        label('MOTORES DIÉSEL', 32, gy - 38, 16.5, gold, 8, [gx + 10, gy - 28, gx + 10, gy - 12]);
        label('ELECTRICIDAD', 104, gy + 32, 17.0, C('#fff6c2'), 8, [150, gy + 27, 150, gy + 17]);
      } else {
        const [bx, by] = v(RX - 11, F + 12), [kx, ky] = v(RX + 5, BIT - 20);
        label('BOP', 100, by - 4, 18.65, C('#ff8a8a'), 16, [154, by + 4, bx - 1, by + 4]);
        if (T >= 18.95) pop('¡BROTE!', kx + 14, ky - 4, 18.95, red, C('#5a0814'), 16);
        const [qx, qy] = v(286, G - 16);
        label('GANANCIA EN PRESAS', 168, 50, 19.2, C('#ffb08a'), 8, [qx - 30, 59, qx - 30, qy - 2]);
      }
      // system header: name window that snaps open as the camera arrives
      const hdr = [
        { t0: 7.8, name: 'IZAJE', icon: 'izaje', sub: ['SUSPENDE Y MUEVE', 'LA SARTA'] },
        { t0: 10.55, name: 'ROTACIÓN', icon: 'rot', sub: ['HACE GIRAR LA SARTA', 'Y LA BARRENA'] },
        { t0: 13.15, name: 'CIRCULACIÓN', icon: 'circ', sub: ['EL LODO DA LA VUELTA'] },
        { t0: 16.15, name: 'POTENCIA', icon: 'pot', sub: ['DIÉSEL-ELÉCTRICA:', 'MUEVE TODO EL EQUIPO'] },
        { t0: 18.35, name: 'CONTROL DE POZO', icon: 'ctrl', sub: ['EL BOP SELLA EL POZO'] },
      ][beat];
      headerFade = { name: hdr.name, icon: hdr.icon, x: 10, y: 8, sub: T >= hdr.t0 + (beat === 0 ? 0.4 : 0.25) ? hdr.sub : null, n: beat + 1, open: beat === 0 ? 1 : step(hdr.t0, hdr.t0 + 0.25, 4) };
      if (T >= 19.0 && Math.floor(T * 6) % 2 === 0) for (let x = 0; x < LW; x++) { vput(x, 0, red); vput(x, LH - 1, red); } // alarm
    } else if (T < B.battle) {
      // BEAT 8b: battle — EL BROTE vs EL BOP
      sceneBattle();
      const atk = T >= 20.5 && T < 21.0 ? Math.round(Math.sin(prog(20.5, 21.0) * Math.PI) * 60) : 0;
      const sealed = T >= 21.6, knock = sealed ? Math.min(30, Math.round((T - 21.6) * 120)) : 0;
      const ex = 34 + atk - knock, ey = 50 + (sealed ? 8 : 0) + Math.round(Math.sin(T * 5) * 1);
      const shake = (T > 20.85 && T < 21.1) || (T > 21.6 && T < 21.85) ? (Math.floor(T * 24) % 2 ? 2 : -2) : 0;
      if (!(sealed && T < 22.0 && Math.floor(T * 12) % 2)) vsprite(BROTE, BROTE_PAL, ex, ey, false, sealed ? 3 : 4);
      for (let k = 0; k < 5; k++) { const ph = (T * 0.9 + k / 5) % 1; vput(ex + 10 + k * 9, ey - ph * 26, k % 2 ? P.r0 : P.y0); }
      win(16, 108, 72, 14); text('BROTE', 31, 111, red, ink);
      const dx = 232 + shake, dy = 30;
      vsprite(T >= 21.5 ? BOP_CLOSED : BOP_OPEN, BOP_PAL, dx, dy, false, 3);
      if (T >= 21.4 && T < 21.6) { vsprite(PX_ARROW, { K: '#0a0618', Y: '#fff6c2' }, dx - 10, dy + 22, false); vsprite(PX_ARROW, { K: '#0a0618', Y: '#fff6c2' }, dx + 45, dy + 22, true); }
      win(dx + 2, 90, 40, 14); text('BOP', dx + 10, 93, white, ink);
      // top message line
      const msg = T < 20.85 ? '¡EL BROTE SUBE POR EL POZO!' : T < 21.6 ? 'EL BOP CIERRA EL POZO...' : '¡POZO BAJO CONTROL!';
      win(6, 4, 308, 16); text(msg, 14, 8, T >= 21.6 ? green : white, ink);
      // command window + cursor
      win(4, 136, 136, 40);
      text('CERRAR BOP', 26, 144, T >= 21.1 ? gold : white, ink); text('MATAR POZO', 26, 160, grey, ink);
      if (T >= 21.1 && T < 21.6) hand(10 + (Math.floor(T * 6) % 2), 145);
      // status window: the well's HP drops when the kick hits, then holds and turns green once sealed
      win(144, 136, 172, 40); text('POZO', 152, 141, cyan, ink);
      const hp = T < 20.85 ? 1 : H.lerp(1, 0.45, step(20.85, 21.05, 3));
      const hpc = sealed ? green : T >= 20.85 && Math.floor(T * 12) % 2 ? white : (hp < 0.6 ? red : green);
      vrect(152, 155, 156, 8, ink); vrect(153, 156, Math.round(154 * hp), 6, hpc);
      if (sealed) pop('¡SELLADO!', 92, 64, 21.6, green, C('#0a4a2a'), 16);
      if (T >= 20.85 && T < 21.3) pop('¡DAÑO!', dx - 10, 64, 20.85, red, C('#5a0814'), 8);
      if (sealed && T >= 21.7) for (let k = 0; k < 6; k++) { const a = k * 1.05 + T * 3, rr = 26 + (Math.floor(T * 12) % 3) * 2, sx = dx + 21 + Math.cos(a) * rr, sy = dy + 27 + Math.sin(a) * rr * 0.8; vput(sx, sy, white); vput(sx - 1, sy, gold); vput(sx + 1, sy, gold); vput(sx, sy - 1, gold); vput(sx, sy + 1, gold); }
    } else if (T < B.types) {
      // BEAT 9: most rigs are rotary; land and three offshore variants rise into place
      sceneTypes([prog(23.55, 23.9), prog(24.05, 24.4), prog(24.55, 24.9), prog(25.05, 25.4)]);
      win(6, 4, 186, 34); text('LA MAYORÍA SON', 14, 9, white, ink); text('ROTATORIOS', 14, 20, gold, ink, 16);
      label('TERRESTRE', 8, 132, 23.85, gold);
      label('JACK-UP', 96, 162, 24.35, cyan);
      label('SEMISUMERGIBLE', 154, 46, 24.85, cyan);
      label('DRILLSHIP', 236, 88, 25.35, cyan);
      if (T >= 25.8) { label('MARINOS', 216, 162, 25.8, white); }
    } else if (T < B.imp) {
      // BEAT 10: why it matters — three stats, then one system fails and the whole rig stops
      sceneImp();
      win(6, 4, 290, 22); text('¿POR QUÉ IMPORTA?', 14, 9, white, ink, 16);
      const fail = T >= 28.9, chain = (i) => fail && (i === 3 || T >= 29.2 + Math.abs(i - 3) * 0.12);
      SYS.forEach((s, i) => {
        const x = 40 + i * 50, y = 32, hit = i === 3 && T >= 28.9 && T < 29.4 && Math.floor(T * 12) % 2 === 0;
        vsprite(ICON[s.id], chain(i) ? ICON_GREY : ICON_PAL, x + (hit ? (Math.floor(T * 24) % 2 ? 2 : -2) : 0), y, false, 2);
        vrect(x + 4, y + 21, 10, 3, chain(i) ? red : green);
      });
      if (fail && T < 29.6) pop('¡FALLA!', 160, 30, 28.9, red, C('#5a0814'), 8);
      win(6, 62, 308, 72);
      const rows = [
        { t0: 27.1, name: 'VEL. PENETRACIÓN', col: green, v: 0.85 },
        { t0: 27.5, name: 'SEGURIDAD', col: cyan, v: 0.9 },
        { t0: 27.9, name: 'COSTO DIARIO', col: gold, v: 0.35 },
      ];
      rows.forEach((r, i) => {
        if (T < r.t0) return; const y = 70 + i * 21;
        text(r.name, 14, y + 2, white, ink);
        let v = r.v * step(r.t0, r.t0 + 0.3, 4);
        if (i === 0 && T >= 29.3) v = r.v * (1 - step(29.3, 29.9, 6));
        if (i === 2 && T >= 29.3) v = Math.min(1, r.v + 0.65 * prog(29.3, 30.6));
        const flash = i === 1 && T >= 29.3 && Math.floor(T * 6) % 2 === 0;
        vrect(150, y, 156, 10, ink); vrect(151, y + 1, Math.max(0, Math.round(154 * v)), 8, i === 0 && T >= 29.3 ? red : flash ? red : r.col);
        if (i === 2 && T >= 29.3) for (let k = 0; k < Math.floor(prog(29.3, 30.6) * 4) + 1; k++) text('$', 160 + k * 12, y + 1, ink, null);
      });
      if (T >= 29.95) { const k = T - 29.95, sc = k < 1 / 12 ? -6 : 0; win(10, 140 + sc, 300, 34); text('TALADRO', 22, 145 + sc, red, C('#5a0814'), 16); text('PARALIZADO', 140, 145 + sc, red, C('#5a0814'), 16); text('SI UNO FALLA, SE DETIENE TODO', 22, 163 + sc, white, ink); }
    } else {
      // BEAT 11: takeaway, back at the rig at dusk
      sceneSurface(0, 1, false);
      sprite(DRILLER, DRILLER_PAL, 70, G1 - 44, false, 2);
      for (let x = 74; x < 96; x++) put(x, G1 + 1, P.K);
      const op = winOpen(6, 124, 308, 52, 31.3);
      if (op >= 1) {
        vrect(14, 132, 34, 36, C('#0a1040')); for (let i = 0; i < 34; i++) { vput(14 + i, 132, grey); vput(14 + i, 167, white); } for (let j = 0; j < 36; j++) { vput(14, 132 + j, grey); vput(47, 132 + j, white); }
        vsprite(DRILLER.slice(0, 10), DRILLER_PAL, 16, 140, false, 2);
        text('5 SISTEMAS,', 56, 134, white, ink, 16);
        text('UN SOLO EQUIPO', 56, 154, gold, ink, 16);
      }
    }
    // quest header (beats 1-2 and the takeaway): the question types out in the dialog, then snaps up into the corner
    if (T < B.well || T >= B.imp) {
      if (T < 2.4) {
        const up = prog(1.85, 2.3), s = Math.floor(up * 6) / 6, y0 = Math.round(H.lerp(126, 2, s)), h0 = Math.round(H.lerp(50, 14, s));
        win(6, y0, up > 0 ? Math.round(H.lerp(308, 192, s)) : 308, h0);
        if (up === 0) {
          vsprite(DRILLER.slice(0, 10), DRILLER_PAL, 14, 136, false, 2);
          const q1 = '¿QUÉ ES UN', q2 = 'TALADRO?';
          text(q1.slice(0, Math.floor(prog(0.35, 0.95) * q1.length)), 50, y0 + 9, white, ink, 16);
          text(q2.slice(0, Math.floor(prog(1.0, 1.4) * q2.length)), 50, y0 + 29, gold, ink, 16);
        } else text('TALADRO DE PERFORACIÓN', 12, y0 + 3, white, ink);
      } else { win(6, 2, 192, 14); text('TALADRO DE PERFORACIÓN', 12, 5, white, ink); }
      if (T >= 2.6 && T < B.well) { const op = winOpen(8, 66, 168, 32, 2.65); if (op >= 1) { text('CONSTRUYE EL POZO', 16, 71, white, ink); text('HASTA EL YACIMIENTO', 16, 84, white, ink); } }
    }

    // ---------------- SNES transitions ----------------
    const mosaic = (n) => { if (n <= 1) return; for (let by = 0; by < LH; by += n) for (let bx = 0; bx < LW; bx += n) { const sx = Math.min(LW - 1, bx + (n >> 1)), sy = Math.min(LH - 1, by + (n >> 1)), si = (sy * LW + sx) * 4; for (let y = by; y < Math.min(LH, by + n); y++) for (let x = bx; x < Math.min(LW, bx + n); x++) { const i = (y * LW + x) * 4; buf[i] = buf[si]; buf[i + 1] = buf[si + 1]; buf[i + 2] = buf[si + 2]; } } };
    const bright = (lvl) => { if (lvl >= 15) return; for (let i = 0; i < buf.length; i += 4) { buf[i] = buf[i] * lvl / 15; buf[i + 1] = buf[i + 1] * lvl / 15; buf[i + 2] = buf[i + 2] * lvl / 15; } };
    const iris = (k, cx, cy) => { const R = Math.round(k * 200); for (let y = 0; y < LH; y++) for (let x = 0; x < LW; x++) if ((x - cx) ** 2 + (y - cy) ** 2 > R * R) { const i = (y * LW + x) * 4; buf[i] = buf[i + 1] = buf[i + 2] = 0; } };
    bright(Math.min(15, Math.floor(T / 0.45 * 15))); // 16-step master-brightness fade-in at the very start
    if (T >= 4.7 && T < 5.3) mosaic(Math.round(16 - Math.abs(T - 5.0) / 0.3 * 15));
    if (T >= 7.5 && T < 8.1) bright(Math.round(Math.abs(T - 7.8) / 0.3 * 15));
    if (T >= 19.7 && T < 20.3) { // wavy battle swirl
      const k = 1 - Math.abs(T - 20.0) / 0.3, src = buf.slice();
      for (let y = 0; y < LH; y++) { const off = Math.round(Math.sin(y * 0.25 + T * 30) * k * 40); for (let x = 0; x < LW; x++) { const sx = ((x + off) % LW + LW) % LW, si = (y * LW + sx) * 4, i = (y * LW + x) * 4; for (let c = 0; c < 3; c++) buf[i + c] = src[si + c] + (255 - src[si + c]) * k * 0.6; } }
    }
    if (T >= 22.9 && T < 23.5) iris(Math.abs(T - 23.2) / 0.3, T < 23.2 ? 253 : 160, T < 23.2 ? 57 : 100);
    if (T >= 26.3 && T < 26.9) bright(Math.round(Math.abs(T - 26.6) / 0.3 * 15));
    if (T >= 30.7 && T < 31.3) mosaic(Math.round(16 - Math.abs(T - 31.0) / 0.3 * 15));
    // flashes on the hits
    const flash = (amt) => { for (let i = 0; i < buf.length; i += 4) { buf[i] = Math.min(255, buf[i] + amt[0]); buf[i + 1] = Math.min(255, buf[i + 1] + amt[1]); buf[i + 2] = Math.min(255, buf[i + 2] + amt[2]); } };
    if (T >= 20.85 && T < 20.95) flash([120, 30, 30]);
    if (T >= 21.6 && T < 21.7) flash([150, 150, 150]);
    if (T >= 28.9 && T < 29.0) flash([120, 30, 30]);
    if (T >= 5.35 && T < 5.45) flash([90, 80, 40]);

    // header windows that ride above the fades (the IZAJE label carries over from the roster into the rig)
    if (headerFade) {
      const hf = headerFade, nw = textW(hf.name, 16), subW = hf.sub ? Math.max(...hf.sub.map((s) => textW(s))) : 0, w = Math.max(nw + 32, subW + 16), op = hf.open == null ? 1 : hf.open;
      if (op > 0) {
        const h = 24 + (hf.sub ? hf.sub.length * 11 + 2 : 0), bh = Math.max(4, Math.round(h * op));
        win(hf.x - 4, hf.y - 4 + Math.round((h - bh) / 2), w, bh);
        if (op >= 1) {
          vsprite(ICON[hf.icon], ICON_PAL, hf.x, hf.y - 1, false, 2);
          text(hf.name, hf.x + 22, hf.y + 1, gold, ink, 16);
          if (hf.sub) hf.sub.forEach((s, i) => text(s, hf.x + 2, hf.y + 22 + i * 11, white, ink));
        }
      }
    }

    const lc = H.layer(LW, LH), lx = lc.getContext('2d');
    lx.putImageData(new ImageData(buf, LW, LH), 0, 0);
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(lc, 0, 0, W, H_); ctx.restore();
  }


  // ================= sound: SNES chip palette =================
  // The picture runs on a 12 fps game tick (T = floor(t*12)/12), so the cues walk the same ticks and re-evaluate the
  // same expressions as explainer(): every sound starts on the tick its event first shows. tk(t0) = first tick >= t0.
  function scoreSound(k) {
    const FPS = 12, END = DURATION;
    const tk = (t0) => Math.ceil(t0 * FPS - 1e-6) / FPS;
    const prog = (T, a, b) => H.clamp((T - a) / (b - a));
    const sq = (t, f, dur, gain, pan) => k.tone(t, { f, type: 'square', dur, gain, a: 0.001, hold: dur * 0.6, pan });
    const tri = (t, f, dur, gain, pan) => k.tone(t, { f, type: 'triangle', dur, gain, a: 0.002, hold: dur * 0.6, pan });
    const crash = (t, dur, gain) => k.noise(t, { dur, filter: 'lowpass', f: 3200, gain, rate: 0.25, a: 0.001 }); // NES-style noise channel
    const pan = (x) => H.clamp((x - 160) / 160, -0.8, 0.8); // view x -> stereo
    // a label lands (pop) and its arrow completes (short high blip) 0.33 s later
    const label = (t0, x, arrow = true) => { k.play('pop', tk(t0), { f: 760, gain: 0.5, pan: pan(x) }); if (arrow) k.withMinor(() => sq(tk(t0 + 0.33), 'E6', 0.035, 0.028, pan(x))); };
    const panSwish = (t) => k.noise(t, { dur: 0.5, filter: 'bandpass', f: [[0, 300], [0.25, 1500], [0.5, 320]], q: 1.2, gain: 0.1, rate: 0.3, a: 0.2 });

    // ---- music (chip), each section stops for the transition or the hit that ends it
    k.music('chip', 0, 2.4, { bpm: 100, gain: 0.28, chords: [['C4', 'E4', 'G4', 'B4']] });
    k.music('chip', 2.4, 4.7, { bpm: 240 / 2.3, gain: 0.3, chords: [['A3', 'C4', 'E4', 'G4']] });
    k.music('chip', tk(5.35), 7.5, { bpm: 112, gain: 0.38, chords: [['F3', 'A3', 'C4', 'E4'], ['G3', 'B3', 'D4', 'G4']] });
    k.music('chip', 8.1, 18.9, { bpm: 120, gain: 0.26, chords: [['C4', 'E4', 'G4', 'B4'], ['A3', 'C4', 'E4', 'G4'], ['F3', 'A3', 'C4', 'E4'], ['G3', 'B3', 'D4', 'F4']] });
    k.music('chip', 20.3, 22.9, { bpm: 150, gain: 0.45, chords: [['A3', 'C4', 'E4', 'A4'], ['F3', 'A3', 'C4', 'F4']] });
    k.music('chip', 23.5, 26.3, { bpm: 110, gain: 0.3, chords: [['F3', 'A3', 'C4', 'E4'], ['G3', 'B3', 'D4', 'G4']] });
    k.music('chip', 26.9, 28.9, { bpm: 120, gain: 0.28, chords: [['C4', 'E4', 'G4', 'B4']] });
    k.music('chip', tk(31.55), END, { bpm: 140, gain: 0.32, chords: [['C4', 'E4', 'G4', 'C5']] });
    // ---- ambience beds: desert wind at the surface, rig noise in the tour, swell at sea
    k.bed('room', 0, 4.8, { gain: 0.7 }); k.bed('room', 7.9, 20.0, { gain: 0.8 }); k.bed('room', 31.0, END, { gain: 0.7 });
    for (let t = 23.3; t < 26.4; t += 1.1) k.noise(t, { dur: 1.4, color: 'pink', filter: 'lowpass', f: [[0, 380], [0.7, 1300], [1.4, 300]], gain: 0.07, a: 0.6, bus: 'amb' });
    // rotation: top-drive hum while the string turns (10.6 - 18.8)
    k.tone(10.6, { f: 55, type: 'sawtooth', dur: 8.3, gain: 0.045, a: 0.25, hold: 7.7, filter: 'lowpass', f2: 380, bus: 'amb' });
    // power: diesel rumble under the power beat
    k.noise(16.2, { dur: 2.7, color: 'brown', filter: 'lowpass', f: 200, gain: 0.22, a: 0.3, hold: 2.0, bus: 'amb' });
    k.tone(16.2, { f: 38, type: 'sawtooth', dur: 2.7, gain: 0.05, a: 0.3, hold: 2.0, filter: 'lowpass', f2: 260, bus: 'amb' });

    // ---- per-tick state machine (mirrors explainer)
    const prev = new Map();
    const edge = (key, v, fn) => { const p = prev.has(key) ? prev.get(key) : v === 0 ? 0 : -1e9; if (v !== p) fn(v, p); prev.set(key, v); };
    const UP = ['C5', 'E5', 'G5', 'C6'];
    const winSteps = (key, T, t0, notes = UP, g = 0.1) => edge(key, Math.floor(prog(T, t0, t0 + 0.25) * 4), (v, p) => { if (v > p && v >= 1) k.withMinor(() => tri(T, notes[v - 1], 0.06, g)); });
    const Q1 = '¿QUÉ ES UN', Q2 = 'TALADRO?';
    for (let f = 0; f <= END * FPS; f++) {
      const T = f / FPS;
      // beat 1: the driller's footsteps (each time the walk frame comes up)
      const wk = prog(T, 0.15, 1.0), stepOn = wk > 0 && wk < 1 && Math.floor(T * 8) % 2 === 1 ? 1 : 0;
      edge('walk', stepOn, (v) => { if (v) k.play('tock', T, { f: 240, gain: 0.3, pan: -0.6 + wk * 0.4, minor: true }); });
      // dialog prints (chip text blips, one per glyph)
      edge('q1', Math.floor(prog(T, 0.35, 0.95) * Q1.length), (v, p) => { if (v > p && p >= 0) k.play('text', T, { n: v - p, rate: 0.035, gain: 1.1, minor: true }); });
      edge('q2', Math.floor(prog(T, 1.0, 1.4) * Q2.length), (v, p) => { if (v > p && p >= 0) k.play('text', T, { n: v - p, rate: 0.035, gain: 1.1, minor: true }); });
      // the window slides up into the quest header in 6 steps
      edge('up', Math.floor(prog(T, 1.85, 2.3) * 6), (v, p) => { if (v > p && v >= 1) k.withMinor(() => tri(T, ['G4', 'A4', 'C5', 'D5', 'E5', 'G5'][v - 1], 0.05, 0.12)); });
      // beat 2: camera sinks into the ground in 9 whole-pixel steps
      edge('sink', Math.floor(prog(T, 2.6, 3.5) * 9), (v, p) => { if (v > p && v >= 1) k.withMinor(() => tri(T, 330 * Math.pow(2, -v / 9), 0.06, 0.1, 0.2)); });
      winSteps('cap', T, 2.65);
      // drilling: a grinding chip crunch per tick while the bit cuts; the depth counter ticks, slowing as it settles
      if (T >= 3.0 && T < 4.3) k.withMinor(() => k.noise(T, { dur: 0.05, filter: 'bandpass', f: 500 + (f % 3) * 140, q: 2, gain: 0.12, rate: 0.4, pan: 0.25 }));
      if (T >= 3.0 && T <= 4.34) {
        const m = Math.round(3000 * H.ease.inOut(prog(T, 3.0, 4.3)) / 10) * 10, gap = prog(T, 3.0, 4.3) > 0.8 ? 2 : 1;
        if (m > (prev.get('m') || 0)) {
          if (m >= 3000) k.play('coin', T, { gain: 0.9, pan: -0.5 });
          else if (f - (prev.get('mt') || -9) >= gap) { k.withMinor(() => sq(T, 900 + 900 * prog(T, 3.0, 4.3), 0.022, 0.03, -0.5)); prev.set('mt', f); }
          prev.set('m', m);
        }
      }
      // mosaics (4.7-5.3 and 30.7-31.3): one square step per tick, pitch falls as blocks grow and rises as they shrink
      for (const c of [5.0, 31.0]) if (T >= c - 0.3 && T < c + 0.3) { const n = Math.round(16 - Math.abs(T - c) / 0.3 * 15); if (n > 1) sq(T, 1500 / Math.sqrt(n), 0.075, 0.036); }
      // beat 3: party window opens, then the five members join one by one (rising notes)
      winSteps('party', T, 5.7);
      for (let i = 0; i < 5; i++) edge('row' + i, T >= 5.95 + i * 0.3 ? 1 : 0, (v) => { if (v) { k.play('blip', T, { f: ['C5', 'E5', 'G5', 'B5', 'D6'][i], dur: 0.08, gain: 1.1 }); k.withMinor(() => tri(T, ['C4', 'E4', 'G4', 'B4', 'D5'][i], 0.12, 0.12)); } });
      // the IZAJE label rises to the header slot (5 steps)
      edge('rise', Math.floor(prog(T, 7.5, 7.75) * 5), (v, p) => { if (v > p && v >= 1) k.withMinor(() => tri(T, ['C5', 'D5', 'E5', 'G5', 'A5'][v - 1], 0.05, 0.11)); });
      // system headers snap open as the camera arrives; their subtitle prints
      [10.55, 13.15, 16.15, 18.35].forEach((t0, i) => winSteps('hdr' + i, T, t0));
      // izaje: the drawworks drum turns while the block travels -> cable clicks every tick
      const moving = (T > 8.4 && T < 9.4) || (T > 9.7 && T < 10.6);
      if (moving) k.withMinor(() => k.play('tick', T, { f: 2600, gain: 0.3, pan: 0.2 }));
      // rotation: rotary table tick every 3 ticks during the rotation beat
      if (T >= 10.6 && T < 13.2 && f % 3 === 0) k.play('tock', T, { f: 520, gain: 0.12, pan: 0.3, minor: true });
      winSteps('inset', T, 11.9, ['G4', 'B4', 'D5', 'G5']);
      if (T >= 12.17 && T < 13.15 && f % 2 === 0) k.withMinor(() => k.noise(T, { dur: 0.06, color: 'brown', filter: 'lowpass', f: 900, gain: 0.25, pan: -0.5 })); // rock crunch in the inset
      // circulation: triplex pump thumps (13.4 - 18.8), bubbles while the mud stream draws on, shaker rattle
      if (T >= 13.4 && T < 18.8 && Math.floor(T / 0.375) !== Math.floor((T - 1 / FPS) / 0.375)) k.play('thud', T, { f: 75, gain: 0.2, pan: 0.6 });
      if (T >= 13.6 && T < 15.0) k.withMinor(() => k.noise(T, { dur: 0.06, filter: 'bandpass', f: 380 + ((f * 37) % 7) * 90, q: 6, gain: 0.14, pan: -0.3 + prog(T, 13.6, 15.0) * 0.8 }));
      if (T >= 13.6 && T < 16.2 && f % 2 === 1) k.play('tick', T, { f: 5200, gain: 0.12, pan: 0.4, minor: true });
      // power: sparks crackle while they run along the cables
      if (T >= 16.7 && T < 17.4) k.withMinor(() => k.noise(T, { dur: 0.03, filter: 'highpass', f: 3500, gain: 0.16 + 0.1 * ((f * 13) % 3), pan: -0.4 + ((f * 7) % 5) * 0.2 }));
      // control: alarm (two-tone square) from the kick until the swirl
      if (T >= 19.0 && T < 19.7) edge('alarm', Math.floor(T * 6) % 2, (v) => sq(T, v ? 'E5' : 'A5', 0.15, 0.045));
      // battle: well HP drops in 3 steps
      edge('hp', Math.floor(prog(T, 20.85, 21.05) * 3), (v, p) => { if (v > p && v >= 1) k.withMinor(() => sq(T, ['E4', 'C4', 'A3'][v - 1], 0.06, 0.05, 0.5)); });
      // types: each rig starts rising (short square sweep) and lands with its label
      [23.55, 24.05, 24.55, 25.05].forEach((t0, i) => edge('rig' + i, T >= t0 ? 1 : 0, (v) => { if (v) k.tone(T, { f: [[0, 160 + i * 40], [0.3, 520 + i * 80]], type: 'square', dur: 0.32, gain: 0.035, a: 0.01, hold: 0.2, pan: pan(40 + i * 78) }); }));
      // importance: stat bars fill in 4 steps (stat-up blips), then drain / overflow after the failure
      [27.1, 27.5, 27.9].forEach((t0, i) => edge('bar' + i, Math.floor(prog(T, t0, t0 + 0.3) * 4), (v, p) => { if (v > p && v >= 1) k.withMinor(() => sq(T, ['C5', 'E5', 'G5', 'C6'][v - 1] , 0.06, 0.045, 0.2)); }));
      [29.2, 29.32, 29.44, 29.56].forEach((t0, i) => edge('grey' + i, T >= t0 ? 1 : 0, (v) => { if (v && i > 0) sq(T, ['E5', 'C5', 'A4'][i - 1], 0.08, 0.05, -0.3 + i * 0.15); }));
      edge('drain', Math.floor(prog(T, 29.3, 29.9) * 6), (v, p) => { if (v > p && v >= 1) k.withMinor(() => sq(T, 660 * Math.pow(2, -v / 4), 0.05, 0.04, 0.3)); });
      edge('cash', T >= 29.3 ? Math.floor(prog(T, 29.3, 30.6) * 4) + 1 : 0, (v, p) => { if (v > p && v >= 1 && v <= 4) k.play('coin', T, { gain: 0.45, pan: 0.5 }); });
      // takeaway window opens in steps
      winSteps('take', T, 31.3, ['C5', 'E5', 'G5', 'G5']);
    }

    // ---- one-off cues
    k.play('select', 0.02, { gain: 0.6, minor: true });                       // dialog window on screen
    // beat 2
    k.noise(3.0, { dur: 1.35, color: 'brown', filter: 'bandpass', f: 140, q: 1.2, gain: 0.3, a: 0.1, hold: 1.0, pan: 0.25 }); // drilling rumble
    label(3.1, 276); label(4.35, 222);
    k.play('text', tk(2.65 + 0.25), { n: 6, rate: 0.04, gain: 0.9, minor: true });          // caption prints
    // beat 3: the 5 stamps on (the biggest hit) with a held chord
    const FIVE = tk(5.35);
    k.play('impact', FIVE, { gain: 1.3 }); crash(FIVE, 0.4, 0.2);
    ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => sq(FIVE + 0.02 * i, n, 0.7, 0.035)); tri(FIVE, 'C3', 0.9, 0.25);
    k.play('text', tk(5.55), { n: 5, rate: 0.03, gain: 0.8, minor: true });                // SISTEMAS / EN CONJUNTO
    k.play('blip', tk(7.1), { f: 'A5', dur: 0.04, gain: 0.8, pan: -0.8 });                // cursor
    k.play('select', tk(7.25), { gain: 1.1, pan: -0.5 });                                    // IZAJE chosen
    // beat 4: hoist (rising drum whine) and lower (falling)
    k.play('text', tk(8.2), { n: 6, rate: 0.04, gain: 0.8, minor: true });
    k.tone(tk(8.4), { f: [[0, 150], [1.0, 420]], type: 'square', dur: 1.0, gain: 0.05, a: 0.05, hold: 0.85, filter: 'lowpass', f2: 900, pan: 0.3 });
    k.tone(tk(9.7), { f: [[0, 420], [0.9, 150]], type: 'square', dur: 0.9, gain: 0.04, a: 0.05, hold: 0.75, filter: 'lowpass', f2: 900, pan: 0.3 });
    label(8.5, 150); label(9.1, 150);
    // camera travels between systems
    [10.3, 12.9, 15.9, 18.1].forEach((t) => panSwish(t));
    [10.55, 13.15, 16.15, 18.35].forEach((t0) => k.play('text', tk(t0 + 0.25), { n: 6, rate: 0.04, gain: 0.8, minor: true }));
    // beat 5
    label(11.0, 280); label(11.5, 160); k.withMinor(() => sq(tk(12.4), 'G6', 0.05, 0.03, 0.4)); // inset arrow lands on the bit
    // beat 6: the mud circuit closes
    label(13.9, 115); label(14.1, 290); label(14.5, 210); label(14.8, 200);
    k.play('ding', tk(15.0), { f: 'C6', gain: 0.55, pan: 0.2 });
    // beat 7: power on
    label(16.5, 90); label(17.0, 150);
    k.play('neon', tk(16.7), { dur: 0.7, gain: 0.45, pan: 0.2 });
    k.play('powerup', tk(17.4), { gain: 0.8 });
    // beat 8: BOP label, the kick rises, ¡BROTE!, pit gain
    label(18.65, 130);
    k.noise(tk(18.9), { dur: 0.75, filter: 'bandpass', f: [[0, 220], [0.7, 1500]], q: 3, gain: 0.2, a: 0.1, hold: 0.5, pan: 0.1 });
    for (let i = 0; i < 6; i++) tri(tk(18.9) + i * 0.11, 160 * Math.pow(1.18, i), 0.07, 0.12, 0.1);    // gas bubbles glug upward
    k.play('stamp', tk(18.95), { gain: 0.9, pan: 0.3 }); sq(tk(18.95), 'D3', 0.2, 0.05, 0.3);
    label(19.2, 250);
    // wavy battle swirl 19.7-20.3 (peak 20.0): warbling square + grainy noise sweep, crash on the cut
    for (let f = Math.ceil(19.7 * FPS); f < 20.3 * FPS; f++) { const T = f / FPS, kk = 1 - Math.abs(T - 20.0) / 0.3; sq(T, 300 + kk * 900 * (f % 2 ? 1 : 1.26), 0.07, 0.04 + kk * 0.02); }
    k.noise(19.7, { dur: 0.6, filter: 'bandpass', f: [[0, 400], [0.3, 3000], [0.6, 500]], q: 1.4, gain: 0.14, rate: 0.3, a: 0.28 });
    crash(tk(20.05), 0.3, 0.12);
    // battle
    k.play('text', tk(20.3), { n: 8, rate: 0.035, gain: 0.9, minor: true });                // "¡EL BROTE SUBE POR EL POZO!"
    k.noise(tk(20.5), { dur: 0.3, filter: 'bandpass', f: [[0, 300], [0.3, 1800]], q: 1, gain: 0.16, rate: 0.4, a: 0.2, pan: -0.3 }); // lunge
    const HIT = tk(20.85);
    k.play('hurt', HIT, { gain: 1.3, pan: 0.5 }); crash(HIT, 0.35, 0.22); k.play('error', HIT + 0.3, { gain: 0.8 });
    k.play('text', tk(20.85) + 0.5, { n: 6, rate: 0.035, gain: 0.8, minor: true });         // "EL BOP CIERRA EL POZO..."
    k.play('blip', tk(21.1), { f: 'A5', dur: 0.04, gain: 0.9, pan: -0.7 });               // cursor on CERRAR BOP
    k.play('select', tk(21.4), { gain: 1.1, pan: -0.6 });                                 // command chosen
    k.tone(tk(21.4), { f: [[0, 260], [0.2, 900]], type: 'square', dur: 0.2, gain: 0.04, a: 0.01, hold: 0.15, pan: 0.2 });   // rams drive in
    k.tone(tk(21.4), { f: [[0, 330], [0.2, 1100]], type: 'square', dur: 0.2, gain: 0.04, a: 0.01, hold: 0.15, pan: 0.9 });
    const SEAL = tk(21.6); // emphasis: the rams meet, the well is sealed
    k.play('impact', SEAL, { gain: 1.4, pan: 0.5 }); k.play('stamp', SEAL, { gain: 0.8, pan: 0.5 }); crash(SEAL, 0.25, 0.2);
    ['G5', 'C6', 'E6'].forEach((n, i) => sq(SEAL + 0.08 + i * 0.06, n, 0.07, 0.06)); sq(SEAL + 0.26, 'G6', 0.45, 0.05); tri(SEAL + 0.08, 'C4', 0.6, 0.18);
    k.play('sparkle', tk(21.7), { n: 7, gain: 0.8 });
    // iris: closes on the BOP (sweep down), opens on the world (sweep up)
    k.tone(tk(22.9), { f: [[0, 1400], [0.27, 160]], type: 'square', dur: 0.28, gain: 0.042, a: 0.002, hold: 0.2, pan: 0.5 });
    k.tone(tk(23.2), { f: [[0, 160], [0.27, 1400]], type: 'square', dur: 0.28, gain: 0.042, a: 0.002, hold: 0.2 });
    k.play('text', tk(23.45), { n: 6, rate: 0.035, gain: 0.8, minor: true });
    // types: labels land with each rig, notes climbing from land to deep water
    [[23.85, 40, 'C5'], [24.35, 115, 'E5'], [24.85, 200, 'G5'], [25.35, 275, 'C6']].forEach(([t0, x, n]) => { label(t0, x, false); k.play('blip', tk(t0), { f: n, dur: 0.1, gain: 1, pan: pan(x) }); });
    label(25.8, 240, false); k.play('select', tk(25.8), { gain: 0.6, pan: 0.5 });
    // importance
    k.play('text', tk(26.95), { n: 8, rate: 0.035, gain: 0.8, minor: true });
    [27.1, 27.5, 27.9].forEach((t0) => k.play('text', tk(t0), { n: 3, rate: 0.03, gain: 0.7, minor: true }));
    const FAIL = tk(28.9);
    k.play('hurt', FAIL, { gain: 1.4, pan: 0.2 }); crash(FAIL, 0.4, 0.22);
    k.tone(tk(29.3), { f: [[0, 400], [1.1, 55]], type: 'square', dur: 1.1, gain: 0.045, a: 0.01, hold: 0.6, filter: 'lowpass', f2: 1200 }); // the rig powers down
    const STAMP = tk(29.95);
    k.play('stamp', STAMP, { gain: 1.2 }); k.play('buzz', STAMP, { f: 70, dur: 0.5, gain: 0.9 });
    // takeaway lands: resolving chip cadence (B -> C over a C bass), soft sparkle
    const TAKE = tk(31.55);
    sq(TAKE, 'B5', 0.08, 0.055); sq(TAKE + 0.08, 'C6', 0.8, 0.055); sq(TAKE + 0.08, 'G5', 0.8, 0.03); tri(TAKE, 'C4', 0.9, 0.22);
    k.play('sparkle', TAKE + 0.12, { n: 5, gain: 0.5 });
  }

  window.TALADRO = { explainer, scoreSound, DURATION, LW, LH };
})();
