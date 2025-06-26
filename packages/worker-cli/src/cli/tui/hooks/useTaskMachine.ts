import { useState, useEffect, useRef } from 'react';
import { TasksMachine } from "@taiga-task-master/core";
import { HashMap } from 'effect';
import type { TaskDisplayInfo, ArtifactInfo } from '../types/tui.js';
import type { NonNegativeInteger } from '@taiga-task-master/common';

export interface TasksMachineMemoryPersistence {
  getState(): TasksMachine.State;
  getQueueSize(): NonNegativeInteger;
  hasPendingTasks(): boolean;
}

export const useTaskMachine = (persistence: TasksMachineMemoryPersistence) => {
  const [state, setState] = useState(persistence.getState());
  const lastStateRef = useRef(state);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const newState = persistence.getState();
      
      // Only update if state actually changed (reference comparison)
      if (newState !== lastStateRef.current) {
        lastStateRef.current = newState;
        setState(newState);
      }
    }, 500); // 2x faster updates for responsive UI
    
    return () => clearInterval(interval);
  }, [persistence]);
  
  // Convert tasks to display format
  const tasks: TaskDisplayInfo[] = HashMap.toEntries(state.tasks).map(([id, task]) => {
    const isRunning = state.taskExecutionState.step === 'running' 
      && (state.taskExecutionState as any).task?.[0] === id;
    
    return {
      id,
      description: typeof task === 'object' && task && 'description' in task 
        ? String((task as { description: string }).description)
        : String(task),
      status: isRunning ? 'running' : 'pending',
    };
  });
  
  // Convert artifacts to display format
  const artifacts: ArtifactInfo[] = state.artifacts.map((artifact, index) => {
    const firstTask = artifact.tasks[0];
    const taskId = firstTask?.[0] || `artifact-${index}`;
    const task = firstTask?.[1];
    const description = task && typeof task === 'object' && 'description' in task 
      ? String((task as { description: string }).description)
      : 'Unknown task';
    
    return {
      taskId: taskId as any,
      branchName: String(artifact.id), // artifact.id is the branch name
      description,
      timestamp: Date.now(), // This would need proper timestamp from artifact
    };
  });
  
  // Convert outputTasks to display format  
  const outputTasks: ArtifactInfo[] = state.outputTasks.map(([taskId, task]) => ({
    taskId,
    branchName: 'pending-artifact', // These are waiting to become artifacts
    description: typeof task === 'object' && task && 'description' in task 
      ? String((task as { description: string }).description)
      : String(task),
    timestamp: Date.now(),
  }));
  
  const currentTask = state.taskExecutionState.step === 'running' 
    ? tasks.find(task => task.id === (state.taskExecutionState as any).task[0])
    : undefined;
  
  return {
    tasks,
    queueSize: persistence.getQueueSize(),
    currentTask,
    artifacts,
    outputTasks,
    hasPendingTasks: persistence.hasPendingTasks(),
  };
};