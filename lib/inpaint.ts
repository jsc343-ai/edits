function dilate(mask: Uint8Array, w: number, h: number, r: number): Uint8Array {
  if (r <= 0) return mask.slice();
  const tmp = new Uint8Array(w * h);
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    let last = -1e9;
    const row = y * w;
    for (let x = 0; x < w; x++) if (mask[row + x]) last = x, (tmp[row + x] = 1);
    else if (x - last <= r) tmp[row + x] = 1;
    last = 1e9;
    for (let x = w - 1; x >= 0; x--) {
      if (mask[row + x]) last = x;
      else if (last - x <= r) tmp[row + x] = 1;
    }
  }
  for (let x = 0; x < w; x++) {
    let last = -1e9;
    for (let y = 0; y < h; y++) {
      if (tmp[y * w + x]) last = y, (out[y * w + x] = 1);
      else if (y - last <= r) out[y * w + x] = 1;
    }
    last = 1e9;
    for (let y = h - 1; y >= 0; y--) {
      if (tmp[y * w + x]) last = y;
      else if (last - y <= r) out[y * w + x] = 1;
    }
  }
  return out;
}

function median(values: number[]): number {
  if (!values.length) return 0;
  const s = values.slice().sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/**
 * Takes the area the player scribbled over, widens it to cover nearby
 * text or marks that differ from the surrounding background, then fills it
 * from the pixels around it.
 */
export function autoClear(image: ImageData, painted: Uint8Array, brush: number): void {
  const { width: w, height: h, data } = image;
  const near = Math.max(2, Math.round(brush * 0.5));
  const band = dilate(painted, w, h, near);
  const wide = dilate(painted, w, h, near + Math.max(4, Math.round(brush * 0.6)));

  const ring: number[][] = [[], [], []];
  const step = Math.max(1, Math.floor((w * h) / 20000));
  for (let i = 0; i < w * h; i += step) {
    if (wide[i] && !band[i]) {
      ring[0].push(data[i * 4]);
      ring[1].push(data[i * 4 + 1]);
      ring[2].push(data[i * 4 + 2]);
    }
  }
  const bg = ring[0].length ? [median(ring[0]), median(ring[1]), median(ring[2])] : null;

  const mask = painted.slice();
  if (bg) {
    for (let i = 0; i < w * h; i++) {
      if (!band[i] || mask[i]) continue;
      const dr = data[i * 4] - bg[0];
      const dg = data[i * 4 + 1] - bg[1];
      const db = data[i * 4 + 2] - bg[2];
      if (dr * dr + dg * dg + db * db > 40 * 40 * 3 * 0.5) mask[i] = 1;
    }
  }
  const final = dilate(mask, w, h, 2);

  const known = new Uint8Array(w * h);
  let remaining = 0;
  for (let i = 0; i < w * h; i++) {
    if (final[i]) remaining++;
    else known[i] = 1;
  }
  if (!remaining || remaining === w * h) return;

  const neighbours = [-1, 1, -w, w, -w - 1, -w + 1, w - 1, w + 1];
  let frontier: number[] = [];
  for (let i = 0; i < w * h; i++) {
    if (known[i]) continue;
    const x = i % w;
    const y = (i / w) | 0;
    let touches = false;
    for (let k = 0; k < 8 && !touches; k++) {
      const dx = k === 0 || k === 4 || k === 6 ? -1 : k === 1 || k === 5 || k === 7 ? 1 : 0;
      const dy = k === 2 || k === 4 || k === 5 ? -1 : k === 3 || k === 6 || k === 7 ? 1 : 0;
      const nx = x + dx;
      const ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && known[i + neighbours[k]]) touches = true;
    }
    if (touches) frontier.push(i);
  }

  while (frontier.length) {
    const next: number[] = [];
    const values: [number, number, number, number][] = [];
    for (const i of frontier) {
      const x = i % w;
      const y = (i / w) | 0;
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = ny * w + nx;
          if (!known[j]) continue;
          r += data[j * 4];
          g += data[j * 4 + 1];
          b += data[j * 4 + 2];
          a += data[j * 4 + 3];
          n++;
        }
      }
      values.push(n ? [r / n, g / n, b / n, a / n] : [0, 0, 0, 255]);
    }
    frontier.forEach((i, idx) => {
      const v = values[idx];
      data[i * 4] = v[0];
      data[i * 4 + 1] = v[1];
      data[i * 4 + 2] = v[2];
      data[i * 4 + 3] = v[3];
      known[i] = 1;
    });
    for (const i of frontier) {
      const x = i % w;
      const y = (i / w) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = ny * w + nx;
          if (!known[j] && final[j]) {
            known[j] = 2;
            next.push(j);
          }
        }
      }
    }
    for (const j of next) known[j] = 0;
    frontier = next;
  }

  const idxs: number[] = [];
  for (let i = 0; i < w * h; i++) if (final[i]) idxs.push(i);
  for (let pass = 0; pass < 6; pass++) {
    const copy = new Uint8ClampedArray(data);
    for (const i of idxs) {
      const x = i % w;
      const y = (i / w) | 0;
      let r = 0, g = 0, b = 0, n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = (ny * w + nx) * 4;
          r += copy[j];
          g += copy[j + 1];
          b += copy[j + 2];
          n++;
        }
      }
      data[i * 4] = r / n;
      data[i * 4 + 1] = g / n;
      data[i * 4 + 2] = b / n;
    }
  }
}
