// Real polyhedral dice rendered on a 2D canvas: no dependency, no CDN, offline-safe.
// An icosahedron (d20) and a cube (d6) rotate in space under drag, so the silhouette and
// the set of faces toward the viewer genuinely change. Motion is presentation only; the
// unbiased crypto roll still decides the result. spinTo() lands the rolled face toward the
// viewer, so a shown landing agrees with the selected face.

// --- quaternion helpers (q = [x,y,z,w]) -------------------------------------------------
const qMul = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];
const qConj = q => [-q[0], -q[1], -q[2], q[3]];
const qNorm = q => { const n = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0] / n, q[1] / n, q[2] / n, q[3] / n]; };
const qAxisAngle = (ax, angle) => { const h = angle / 2, s = Math.sin(h); return [ax[0] * s, ax[1] * s, ax[2] * s, Math.cos(h)]; };
function qRotate(q, v) {
  // v' = q * (v,0) * q^-1, expanded.
  const [x, y, z, w] = q;
  const tx = 2 * (y * v[2] - z * v[1]);
  const ty = 2 * (z * v[0] - x * v[2]);
  const tz = 2 * (x * v[1] - y * v[0]);
  return [
    v[0] + w * tx + (y * tz - z * ty),
    v[1] + w * ty + (z * tx - x * tz),
    v[2] + w * tz + (x * ty - y * tx),
  ];
}
function toAxisAngle(q) {
  let [x, y, z, w] = qNorm(q);
  if (w < 0) { x = -x; y = -y; z = -z; w = -w; } // shortest arc
  const angle = 2 * Math.acos(Math.min(1, Math.max(-1, w)));
  const s = Math.sqrt(Math.max(0, 1 - w * w));
  return s < 1e-6 ? { axis: [0, 1, 0], angle: 0 } : { axis: [x / s, y / s, z / s], angle };
}

// --- vector helpers ---------------------------------------------------------------------
const vSub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const vCross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vDot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const vLen = a => Math.hypot(a[0], a[1], a[2]);
const vUnit = a => { const l = vLen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const vScale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const vAdd3 = (a, b, c) => [a[0] + b[0] + c[0], a[1] + b[1] + c[1], a[2] + b[2] + c[2]];

// --- geometry builders ------------------------------------------------------------------
// Faces are vertex-index triples/quads, oriented so the right-hand normal points outward.
function orientOutward(verts, idx) {
  const pts = idx.map(i => verts[i]);
  const center = pts.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]).map(x => x / pts.length);
  const n = vCross(vSub(pts[1], pts[0]), vSub(pts[2], pts[0]));
  return vDot(n, center) < 0 ? [...idx].reverse() : idx;
}

function buildIcosahedron() {
  const phi = (1 + Math.sqrt(5)) / 2;
  const raw = [
    [0, 1, phi], [0, 1, -phi], [0, -1, phi], [0, -1, -phi],
    [1, phi, 0], [1, -phi, 0], [-1, phi, 0], [-1, -phi, 0],
    [phi, 0, 1], [phi, 0, -1], [-phi, 0, 1], [-phi, 0, -1],
  ];
  const r = vLen(raw[0]);
  const verts = raw.map(v => vScale(v, 1 / r)); // unit sphere
  // Edge = the minimum distance between distinct vertices.
  let edge = Infinity;
  for (let i = 0; i < verts.length; i++) for (let j = i + 1; j < verts.length; j++) edge = Math.min(edge, vLen(vSub(verts[i], verts[j])));
  const isEdge = (i, j) => Math.abs(vLen(vSub(verts[i], verts[j])) - edge) < 1e-6;
  const faces = [];
  for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) for (let k = j + 1; k < 12; k++)
    if (isEdge(i, j) && isEdge(j, k) && isEdge(i, k)) faces.push(orientOutward(verts, [i, j, k]));
  return { verts, faces }; // 20 faces for a valid icosahedron
}

