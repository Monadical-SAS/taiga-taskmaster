// @vibe-generated: mock data generators for simulation

import { TaskId } from "@taiga-task-master/common";
import type {
  MockTask,
  Tasks,
  Artifact,
  SimulationState,
  ArtifactId,
} from "./types.js";
import { HashMap, Schema } from "effect";
import {
  castNonNegativeInteger,
  castNonEmptyString,
} from "@taiga-task-master/common";

/* eslint-disable functional/no-expression-statements, functional/immutable-data */
const state = {
  taskIdCounter: 1,
  artifactIdCounter: 1,
};

export const resetCounters = (): void => {
  state.taskIdCounter = 1;
  state.artifactIdCounter = 1;
};

export const generateTaskId = (): TaskId =>
  Schema.decodeSync(TaskId)(state.taskIdCounter++);

export const generateArtifactId = (): ArtifactId =>
  castNonEmptyString(`artifact-${state.artifactIdCounter++}`);

export const createArtifactId = (id: string): ArtifactId =>
  castNonEmptyString(id);

const randomChoice = <T>(items: T[]): T => {
  const randomIndex = Math.floor(Math.random() * items.length);
  const item = items[randomIndex];
  if (item === undefined) {
    throw new Error("randomChoice: items array is empty");
  }
  return item;
};

const taskTitles = [
  "Lorem ipsum setup",
  "Dolor sit implementation",
  "Amet consectetur refactor",
  "Adipiscing elit feature",
  "Sed do eiusmod testing",
  "Tempor incididunt cleanup",
  "Labore et dolore validation",
  "Magna aliqua optimization",
];

const taskDescriptions = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
  "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  "Ut enim ad minim veniam, quis nostrud exercitation.",
  "Duis aute irure dolor in reprehenderit in voluptate.",
  "Excepteur sint occaecat cupidatat non proident.",
  "Sunt in culpa qui officia deserunt mollit anim.",
  "At vero eos et accusamus et iusto odio dignissimos.",
  "Et harum quidem rerum facilis est et expedita distinctio.",
];

export const generateMockTask = (): MockTask => {
  const id = generateTaskId();
  return {
    id,
    title: randomChoice(taskTitles),
    description: randomChoice(taskDescriptions),
  };
};

export const generateMockTasks = (count: number): Tasks => {
  const taskEntries = Array.from({ length: count }, () => {
    const task = generateMockTask();
    return [task.id, task] as [TaskId, MockTask];
  });
  return HashMap.fromIterable(taskEntries);
};

export const generateMockArtifact = (
  completedTasks: Tasks,
  artifactId?: ArtifactId
): Artifact => {
  const id = artifactId || generateArtifactId();
  return {
    id,
    tasks: completedTasks,
    branchName: `execution-${id}`,
    prUrl: `https://github.com/mock/repo/pull/${state.artifactIdCounter}`,
    deploymentUrl: `https://deploy-${id}.example.com`,
  };
};

export const createInitialState = (taskCount: number = 5): SimulationState => {
  return {
    tasks: generateMockTasks(taskCount),
    timestamp: castNonNegativeInteger(Date.now()),
    artifacts: [],
    outputTasks: [],
    taskExecutionState: {
      agentExecutionState: { step: "stopped" },
    },
  };
};

export const mockAgentProgressTexts = [
  "Analyzing task requirements...",
  "Setting up development environment...",
  "Implementing core functionality...",
  "Writing unit tests...",
  "Running integration tests...",
  "Optimizing performance...",
  "Updating documentation...",
  "Finalizing implementation...",
];
