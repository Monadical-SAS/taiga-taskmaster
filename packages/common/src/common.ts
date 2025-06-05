import { Schema } from "effect";

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
export const TextContent = NonEmptyString.pipe(Schema.brand("TextContent"));
export type TextContent = typeof TextContent.Type;
export const PrdText = NonEmptyString.pipe(Schema.brand("PrdText"));
export type PrdText = typeof PrdText.Type;
export const PrdTextHash = NonEmptyString.pipe(Schema.brand("PrdTextHash"))
export type PrdTextHash = typeof PrdTextHash.Type
// should prettify some types; doesn't work on schames...
export type Prettify<T> = {
  [K in keyof T]: Prettify<T[K]>;
} & {};
export const castNonEmptyString = (s: string): NonEmptyString => {
  return Schema.decodeSync(NonEmptyString)(s);
};
export const Url = NonEmptyString.pipe(Schema.brand("Url"));

// Taiga Tag Management
export const TaigaTag = NonEmptyString.pipe(Schema.brand("TaigaTag"));
export type TaigaTag = typeof TaigaTag.Type;
