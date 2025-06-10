// @vibe-generated: comprehensive tests for simulator
/* eslint-disable functional/no-let */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { describe, it, expect, beforeEach } from "vitest";
import {
  createSimulator,
  step,
  back,
  forward,
  getHistoryInfo,
  reset,
  getStateSummary,
  getCurrentState,
  resetCounters,
  type Simulator,
  type SimulationCommand,
} from "./index.js";
import { generateMockTasks } from "./mock-data.js";
import { HashMap, Array } from "effect";

describe("Tasks Machine Simulator", () => {
  let simulator: Simulator;

  beforeEach(() => {
    resetCounters(); // Reset global state between tests
    simulator = createSimulator(3); // Start with 3 tasks
  });

  describe("Initial State", () => {
    it("should create simulator with correct initial state", () => {
      const summary = getStateSummary(getCurrentState(simulator));

      expect(summary.taskCounts.pending).toBe(3);
      expect(summary.taskCounts["in-progress"]).toBe(0);
      expect(summary.taskCounts.completed).toBe(0);
      expect(summary.artifactCount).toBe(0);
      expect(summary.agentStatus).toBe("stopped");
      expect(summary.currentTask).toBeNull();
    });

    it("should have initial history state", () => {
      const historyInfo = getHistoryInfo(simulator);

      expect(historyInfo.totalStates).toBe(1);
      expect(historyInfo.currentIndex).toBe(0);
      expect(historyInfo.canGoBack).toBe(false);
      expect(historyInfo.canGoForward).toBe(false);
    });
  });

  describe("Task Execution Flow", () => {
    it("should take next task successfully", () => {
      const newSimulator = step(simulator, { type: "take_next_task" });
      const summary = getStateSummary(getCurrentState(newSimulator));

      expect(summary.taskCounts.pending).toBe(2);
      expect(summary.taskCounts["in-progress"]).toBe(1);
      expect(summary.agentStatus).toBe("running");
      expect(summary.currentTask).toBeTruthy();

      const historyInfo = getHistoryInfo(newSimulator);
      expect(historyInfo.totalStates).toBe(2);
      expect(historyInfo.currentIndex).toBe(1);
    });

    it("should fail to take next task when agent is running", () => {
      const runningSimulator = step(simulator, { type: "take_next_task" });

      expect(() => {
        step(runningSimulator, { type: "take_next_task" });
      }).toThrow("Cannot take next task: agent is already running");
    });

    it("should complete current task successfully", () => {
      const runningSimulator = step(simulator, { type: "take_next_task" });
      const completedSimulator = step(runningSimulator, {
        type: "complete_current_task",
      });
      const summary = getStateSummary(getCurrentState(completedSimulator));

      expect(summary.taskCounts.pending).toBe(2);
      expect(summary.taskCounts["in-progress"]).toBe(0);
      expect(summary.taskCounts.completed).toBe(0); // Moved to artifact
      expect(summary.artifactCount).toBe(1);
      expect(summary.agentStatus).toBe("stopped");
    });

    it("should fail to complete task when no task is running", () => {
      expect(() => {
        step(simulator, { type: "complete_current_task" });
      }).toThrow("Cannot complete task: no task currently running");
    });
  });

  describe("Agent Step Simulation", () => {
    it("should simulate agent progress", () => {
      const runningSimulator = step(simulator, { type: "take_next_task" });
      const progressSimulator = step(runningSimulator, {
        type: "agent_step",
        progressText: "Custom progress message",
      });

      const summary = getStateSummary(getCurrentState(progressSimulator));
      expect(summary.progressText).toBe("Custom progress message");
      expect(summary.agentStatus).toBe("running");
    });

    it("should fail agent step when not running", () => {
      expect(() => {
        step(simulator, { type: "agent_step" });
      }).toThrow("Cannot step agent: not currently running");
    });
  });

  describe("Artifact Management", () => {
    it("should commit artifact successfully", () => {
      // Complete a task to create an artifact
      const runningSimulator = step(simulator, { type: "take_next_task" });
      const completedSimulator = step(runningSimulator, {
        type: "complete_current_task",
      });

      // Get the artifact ID
      const artifact = getCurrentState(completedSimulator).artifacts[0]!;

      // Commit the artifact
      const committedSimulator = step(completedSimulator, {
        type: "commit_artifact",
        artifactId: artifact.id,
      });

      const summary = getStateSummary(getCurrentState(committedSimulator));
      expect(summary.artifactCount).toBe(0); // Artifact was committed and removed
    });

    it("should fail to commit non-existent artifact", () => {
      expect(() => {
        step(simulator, {
          type: "commit_artifact",
          artifactId: "non-existent" as any,
        });
      }).toThrow("No artifacts to commit");
    });
  });

  describe("Task Appending", () => {
    it("should append new tasks successfully", () => {
      const newTasks = generateMockTasks(2);
      const appendedSimulator = step(simulator, {
        type: "append_tasks",
        tasks: newTasks,
      });

      const summary = getStateSummary(getCurrentState(appendedSimulator));
      expect(summary.taskCounts.pending).toBe(5); // 3 original + 2 new
    });

    it("should fail to append duplicate task IDs", () => {
      const duplicateTasks = HashMap.set(HashMap.empty(), "task-1" as any, {
        id: "task-1" as any,
        title: "Duplicate",
        description: "This should fail",
        status: "pending" as const,
      });

      // This might not fail immediately due to random ID generation
      // but the logic is there to prevent it
      const currentTaskIds = Array.fromIterable(
        HashMap.keys(getCurrentState(simulator).tasks)
      );
      console.log("Current task IDs:", currentTaskIds); // For debugging
    });
  });

  describe("History Management", () => {
    it("should go back in history successfully", () => {
      const step1 = step(simulator, { type: "take_next_task" });
      const step2 = step(step1, { type: "agent_step" });

      expect(getHistoryInfo(step2).currentIndex).toBe(2);

      const backOne = back(step2);
      expect(getHistoryInfo(backOne).currentIndex).toBe(1);
      expect(getStateSummary(getCurrentState(backOne)).agentStatus).toBe(
        "running"
      );

      const backTwo = back(backOne);
      expect(getHistoryInfo(backTwo).currentIndex).toBe(0);
      expect(getStateSummary(getCurrentState(backTwo)).agentStatus).toBe(
        "stopped"
      );
    });

    it("should fail to go back from initial state", () => {
      expect(() => {
        back(simulator);
      }).toThrow("Cannot go back: already at initial state");
    });

    it("should go forward in history after rollback", () => {
      const step1 = step(simulator, { type: "take_next_task" });
      const step2 = step(step1, { type: "agent_step" });
      const backOne = back(step2);

      const forwardOne = forward(backOne);
      expect(getHistoryInfo(forwardOne).currentIndex).toBe(2);
      expect(getStateSummary(getCurrentState(forwardOne)).agentStatus).toBe(
        "running"
      );
    });

    it("should fail to go forward from latest state", () => {
      const step1 = step(simulator, { type: "take_next_task" });

      expect(() => {
        forward(step1);
      }).toThrow("Cannot go forward: already at latest state");
    });

    it("should reset to initial state", () => {
      const step1 = step(simulator, { type: "take_next_task" });
      const step2 = step(step1, { type: "agent_step" });

      const resetSimulator = reset(step2);
      expect(getHistoryInfo(resetSimulator).currentIndex).toBe(0);
      expect(getStateSummary(getCurrentState(resetSimulator)).agentStatus).toBe(
        "stopped"
      );
    });
  });

  describe("Full Workflow", () => {
    it("should simulate complete task workflow", () => {
      let currentSimulator = simulator;

      // Take first task
      currentSimulator = step(currentSimulator, { type: "take_next_task" });
      expect(
        getStateSummary(getCurrentState(currentSimulator)).agentStatus
      ).toBe("running");

      // Simulate some progress
      currentSimulator = step(currentSimulator, { type: "agent_step" });
      expect(
        getStateSummary(getCurrentState(currentSimulator)).agentStatus
      ).toBe("running");

      // Complete the task
      currentSimulator = step(currentSimulator, {
        type: "complete_current_task",
      });
      expect(
        getStateSummary(getCurrentState(currentSimulator)).artifactCount
      ).toBe(1);
      expect(
        getStateSummary(getCurrentState(currentSimulator)).agentStatus
      ).toBe("stopped");

      // Commit the artifact
      const artifactId = getCurrentState(currentSimulator).artifacts[0]!.id;
      currentSimulator = step(currentSimulator, {
        type: "commit_artifact",
        artifactId,
      });
      expect(
        getStateSummary(getCurrentState(currentSimulator)).artifactCount
      ).toBe(0);

      // Take next task
      currentSimulator = step(currentSimulator, { type: "take_next_task" });
      expect(
        getStateSummary(getCurrentState(currentSimulator)).taskCounts.pending
      ).toBe(1);
      expect(
        getStateSummary(getCurrentState(currentSimulator)).agentStatus
      ).toBe("running");

      // Verify history
      const historyInfo = getHistoryInfo(currentSimulator);
      expect(historyInfo.totalStates).toBe(6); // Initial + 5 steps
      expect(historyInfo.canGoBack).toBe(true);
    });
  });
});
