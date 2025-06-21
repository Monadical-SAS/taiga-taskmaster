// @vibe-generated: Unit tests for core TasksMachine functions
import { describe, it, expect } from "vitest";
import { HashMap } from "effect";
import { TasksMachine } from "./core.js";
import { castNonNegativeInteger, type TaskId } from "@taiga-task-master/common";

// Helper to create test state
const createTestState = (): TasksMachine.State => ({
  tasks: HashMap.make(
    [1 as TaskId, { id: 1, title: "Task 1", status: "pending" }],
    [2 as TaskId, { id: 2, title: "Task 2", status: "pending" }],
    [3 as TaskId, { id: 3, title: "Task 3", status: "pending" }]
  ),
  timestamp: castNonNegativeInteger(Date.now()),
  taskExecutionState: { step: "stopped" },
  outputTasks: [],
  artifacts: [
    {
      id: "artifact-1",
      tasks: HashMap.make(
        [4 as TaskId, { id: 4, title: "Task 4", status: "completed" }],
        [5 as TaskId, { id: 5, title: "Task 5", status: "completed" }]
      ),
    }
  ],
});

describe("TasksMachine.editTask", () => {
  describe("editing tasks in main tasks list", () => {
    it("should edit a task that exists in main tasks", () => {
      const state = createTestState();
      const editedTask = { id: 1, title: "Edited Task 1", status: "in-progress" };
      
      const [newState, removedArtifacts] = TasksMachine.editTask(
        1 as TaskId,
        editedTask
      )(state);
      
      // Should return the task and no artifacts removed
      expect(removedArtifacts).toEqual([]);
      
      // Task should be updated in main tasks
      const updatedTask = HashMap.get(newState.tasks, 1 as TaskId);
      expect(updatedTask._tag).toBe("Some");
      if (updatedTask._tag === "Some") {
        expect(updatedTask.value).toEqual(editedTask);
      }
      
      // Other tasks should remain unchanged
      expect(HashMap.size(newState.tasks)).toBe(3);
      expect(newState.artifacts).toEqual(state.artifacts);
    });

    it("should preserve other tasks when editing one task", () => {
      const state = createTestState();
      const originalTask2 = HashMap.get(state.tasks, 2 as TaskId);
      const originalTask3 = HashMap.get(state.tasks, 3 as TaskId);
      
      const editedTask = { id: 1, title: "Edited Task 1", status: "in-progress" };
      
      const [newState] = TasksMachine.editTask(
        1 as TaskId,
        editedTask
      )(state);
      
      // Other tasks should remain unchanged
      const task2 = HashMap.get(newState.tasks, 2 as TaskId);
      const task3 = HashMap.get(newState.tasks, 3 as TaskId);
      
      expect(task2).toEqual(originalTask2);
      expect(task3).toEqual(originalTask3);
    });
  });

  describe("editing tasks in artifacts", () => {
    it("should edit a task in an artifact and remove that artifact", () => {
      const state = createTestState();
      const editedTask = { id: 4, title: "Edited Task 4", status: "pending" };
      
      const [newState, removedArtifacts] = TasksMachine.editTask(
        4 as TaskId,
        editedTask
      )(state);
      
      // Should remove the artifact containing the task
      expect(removedArtifacts).toEqual(["artifact-1"]);
      expect(newState.artifacts).toEqual([]);
      
      // Task should be moved back to main tasks with edits applied
      const updatedTask = HashMap.get(newState.tasks, 4 as TaskId);
      expect(updatedTask._tag).toBe("Some");
      if (updatedTask._tag === "Some") {
        expect(updatedTask.value).toEqual(editedTask);
      }
      
      // Other task from the artifact should also be returned to main tasks
      const otherTask = HashMap.get(newState.tasks, 5 as TaskId);
      expect(otherTask._tag).toBe("Some");
      
      // Total tasks should be original tasks + tasks from removed artifact
      expect(HashMap.size(newState.tasks)).toBe(5); // 3 original + 2 from artifact
    });

    it("should remove artifacts in the correct order (tail removal)", () => {
      // Create state with multiple artifacts
      const state: TasksMachine.State = {
        ...createTestState(),
        artifacts: [
          {
            id: "artifact-1",
            tasks: HashMap.make([6 as TaskId, { id: 6, title: "Task 6", status: "completed" }]),
          },
          {
            id: "artifact-2", 
            tasks: HashMap.make([7 as TaskId, { id: 7, title: "Task 7", status: "completed" }]),
          },
          {
            id: "artifact-3",
            tasks: HashMap.make([8 as TaskId, { id: 8, title: "Task 8", status: "completed" }]),
          }
        ],
      };
      
      // Edit task in the middle artifact
      const editedTask = { id: 7, title: "Edited Task 7", status: "pending" };
      
      const [newState, removedArtifacts] = TasksMachine.editTask(
        7 as TaskId,
        editedTask
      )(state);
      
      // Should remove artifact-2 and artifact-3 (tail removal)
      expect(removedArtifacts).toEqual(["artifact-2", "artifact-3"]);
      expect(newState.artifacts).toEqual([state.artifacts[0]]); // Only artifact-1 remains
      
      // Tasks from removed artifacts should be in main tasks
      const task7 = HashMap.get(newState.tasks, 7 as TaskId);
      const task8 = HashMap.get(newState.tasks, 8 as TaskId);
      expect(task7._tag).toBe("Some");
      expect(task8._tag).toBe("Some");
      
      // Edited task should have the new values
      if (task7._tag === "Some") {
        expect(task7.value).toEqual(editedTask);
      }
    });
  });

  describe("error cases", () => {
    it("should throw error for non-existent task", () => {
      const state = createTestState();
      const editedTask = { id: 999, title: "Non-existent", status: "pending" };
      
      expect(() => {
        TasksMachine.editTask(999 as TaskId, editedTask)(state);
      }).toThrow("panic! cannot edit task 999: no such task in artifacts neither in current tasks");
    });

    it("should throw error when no tasks or artifacts exist", () => {
      const emptyState: TasksMachine.State = {
        tasks: HashMap.empty(),
        timestamp: castNonNegativeInteger(Date.now()),
        artifacts: [],
        taskExecutionState: { step: "stopped" },
        outputTasks: [],
      };
      
      const editedTask = { id: 1, title: "Task", status: "pending" };
      
      expect(() => {
        TasksMachine.editTask(1 as TaskId, editedTask)(emptyState);
      }).toThrow("panic! cannot edit task 1: no such task in artifacts neither in current tasks");
    });
  });

  describe("state consistency", () => {
    it("should preserve timestamp and taskExecutionState", () => {
      const state = createTestState();
      const originalTimestamp = state.timestamp;
      const originalTaskExecutionState = state.taskExecutionState;
      
      const editedTask = { id: 1, title: "Edited Task 1", status: "in-progress" };
      
      const [newState] = TasksMachine.editTask(
        1 as TaskId,
        editedTask
      )(state);
      
      expect(newState.timestamp).toBe(originalTimestamp);
      expect(newState.taskExecutionState).toEqual(originalTaskExecutionState);
    });

    it("should maintain task ID consistency", () => {
      const state = createTestState();
      const editedTask = { id: 1, title: "Edited Task 1", status: "in-progress" };
      
      const [newState] = TasksMachine.editTask(
        1 as TaskId,
        editedTask
      )(state);
      
      // Task should still exist at the same ID
      const updatedTask = HashMap.get(newState.tasks, 1 as TaskId);
      expect(updatedTask._tag).toBe("Some");
      
      // All original task IDs should still be present
      expect(HashMap.has(newState.tasks, 1 as TaskId)).toBe(true);
      expect(HashMap.has(newState.tasks, 2 as TaskId)).toBe(true);
      expect(HashMap.has(newState.tasks, 3 as TaskId)).toBe(true);
    });
  });
});

