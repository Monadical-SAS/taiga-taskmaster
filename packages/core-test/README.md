# @vibe-generated

# Core Test Package

End-to-end test package that combines taskmaster and tasktracker functionality. This package tests the complete flow from PRD to Taiga task synchronization.

## Features

- Complete PRD-to-Taiga pipeline testing
- Combines task generation (taskmaster) with task synchronization (tasktracker)
- Isolated testing in `temp/` directory
- Environment variable loading from root `.env`
- File system cleanup after tests
- Validation of both task generation and Taiga synchronization

## Usage

```bash
# From project root
npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/core-test run test:manual
```

## What This Test Does

This test combines both taskmaster-test and tasktracker-test flows:

1. **Task Generation Phase** (from taskmaster-test):

   - Creates an isolated temp directory
   - Generates a sample PRD file
   - Runs task generation to create tasks.json
   - Validates the generated tasks structure

2. **Task Synchronization Phase** (from tasktracker-test):
   - Authenticates with Taiga API
   - Syncs generated tasks to Taiga with proper tagging
   - Tests both task creation and update scenarios
   - Validates proper task identification using tags

## Environment Variables

Requires the following in the root `.env` file:

**For Task Generation:**

- `ANTHROPIC_API_KEY` - For AI task generation
- `PERPLEXITY_API_KEY` - For research-backed task generation (optional)

**For Taiga Integration:**

- `TAIGA_USERNAME` - Your Taiga username
- `TAIGA_PASSWORD` - Your Taiga password
- `TAIGA_PROJECT_ID` - Numeric ID of Taiga project (must have task creation permissions)

## Test Flow

1. **Setup**: Create isolated test environment
2. **Generate Tasks**: PRD → tasks.json using taskmaster functionality
3. **Authenticate**: Connect to Taiga API
4. **Sync Tasks**: Upload generated tasks to Taiga using tasktracker functionality
5. **Update Test**: Modify tasks and test update synchronization
6. **Cleanup**: Remove temporary files

## Tagging System

Tasks are identified using a tag-based system:

- Project tag: `tm-project-{projectId}`
- Task tag: `tm-task-{taskId}`

This allows reliable mapping between TaskMaster tasks and Taiga tasks for updates.
