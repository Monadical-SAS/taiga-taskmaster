/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { createTaskDescriptionFunctions } from './task-description.js';
import { TaskFileContent, castTaskId } from '@taiga-task-master/common';

describe('createTaskDescriptionFunctions', () => {
  const taskDescriptions = createTaskDescriptionFunctions();

  const mockTask: TaskFileContent = {
    id: castTaskId(1),
    title: 'Test Task Title',
    description: 'This is a test task description',
    details: 'Test details information',
    testStrategy: 'Test strategy for the task',
    priority: 'high',
    dependencies: [],
    status: 'pending',
    subtasks: []
  };

  describe('simple', () => {
    it('should return task description when available', () => {
      const result = taskDescriptions.simple(mockTask);
      expect(result).toBe('This is a test task description');
    });

    it('should return JSON string when description is empty', () => {
      const taskWithoutDescription = { ...mockTask, description: '' };
      const result = taskDescriptions.simple(taskWithoutDescription);
      expect(result).toBe(JSON.stringify(taskWithoutDescription));
    });

    it('should return JSON string when description is whitespace only', () => {
      const taskWithWhitespace = { ...mockTask, description: '   \n  \t  ' };
      const result = taskDescriptions.simple(taskWithWhitespace);
      expect(result).toBe(JSON.stringify(taskWithWhitespace));
    });

    it('should return JSON string when description is undefined', () => {
      const taskWithoutDescription = { ...mockTask, description: undefined as any };
      const result = taskDescriptions.simple(taskWithoutDescription);
      expect(result).toBe(JSON.stringify(taskWithoutDescription));
    });
  });

  describe('detailed', () => {
    it('should format complete task with all sections', () => {
      const result = taskDescriptions.detailed(mockTask);
      
      expect(result).toContain('# Test Task Title');
      expect(result).toContain('This is a test task description');
      expect(result).toContain('## Details\nTest details information');
      expect(result).toContain('## Test Strategy\nTest strategy for the task');
      expect(result).toContain('## Priority\nhigh');
    });

    it('should handle task with minimal data', () => {
      const minimalTask: TaskFileContent = {
        id: castTaskId(2),
        title: 'Minimal Task',
        description: 'Just a description',
        details: '',
        testStrategy: '',
        dependencies: [],
        status: 'pending',
        subtasks: []
      };
      
      const result = taskDescriptions.detailed(minimalTask);
      expect(result).toContain('Just a description');
      expect(result).toContain('# Minimal Task'); // Has title
      expect(result).not.toContain('## Details\n'); // Empty details not shown
      expect(result).not.toContain('## Test Strategy\n'); // Empty test strategy not shown
      expect(result).not.toContain('## Priority'); // No priority set
    });

    it('should fallback to JSON when no meaningful content', () => {
      const emptyTask: TaskFileContent = {
        id: castTaskId(3),
        title: '',
        description: '',
        details: '',
        testStrategy: '',
        dependencies: [],
        status: 'pending',
        subtasks: []
      };
      
      const result = taskDescriptions.detailed(emptyTask);
      expect(result).toBe(JSON.stringify(emptyTask));
    });

    it('should handle dependencies correctly', () => {
      const taskWithDeps = {
        ...mockTask,
        dependencies: [castTaskId(1), castTaskId(2)]
      };
      
      const result = taskDescriptions.detailed(taskWithDeps);
      expect(result).toContain('## Dependencies\n1, 2');
    });
  });

  describe('instructions', () => {
    it('should format task as clear instructions', () => {
      const result = taskDescriptions.instructions(mockTask);
      
      expect(result).toContain('# Task Instructions');
      expect(result).toContain('## Objective\nTest Task Title');
      expect(result).toContain('## Description\nThis is a test task description');
      expect(result).toContain('## Details\nTest details information');
      expect(result).toContain('## Requirements\nTest strategy for the task');
      expect(result).toContain('## Deliverables');
      expect(result).toContain('Modified or created files that fulfill the requirements');
      expect(result).toContain('Brief explanation of changes made');
    });

    it('should provide default requirements when none specified', () => {
      const taskWithoutReqs = { ...mockTask, testStrategy: '' };
      const result = taskDescriptions.instructions(taskWithoutReqs);
      
      expect(result).toContain('## Requirements\n- Complete the task as described');
      expect(result).toContain('- Create or modify files as needed');
      expect(result).toContain('- Ensure code is well-formatted and documented');
    });

    it('should handle minimal task with fallback', () => {
      const minimalTask: TaskFileContent = {
        id: castTaskId(4),
        title: '',
        description: '',
        details: '',
        testStrategy: '',
        dependencies: [],
        status: 'pending',
        subtasks: []
      };
      
      const result = taskDescriptions.instructions(minimalTask);
      expect(result).toContain('# Task Instructions');
      expect(result).toContain('## Requirements');
      expect(result).toContain('## Deliverables');
    });

    it('should include all sections when task has complete data', () => {
      const result = taskDescriptions.instructions(mockTask);
      
      // Should have all expected sections
      const sections = [
        '# Task Instructions',
        '## Objective',
        '## Description', 
        '## Details',
        '## Requirements',
        '## Deliverables'
      ];
      
      sections.forEach(section => {
        expect(result).toContain(section);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle task with only title', () => {
      const titleOnlyTask: TaskFileContent = {
        id: castTaskId(5),
        title: 'Just a title',
        description: '',
        details: '',
        testStrategy: '',
        dependencies: [],
        status: 'pending',
        subtasks: []
      };
      
      const simple = taskDescriptions.simple(titleOnlyTask);
      const detailed = taskDescriptions.detailed(titleOnlyTask);
      const instructions = taskDescriptions.instructions(titleOnlyTask);
      
      expect(simple).toBe(JSON.stringify(titleOnlyTask));
      expect(detailed).toContain('# Just a title');
      expect(instructions).toContain('## Objective\nJust a title');
    });

    it('should handle task with subtasks', () => {
      const taskWithSubtasks = {
        ...mockTask,
        subtasks: [{
          id: 1 as any, // SubtaskId type
          title: 'Subtask 1',
          status: 'pending' as const,
          dependencies: []
        }]
      };
      
      const result = taskDescriptions.detailed(taskWithSubtasks);
      expect(result).toContain('## Subtasks');
      expect(result).toContain('- Subtask 1 (pending)');
    });

    it('should handle task with empty subtasks array', () => {
      const result = taskDescriptions.detailed(mockTask);
      expect(result).not.toContain('## Subtasks');
    });
  });
});