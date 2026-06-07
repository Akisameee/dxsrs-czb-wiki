const UINT_MAX = 0xffffffff;
const MT_SEED = 1812433253;

function uint(value) {
  return value >>> 0;
}

function seedStep(previous, index) {
  const mixed = uint(previous ^ (previous >>> 30));
  return uint(Math.imul(MT_SEED, mixed) + index);
}

export class UnityRandom {
  constructor(seed = 0) {
    this.initState(seed);
  }

  initState(seed) {
    const x = uint(seed);
    const y = seedStep(x, 1);
    const z = seedStep(y, 2);
    const w = seedStep(z, 3);
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
    return this.nextUint() / UINT_MAX;
  }

  rangeInt(minInclusive, maxExclusive) {
    const min = Math.trunc(minInclusive);
    const max = Math.trunc(maxExclusive);
    if (max <= min) return min;

    const span = max - min;
    const value = min + Math.floor(this.value() * span);
    return value >= max ? max - 1 : value;
  }

  rangeFloat(minInclusive, maxInclusive) {
    const min = Number(minInclusive);
    const max = Number(maxInclusive);
    return min + (max - min) * this.value();
  }

  snapshot() {
    return [...this.state];
  }
}

export function makeZiChuangSeed({ yi, qi, xing, shen, weaponType }) {
  return (
    Number(yi) +
    Number(qi) * 11 +
    Number(xing) * 111 +
    Number(shen) * 1111 +
    Number(weaponType) * 11111 +
    11111
  );
}
