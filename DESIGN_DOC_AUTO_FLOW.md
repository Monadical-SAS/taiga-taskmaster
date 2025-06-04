# @vibe-generated

# Automatic Code Generator Architecture Design

## Overview

This document outlines the architecture for an automatic code generator that transforms conversations into deployed projects. The system's killer feature is real-time demo generation during client conversations, providing immediate visual feedback as requirements are gathered and refined.

## Core Concept

The system follows a modified V-model approach with heavy focus on requirement gathering and re-validation, supported by coding agent regeneration powers. The architecture enables human-in-the-loop intervention at multiple granularities while maintaining full automation capabilities.

## Key Design Principles

1. **Real-time Demo Generation**: During client conversations, the system automatically detects sufficient context to create PRDs and immediately begins code generation and deployment
2. **Human Intervention Flexibility**: Support for completely automatic execution, full human-in-the-loop control, and hybrid approaches
3. **Progress Visibility**: Each task implementation creates a deployable checkpoint that clients can evaluate
4. **Robust Failure Handling**: Serializable state with retry capabilities and checkpoint recovery
5. **Incremental Development**: Support for stacked progress with ability to rollback and continue from any point

## System Architecture

### State Model

```typescript
State = {
  master_tasks_json: TasksFile,     // Single source of truth, edited by humans
  executions: Execution[]           // Historical and active execution tracking
}

Execution = {
  id: string,
  tasks_json_before: TasksFile,     // Snapshot when execution started
  tasks_json_after: TasksFile,      // Snapshot when execution completed
  branch_name: `execution-${id}`,
  status: 'running' | 'completed' | 'abandoned'
}
```

### Core Components

#### 1. PRD Generation Engine

- **Input**: Client conversation context
- **Output**: Product Requirements Document (PRD)
- **Trigger**: Automatic detection of "sufficient context for a PRD"
- **Behavior**: Multiple PRDs can be created and appended during extended conversations
- **Current Status**: Deliberately out of scope for initial implementation

#### 2. Task Discovery & Management

- **Tool**: Taskmaster CLI (existing, reused)
- **Function**: Converts PRD into executable tasks, manages task dependencies
- **Key Constraint**: Once PRD is analyzed and tasks created, PRD is discarded. Updates require new PRD creation and task appending
- **Task Granularity**: Each task must be "showable" - a meaningful feature increment that clients can evaluate

#### 3. Code Generation Agent

- **Input**: Task description from Taskmaster
- **Output**: Implemented code, tests, deployment artifacts
- **Execution Model**: One execution = one atomic agent run covering one or more sequential tasks
- **Integration**: Black box approach - agent determines internal task sequencing

#### 4. Deployment Pipeline

- **Strategy**: Docker-first deployment with fresh environments per checkpoint
- **Environment**: Preview environments, no migration concerns (always deployed from scratch)
- **URL Generation**: Each task completion generates unique deployment URL
- **Integration**: Likely GitHub CI integration for automated deployment

### Execution Flow

#### Normal Execution Cycle

1. `taskmaster.next()` reads `master_tasks_json` and returns next incomplete task(s)
2. Create new Execution record with current tasks_json snapshot
3. Agent implements returned task(s) atomically
4. Upon completion:
   - Update `execution.tasks_json_after`
   - Commit code changes to execution branch
   - Deploy to unique preview URL
   - Mark execution as completed
5. Repeat from step 1 until all tasks complete

#### Human Intervention Flow

1. Human edits `master_tasks_json` (only source of task modifications)
2. System identifies if changes affect currently running executions:
   - **No Impact**: Changes to future tasks while agent works on current tasks
   - **Impact Required**: Changes to tasks that are:
     - Currently being executed
     - Already completed in running executions
3. For impacted executions:
   - Abandon current execution(s)
   - Create new execution starting from modified task
   - Previous work is preserved but abandoned branch continues to exist

### Storage Architecture

#### Code Storage

- **Repository**: Git-based with branch-per-execution model
- **Branch Naming**: `execution-${execution_id}`
- **Merge Strategy**: Merge commits, likely with PR chains for progress visibility

#### State Storage

- **Master tasks.json**: External storage (database/file system), not in git to avoid merge conflicts
- **Execution Snapshots**: External storage, referenced by execution ID
- **Derivable Data**: Branch names, deployment URLs, execution hashes computed on-demand

### Key Architectural Constraints

#### PRD Handling

- **Immutable After Processing**: PRDs are discarded after task generation
- **Update Strategy**: New PRDs appended to existing task list
- **State Hash**: Combination of all PRD hashes + tasks.json hash

#### Task Management

- **Master Authority**: Only `master_tasks_json` drives execution
- **Snapshot Purpose**: Execution snapshots exist purely for observability and tracking
- **Agent Integration**: Taskmaster CLI always reads from master, never from snapshots

#### Human Intervention Rules

- **Edit Scope**: Humans only edit master_tasks_json
- **Change Impact**: Only changes to incomplete tasks that affect running executions trigger intervention
- **Recovery Strategy**: Complete restart from modified task (no context preservation from abandoned work)

## Implementation Phases

### Phase 1: Core Pipeline (Current Focus)

- PRD to deployed project flow
- Basic human intervention (task-level)
- Single execution tracking
- Docker deployment integration

### Phase 2: Enhanced Features (Future)

- Concurrent execution support
- Advanced retry logic with exponential backoff
- Execution locking mechanisms
- Context preservation across interventions

### Phase 3: Production Features (Future)

- Multiple concurrent conversations
- Advanced progress visualization
- Comprehensive failure recovery
- Performance optimizations

## Open Questions & Future Considerations

### Immediate Implementation Questions

1. **Deployment Strategy Details**: Specific CI/CD pipeline integration approach
2. **Execution Cleanup**: Strategy for managing accumulated branches and deployments
3. **Concurrency Control**: Locking mechanisms for multi-user scenarios

### Future Enhancements

1. **Context Learning**: Preserving agent-learned context across task interventions
2. **Tree Execution**: Support for parallel execution branches
3. **Advanced Task Granularity**: More sophisticated task breakdown and dependency management
4. **Multi-tenant Support**: Multiple simultaneous client conversations

## Success Metrics

The architecture succeeds when:

- Client conversations can immediately produce working demos
- Human intervention is seamless and non-destructive to completed work
- System handles failures gracefully with full recovery capabilities
- Each task increment provides meaningful client value
- Development progress is completely transparent and auditable
