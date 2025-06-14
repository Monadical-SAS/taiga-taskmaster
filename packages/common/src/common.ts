import { Option, Schema } from "effect";

export const NonNegativeInteger = Schema.Number.pipe(
  Schema.int(),
  Schema.nonNegative(),
  Schema.brand("NonNegativeInteger")
);
export type NonNegativeInteger = Schema.Schema.Type<typeof NonNegativeInteger>;
export const castNonNegativeInteger = (n: number): NonNegativeInteger => {
  return Schema.decodeSync(NonNegativeInteger)(n);
};
export const PositiveInteger = NonNegativeInteger.pipe(
  Schema.positive(),
  Schema.brand("PositiveInteger")
);
export type PositiveInteger = Schema.Schema.Type<typeof PositiveInteger>;
export const castPositiveInteger = (n: number): PositiveInteger => {
  return Schema.decodeSync(PositiveInteger)(n);
};
export const bang = <T>(v: T | undefined): T => {
  if (typeof v === "undefined") throw new Error(`panic! ${v} is undefined`);
  return v as T;
};
export const assert = bang;
export const NonEmptyStringBrand = Symbol.for("NonEmptyString");
export const NonEmptyString = Schema.NonEmptyString.pipe(
  Schema.brand(NonEmptyStringBrand)
);
export type NonEmptyString = typeof NonEmptyString.Type;
export const nonEmptyStringFromNumber = (n: number): NonEmptyString => {
  // can always map
  return Schema.decodeSync(NonEmptyString)(n.toString());
};
export const TextContent = NonEmptyString.pipe(Schema.brand("TextContent"));
export type TextContent = typeof TextContent.Type;
export const PrdText = NonEmptyString.pipe(Schema.brand("PrdText"));
export type PrdText = typeof PrdText.Type;
export const PrdTextHash = NonEmptyString.pipe(Schema.brand("PrdTextHash"));
export type PrdTextHash = typeof PrdTextHash.Type;
// should prettify some types; doesn't work on schames...
export type Prettify<T> = {
  [K in keyof T]: Prettify<T[K]>;
} & {};
export const castNonEmptyString = (s: string): NonEmptyString => {
  return Schema.decodeSync(NonEmptyString)(s);
};
export const oneOrNone = <T>(a: T[]) => {
  if (a.length > 1) {
    throw new Error(`Expected one or none elements, got ${a.length}`);
  }
  if (a.length === 0) {
    return Option.none();
  }
  return Option.some(bang(a[0]));
};

export const onlyOne = <T>(a: T[]) => {
  if (a.length !== 1) {
    throw new Error(`Expected exactly one element, got ${a.length}`);
  }
  return a[0];
};

export const castNonEmptyArray = <T>(a: T[]): [T, ...T[]] => {
  if (a.length === 0) {
    throw new Error(`Expected at least one element, got ${a.length}`);
  }
  return a as [T, ...T[]];
};

export const Url = NonEmptyString.pipe(Schema.brand("Url"));

// Taiga Tag Management
export const TaigaTag = NonEmptyString.pipe(Schema.brand("TaigaTag"));
export type TaigaTag = typeof TaigaTag.Type;

/* eslint-disable functional/no-let, functional/no-loop-statements, functional/no-expression-statements */
export const cyrb53 = (str: string, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for(let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};
/* eslint-enable functional/no-let, functional/no-loop-statements, functional/no-expression-statements */