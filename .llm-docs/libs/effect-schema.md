Effect Schema in TypeScript: A Concise Summary
Effect Schema is a TypeScript module for defining schemas that describe data structures. It enables validation, transformation, and documentation of data, making it ideal for working with structured data in TypeScript.
A schema is defined as Schema<Type, Encoded, Requirements>:
Type: The decoded output type (e.g., your domain type).
Encoded: The input/output type (often JSON-compatible).
Requirements: External dependencies for decoding/encoding (default: never).
Key Concepts

1. Defining Schemas
   Schemas are built using constructors like Schema.Struct, Schema.Array, or primitives (Schema.String, Schema.Number).
   Example:
   ts
   import { Schema } from "effect"
   const Person = Schema.Struct({ name: Schema.String, age: Schema.Number })
2. Decoding and Encoding
   Decoding: Converts Encoded → Type (e.g., raw input to your type).
   Encoding: Converts Type → Encoded (e.g., your type to raw output).
   Use methods like decodeUnknownSync or encodeSync.
   Example:
   ts
   const decoded = Schema.decodeUnknownSync(Person)({ name: "Alice", age: 30 })
   console.log(decoded) // { name: "Alice", age: 30 }
3. Annotations
   Add metadata (e.g., titles, descriptions) to schemas.
   Example:
   ts
   const AnnotatedPerson = Person.annotations({ title: "Person" })
4. Transformations
   Use Schema.transform to convert between types.
   Example:
   ts
   const NumberFromString = Schema.transform(Schema.String, Schema.Number, {
   decode: (s) => parseFloat(s),
   encode: (n) => n.toString()
   })
5. Filters
   Add validation rules (e.g., length or range constraints).
   Example:
   ts
   const LongString = Schema.String.pipe(Schema.filter(s => s.length >= 10))
6. Error Handling
   Errors are detailed and customizable.
   Example:
   ts
   Schema.decodeUnknownSync(LongString)("short") // Throws: "Expected length >= 10"
7. Advanced Features
   Branded Types: Add type safety (e.g., Schema.String.pipe(Schema.brand("ID"))).
   Recursive Schemas: Define self-referencing structures.
   Custom Annotations: Tailor schemas to your needs.
   Full Example
   ts
   import { Schema } from "effect"

const Person = Schema.Struct({
name: Schema.String,
age: Schema.Number
}).annotations({ title: "Person" })

const decoded = Schema.decodeUnknownSync(Person)({ name: "Alice", age: 30 })
console.log(decoded) // { name: "Alice", age: 30 }
This covers the essentials of Effect Schema: defining schemas, transforming data, adding constraints, and handling errors, all while leveraging TypeScript’s type system. The layout is clean, with proper Markdown and intact code blocks.
