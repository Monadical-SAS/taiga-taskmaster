import React from 'react';
import { Box, Text } from 'ink';
import type { TaskDisplayInfo } from '../types/tui.js';
import type { NonNegativeInteger } from '@taiga-task-master/common';

interface TaskQueueProps {
  readonly tasks: TaskDisplayInfo[];
  readonly currentTask?: TaskDisplayInfo;
  readonly queueSize: NonNegativeInteger;
}

export const TaskQueue: React.FC<TaskQueueProps> = ({ 
  tasks, 
  currentTask, 
  queueSize 
}) => {
  const getStatusIcon = (status: TaskDisplayInfo['status']) => {
    switch (status) {
      case 'running':
        return '🔄';
      case 'pending':
        return '⏳';
      case 'completed':
        return '✅';
      case 'failed':
        return '❌';
      default:
        return '⏳';
    }
  };
  
  const getStatusColor = (status: TaskDisplayInfo['status']) => {
    switch (status) {
      case 'running':
        return 'yellow';
      case 'pending':
        return 'blue';
      case 'completed':
        return 'green';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };
  
  const truncateDescription = (desc: string, maxLength = 40) => {
    return desc.length > maxLength ? `${desc.slice(0, maxLength)}...` : desc;
  };
  
  return (
    <Box 
      borderStyle="single" 
      borderColor="blue" 
      flexDirection="column" 
      paddingX={1}
      minHeight={8}
    >
      <Text bold>Task Queue ({queueSize})</Text>
      
      {tasks.length === 0 ? (
        <Text color="gray">No tasks in queue</Text>
      ) : (
        tasks.slice(0, 10).map((task, index) => (
          <Box key={String(task.id)} flexDirection="row">
            <Text color={getStatusColor(task.status)}>
              {index + 1}. [{getStatusIcon(task.status)} {task.status.toUpperCase()}] 
            </Text>
            <Text color="cyan" bold> ID:{task.id} </Text>
            <Text color={getStatusColor(task.status)}>
              {truncateDescription(task.description)}
            </Text>
          </Box>
        ))
      )}
      
      {tasks.length > 10 && (
        <Text color="gray">... and {tasks.length - 10} more tasks</Text>
      )}
      
      <Box marginTop={1}>
        <Text color="green">➕ Add new task</Text>
      </Box>
    </Box>
  );
};