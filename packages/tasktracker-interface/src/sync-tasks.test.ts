// @vibe-generated: conforms to tasktracker-interface
import { describe, it, expect, vi } from "vitest";
import { Schema } from "effect";
import {
  TaskId,
  ProjectId,
  TaskFileContent,
  UniqTaskFileContentList,
  SINGLETON_PROJECT_ID,
  UniqTaskFileContentListTypeSchema,
} from "@taiga-task-master/common";
import {
  syncTasks,
  type SyncTasksDeps,
  TaskText as TaskTextSchema,
  TaskTrackerTasksResult,
} from "./index.js";

describe("syncTasks", () => {
  const createTaskId = (n: number) => Schema.decodeSync(TaskId)(n);
  const createTaskText = (text: string) =>
    Schema.decodeSync(TaskTextSchema)(text);
  const testProjectId = SINGLETON_PROJECT_ID;

  const createMockTaskFileContent = (
    id: number,
    title = "Test Task",
    description = "Test Description",
    details = "Test Details",
    testStrategy = "Test Strategy"
  ): TaskFileContent => {
    return Schema.decodeSync(TaskFileContent)({
      id,
      title,
      description,
      status: "pending",
      dependencies: [],
      details,
      testStrategy,
      subtasks: [],
    });
  };

  const createMockDeps = (): SyncTasksDeps => ({
    getTasks: vi.fn(),
    addTasks: vi.fn(),
    updateTasks: vi.fn(),
    renderTask: vi.fn(),
  });

  describe("task synchronization logic", () => {
    it("should add new tasks when none exist in tracker", async () => {
      const deps = createMockDeps();
      const mockTasks = [
        createMockTaskFileContent(1),
        createMockTaskFileContent(2),
      ];
      const uniqTasks = Schema.decodeSync(UniqTaskFileContentListTypeSchema)(
        mockTasks
      );

      // Mock empty tracker response
      vi.mocked(deps.getTasks).mockResolvedValue(
        Schema.decodeSync(TaskTrackerTasksResult)([])
      );
      vi.mocked(deps.renderTask)
        .mockReturnValueOnce(createTaskText("Rendered Task 1"))
        .mockReturnValueOnce(createTaskText("Rendered Task 2"));

      await syncTasks(deps)(uniqTasks, testProjectId);

      expect(deps.getTasks).toHaveBeenCalledWith(
        new Set([createTaskId(1), createTaskId(2)]),
        testProjectId
      );
      expect(deps.addTasks).toHaveBeenCalledWith(
        new Map([
          [createTaskId(1), createTaskText("Rendered Task 1")],
          [createTaskId(2), createTaskText("Rendered Task 2")],
        ]),
        testProjectId
      );
      expect(deps.updateTasks).toHaveBeenCalledWith(new Map(), testProjectId);
    });

    it("should update existing tasks when they exist in tracker", async () => {
      const deps = createMockDeps();
      const mockTasks = [
        createMockTaskFileContent(1),
        createMockTaskFileContent(2),
      ];
      const uniqTasks = Schema.decodeSync(UniqTaskFileContentListTypeSchema)(
        mockTasks
      );

      // Mock tracker response with existing tasks
      vi.mocked(deps.getTasks).mockResolvedValue(
        Schema.decodeSync(TaskTrackerTasksResult)([
          createTaskId(1),
          createTaskId(2),
        ])
      );
      vi.mocked(deps.renderTask)
        .mockReturnValueOnce(createTaskText("Updated Task 1"))
        .mockReturnValueOnce(createTaskText("Updated Task 2"));

      await syncTasks(deps)(uniqTasks, testProjectId);

      expect(deps.addTasks).toHaveBeenCalledWith(new Map(), testProjectId);
      expect(deps.updateTasks).toHaveBeenCalledWith(
        new Map([
          [createTaskId(1), createTaskText("Updated Task 1")],
          [createTaskId(2), createTaskText("Updated Task 2")],
        ]),
        testProjectId
      );
    });

    it("should handle mixed new and existing tasks", async () => {
      const deps = createMockDeps();
      const mockTasks = [
        createMockTaskFileContent(1), // new
        createMockTaskFileContent(2), // existing
        createMockTaskFileContent(3), // new
      ];
      const uniqTasks = Schema.decodeSync(UniqTaskFileContentListTypeSchema)(
        mockTasks
      );

      // Mock tracker response with task 2 existing
      vi.mocked(deps.getTasks).mockResolvedValue(
        Schema.decodeSync(TaskTrackerTasksResult)([createTaskId(2)])
      );
      vi.mocked(deps.renderTask)
        .mockReturnValueOnce(createTaskText("New Task 1")) // excluded tasks first (non-existing)
        .mockReturnValueOnce(createTaskText("New Task 3")) // excluded tasks
        .mockReturnValueOnce(createTaskText("Updated Task 2")); // satisfying tasks (existing)

      await syncTasks(deps)(uniqTasks, testProjectId);

      // Note: partition returns [excluded, satisfying], so toAdd gets excluded (non-existing), toUpdate gets satisfying (existing)
      expect(deps.addTasks).toHaveBeenCalledWith(
        new Map([
          [createTaskId(1), createTaskText("New Task 1")],
          [createTaskId(3), createTaskText("New Task 3")],
        ]),
        testProjectId
      );
      expect(deps.updateTasks).toHaveBeenCalledWith(
        new Map([[createTaskId(2), createTaskText("Updated Task 2")]]),
        testProjectId
      );
    });

    it("should handle empty task list", async () => {
      const deps = createMockDeps();
      const uniqTasks = Schema.decodeSync(UniqTaskFileContentList)([]);

      vi.mocked(deps.getTasks).mockResolvedValue(
        Schema.decodeSync(TaskTrackerTasksResult)([])
      );

      await syncTasks(deps)(uniqTasks, testProjectId);

      expect(deps.getTasks).toHaveBeenCalledWith(new Set(), testProjectId);
      expect(deps.addTasks).toHaveBeenCalledWith(new Map(), testProjectId);
      expect(deps.updateTasks).toHaveBeenCalledWith(new Map(), testProjectId);
    });

    it("should call renderTask for each task exactly once", async () => {
      const deps = createMockDeps();
      const mockTasks = [
        createMockTaskFileContent(1),
        createMockTaskFileContent(2),
      ];
      const uniqTasks = Schema.decodeSync(UniqTaskFileContentListTypeSchema)(
        mockTasks
      );

      vi.mocked(deps.getTasks).mockResolvedValue(
        Schema.decodeSync(TaskTrackerTasksResult)([])
      );
      vi.mocked(deps.renderTask).mockReturnValue(
        createTaskText("Rendered Task")
      );

      await syncTasks(deps)(uniqTasks, testProjectId);

      expect(deps.renderTask).toHaveBeenCalledTimes(2);
      expect(deps.renderTask).toHaveBeenCalledWith(mockTasks[0]);
      expect(deps.renderTask).toHaveBeenCalledWith(mockTasks[1]);
    });

    it("should execute addTasks and updateTasks concurrently", async () => {
      const deps = createMockDeps();
      const mockTasks = [
        createMockTaskFileContent(1), // new
        createMockTaskFileContent(2), // existing
      ];
      const uniqTasks = Schema.decodeSync(UniqTaskFileContentListTypeSchema)(
        mockTasks
      );

      vi.mocked(deps.getTasks).mockResolvedValue(
        Schema.decodeSync(TaskTrackerTasksResult)([createTaskId(2)])
      );
      vi.mocked(deps.renderTask).mockReturnValue(
        createTaskText("Rendered Task")
      );

      const state = {
        addTasksStarted: false,
        updateTasksStarted: false,
        addTasksResolved: false,
        updateTasksResolved: false,
      };

      vi.mocked(deps.addTasks).mockImplementation(async () => {
        state.addTasksStarted = true;
        await new Promise((resolve) => setTimeout(resolve, 50));
        state.addTasksResolved = true;
        expect(state.updateTasksStarted).toBe(true); // Should have started concurrently
        expect(state.updateTasksResolved).toBe(false); // Should not have resolved yet
      });

      vi.mocked(deps.updateTasks).mockImplementation(async () => {
        state.updateTasksStarted = true;
        await new Promise((resolve) => setTimeout(resolve, 100));
        state.updateTasksResolved = true;
      });

      await syncTasks(deps)(uniqTasks, testProjectId);

      expect(state.addTasksResolved).toBe(true);
      expect(state.updateTasksResolved).toBe(true);
    });
  });

  describe("dependency validation", () => {
    it("should call getTasks with correct task IDs", async () => {
      const deps = createMockDeps();
      const mockTasks = [
        createMockTaskFileContent(5),
        createMockTaskFileContent(10),
        createMockTaskFileContent(15),
      ];
      const uniqTasks = Schema.decodeSync(UniqTaskFileContentListTypeSchema)(
        mockTasks
      );

      vi.mocked(deps.getTasks).mockResolvedValue(
        Schema.decodeSync(TaskTrackerTasksResult)([])
      );
      vi.mocked(deps.renderTask).mockReturnValue(
        createTaskText("Rendered Task")
      );

      await syncTasks(deps)(uniqTasks, testProjectId);

      expect(deps.getTasks).toHaveBeenCalledWith(
        new Set([createTaskId(5), createTaskId(10), createTaskId(15)]),
        testProjectId
      );
    });

    it("should use correct projectId for all operations", async () => {
      const deps = createMockDeps();
      const customProjectId = Schema.decodeSync(ProjectId)("custom-project");
      const mockTasks = [createMockTaskFileContent(1)];
      const uniqTasks = Schema.decodeSync(UniqTaskFileContentListTypeSchema)(
        mockTasks
      );

      vi.mocked(deps.getTasks).mockResolvedValue(
        Schema.decodeSync(TaskTrackerTasksResult)([])
      );
      vi.mocked(deps.renderTask).mockReturnValue(
        createTaskText("Rendered Task")
      );

      await syncTasks(deps)(uniqTasks, customProjectId);

      expect(deps.getTasks).toHaveBeenCalledWith(
        expect.any(Set),
        customProjectId
      );
      expect(deps.addTasks).toHaveBeenCalledWith(
        expect.any(Map),
        customProjectId
      );
      expect(deps.updateTasks).toHaveBeenCalledWith(
        expect.any(Map),
        customProjectId
      );
    });
  });
});
