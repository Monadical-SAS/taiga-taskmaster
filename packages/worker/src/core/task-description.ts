/* eslint-disable functional/no-expression-statements, functional/immutable-data */
import { TaskFileContent } from '@taiga-task-master/common';
import { NonEmptyString, castNonEmptyString } from '@taiga-task-master/common';

export const createTaskDescriptionFunctions = () => ({
  /**
   * Simple string extraction for basic task descriptions
   * Used primarily for testing
   */
  simple: (task: TaskFileContent): NonEmptyString => {
    // Extract description directly if available
    if (typeof task.description === 'string' && task.description.trim() !== '') {
      return castNonEmptyString(task.description);
    }
    
    // Fallback to stringifying the task
    return castNonEmptyString(JSON.stringify(task));
  },
  
  /**
   * Detailed description extraction for production use
   * Formats task with title, context, and requirements
   */
  detailed: (task: TaskFileContent): NonEmptyString => {
    const descriptionParts: string[] = [];
    
    // Add title if available
    if (task.title) {
      descriptionParts.push(`# ${task.title}`);
    }
    
    // Add description
    if (task.description) {
      descriptionParts.push(task.description);
    }
    
    // Add details if available
    if (task.details) {
      descriptionParts.push(`## Details\n${task.details}`);
    }
    
    // Add test strategy if available
    if (task.testStrategy) {
      descriptionParts.push(`## Test Strategy\n${task.testStrategy}`);
    }
    
    // Add other metadata
    if (task.priority) {
      descriptionParts.push(`## Priority\n${task.priority}`);
    }
    
    if (task.dependencies.length > 0) {
      descriptionParts.push(`## Dependencies\n${task.dependencies.join(', ')}`);
    }
    
    if (task.subtasks.length > 0) {
      const subtaskList = task.subtasks.map(subtask => `- ${subtask.title} (${subtask.status})`).join('\n');
      descriptionParts.push(`## Subtasks\n${subtaskList}`);
    }
    
    // Join all parts or fallback to JSON
    const description = descriptionParts.length > 0 ? descriptionParts.join('\n\n') + '\n\n' : JSON.stringify(task);
    
    return castNonEmptyString(description);
  },
  
  /**
   * Instruction-focused description for AI workers
   * Formats task as clear instructions with context
   */
  instructions: (task: TaskFileContent): NonEmptyString => {
    const descriptionParts: string[] = ['# Task Instructions'];
    
    // Add title as main instruction
    if (task.title) {
      descriptionParts.push(`## Objective\n${task.title}`);
    }
    
    // Add detailed description
    if (task.description) {
      descriptionParts.push(`## Description\n${task.description}`);
    }
    
    // Add details if available
    if (task.details) {
      descriptionParts.push(`## Details\n${task.details}`);
    }
    
    // Add specific requirements from test strategy
    if (task.testStrategy) {
      descriptionParts.push(`## Requirements\n${task.testStrategy}`);
    } else {
      descriptionParts.push(`## Requirements\n- Complete the task as described\n- Create or modify files as needed\n- Ensure code is well-formatted and documented`);
    }
    
    // Add expected deliverables
    descriptionParts.push(`## Deliverables\n- Modified or created files that fulfill the requirements\n- Brief explanation of changes made`);
    
    // Join all parts or fallback to JSON
    const description = descriptionParts.length > 1 ? descriptionParts.join('\n\n') + '\n\n' : `# Task Instructions\n\nComplete the following task:\n\n${JSON.stringify(task)}`;
    
    return castNonEmptyString(description);
  }
});