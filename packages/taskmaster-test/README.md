# @vibe-generated

# Taskmaster Test Package

Manual testing package for taskmaster functionality. This package tests the complete taskmaster CLI workflow in isolation using a temporary directory.

## Features

- Isolated testing in `temp/` directory
- Environment variable loading from root `.env`
- File system cleanup after tests
- Validation of generated tasks.json structure
- Complete PRD-to-tasks pipeline testing

## Usage

```bash
# From project root
npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/taskmaster-test run test:isolated
```

## What This Test Does

This test:

- Creates an isolated temp directory
- Generates a sample PRD file
- Runs `npx task-master parse-prd` with environment variables
- Validates the generated tasks.json structure
- Cleans up temporary files

## Environment Variables

Requires the following in the root `.env` file:
- `ANTHROPIC_API_KEY` - For AI task generation
- `PERPLEXITY_API_KEY` - For research-backed task generation

## Test Flow

1. Creates isolated `temp/` directory
2. Generates sample PRD file
3. Runs taskmaster CLI to generate tasks
4. Validates resulting tasks.json structure and content
5. Cleans up temporary files automatically
