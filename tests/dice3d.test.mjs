import test from 'node:test';
import assert from 'node:assert/strict';
import { createDie } from '../src/dice3d.mjs';

test('animated d20 and d6 land continuously after fractional drag turns', async () => {
  const saved = Object.fromEntries(['window', 'performance', 'requestAnimationFrame', 'cancelAnimationFrame'].map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  const callbacks = new Map(); let id = 0;
  Object.defineProperty(globalThis, 'performance', { value: { now: () => 0 }, configurable: true });
  globalThis.window = { devicePixelRatio: 1 };
  globalThis.requestAnimationFrame = cb => { callbacks.set(++id, cb); return id; };
  globalThis.cancelAnimationFrame = key => callbacks.delete(key);
  const frame = time => { const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach(cb => cb(time)); };
  try {
    for (const sides of [20, 6]) for (let face = 1; face <= sides; face++) for (const turns of [2, 2.3, 2.5, 2.99]) {
      let points = [];
      const ctx = new Proxy({
        clearRect() { points = []; },
        moveTo(x, y) { points.push([x, y]); },
        lineTo(x, y) { points.push([x, y]); },
      }, { get: (obj, key) => obj[key] ?? (() => {}) });
      const canvas = { dataset: {}, clientWidth: 190, clientHeight: 190,
        getContext: () => ctx, getBoundingClientRect: () => ({ width: 190, height: 190 }) };
      const die = createDie(canvas, { sides });
      const landed = die.spinTo(face, { turns });
      frame(619);
      const before = { front: die.front, points: structuredClone(points) };
      frame(620); await landed;
      const label = `d${sides}, face ${face}, ${turns} turns`;
      assert.equal(die.front, face, `${label}: final face`);
      assert.equal(before.front, face, `${label}: must already approach the selected face before the final frame`);
      assert(before.points.length && points.length, 'Renderer must draw projected vertices');
      const jump = Math.max(...before.points.map(([x, y]) => Math.min(...points.map(([a, b]) => Math.hypot(a-x, b-y)))));
      assert(jump < .01, `${label}: final-frame silhouette jumped ${jump}px`);
      assert.equal(callbacks.size, 0, 'Animation finishes without pending frames');
    }
  } finally {
    for (const [key, descriptor] of Object.entries(saved)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
});

// A 2D context that tracks the transform, so a number's ink box can be checked against the
// face it is printed on. Synthetic glyph metrics: width .6em per digit, ascent .72em.
function recordingContext() {
  let m = [1, 0, 0, 1, 0, 0], stack = [], path = [];
  const glyphs = [];
  const map = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  const mul = (a, b, c, d, e, f) => { m = [m[0] * a + m[2] * b, m[1] * a + m[3] * b, m[0] * c + m[2] * d, m[1] * c + m[3] * d, m[0] * e + m[2] * f + m[4], m[1] * e + m[3] * f + m[5]]; };
  const ctx = {
    font: '10px serif', textAlign: 'start', textBaseline: 'alphabetic', glyphs,
    save() { stack.push(m); }, restore() { m = stack.pop() || [1, 0, 0, 1, 0, 0]; },
    resetTransform() { m = [1, 0, 0, 1, 0, 0]; }, setTransform(...t) { m = t; },
    scale(x, y) { mul(x, 0, 0, y, 0, 0); }, translate(x, y) { mul(1, 0, 0, 1, x, y); },
    rotate(r) { mul(Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0); }, transform: mul,
    clearRect() { glyphs.length = 0; }, beginPath() { path = []; },
    moveTo(x, y) { path.push(map(x, y)); }, lineTo(x, y) { path.push(map(x, y)); },
    measureText(s) {
      const em = parseFloat(/(\d+(\.\d+)?)px/.exec(ctx.font)[1]), w = 0.6 * em * s.length;
      const x = { center: [-w / 2, w / 2], right: [-w, 0], end: [-w, 0] }[ctx.textAlign] || [0, w];
      const y = { middle: [-0.36 * em, 0.36 * em], top: [0, 0.72 * em], hanging: [0, 0.72 * em] }[ctx.textBaseline] || [-0.72 * em, 0];
      return { width: w, actualBoundingBoxLeft: -x[0], actualBoundingBoxRight: x[1], actualBoundingBoxAscent: -y[0], actualBoundingBoxDescent: y[1] };
    },
    fillText(s, x, y) {
      const b = ctx.measureText(s);
      const corners = [[-b.actualBoundingBoxLeft, -b.actualBoundingBoxAscent], [b.actualBoundingBoxRight, -b.actualBoundingBoxAscent],
        [b.actualBoundingBoxRight, b.actualBoundingBoxDescent], [-b.actualBoundingBoxLeft, b.actualBoundingBoxDescent]];
      glyphs.push({ text: s, ink: corners.map(([u, v]) => map(x + u, y + v)), face: [...path], axes: [[m[0], m[1]], [m[2], m[3]]] });
    },
    fillRect(x, y, w, h) { glyphs.at(-1)?.ink.push(map(x, y), map(x + w, y), map(x + w, y + h), map(x, y + h)); },
  };
  return new Proxy(ctx, { get: (obj, key) => (key in obj ? obj[key] : () => {}) });
}

const inside = (poly, [x, y]) => {
  // Convex polygon, either winding; half a pixel of tolerance.
  const s = poly.map((a, i) => { const b = poly[(i + 1) % poly.length]; return ((b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0])) / Math.hypot(b[0] - a[0], b[1] - a[1]); });
  return s.every(v => v >= -0.5) || s.every(v => v <= 0.5);
};
// A text axis in the basis of the face's own projected frame (a triangle's edges, a quad's
// bimedians): fixed for a printed number, however the die turns.
const inFaceBasis = (face, [x, y]) => {
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
  const [e1, e2] = face.length === 4
    ? [sub(mid(face[1], face[2]), mid(face[3], face[0])), sub(mid(face[2], face[3]), mid(face[0], face[1]))]
    : [sub(face[1], face[0]), sub(face[2], face[0])];
  const det = e1[0] * e2[1] - e1[1] * e2[0];
  return [(x * e2[1] - y * e2[0]) / det, (e1[0] * y - e1[1] * x) / det];
};

test('dice numbers are printed in their face planes, inside their faces', async () => {
  const saved = Object.fromEntries(['window', 'requestAnimationFrame', 'cancelAnimationFrame'].map(k => [k, Object.getOwnPropertyDescriptor(globalThis, k)]));
  globalThis.window = { devicePixelRatio: 1 };
  globalThis.requestAnimationFrame = () => 1;
  globalThis.cancelAnimationFrame = () => {};
  try {
    for (const sides of [20, 6]) {
      const ctx = recordingContext();
      const die = createDie({ dataset: {}, clientWidth: 190, clientHeight: 190,
        getContext: () => ctx, getBoundingClientRect: () => ({ width: 190, height: 190 }) }, { sides });
      const seen = new Map(); // number -> text axes in face-edge coordinates, per pose
      // The resting tilt, then drags that leave several faces steeply oblique.
      const drags = [[0, 0], [55, 38], [-95, 70], [140, -20], [-30, -120], [80, 80], [-160, 15]];
      for (const [dx, dy] of drags) {
        die.rotateByScreen(dx, dy); die.render();
        assert(ctx.glyphs.length >= 2, `d${sides}: numbers drawn`);
        for (const g of ctx.glyphs) {
          const label = `d${sides} pose ${dx},${dy}, number ${g.text}`;
          for (const p of g.ink) assert(inside(g.face, p), `${label}: ink at ${p.map(v => v.toFixed(1))} is outside its face`);
          const axes = g.axes.map(a => inFaceBasis(g.face, a));
          if (!seen.has(g.text)) seen.set(g.text, axes);
          const first = seen.get(g.text);
          for (let i = 0; i < 2; i++) {
            const drift = Math.hypot(axes[i][0] - first[i][0], axes[i][1] - first[i][1]) / Math.hypot(...first[i]);
            assert(drift < 0.15, `${label}: text ${i ? 'up' : 'right'} axis does not turn with its face (drift ${drift.toFixed(2)})`);
          }
        }
      }
      // A landed number reads upright and unskewed.
      for (const n of (sides === 20 ? [1, 6, 9, 17, 20] : [1, 4, 6])) {
        await die.spinTo(n, { reduced: true });
        const g = ctx.glyphs.find(x => x.text === String(n));
        const [[ax, ay], [ux, uy]] = g.axes;
        assert(ax > 0 && uy > 0 && Math.abs(ay) < 1e-6 * ax && Math.abs(ux) < 1e-6 * uy, `d${sides} landed on ${n}: number is not upright`);
      }
    }
  } finally {
    for (const [key, descriptor] of Object.entries(saved)) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key];
    }
  }
});