describe("TasksMachine.appendTasks", () => {
  it("should append tasks to empty task list", () => {
    const state = createTestState();
    state.tasks = HashMap.empty();
    
    const newTasks = HashMap.make(
      [10 as TaskId, { id: 10, title: "New Task 10", status: "pending" }],
      [11 as TaskId, { id: 11, title: "New Task 11", status: "pending" }]
    );
    
    const newState = TasksMachine.appendTasks(newTasks)(state);
    
    expect(HashMap.size(newState.tasks)).toBe(2);
    expect(HashMap.has(newState.tasks, 10 as TaskId)).toBe(true);
    expect(HashMap.has(newState.tasks, 11 as TaskId)).toBe(true);
  });

  it("should throw error when appending duplicate task IDs", () => {
    const state = createTestState();
    
    const duplicateTasks = HashMap.make(
      [1 as TaskId, { id: 1, title: "Duplicate Task", status: "pending" }]
    );
    
    expect(() => {
      TasksMachine.appendTasks(duplicateTasks)(state);
    }).toThrow("panic! tasks to append will create duplicates");
  });
});

describe("TasksMachine.addArtifact", () => {
  it("should create artifact from first output task", () => {
    const state = createTestState();
    // Add a task to outputTasks and remove it from main tasks (as it would be after task execution)
    const completedTask = { id: 1, title: "Task 1", status: "pending" };
    state.outputTasks = [[1 as TaskId, completedTask]];
    state.tasks = HashMap.remove(state.tasks, 1 as TaskId); // Remove from main tasks
    
    const newState = TasksMachine.addArtifact("test-artifact")(state);
    
    // Should have one more artifact
    expect(newState.artifacts.length).toBe(2);
    
    // New artifact should contain the first output task
    const newArtifact = newState.artifacts.find(a => a.id === "test-artifact");
    expect(newArtifact).toBeDefined();
    if (newArtifact) {
      expect(HashMap.size(newArtifact.tasks)).toBe(1);
      expect(HashMap.has(newArtifact.tasks, 1 as TaskId)).toBe(true);
    }
    
    // Output task should be removed from outputTasks
    expect(newState.outputTasks.length).toBe(0);
  });

  it("should throw error when no output tasks exist", () => {
    const state = createTestState();
    // Ensure outputTasks is empty
    state.outputTasks = [];
    
    expect(() => {
      TasksMachine.addArtifact("test-artifact")(state);
    }).toThrow("panic! cannot create artifact test-artifact: no tasks to add");
  });

  it("should throw error for duplicate artifact ID", () => {
    const state = createTestState();
    // Add a task to outputTasks and remove it from main tasks
    const completedTask = { id: 1, title: "Task 1", status: "pending" };
    state.outputTasks = [[1 as TaskId, completedTask]];
    state.tasks = HashMap.remove(state.tasks, 1 as TaskId);
    
    expect(() => {
      TasksMachine.addArtifact("artifact-1")(state); // artifact-1 already exists
    }).toThrow("panic! Artifact with id artifact-1 already exists");
  });

  it("should throw error if task is still in main tasks", () => {
    const state = createTestState();
    // Add a task to outputTasks that's still in main tasks (invalid state)
    state.outputTasks = [[1 as TaskId, { id: 1, title: "Task 1", status: "pending" }]];
    // Keep task in main tasks to create invalid state
    
    expect(() => {
      TasksMachine.addArtifact("test-artifact")(state);
    }).toThrow("panic! invalid state: 1 is in non-started tasks");
  });
});

