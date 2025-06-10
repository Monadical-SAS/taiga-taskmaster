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
  master_tasks_json: TasksFile,     // Single source of truth
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

-------- FAQ

> What are the complete task states?

Think about tasks not as of "tasks in task tracker". This would be VERY WRONG point of view.. Think about them as "units of work" for the agent to do in an automatic way, reporting the progress in-between for humans to get involved.

Therefore, the task can be only (from the point of view of the state machine): "queued", "running", (note that there's no "failed". failed tasks go back to "queued", report and stop execution until the tasks are specified better by human in the loop and machine is restarted, whether automatically or by human - TBD), "done" (effectively, PR is created in the PR chain), "committed" (went to master; no edits are possible) (although due to mutable nature of systems users can technically edit but it shouldn't change anything in the machine anymore). in type definitions the completed tasks become "artifacts".

> How do we model task metadata (assignee, estimated effort, dependencies, deployment URLs)?

Don't fucking think about it by the reasons above. The task is a atomic piece of work.

> Should task status changes be events or direct mutations

It's always functions, you get a state, you return a new state. Events are TBD but not to worry right now.

> Can multiple executions run simultaneously on different task subsets

One piece of task execution has: the state of the repo (all the tasks "done" up to the last one) (remember it's a chain of PRs). That means that the system is by-design can't get into race condition: even if two agents were working on the SAME task, they would just spawn two separate PRs.
But for safety, we'll have a lock at some point. It's just not a concern right now for MVP.

> What's the relationship between Execution (from the spec) and TaskExecutionState (from types)?

Executions from the spec are rather "artifacts". TaskExecutionState is only one singular state per agent that concerns the in-progress of the current task being executed.

> How do we model the git branch lifecycle

This is an implementation detail that I'm not sure I want to include into the core; the sole fact of Artifacts being an array should model the git branch lifecycle pretty well, non?

> Which task properties can humans edit, and when

they are able to edit anything anytime, the question is whether the edit makes sense to the system. when the task became a committed artifact, any edit does't make sense and can be ignored. the "currently executing" task, if edited or reordered, will have to be rerun of course

the task queue can be modified as the user wishes to (yet again note that the queue is not a real queue data structure, it's just a graph-like structure from which our code can "pull next task")

> How do we prevent edits that would break running executions
> we can't prevent edits but we can ignore them and report. the rest of the answer is above.

> Should we use event sourcing for auditability of human interventions

probably. we need to be able to rerun the state machnine from any point so..

> How do we model the "abandon execution and restart" flow from the spec?

I'm not sure we care much because it seems an implementation detail

> No dependency modeling in types, but spec mentions dependencies.

Consider the "task queue" as a black box already containing dependencies (because it's literally a graph inside).

> Should dependency resolution be part of the state machine or external

We DO already have a function that procures the next available task. no worries.

> simplistic

good. we need to keep core simple and free of implementation details. only domain design.

> How do we handle agent failures and retries?

what you mean how? exponential backoffs no?

> What information flows from the state machine to the agent

in the proposed implementation there's only "state" but we can return a state AND events if we want.

> How do we track agent progress within a task

we have no good way of doing it - it's a black box! we only have textual log of it, and we can give it some timeouts; but that's it. IN FAR FUTURE we can ask the agent to call our MCP to report its progress but that would be too very unreliable. agent is unreliable by design.

> Should agent state be part of our state machine or external

you will have to develop the question if you don't have the answer already

> Spec says PRDs are discarded, but we need audit trails

we'll have them somewhere, it's just not a concern of the task machine for now. don't think about it. it's whole another module of the system to TBD.

> Artifact concept is unclear

specific example: the code takes a task (or a group of tasks) as a unit of work. changes branch, sends the tasks to the agent. the agent modifies code in the branch. the control code sees that agent is finished successfully and PRs this branch into the _LAST ARTIFACT BRANCH AVAILABLE_ (to keep a chain of PRs) or into master. so artifact is a "task(s) completed" + its associated branch with PR and with deployment done (to check manually by a human)

> How do we track deployment URLs and their lifecycle

Not the concern of the core. We will work on it later.

> Should we model this as a formal state machine with events

It's already kind of that - it has state, it has functions that return new state. relax.

> Should we use a library like XState or build our own

again, relax, I know about XState buti t's really just reducers.

> Should we use branded types for IDs to prevent mixing them up

We should and you're welcome to add it to specs, but for now I keep the "guiding" code string-y to keep it short for LLMs to understand. We will definitely have branded types when I decide.

> How do we validate state invariants at runtime

Tests + assertions

> Should we use a schema validation library like Zod

Implemt-entation detail. But I alreadysch use effect-schema

> How do we handle state migration as the system evolves

we'll think about it later. no need to overcomplicate now

> Performance & Scalability Considerations

> How large can the task graph get

Small enough. not more than 100.

> Do we need pagination/lazy loading

what do you mean? we're not building an ui right now.

> Should we persist state to disk, and if so, how often

State is event sourcing so it's in db/on disk somewhere.

> How do we handle system crashes and state recovery

all is in db + in artifacts. if it crashes during task execution in the black box, welp we can't do anything to save it.

> Do we need event streaming for real-time UI updates

We will have it at some point but right now we develop the core.
