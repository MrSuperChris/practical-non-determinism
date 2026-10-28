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