describe("TasksMachine.commitArtifact", () => {
  it("should commit the first artifact", () => {
    const state = createTestState();
    
    const newState = TasksMachine.commitArtifact("artifact-1")(state);
    
    // Artifact should be removed
    expect(newState.artifacts.length).toBe(0);
    
    // Tasks from artifact should NOT be returned to main tasks (they are committed/done)
    expect(HashMap.size(newState.tasks)).toBe(3); // 3 original tasks remain
    expect(HashMap.has(newState.tasks, 4 as TaskId)).toBe(false);
    expect(HashMap.has(newState.tasks, 5 as TaskId)).toBe(false);
  });

  it("should throw error when committing wrong artifact", () => {
    const state = createTestState();
    
    expect(() => {
      TasksMachine.commitArtifact("wrong-artifact")(state);
    }).toThrow("panic! artifact to commit wrong-artifact isn't next in line; expected artifact-1");
  });

  it("should throw error when no artifacts exist", () => {
    const state = createTestState();
    state.artifacts = [];
    
    expect(() => {
      TasksMachine.commitArtifact("any-artifact")(state);
    }).toThrow("panic! artifact any-artifact not found in pending artifacts, moreover artifacts are empty");
  });
});

describe("TasksMachine.startTaskExecution", () => {
  it("should start execution of an existing pending task", () => {
    const state = createTestState();
    const taskToExecute = 1 as TaskId;
    
    const newState = TasksMachine.startTaskExecution(taskToExecute)(state);
    
    // Task should be removed from pending tasks
    expect(HashMap.has(newState.tasks, taskToExecute)).toBe(false);
    expect(HashMap.size(newState.tasks)).toBe(2); // Started with 3, removed 1
    
    // Task should be in execution state
    expect(newState.taskExecutionState.step).toBe("running");
    if (newState.taskExecutionState.step === "running") {
      expect(newState.taskExecutionState.task).toEqual([1 as TaskId, {
        id: 1,
        title: "Task 1",
        status: "pending"
      }]);
    }
    
    // Other tasks should remain unchanged
    expect(HashMap.has(newState.tasks, 2 as TaskId)).toBe(true);
    expect(HashMap.has(newState.tasks, 3 as TaskId)).toBe(true);
    
    // Artifacts should remain unchanged
    expect(newState.artifacts).toEqual(state.artifacts);
  });

  it("should preserve other state properties when starting task execution", () => {
    const state = createTestState();
    const originalTimestamp = state.timestamp;
    const originalArtifacts = state.artifacts;
    
    const newState = TasksMachine.startTaskExecution(1 as TaskId)(state);
    
    expect(newState.timestamp).toBe(originalTimestamp);
    expect(newState.artifacts).toEqual(originalArtifacts);
  });

  it("should throw error when trying to start non-existent task", () => {
    const state = createTestState();
    
    expect(() => {
      TasksMachine.startTaskExecution(999 as TaskId)(state);
    }).toThrow("panic! cannot start task execution: no such task");
  });

  it("should throw error when task execution is already in progress", () => {
    const state = createTestState();
    // Set execution state to already running
    state.taskExecutionState = {
      step: "running",
      task: [2 as TaskId, { id: 2, title: "Running Task", status: "pending" }]
    };
    
    expect(() => {
      TasksMachine.startTaskExecution(1 as TaskId)(state);
    }).toThrow("panic! cannot start task execution: task execution already in progress");
  });

  it("should work when agent execution state is stopped", () => {
    const state = createTestState();
    // Explicitly ensure agent execution state is stopped
    state.taskExecutionState = { step: "stopped" };
    
    const newState = TasksMachine.startTaskExecution(1 as TaskId)(state);
    
    // Should succeed and move task to execution
    expect(HashMap.has(newState.tasks, 1 as TaskId)).toBe(false);
    expect(newState.taskExecutionState.step).toBe("running");
  });

  it("should not start execution of tasks that are in artifacts", () => {
    const state = createTestState();
    
    // Try to start execution of a task that's in an artifact (task 4)
    expect(() => {
      TasksMachine.startTaskExecution(4 as TaskId)(state);
    }).toThrow("panic! cannot start task execution: no such task");
  });

  it("should handle starting execution when no artifacts exist", () => {
    const state = createTestState();
    state.artifacts = [];
    
    const newState = TasksMachine.startTaskExecution(1 as TaskId)(state);
    
    expect(HashMap.has(newState.tasks, 1 as TaskId)).toBe(false);
    expect(newState.taskExecutionState.step).toBe("running");
    expect(newState.artifacts).toEqual([]);
  });
});

