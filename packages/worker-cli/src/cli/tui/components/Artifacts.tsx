import React from 'react';
import { Box, Text } from 'ink';
import type { ArtifactInfo } from '../types/tui.js';

interface ArtifactsProps {
  readonly artifacts: ArtifactInfo[];
  readonly outputTasks?: ArtifactInfo[];
}

export const Artifacts: React.FC<ArtifactsProps> = ({ artifacts, outputTasks = [] }) => {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  const truncateDescription = (desc: string, maxLength = 30) => {
    return desc.length > maxLength ? `${desc.slice(0, maxLength)}...` : desc;
  };
  
  const totalCompleted = outputTasks.length + artifacts.length;
  
  return (
    <Box 
      borderStyle="single" 
      borderColor="cyan" 
      flexDirection="column" 
      paddingX={1}
      minHeight={6}
    >
      <Text bold>Completed Tasks ({totalCompleted})</Text>
      
      {outputTasks.length > 0 && (
        <Box flexDirection="column">
          <Text color="yellow">Pending Artifacts ({outputTasks.length}):</Text>
          {outputTasks.slice(-3).map((task) => (
            <Box key={String(task.taskId)} flexDirection="row">
              <Text color="yellow">⏳ </Text>
              <Text color="cyan" bold>ID:{task.taskId} </Text>
              <Text color="yellow">{truncateDescription(task.description)}</Text>
            </Box>
          ))}
        </Box>
      )}
      
      {artifacts.length > 0 && (
        <Box flexDirection="column">
          <Text color="green">Artifacts ({artifacts.length}):</Text>
          {artifacts.slice(-3).map((artifact) => (
            <Box key={String(artifact.taskId)} flexDirection="row">
              <Text>✅ </Text>
              <Text color="cyan" bold>ID:{artifact.taskId} </Text>
              <Text color="green">{truncateDescription(artifact.description)}</Text>
              <Text> (<Text color="blue">{artifact.branchName}</Text>)</Text>
            </Box>
          ))}
        </Box>
      )}
      
      {totalCompleted === 0 && (
        <Text color="gray">No completed tasks yet</Text>
      )}
      
      {totalCompleted > 6 && (
        <Text color="gray">... and {totalCompleted - 6} more</Text>
      )}
    </Box>
  );
};