/** Memoize a function by reference equality of its arguments. */
export function memoByRef<A extends readonly unknown[], V>(
  compute: (...args: A) => V,
): (...args: A) => V {
  let lastArgs: A | null = null;
  let lastValue: V;
  return (...args: A): V => {
    if (lastArgs !== null && lastArgs.length === args.length && lastArgs.every((a, i) => a === args[i])) {
      return lastValue;
    }
    lastValue = compute(...args);
    lastArgs = args;
    return lastValue;
  };
}
