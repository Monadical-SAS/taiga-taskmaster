# TypeScript Class Usage Warning

## Prefer functions

If you can use a simple function, ALWAYS use a simple function. Classes should be a rare situation. Think twice before using class. If you use class, make sure you have a good reason.  

## Core Principle: Classes = State + Behaviors

**Only create a class when you have meaningful state to encapsulate.**
**Even when you do, first think twice in the terms of immutability and state pattern.**

## DON'T Use Classes When:

### 1. **Pure Functions (No State)**
WRONG:
```
// Pointless class wrapper
class Adder {
  add(a: number, b: number) { return a + b; }
}
```
RIGHT:
```
// Just use a function
const add = (a: number, b: number) => a + b;
```

### 2. **Stateless Utilities**
WRONG:
```
// Ceremony for no reason
class MathUtils {
  static factorial(n: number) { /* ... */ }
  static fibonacci(n: number) { /* ... */ }
}
```
RIGHT:
```
// Plain functions
export const factorial = (n: number) => /* ... */;
export const fibonacci = (n: number) => /* ... */;
```

### 3. **Simple Data Transformation**
WRONG:
```
// Overkill
class UserFormatter {
  format(user: User) { return `${user.name} (${user.email})`; }
}
```

RIGHT:
```
//  Simple function
const formatUser = (user: User) => `${user.name} (${user.email})`;
```


## Interface Guidelines:

- **`implements`**  - Use for contracts and polymorphism
- **`extends`**  - Do not use. prefer composition or no classes at all

## Effect Schema Usage Guidelines - Either Pattern

// ✅ For unknown input (JSON, user input, APIs)
const parseUser = Schema.decodeUnknownEither(UserSchema); // unknown -> Either<Error, User>

// ✅ For raw typed input (primitive fields, standard data structures, already known at compile time)
const parseUserMoreOrLessKnown = Schema.decodeEither(UserSchema); // string -> Either<{name: string, age: number}, User>

Use decodeUnknownEither when type is unknown, use decodeEither when type is more-or-less known. Always prefer decodeEither but relise that decodeUnknownEither is more often than not inevitable 

# Type Casting Guidelines

NEVER use type casting (as or any or even cast to a specific type) in TypeScript code
by the way, NEVER NEVER cast `as any`
If you want to transform a type of variable, you parse it / or go through typeguards (which can cast when we're 100% sure it's correct)

# Domain-Driven Design

4. **Types Should Reflect Business Meaning**
    - Types tell you WHAT something is, not HOW it's stored
    - Primitive obsession is dangerous: `string` means "sequence of characters", `Email` means "valid email address"
    - Keep domain concepts clear in your types

   Example:
   ```go
   // Bad: Primitive types hide meaning
   type Order struct {
       id string
       status string
       amount float64
   }
   
   // Good: Types convey meaning
   type Order struct {
       id      OrderId
       status  OrderStatus
       amount  Money
   }
   ```

# Code Documentation

**Comments Must Add Value**
- Don't repeat what the code already says
- Comment on WHY, not WHAT
- If you need a comment to explain WHAT, consider making the code clearer
- DO NOT add useless comments
- Keep comments at the same abstraction level as the code they document

   Example:
   ```go
   // Bad:
   // Set user's age
   user.Age = 25
   
   // Good:
   // Age verified through passport verification service
   user.Age = verifiedAge
   
   // Better: Make it obvious in code
   user.SetVerifiedAge(passportVerifiedAge)
   ```
  
# Interface naming

if you have to write an interface, don't prefix it with "I" like you saw in some code online. It's ts antipattern.