const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));

function angle(a, b, c) {
  const u = [a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0)];
  const v = [c.x - b.x, c.y - b.y, (c.z ?? 0) - (b.z ?? 0)];
  const length = Math.hypot(...u) * Math.hypot(...v);
  if (length < 1e-12) return 0;
  return Math.acos(Math.max(-1, Math.min(1, u.reduce((s, n, i) => s + n * v[i], 0) / length))) * 180 / Math.PI;
}

export function countFingers(points) {
  if (!points || points.length !== 21) return 0;
  const p = points;
  const palm = distance(p[0], p[9]);
  if (palm < 1e-8) return 0;
  let count = 0;
  for (const [mcp, pip, dip, tip] of [[5, 6, 7, 8], [9, 10, 11, 12], [13, 14, 15, 16], [17, 18, 19, 20]]) {
    const chain = distance(p[mcp], p[pip]) + distance(p[pip], p[dip]) + distance(p[dip], p[tip]);
    // A slightly curved finger is still raised. Do not require the tiny distal
    // joint to be almost perfectly straight: its estimated depth is often noisy.
    const reach = distance(p[mcp], p[tip]) / (chain || 1);
    const outward = distance(p[tip], p[0]) > distance(p[pip], p[0]) + palm * 0.025;
    if (reach > 0.78 && angle(p[mcp], p[pip], p[tip]) > 135 && outward) count++;
  }
  // Thumb extension is relative to the palm, independent of handedness and
  // screen x direction. A thumb folded across the palm must not count.
  const thumbChain = distance(p[2], p[3]) + distance(p[3], p[4]);
  const thumbReach = distance(p[2], p[4]) / (thumbChain || 1);
  const spread = distance(p[4], p[5]) > distance(p[3], p[5]) + palm * 0.08;
  if (thumbReach > 0.83 && angle(p[2], p[3], p[4]) > 135 && spread && distance(p[4], p[9]) > palm * 0.5) count++;
  return count;
}

export function countHands(result) {
  return result.landmarks.map((points, i) => countFingers(result.worldLandmarks?.[i]?.length === 21 ? result.worldLandmarks[i] : points));
}

export class StableCount {
  constructor(delay = 130) { this.delay = delay; this.reset(); }
  reset() { this.value = null; this.history = []; this.started = null; }
  update(value, now) {
    if (value === null) { this.reset(); return null; }
    if (this.started === null) this.started = now;
    this.history.push({value, time: now});
    // Retain one boundary sample so low FPS still permits stabilization.
    while (this.history.length > 1 && this.history[1].time <= now - this.delay) this.history.shift();
    const votes = new Map();
    for (const sample of this.history) votes.set(sample.value, (votes.get(sample.value) ?? 0) + 1);
    const [winner, votesCount] = [...votes].sort((a, b) => b[1] - a[1])[0];
    if (now - this.started >= this.delay && votesCount / this.history.length > 0.6) this.value = winner;
    return this.value;
  }
}
