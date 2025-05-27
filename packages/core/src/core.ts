import { Schema, ParseResult, Either, Effect } from "effect";
import type { FilterOutput } from 'effect/Schema';
import { Unexpected } from 'effect/ParseResult';

export const greet = (name: string): string => {
  return `Hello, ${name}!`;
};



// having PRD (TODO receival part is a separate, irrelevant now),

// (DI: CLI) => (prd.txt, Optional<previous tasks.json>/*represents append*/) => tasks.json
// () => tasks.json
// rendering - one way, but TODO two-way
// (tasks.json) => TrackerTask[]
// sync(TrackerTask[]) (mind ids, statuses)