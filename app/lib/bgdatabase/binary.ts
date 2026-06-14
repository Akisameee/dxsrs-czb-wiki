const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: false });

export class BgBinaryReader {
  readonly bytes: Uint8Array;
  private readonly view: DataView;
  offset: number;

  constructor(bytes: Uint8Array, offset = 0) {
    this.bytes = bytes;
    this.view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    this.offset = offset;
  }

  get length() {
    return this.bytes.length;
  }

  readInt32() {
    this.ensure(4);
    const value = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return value;
  }

  readFloat32() {
    this.ensure(4);
    const value = this.view.getFloat32(this.offset, true);
    this.offset += 4;
    return value;
  }

  readBool() {
    this.ensure(1);
    const value = this.bytes[this.offset] !== 0;
    this.offset += 1;
    return value;
  }

  readId() {
    return this.readBytes(16);
  }

  readByteArray() {
    const length = this.readInt32();
    if (length < 0) throw new Error(`byte[] 长度异常：${length}`);
    return this.readBytes(length);
  }

  readString() {
    const bytes = this.readByteArray();
    if (!bytes.length) return null;
    return textDecoder.decode(bytes);
  }

  readArray<T>(readItem: (index: number) => T) {
    const count = this.readInt32();
    if (count < 0 || count > 1_000_000) throw new Error(`数组长度异常：${count}`);
    const values: T[] = [];
    for (let index = 0; index < count; index += 1) values.push(readItem(index));
    return values;
  }

  peekIdEquals(target: Uint8Array) {
    if (this.offset + target.length > this.bytes.length) return false;
    for (let index = 0; index < target.length; index += 1) {
      if (this.bytes[this.offset + index] !== target[index]) return false;
    }
    return true;
  }

  readBytes(length: number) {
    this.ensure(length);
    const value = this.bytes.slice(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  private ensure(length: number) {
    if (length < 0 || this.offset + length > this.bytes.length) {
      throw new Error(`BGDatabase 数据被截断：offset=${this.offset}, length=${length}`);
    }
  }
}

export class BgBinaryWriter {
  private chunks: Uint8Array[] = [];
  private size = 0;

  get count() {
    return this.size;
  }

  addInt32(value: number) {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setInt32(0, value, true);
    this.addBytesRaw(bytes);
  }

  addFloat32(value: number) {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setFloat32(0, value, true);
    this.addBytesRaw(bytes);
  }

  addBool(value: boolean) {
    this.addBytesRaw(new Uint8Array([value ? 1 : 0]));
  }

  addId(value: Uint8Array) {
    if (value.length !== 16) throw new Error(`BGId 长度异常：${value.length}`);
    this.addBytesRaw(value);
  }

  addByteArray(value: Uint8Array | null | undefined) {
    if (!value?.length) {
      this.addInt32(0);
      return;
    }
    this.addInt32(value.length);
    this.addBytesRaw(value);
  }

  addString(value: string | null | undefined) {
    if (!value) {
      this.addInt32(0);
      return;
    }
    this.addByteArray(textEncoder.encode(value));
  }

  addArray<T>(values: readonly T[], writeItem: (value: T, index: number) => void) {
    this.addInt32(values.length);
    values.forEach((value, index) => writeItem(value, index));
  }

  addBytesRaw(value: Uint8Array) {
    if (!value.length) return;
    this.chunks.push(value);
    this.size += value.length;
  }

  toArray() {
    const output = new Uint8Array(this.size);
    let offset = 0;
    for (const chunk of this.chunks) {
      output.set(chunk, offset);
      offset += chunk.length;
    }
    return output;
  }
}

export function bytesFromHex(value: string) {
  return new Uint8Array(
    value
      .trim()
      .split(/\s+/)
      .map((part) => Number.parseInt(part, 16)),
  );
}

export function bytesEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) return false;
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) return false;
  }
  return true;
}