describe("TasksMachine.endTaskExecution", () => {
  it("should move running task to output tasks", () => {
    const state = createTestState();
    // Set up a running task
    const runningTask = { id: 1, title: "Task 1", status: "pending" };
    state.taskExecutionState = {
      step: "running",
      task: [1 as TaskId, runningTask]
    };
    state.tasks = HashMap.remove(state.tasks, 1 as TaskId); // Task should not be in main tasks when running
    
    const newState = TasksMachine.endTaskExecution(state);
    
    // Task execution should be stopped
    expect(newState.taskExecutionState.step).toBe("stopped");
    
    // Task should be in output tasks
    expect(newState.outputTasks.length).toBe(1);
    expect(newState.outputTasks[0]).toEqual([1 as TaskId, runningTask]);
    
    // Other state should remain unchanged
    expect(newState.tasks).toEqual(state.tasks);
    expect(newState.artifacts).toEqual(state.artifacts);
    expect(newState.timestamp).toBe(state.timestamp);
  });

  it("should throw error when no task is running", () => {
    const state = createTestState();
    // Ensure task execution is stopped
    state.taskExecutionState = { step: "stopped" };
    
    expect(() => {
      TasksMachine.endTaskExecution(state);
    }).toThrow("panic! cannot end task execution: task execution not in progress");
  });

  it("should preserve existing output tasks", () => {
    const state = createTestState();
    // Set up existing output tasks
    const existingTask = { id: 2, title: "Existing Task", status: "pending" };
    state.outputTasks = [[2 as TaskId, existingTask]];
    
    // Set up a running task
    const runningTask = { id: 1, title: "Task 1", status: "pending" };
    state.taskExecutionState = {
      step: "running",
      task: [1 as TaskId, runningTask]
    };
    state.tasks = HashMap.remove(state.tasks, 1 as TaskId);
    
    const newState = TasksMachine.endTaskExecution(state);
    
    // Should have both existing and new output tasks
    expect(newState.outputTasks.length).toBe(2);
    expect(newState.outputTasks[0]).toEqual([2 as TaskId, existingTask]);
    expect(newState.outputTasks[1]).toEqual([1 as TaskId, runningTask]);
  });
});