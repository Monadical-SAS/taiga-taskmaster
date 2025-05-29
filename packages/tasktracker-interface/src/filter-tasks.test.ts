// @vibe-generated: conforms to tasktracker-interface
import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import {
  TaskId,
  ProjectId,
  SINGLETON_PROJECT_ID,
} from "@taiga-task-master/common";
import { TaskDetail } from "@taiga-task-master/taiga-api-interface";
import { filterTasks } from "./index.js";

describe("filterTasks", () => {
  const createTaskId = (n: number) => Schema.decodeSync(TaskId)(n);
  const createProjectId = (id: string) => Schema.decodeSync(ProjectId)(id);
  const testProjectId = SINGLETON_PROJECT_ID;
  const _otherProjectId = createProjectId("other-project");

  const createTaskDetail = (
    id: number,
    tags: Array<[string, string | null]> = []
  ): TaskDetail => {
    return Schema.decodeSync(TaskDetail)({
      id,
      ref: id,
      subject: `Task ${id}`,
      description: `Description for task ${id}`,
      status: 1,
      project: 1,
      assigned_to: null,
      user_story: null,
      milestone: null,
      is_blocked: false,
      is_closed: false,
      blocked_note: "",
      created_date: "2024-01-01T00:00:00.000Z",
      modified_date: "2024-01-01T00:00:00.000Z",
      finished_date: null,
      tags,
      watchers: [],
      is_watcher: false,
      version: 1,
    });
  };

  describe("Happy Path", () => {
    it("should return all valid tasks when everything matches", () => {
      const expected = new Set([createTaskId(1), createTaskId(2)]);
      const allTasks = [
        createTaskDetail(1, [
          ["tm-project-taskmaster-test", null],
          ["tm-task-1", null],
        ]),
        createTaskDetail(2, [
          ["tm-project-taskmaster-test", null],
          ["tm-task-2", null],
        ]),
      ];

      const result = filterTasks(expected, allTasks, testProjectId);

      expect(result.valid.size).toBe(2);
      expect(result.valid.has(createTaskId(1))).toBe(true);
      expect(result.valid.has(createTaskId(2))).toBe(true);
      expect(result.unrelatedProject.size).toBe(0);
      expect(result.extra.size).toBe(0);
      expect(result.missing.size).toBe(0);
      expect(result.warnings.length).toBe(0);
      expect(result.dupes.size).toBe(0);
    });

    it("should handle empty inputs", () => {
      const expected = new Set<TaskId>();
      const allTasks: TaskDetail[] = [];

      const result = filterTasks(expected, allTasks, testProjectId);

      expect(result.valid.size).toBe(0);
      expect(result.unrelatedProject.size).toBe(0);
      expect(result.extra.size).toBe(0);
      expect(result.missing.size).toBe(0);
      expect(result.warnings.length).toBe(0);
      expect(result.dupes.size).toBe(0);
    });

    it("should handle partial matches", () => {
      const expected = new Set([
        createTaskId(1),
        createTaskId(2),
        createTaskId(3),
      ]);
      const allTasks = [
        createTaskDetail(1, [
          ["tm-project-taskmaster-test", null],
          ["tm-task-1", null],
        ]),
        // Task 2 is missing
        createTaskDetail(3, [
          ["tm-project-taskmaster-test", null],
          ["tm-task-3", null],
        ]),
      ];

      const result = filterTasks(expected, allTasks, testProjectId);

      expect(result.valid.size).toBe(2);
      expect(result.valid.has(createTaskId(1))).toBe(true);
      expect(result.valid.has(createTaskId(3))).toBe(true);
      expect(result.missing.size).toBe(1);
      expect(result.missing.has(createTaskId(2))).toBe(true);
    });
  });

  describe("Task Categorization", () => {
    it("should categorize unrelated project tasks", () => {
      const expected = new Set([createTaskId(1)]);
      const allTasks = [
        createTaskDetail(1, [
          ["tm-project-taskmaster-test", null],
          ["tm-task-1", null],
        ]),
        createTaskDetail(2, [
          ["tm-project-other-project", null], // Different project
          ["tm-task-2", null],
        ]),
      ];

      const result = filterTasks(expected, allTasks, testProjectId);

      expect(result.valid.size).toBe(1);
      expect(result.unrelatedProject.size).toBe(1);
      expect(result.unrelatedProject.has(createTaskId(2))).toBe(true);
    });

    it("should categorize extra tasks (from our project but not expected)", () => {
      const expected = new Set([createTaskId(1)]);
      const allTasks = [
        createTaskDetail(1, [
          ["tm-project-taskmaster-test", null],
          ["tm-task-1", null],
        ]),
        createTaskDetail(2, [
          ["tm-project-taskmaster-test", null], // Same project
          ["tm-task-2", null], // But not expected
        ]),
      ];

      const result = filterTasks(expected, allTasks, testProjectId);

      expect(result.valid.size).toBe(1);
      expect(result.extra.size).toBe(1);
      expect(result.extra.has(createTaskId(2))).toBe(true);
    });

    it("should identify missing tasks", () => {
      const expected = new Set([
        createTaskId(1),
        createTaskId(2),
        createTaskId(3),
      ]);
      const allTasks = [
        createTaskDetail(1, [
          ["tm-project-taskmaster-test", null],
          ["tm-task-1", null],
        ]),
        // Tasks 2 and 3 are missing
      ];

      const result = filterTasks(expected, allTasks, testProjectId);

      expect(result.valid.size).toBe(1);
      expect(result.missing.size).toBe(2);
      expect(result.missing.has(createTaskId(2))).toBe(true);
      expect(result.missing.has(createTaskId(3))).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle tasks with no tags (warnings)", () => {
      const expected = new Set([createTaskId(1)]);
      const allTasks = [
        createTaskDetail(1, []), // No tags
      ];

      const result = filterTasks(expected, allTasks, testProjectId);

      expect(result.valid.size).toBe(0);
      expect(result.warnings.length).toBe(1);
      expect(result.missing.size).toBe(1);
    });

    it("should handle tasks with invalid tag format (warnings)", () => {
      const expected = new Set([createTaskId(1)]);
      const allTasks = [
        createTaskDetail(1, [
          ["invalid-prefix", null], // Invalid tag format
          ["tm-task-1", null],
        ]),
      ];

      const result = filterTasks(expected, allTasks, testProjectId);

      expect(result.valid.size).toBe(0);
      expect(result.warnings.length).toBe(1);
    });

    it("should handle tasks missing project tag (warnings)", () => {
      const expected = new Set([createTaskId(1)]);
      const allTasks = [
        createTaskDetail(1, [
          ["tm-task-1", null], // Missing project tag
        ]),
      ];

      const result = filterTasks(expected, allTasks, testProjectId);

      expect(result.valid.size).toBe(0);
      expect(result.warnings.length).toBe(1);
    });

    it("should handle tasks missing task tag (warnings)", () => {
      const expected = new Set([createTaskId(1)]);
      const allTasks = [
        createTaskDetail(1, [
          ["tm-project-taskmaster-test", null], // Missing task tag
        ]),
      ];

      const result = filterTasks(expected, allTasks, testProjectId);

      expect(result.valid.size).toBe(0);
      expect(result.warnings.length).toBe(1);
    });

    it("should handle duplicate tasks", () => {
      const expected = new Set([createTaskId(1)]);
      const allTasks = [
        createTaskDetail(1, [
          ["tm-project-taskmaster-test", null],
          ["tm-task-1", null],
        ]),
        createTaskDetail(2, [
          ["tm-project-taskmaster-test", null],
          ["tm-task-1", null], // Same masterId as task 1
        ]),
      ];

      const result = filterTasks(expected, allTasks, testProjectId);

      expect(result.valid.size).toBe(0); // No valid tasks due to duplication
      expect(result.dupes.size).toBe(1);
      expect(result.dupes.has(createTaskId(1))).toBe(true);
    });
  });

  describe("Tag Format Validation", () => {
    it("should handle tasks with multiple project tags (warnings)", () => {
      const expected = new Set([createTaskId(1)]);
      const allTasks = [
        createTaskDetail(1, [
          ["tm-project-taskmaster-test", null],
          ["tm-project-other", null], // Multiple project tags
          ["tm-task-1", null],
        ]),
      ];

      const result = filterTasks(expected, allTasks, testProjectId);

      expect(result.valid.size).toBe(0);
      expect(result.warnings.length).toBe(1);
    });

    it("should handle tasks with multiple task tags (warnings)", () => {
      const expected = new Set([createTaskId(1)]);
      const allTasks = [
        createTaskDetail(1, [
          ["tm-project-taskmaster-test", null],
          ["tm-task-1", null],
          ["tm-task-2", null], // Multiple task tags
        ]),
      ];

      const result = filterTasks(expected, allTasks, testProjectId);

      expect(result.valid.size).toBe(0);
      expect(result.warnings.length).toBe(1);
    });

    it("should handle tasks with wrong tag prefix (warnings)", () => {
      const expected = new Set([createTaskId(1)]);
      const allTasks = [
        createTaskDetail(1, [
          ["tm-project-taskmaster-test", null],
          ["wrong-prefix-1", null], // Wrong prefix
        ]),
      ];

      const result = filterTasks(expected, allTasks, testProjectId);

      expect(result.valid.size).toBe(0);
      expect(result.warnings.length).toBe(1);
    });

    it("should handle tasks with malformed project tag (warnings)", () => {
      const expected = new Set([createTaskId(1)]);
      const allTasks = [
        createTaskDetail(1, [
          ["wrong-project-prefix", null], // Wrong project prefix
          ["tm-task-1", null],
        ]),
      ];

      const result = filterTasks(expected, allTasks, testProjectId);

      expect(result.valid.size).toBe(0);
      expect(result.warnings.length).toBe(1);
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle mixed scenarios with all categories", () => {
      const expected = new Set([
        createTaskId(1),
        createTaskId(2),
        createTaskId(3),
        createTaskId(4),
      ]);
      const allTasks = [
        // Valid task
        createTaskDetail(1, [
          ["tm-project-taskmaster-test", null],
          ["tm-task-1", null],
        ]),
        // Unrelated project
        createTaskDetail(2, [
          ["tm-project-other-project", null],
          ["tm-task-2", null],
        ]),
        // Extra task (not expected)
        createTaskDetail(3, [
          ["tm-project-taskmaster-test", null],
          ["tm-task-5", null],
        ]),
        // Invalid task (warning)
        createTaskDetail(4, [
          ["invalid-prefix", null],
          ["tm-task-4", null],
        ]),
        // Duplicate of task 1
        createTaskDetail(5, [
          ["tm-project-taskmaster-test", null],
          ["tm-task-1", null], // Same masterId as task 1
        ]),
        // Tasks 2, 3, 4 from expected set are missing
      ];

      const result = filterTasks(expected, allTasks, testProjectId);

      expect(result.valid.size).toBe(0); // Task 1 becomes dupe due to task 5
      expect(result.unrelatedProject.size).toBe(1);
      expect(result.unrelatedProject.has(createTaskId(2))).toBe(true);
      expect(result.extra.size).toBe(1);
      expect(result.extra.has(createTaskId(5))).toBe(true);
      expect(result.warnings.length).toBe(1); // Task 4 with invalid tag
      expect(result.dupes.size).toBe(1);
      expect(result.dupes.has(createTaskId(1))).toBe(true);
      expect(result.missing.size).toBe(4); // All expected tasks are missing/invalid
    });

    it("should handle large datasets efficiently", () => {
      const expectedCount = 100;
      const expected = new Set(
        Array.from({ length: expectedCount }, (_, i) => createTaskId(i + 1))
      );
      const allTasks = Array.from({ length: expectedCount }, (_, i) =>
        createTaskDetail(i + 1, [
          ["tm-project-taskmaster-test", null],
          [`tm-task-${i + 1}`, null],
        ])
      );

      const result = filterTasks(expected, allTasks, testProjectId);

      expect(result.valid.size).toBe(expectedCount);
      expect(result.missing.size).toBe(0);
      expect(result.warnings.length).toBe(0);
      expect(result.dupes.size).toBe(0);
    });
  });
});
