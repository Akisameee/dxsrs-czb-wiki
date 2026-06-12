const MT_SEED = 1812433253;

import type { CustomMartialInput } from "./types";

function uint(value: number) {
  return value >>> 0;
}

function seedStep(previous: number) {
  return uint(Math.imul(MT_SEED, previous) + 1);
}

export class UnityRandom {
  state: [number, number, number, number] = [0, 0, 0, 0];

  constructor(seed = 0) {
    this.initState(seed);
  }

  initState(seed: number) {
    const x = uint(seed);
    const y = seedStep(x);
    const z = seedStep(y);
    const w = seedStep(z);
    this.state = [x, y, z, w];
    return this;
  }

  nextUint() {
    let [x, y, z, w] = this.state;
    const t = uint(x ^ uint(x << 11));
    x = y;
    y = z;
    z = w;
    w = uint(w ^ (w >>> 19) ^ t ^ (t >>> 8));
    this.state = [x, y, z, w];
    return w;
  }

  value() {
    return (this.nextUint() & 0x7fffff) / 0x7fffff;
  }

  rangeInt(minInclusive: number, maxExclusive: number) {
    const min = Math.trunc(minInclusive);
    const max = Math.trunc(maxExclusive);
    if (max <= min) return min;

    const span = max - min;
    return min + (this.nextUint() % span);
  }

  rangeFloat(minInclusive: number, maxInclusive: number) {
    const min = Number(minInclusive);
    const max = Number(maxInclusive);
    const value = this.value();
    return value * min + (1 - value) * max;
  }

  snapshot() {
    return [...this.state];
  }
}

export function makeZiChuangSeed({ yi, qi, xing, shen, weaponType }: CustomMartialInput) {
  return (
    Number(yi) +
    Number(qi) * 11 +
    Number(xing) * 111 +
    Number(shen) * 1111 +
    Number(weaponType) * 11111 +
    11111
  );
}
