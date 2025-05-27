import { Schema, ParseResult, Either } from "effect";

export * from './tasks.js'

export const PositiveInteger = Schema.Number.pipe(
  Schema.int(),
  Schema.positive(),
  Schema.brand("PositiveInteger")
);

export type PositiveInteger = Schema.Schema.Type<typeof PositiveInteger>;

export const castPositiveInteger = (n: number): PositiveInteger => {
  return Schema.decodeSync(PositiveInteger)(n)
}

export const bang = <T>(v: T | undefined): T => {
  if (typeof v === "undefined") throw new Error(`panic! ${v} is undefined`);
  return v as T;
};

export const assert = bang;

export const NonEmptyString = Schema.NonEmptyString.pipe(
  Schema.brand('NonEmptyString')
);

export type NonEmptyString = typeof NonEmptyString.Type;

export const TextContent = NonEmptyString.pipe(
  Schema.brand("TextContent")
);

export type TextContent = typeof TextContent.Type;

export const PrdText =  NonEmptyString.pipe(
  Schema.brand("PrdText")
);

export type PrdText = typeof PrdText.Type

// should prettify some types; doesn't work on schames...
export type Prettify<T> = {
  [K in keyof T]: Prettify<T[K]>;
} & {};

export const castNonEmptyString = (s: string): NonEmptyString => {
  return Schema.decodeSync(NonEmptyString)(s)
}
  