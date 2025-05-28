// @vibe-generated: conforms to taskmaster-interface
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Option, Schema } from "effect";
import {
  generateTasks,
  createValidationUtils,
  createFileOperations,
  createCliWrapper,
  createTaskUtils,
  createDefaultDependencies,
} from "./index.js";
import { type GenerateTasksDeps } from "@taiga-task-master/taskmaster-interface";
import {
  type TasksFileContent,
  type PrdText,
  type TaskId,
  castNonEmptyString,
  TaskId as TaskIdSchema,
} from "@taiga-task-master/common";
import type { TrackerTask } from "@taiga-task-master/tasktracker-interface";

// Mock fs module
vi.mock("fs", () => ({
  promises: {
    writeFile: vi.fn(),
    readFile: vi.fn(),
    unlink: vi.fn(),
    access: vi.fn(),
  },
}));

// Mock child_process
vi.mock("child_process", () => ({
  exec: vi.fn(),
}));

const mockFs = await vi.importMock<typeof import("fs")>("fs");

describe("Task Generation Service", () => {
  const mockPrd = "# Test PRD\nThis is a test PRD content" as PrdText;
  const createTaskId = (n: number): TaskId =>
    Schema.decodeSync(TaskIdSchema)(n);
  const mockTasksFileContent: TasksFileContent = {
    tasks: [
      {
        id: createTaskId(1),
        title: "Test Task",
        description: "Test description",
        status: "pending",
        dependencies: [],
        details: "Test details",
        testStrategy: "Test strategy",
        subtasks: [],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createValidationUtils", () => {
    it("should validate valid tasks file content", () => {
      const validation = createValidationUtils();

      expect(() =>
        validation.validateTasksFileContent(mockTasksFileContent)
      ).not.toThrow();
    });

    it("should throw error for invalid tasks file content", () => {
      const validation = createValidationUtils();

      expect(() =>
        validation.validateTasksFileContent({ invalid: "data" })
      ).toThrow("Task validation failed");
    });

    it("should validate tasks file from filesystem", async () => {
      const validation = createValidationUtils();
      const filePath = castNonEmptyString("test.json");

      mockFs.promises.readFile.mockResolvedValueOnce(
        JSON.stringify(mockTasksFileContent)
      );

      const result = await validation.validateTasksFile(filePath);
      expect(result).toEqual(mockTasksFileContent);
      expect(mockFs.promises.readFile).toHaveBeenCalledWith(filePath, "utf8");
    });

    it("should throw error for invalid JSON", async () => {
      const validation = createValidationUtils();
      const filePath = castNonEmptyString("test.json");

      mockFs.promises.readFile.mockResolvedValueOnce("invalid json");

      await expect(validation.validateTasksFile(filePath)).rejects.toThrow(
        "Invalid JSON in tasks file"
      );
    });
  });

  describe("createFileOperations", () => {
    it("should save PRD file and return disposable", async () => {
      const fileOps = createFileOperations();
      const path = castNonEmptyString("test.txt");

      mockFs.promises.writeFile.mockResolvedValueOnce(undefined);

      const disposable = await fileOps.savePrd(path, mockPrd);

      expect(mockFs.promises.writeFile).toHaveBeenCalledWith(
        path,
        mockPrd,
        "utf8"
      );
      expect(typeof disposable[Symbol.asyncDispose]).toBe("function");
    });

    it("should clean up file on disposal", async () => {
      const fileOps = createFileOperations();
      const path = castNonEmptyString("test.txt");

      mockFs.promises.writeFile.mockResolvedValueOnce(undefined);
      mockFs.promises.unlink.mockResolvedValueOnce(undefined);

      const disposable = await fileOps.savePrd(path, mockPrd);
      await disposable[Symbol.asyncDispose]();

      expect(mockFs.promises.unlink).toHaveBeenCalledWith(path);
    });

    it("should handle cleanup errors gracefully", async () => {
      const fileOps = createFileOperations();
      const path = castNonEmptyString("test.txt");

      mockFs.promises.writeFile.mockResolvedValueOnce(undefined);
      mockFs.promises.unlink.mockRejectedValueOnce(new Error("File not found"));

      const disposable = await fileOps.savePrd(path, mockPrd);

      // Should not throw
      await expect(disposable[Symbol.asyncDispose]()).resolves.toBeUndefined();
    });

    it("should read tasks JSON file", async () => {
      const fileOps = createFileOperations();
      const path = castNonEmptyString("tasks.json");

      mockFs.promises.readFile.mockResolvedValueOnce(
        JSON.stringify(mockTasksFileContent)
      );

      const result = await fileOps.readTasksJson(path);
      expect(result).toEqual(mockTasksFileContent);
    });
  });

  describe("createTaskUtils", () => {
    it("should convert tasks JSON to TrackerTask array", () => {
      const taskUtils = createTaskUtils();

      const result = taskUtils.tasksFromJson(mockTasksFileContent);

      expect(result).toEqual([{ masterId: createTaskId(1) }]);
    });
  });

  describe("generateTasks function", () => {
    it("should throw error when current tasks are provided", async () => {
      const mockDeps: GenerateTasksDeps = {
        savePrd: vi.fn(),
        cli: { generate: vi.fn() },
        readTasksJson: vi.fn(),
        tasksFromJson: vi.fn(),
      };

      const generateTasksFunc = generateTasks(mockDeps);

      await expect(
        generateTasksFunc(mockPrd, Option.some(mockTasksFileContent))
      ).rejects.toThrow("panic! PRD update not implemented");
    });

    it("should generate tasks successfully", async () => {
      const mockTrackerTasks: TrackerTask[] = [{ masterId: createTaskId(1) }];

      const mockDeps: GenerateTasksDeps = {
        savePrd: vi.fn().mockResolvedValue({
          [Symbol.asyncDispose]: vi.fn(),
        }),
        cli: {
          generate: vi.fn().mockResolvedValue(mockTrackerTasks),
        },
        readTasksJson: vi.fn().mockResolvedValue(mockTasksFileContent),
        tasksFromJson: vi.fn().mockReturnValue(mockTrackerTasks),
      };

      const generateTasksFunc = generateTasks(mockDeps);
      const result = await generateTasksFunc(mockPrd, Option.none());

      expect(result).toEqual(mockTrackerTasks);
      expect(mockDeps.savePrd).toHaveBeenCalledWith("scripts/prd.txt", mockPrd);
      expect(mockDeps.cli.generate).toHaveBeenCalledWith(
        "scripts/prd.txt",
        "tasks/tasks.json"
      );
    });

    it("should handle CLI generation errors", async () => {
      const mockDeps: GenerateTasksDeps = {
        savePrd: vi.fn().mockResolvedValue({
          [Symbol.asyncDispose]: vi.fn(),
        }),
        cli: {
          generate: vi.fn().mockRejectedValue(new Error("CLI failed")),
        },
        readTasksJson: vi.fn(),
        tasksFromJson: vi.fn(),
      };

      const generateTasksFunc = generateTasks(mockDeps);

      await expect(generateTasksFunc(mockPrd, Option.none())).rejects.toThrow(
        "CLI failed"
      );
    });
  });

  describe("createDefaultDependencies", () => {
    it("should create dependencies with validation", () => {
      const deps = createDefaultDependencies();

      expect(deps).toHaveProperty("savePrd");
      expect(deps).toHaveProperty("cli");
      expect(deps).toHaveProperty("readTasksJson");
      expect(deps).toHaveProperty("tasksFromJson");
    });

    it("should validate tasks when reading JSON", async () => {
      const deps = createDefaultDependencies();
      const path = castNonEmptyString("tasks.json");

      mockFs.promises.readFile.mockResolvedValueOnce(
        JSON.stringify(mockTasksFileContent)
      );

      const result = await deps.readTasksJson(path);
      expect(result).toEqual(mockTasksFileContent);
    });

    it("should validate tasks structure when converting from JSON", () => {
      const deps = createDefaultDependencies();

      const result = deps.tasksFromJson(mockTasksFileContent);
      expect(result).toEqual([{ masterId: createTaskId(1) }]);
    });
  });

  describe("CLI integration", () => {
    it("should provide CLI wrapper", () => {
      const cli = createCliWrapper();
      expect(cli.generate).toBeDefined();
      expect(typeof cli.generate).toBe("function");
    });
  });
});
