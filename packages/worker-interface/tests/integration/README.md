# Integration Tests

This directory contains integration tests that test real system interactions.

## Real Git Integration Tests

**File:** `loop-real-git.test.ts`

These tests verify the `loop()` function works with real git operations:

- Creates temporary git repositories with complete isolation
- Tests real file system artifacts and git commits
- Validates proper branch management and cleanup
- Includes detailed step-by-step logging

### Features Tested

✅ Chain of tasks with real git workflow  
✅ Git conflict recovery and cleanup  
✅ Complex task descriptions and branch naming  
✅ Real file artifacts creation and commits  
✅ Dependency injection (log, sleep, git operations)  

### How to Run

```bash
# Run only integration tests
pnpm test:integration

# Run specific integration test
pnpm test:integration -t "creates correct branch names"

# Watch mode for integration tests
pnpm test:integration:watch

# See detailed step-by-step logging
pnpm test:integration -- --reporter=verbose
```

### System Requirements

- No external dependencies on GitHub or user git credentials
- Creates temporary directories that are automatically cleaned up
- Uses `simple-git` library for isolated git operations
- All operations are local-only (no network required)