import { Schema, ParseResult, Either } from "effect";

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

export const TextContent = Schema.NonEmptyString.pipe(
  Schema.brand("TextContent")
);

export type TextContent = Schema.Schema.Type<typeof TextContent>;

// delete command
export const TextContentDel = Schema.TaggedStruct("TextContentDel", {

});


export type Prettify<T> = {
  [K in keyof T]: Prettify<T[K]>;
} & {};