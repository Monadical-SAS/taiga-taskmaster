import { Schema, ParseResult, Either, Effect } from "effect";
import type { FilterOutput } from 'effect/Schema';
import { Unexpected } from 'effect/ParseResult';

export const greet = (name: string): string => {
  return `Hello, ${name}!`;
};



