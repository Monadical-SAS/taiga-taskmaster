import { Schema } from "effect";

export const greet = (name: string): string => {
  return `Hello, ${name}!`;
};

export const GreetingSchema = Schema.Struct({
  name: Schema.String,
  message: Schema.String,
});