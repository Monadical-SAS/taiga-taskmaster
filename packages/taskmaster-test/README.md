# @vibe-generated

# taskmaster-test

Manual testing package for taskmaster functionality. This package tests the taskmaster CLI integration in isolation using a temporary directory.

## Features

- Isolated testing in `temp/` directory
- Environment variable loading from root `.env`
- File system cleanup after tests
- Validation of generated tasks.json

## Usage

```bash
# Run with environment variables from root .env
pnpm test:isolated
```

## Test Flow

1. Creates isolated `temp/` directory
2. Generates PRD file
3. Runs taskmaster CLI to generate tasks
4. Validates resulting tasks.json
5. Cleans up temporary files