function buildCube() {
  const s = 1 / Math.sqrt(3); // unit circumradius, matches the d20 scale
  const verts = [];
  for (const x of [-s, s]) for (const y of [-s, s]) for (const z of [-s, s]) verts.push([x, y, z]);
  const at = (x, y, z) => verts.findIndex(v => v[0] === x && v[1] === y && v[2] === z);
  const faces = [
    [at(-s, -s, s), at(s, -s, s), at(s, s, s), at(-s, s, s)],   // +z
    [at(s, -s, -s), at(-s, -s, -s), at(-s, s, -s), at(s, s, -s)], // -z
    [at(s, -s, s), at(s, -s, -s), at(s, s, -s), at(s, s, s)],   // +x
    [at(-s, -s, -s), at(-s, -s, s), at(-s, s, s), at(-s, s, -s)], // -x
    [at(-s, s, s), at(s, s, s), at(s, s, -s), at(-s, s, -s)],   // +y
    [at(-s, -s, -s), at(s, -s, -s), at(s, -s, s), at(-s, -s, s)], // -y
  ].map(idx => orientOutward(verts, idx));
  return { verts, faces };
}

function faceCentroidNormal(verts, idx) {
  const pts = idx.map(i => verts[i]);
  const centroid = pts.reduce((a, p) => [a[0] + p[0], a[1] + p[1], a[2] + p[2]], [0, 0, 0]).map(x => x / pts.length);
  const normal = vUnit(vCross(vSub(pts[1], pts[0]), vSub(pts[2], pts[0])));
  return { centroid, normal: vDot(normal, centroid) < 0 ? vScale(normal, -1) : normal };
}

// Assign die numbers so opposite faces sum to (sides+1), as on a real die.
function numberFaces(verts, faces, sides) {
  const info = faces.map((idx, i) => ({ i, ...faceCentroidNormal(verts, idx) }));
  const numbers = new Array(faces.length).fill(0);
  const used = new Array(faces.length).fill(false);
  let n = 1;
  for (const f of info) {
    if (used[f.i]) continue;
    // Find the antipodal face (normal closest to -f.normal).
    let opp = -1, best = -Infinity;
    for (const g of info) if (!used[g.i] && g.i !== f.i) { const d = vDot(g.normal, vScale(f.normal, -1)); if (d > best) { best = d; opp = g.i; } }
    numbers[f.i] = n; used[f.i] = true;
    if (opp >= 0) { numbers[opp] = sides + 1 - n; used[opp] = true; }
    n++;
  }
  return numbers;
}

const PALETTES = {
  20: { face: [78, 54, 95], edge: '#d9c99c', ink: '#efd79c', inkBack: '#2c2240' },   // plum / gold
  6: { face: [233, 226, 206], edge: '#2d2341', ink: '#1a3350', inkBack: '#1a3350' }, // cream / navy
};
const LIGHT = vUnit([-0.35, -0.65, 0.75]);
// Numbers are laid out at a fixed text size, then scaled into world units per face.
const TEXT_PX = 100;
const TEXT_FONT = `600 ${TEXT_PX}px Georgia, "Times New Roman", serif`;
const FILL = { 20: 0.88, 6: 0.6 }; // share of the largest centred fit the number's ink box takes

