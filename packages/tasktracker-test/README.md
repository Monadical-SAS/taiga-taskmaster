# @vibe-generated

# TaskTracker Test Package

This package provides manual testing capabilities for the tasktracker functionality, specifically testing tasks creation and synchronization with Taiga using dependency injection.

## Features

- Tests task synchronization with Taiga using dependency injection
- Provides concrete implementations of TaskTracker dependencies using Taiga API
- Validates end-to-end functionality from TaskMaster to Taiga
- Tests both task creation and update scenarios
- Uses tag-based identification system for mapping TaskMaster tasks to Taiga tasks

## Usage

```bash
# From project root
npx dotenv -e ./.env -- pnpm --filter @taiga-task-master/tasktracker-test run test:manual
```

## What This Test Does

This test:

- Authenticates with Taiga API using provided credentials
- Creates 3 sample TaskMaster tasks
- **First sync**: Adds new tasks to Taiga with proper tagging
- **Second sync**: Updates existing tasks with modified content
- Validates proper task identification using tags
- Tests concurrent add/update operations

## Environment Variables

Requires Taiga API credentials in `.env` file at project root:
- `TAIGA_USERNAME` - Your Taiga username
- `TAIGA_PASSWORD` - Your Taiga password  
- `TAIGA_PROJECT_ID` - Numeric ID of Taiga project (must have task creation permissions)

## Test Structure

The test implements the `SyncTasksDeps` interface from tasktracker-interface:

- **`getTasks`**: Searches Taiga tasks by tags to find existing TaskMaster tasks
- **`addTasks`**: Creates new tasks in Taiga with proper project and task ID tagging
- **`updateTasks`**: Updates existing Taiga tasks by finding them via tags
- **`renderTask`**: Converts TaskFileContent to comprehensive text format

## Tagging System

Tasks are identified using a tag-based system:
- Project tag: `tm-project-{projectId}` 
- Task tag: `tm-task-{taskId}`

This allows reliable mapping between TaskMaster tasks and Taiga tasks for updates.

## Test Flow

1. **Setup**: Authenticate with Taiga API
2. **Create Test Data**: Generate 3 sample TaskMaster tasks
3. **First Sync**: Add new tasks to Taiga (or update if they exist from previous runs)
4. **Second Sync**: Update all tasks with modified content to test update logic
5. **Validation**: Confirm proper task creation, tagging, and updates