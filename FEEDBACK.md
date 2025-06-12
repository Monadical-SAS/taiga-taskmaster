

## Critical Issues

### 1. **Severe Type Safety Violation** 🚨
**Location:** `packages/worker-interface/src/index.ts:21`
```typescript
readonly streamLines: (command: Command.Command) => Stream.Stream<string, unknown>;
```
**Issue:** Using `unknown` as error type defeats the purpose of Effect's type safety.
**Impact:** Eliminates compile-time error handling guarantees, making error handling unpredictable.
**Fix:** Use proper error types:
```typescript
readonly streamLines: (command: Command.Command) => Stream.Stream<string, Error1 | Error2>;
```

### 2. **Broken Mock Testing Logic** 🚨
**Location:** `packages/worker-interface/src/index.ts:114-118`
```typescript
streamLines: (_command) => {
  const commandKey = Object.keys(scenarios)[0] ?? "default-command";
  const scenario = scenarios[commandKey] ?? { output: ["default mock output"] };
```
**Issue:** Mock completely ignores the input command and just picks the first scenario key.
**Impact:** Tests cannot actually validate specific command behavior - they're testing randomness.
**Fix:** Implement proper command-to-scenario mapping or use a command serializer.

### 3. **Naive Command Parsing** ⚠️
**Location:** `packages/worker-interface/src/index.ts:78-89`
```typescript
const commandParts = commandString.split(" ");
const cmd = commandParts[0];
const args = commandParts.slice(1);
```
**Issue:** Simple space-splitting breaks with quoted arguments, complex shell commands.
**Example:** `echo "hello world"` becomes `["echo", "\"hello", "world\""]` instead of `["echo", "hello world"]`.
**Fix:** don't event concatenate your commands into string, just return an array from createGooseCommand. same for "command" field etc

---

## Design Issues

### 6. **Missing Error Type Propagation**
**Location:** Various functions
**Issue:** Functions that can fail don't properly type their error cases
**Example:** `executeTask()` can fail with "Empty command" but this isn't reflected in calling code

---

## Test Issues

### 7. **Tests Don't Reflect Reality**
**Location:** `packages/worker-interface/src/index.test.ts:204-224`
```typescript
// Mock version
const testLayer = TestCommandExecutor({
  "mock-command": {  // ← This key is never matched!
    output: [expectedOutput],
  },
});
const mockedResult = await runTaskAsPromise(executeCommand(commandObj), testLayer);
```
**Issue:** Cross-validation test doesn't actually test the same command because mock key doesn't match.
**Impact:** False confidence in test coverage.

### 8. **Hardcoded Test Values**
**Examples:** Absolute paths like `/Users/firfi/.local/share/goose/sessions/...` in mock data
**Issue:** Tests become brittle and environment-specific
**Fix:** Use relative paths or dynamic test data generation

---

## Performance & Resource Issues

### 10. **No Timeout Handling**
**Location:** Effect streams don't have timeouts configured
**Issue:** Long-running commands could hang indefinitely
**Fix:** Add timeout configuration to all command executions https://effect.website/docs/data-types/datetime/#now, https://effect.website/docs/testing/testclock/, https://effect.website/docs/error-management/timing-out/

### 11. **Memory Leak Potential**
**Issue:** Stream collectors don't appear to have size limits
**Risk:** Large command output could consume excessive memory
**Fix:** Add stream buffering limits 

---


## Functional Programming Violations

### 15. **Side Effects in Pure Functions**
**Location:** `packages/worker-interface/src/index.ts:54-56`
```typescript
Stream.map((line) => ({
  timestamp: Date.now(), // ← Side effect!
  line,
}))
```
**Issue:** `Date.now()` is a side effect that makes the function impure
**Fix:** https://effect.website/docs/data-types/datetime/#now, https://effect.website/docs/testing/testclock/, https://effect.website/docs/error-management/timing-out/

---

## Security Considerations

### 16. **Shell Injection Risk**
**Location:** Line 206: `cd "${workingDir}" && ${commandString}`
**Issue:** User-controlled input goes directly to shell
**Risk:** Command injection if `workingDir` contains shell metacharacters
**Fix:** Use proper shell escaping or avoid shell composition