function shade(rgb, k) {
  const c = rgb.map(v => Math.round(Math.min(255, Math.max(0, v * k))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

export function createDie(canvas, { sides = 20 } = {}) {
  const geom = sides === 6 ? buildCube() : buildIcosahedron();
  const numbers = numberFaces(geom.verts, geom.faces, sides);
  const faceData = geom.faces.map((idx, i) => ({ idx, number: numbers[i], ...faceCentroidNormal(geom.verts, idx) }));
  const byNumber = new Map(faceData.map(f => [f.number, f]));
  const palette = PALETTES[sides] || PALETTES[20];
  const ctx = canvas.getContext('2d');
  // A gentle default tilt shows three to four faces at rest.
  let q = qNorm(qMul(qAxisAngle([1, 0, 0], -0.42), qAxisAngle([0, 1, 0], 0.62)));
  let raf = 0, anim = null;
  // Each face's text axes are fixed on the die. "Up" is whichever in-plane direction
  // faceQuaternion() turns to screen-up, so a landed number reads upright.
  for (const f of faceData) {
    f.up = vUnit(qRotate(qConj(faceQuaternion(f.number)), [0, 1, 0]));
    f.right = vCross(f.up, f.normal);
    f.flat = f.idx.map(i => { const d = vSub(geom.verts[i], f.centroid); return [vDot(d, f.right), vDot(d, f.up)]; });
  }
  const inks = new Map();

  // The number's ink box at TEXT_PX (alphabetic baseline), with room for a 6/9 underline.
  function inkBox(number) {
    if (inks.has(number)) return inks.get(number);
    const text = String(number);
    ctx.font = TEXT_FONT;
    const m = ctx.measureText ? ctx.measureText(text) : null;
    const measured = m && Number.isFinite(m.actualBoundingBoxAscent);
    const left = measured ? m.actualBoundingBoxLeft : 0;
    const right = measured ? m.actualBoundingBoxRight : TEXT_PX * 0.6 * text.length;
    const ascent = measured ? m.actualBoundingBoxAscent : TEXT_PX * 0.7;
    const glyphDescent = measured ? m.actualBoundingBoxDescent : 0;
    const bar = sides === 20 && (number === 6 || number === 9);
    const ink = { left, right, ascent, glyphDescent, glyphW: right + left, bar,
      descent: bar ? glyphDescent + TEXT_PX * 0.14 : glyphDescent };
    inks.set(number, ink);
    return ink;
  }
  // One text scale per die, as on a real die: the largest that keeps every number's
  // centred ink box inside its (convex) face, times FILL.
  let textScale = 0;
  function scale() {
    if (!textScale) textScale = Math.min(...faceData.map(fitFor)) * (FILL[sides] || FILL[20]);
    return textScale;
  }
  function fitFor(f) {
    const ink = inkBox(f.number);
    const hw = (ink.right + ink.left) / 2, hh = (ink.ascent + ink.descent) / 2;
    const corners = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]];
    let k = Infinity;
    f.flat.forEach((a, i) => {
      const b = f.flat[(i + 1) % f.flat.length];
      let m = [a[1] - b[1], b[0] - a[0]]; // edge normal
      const dist = -(a[0] * m[0] + a[1] * m[1]);
      if (dist < 0) { m = [-m[0], -m[1]]; }
      const len = Math.hypot(m[0], m[1]), inward = [m[0] / len, m[1] / len], gap = Math.abs(dist) / len;
      for (const c of corners) { const t = c[0] * inward[0] + c[1] * inward[1]; if (t < 0) k = Math.min(k, gap / -t); }
    });
    return k;
  }

  function size() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const w = Math.max(1, Math.round((rect.width || canvas.clientWidth || 160)));
    const h = Math.max(1, Math.round((rect.height || canvas.clientHeight || 160)));
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) { canvas.width = w * dpr; canvas.height = h * dpr; }
    return { w, h, dpr };
  }

  function rotated() {
    const verts = geom.verts.map(v => qRotate(q, v));
    const faces = faceData.map(f => {
      const centroid = qRotate(q, f.centroid);
      const normal = qRotate(q, f.normal);
      return { ...f, centroid, normal };
    });
    return { verts, faces };
  }

  function render() {
    const { w, h, dpr } = size();
    if (ctx.resetTransform) ctx.resetTransform(); else ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.44, D = 4.2, focal = 2.1;
    const { verts, faces } = rotated();
    const project = v => { const s = focal / (D - v[2]); return [cx + v[0] * s * R, cy - v[1] * s * R]; };
    const screen = verts.map(project);
    // Painter's algorithm; cull clearly back-facing triangles.
    const draw = faces.filter(f => f.normal[2] > -0.05).sort((a, b) => a.centroid[2] - b.centroid[2]);
    for (const f of draw) {
      const pts = f.idx.map(i => screen[i]);
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      const lit = 0.52 + 0.48 * Math.max(0, vDot(f.normal, LIGHT));
      ctx.fillStyle = shade(palette.face, lit);
      ctx.fill();
      ctx.lineWidth = Math.max(1, R * 0.018);
      ctx.strokeStyle = palette.edge;
      ctx.lineJoin = 'round';
      ctx.stroke();
      if (f.normal[2] > 0.18) {
        // Print the number in the face's plane: the affine map that best carries the face's
        // flat right/up coordinates onto its projected corners (exact for a triangle),
        // clipped to the face just filled.
        const ink = inkBox(f.number);
        const k = scale(); // world units per text pixel
        let mx = 0, my = 0, suu = 0, suv = 0, svv = 0, sux = 0, svx = 0, suy = 0, svy = 0;
        pts.forEach(([x, y]) => { mx += x / pts.length; my += y / pts.length; });
        f.flat.forEach(([u, v], i) => {
          const x = pts[i][0] - mx, y = pts[i][1] - my; // flat coordinates are centred already
          suu += u * u; suv += u * v; svv += v * v; sux += u * x; svx += v * x; suy += u * y; svy += v * y;
        });
        const det = suu * svv - suv * suv;
        const ax = (sux * svv - svx * suv) / det, ay = (suy * svv - svy * suv) / det; // screen per unit right
        const ux = (svx * suu - sux * suv) / det, uy = (svy * suu - suy * suv) / det; // screen per unit up
        ctx.save();
        ctx.clip();
        ctx.transform(ax * k, ay * k, -ux * k, -uy * k, mx, my);
        ctx.fillStyle = f.normal[2] > 0.45 ? palette.ink : palette.inkBack;
        ctx.font = TEXT_FONT;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.globalAlpha = Math.min(1, (f.normal[2] - 0.12) * 2.6);
        const x0 = -(ink.right - ink.left) / 2, y0 = (ink.ascent - ink.descent) / 2;
        ctx.fillText(String(f.number), x0, y0);
        // 6 and 9 turn with their faces now, so mark them the way real dice do.
        if (ink.bar) ctx.fillRect(-ink.glyphW * 0.35, y0 + ink.glyphDescent + TEXT_PX * 0.07, ink.glyphW * 0.7, TEXT_PX * 0.07);
        ctx.restore();
      }
    }
    const front = draw.reduce((a, b) => (b.normal[2] > (a?.normal[2] ?? -2) ? b : a), null);
    canvas.dataset.frontFace = String(front ? front.number : '');
    canvas.dataset.visible = draw.filter(f => f.normal[2] > 0).map(f => f.number).sort((a, b) => a - b).join(',');
  }

  function scheduleRender() { if (!raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); }

  function rotateByScreen(dx, dy) {
    const k = 0.9 / (Math.min(canvas.clientWidth || 160, canvas.clientHeight || 160) * 0.5);
    const step = qMul(qAxisAngle([0, 1, 0], dx * k), qAxisAngle([1, 0, 0], dy * k));
    q = qNorm(qMul(step, q));
    scheduleRender();
  }

  function faceQuaternion(number) {
    const f = byNumber.get(number) || faceData[0];
    // Shortest-arc rotation that brings this face's normal toward the viewer (+z).
    const a = vUnit(f.normal), b = [0, 0, 1];
    const d = vDot(a, b);
    if (d > 0.9999) return [0, 0, 0, 1]; // already facing the viewer
    if (d < -0.9999) return [1, 0, 0, 0]; // 180° about x
    const axis = vUnit(vCross(a, b));
    return qNorm(qAxisAngle(axis, Math.acos(Math.min(1, Math.max(-1, d)))));
  }

  function stopAnim() { if (anim) { cancelAnimationFrame(anim); anim = null; } }

  function spinTo(number, { reduced = false, turns = 2 } = {}) {
    stopAnim();
    const target = faceQuaternion(number);
    if (reduced) { q = target; render(); return Promise.resolve(); }
    const start = q;
    const { axis, angle } = toAxisAngle(qMul(target, qConj(start))); // start -> target
    // Only full extra revolutions preserve the target orientation. Drag distance
    // supplies fractional turns; adding those would force a snap on the last frame.
    const total = angle + 2 * Math.PI * Math.max(1, Math.round(turns));
    const dur = 620, t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    return new Promise(resolve => {
      const tick = now => {
        const t = Math.min(1, (now - t0) / dur);
        q = qNorm(qMul(qAxisAngle(axis, total * ease(t)), start));
        render();
        if (t < 1) anim = requestAnimationFrame(tick); else { anim = null; q = target; render(); resolve(); }
      };
      anim = requestAnimationFrame(tick);
    });
  }

  render();
  return {
    el: canvas,
    render,
    scheduleRender,
    rotateByScreen,
    spinTo,
    faceQuaternion,
    stop: stopAnim,
    get front() { return Number(canvas.dataset.frontFace) || null; },
    get sides() { return sides; },
  };
}
