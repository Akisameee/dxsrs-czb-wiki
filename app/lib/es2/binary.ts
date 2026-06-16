const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder("utf-8", { fatal: false });

export class Es2BinaryReader {
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

  readByte() {
    this.ensure(1);
    return this.bytes[this.offset++];
  }

  readBool() {
    return this.readByte() !== 0;
  }

  readInt32() {
    this.ensure(4);
    const value = this.view.getInt32(this.offset, true);
    this.offset += 4;
    return value;
  }

  readUInt16() {
    this.ensure(2);
    const value = this.view.getUint16(this.offset, true);
    this.offset += 2;
    return value;
  }

  readBytes(length: number) {
    this.ensure(length);
    const value = this.bytes.slice(this.offset, this.offset + length);
    this.offset += length;
    return value;
  }

  readString() {
    const length = this.read7BitEncodedInt();
    return textDecoder.decode(this.readBytes(length));
  }

  read7BitEncodedInt() {
    let count = 0;
    let shift = 0;
    let byte = 0;

    do {
      if (shift === 35) throw new Error("ES2 字符串长度异常");
      byte = this.readByte();
      count |= (byte & 0x7f) << shift;
      shift += 7;
    } while ((byte & 0x80) !== 0);

    return count;
  }

  private ensure(length: number) {
    if (length < 0 || this.offset + length > this.bytes.length) {
      throw new Error(`ES2 数据被截断：offset=${this.offset}, length=${length}`);
    }
  }
}

export class Es2BinaryWriter {
  private chunks: Uint8Array[] = [];
  private size = 0;

  addByte(value: number) {
    this.addBytesRaw(new Uint8Array([value & 0xff]));
  }

  addBool(value: boolean) {
    this.addByte(value ? 1 : 0);
  }

  addInt32(value: number) {
    const bytes = new Uint8Array(4);
    new DataView(bytes.buffer).setInt32(0, value, true);
    this.addBytesRaw(bytes);
  }

  addUInt16(value: number) {
    const bytes = new Uint8Array(2);
    new DataView(bytes.buffer).setUint16(0, value, true);
    this.addBytesRaw(bytes);
  }

  addString(value: string) {
    const bytes = textEncoder.encode(value);
    this.add7BitEncodedInt(bytes.length);
    this.addBytesRaw(bytes);
  }

  addBytes(value: ArrayLike<number>) {
    this.addBytesRaw(Uint8Array.from(value));
  }

  add7BitEncodedInt(value: number) {
    let current = value >>> 0;
    while (current >= 0x80) {
      this.addByte((current | 0x80) & 0xff);
      current >>>= 7;
    }
    this.addByte(current);
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

  private addBytesRaw(bytes: Uint8Array) {
    this.chunks.push(bytes);
    this.size += bytes.length;
  }
}
