import { Schema, ParseResult, Either } from "effect";
import type { FilterOutput } from "effect/Schema";
import { Unexpected } from 'effect/ParseResult';

export const PositiveInteger = Schema.Number.pipe(
  Schema.int(),
  Schema.positive(),
  Schema.brand("PositiveInteger")
);

export type PositiveInteger = Schema.Schema.Type<typeof PositiveInteger>;

export const PositiveIntegerFromString = Schema.compose(Schema.NumberFromString, PositiveInteger);

// for dict keys usage at need: string that is string but certainly checked for being a positive integer underneath
export const PositiveIntegerString = Schema.NonEmptyString.pipe(
  Schema.filter((s): FilterOutput => {
    const r = ParseResult.validateEither(PositiveIntegerFromString)(s);
    if (Either.isLeft(r)) {
      return r.left;
    }
    return true;
  }),
  Schema.brand("PositiveIntegerString")
);

export type PositiveIntegerString = Schema.Schema.Type<typeof PositiveIntegerString>;
export const toPositiveInteger = (s: PositiveIntegerString) => Number.parseInt(s, 10) as PositiveInteger

export const bang = <T>(v: T | undefined): T => {
  if (typeof v === "undefined") throw new Error(`panic! ${v} is undefined`);
  return v as T;
};

export const assert = bang;

export const TextContent = Schema.NonEmptyString.pipe(
  Schema.brand("TextContent")
);

export type TextContent = Schema.Schema.Type<typeof TextContent>;

// keys are always "1", "2", "3" gapless and starting with 1; otherwise there's something wrong
export const TaskFileStructure = Schema.Record({
  key: PositiveIntegerString,
  value: TextContent
}).pipe(
  Schema.filter((record): FilterOutput => {
    const keys = Object.keys(record) as (keyof typeof record)[];
    const nums = keys.map(toPositiveInteger)
    if (nums.length === 0) return true;
    const sortedNums = nums.toSorted((a, b) => a - b);
    if (sortedNums[0] !== 1) return new Unexpected(sortedNums[0], "Task list doesn't start from task number 1");
    const consecutive = sortedNums.every((num, index) => index === 0 || num === bang(sortedNums[index - 1]) + 1);
    if (!consecutive) return new Unexpected(sortedNums.join(','), "Task list isn't consecutive and/or gapless");
    return true;
  }, {
    message: (input) => `Keys must start with 1 and be consecutive positive integers, received: ${JSON.stringify(Object.keys(input))}`
  }),
  Schema.brand("TaskFileStructure")
);

export type TaskFileStructure = Schema.Schema<typeof TaskFileStructure>;

// for LLM to read; use TaskFileStructure but assume _TaskFileStructureUnrolled is the same
type _TaskFileStructureUnrolled = Record<PositiveIntegerString, TextContent>;
