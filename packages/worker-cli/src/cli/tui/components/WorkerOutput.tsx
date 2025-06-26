import React from 'react';
import { Box, Text } from 'ink';
import type { WorkerOutputLine, TaskDisplayInfo } from '../types/tui.js';

interface WorkerOutputProps {
  readonly output: WorkerOutputLine[];
  readonly logFile?: string;
  readonly currentTask?: TaskDisplayInfo;
  readonly onClear: () => void;
}

export const WorkerOutput: React.FC<WorkerOutputProps> = ({ 
  output, 
  logFile, 
  currentTask,
  onClear 
}) => {
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  const getLineColor = (level?: string) => {
    switch (level) {
      case 'error':
        return 'red';
      case 'debug':
        return 'gray';
      case 'info':
      default:
        return 'white';
    }
  };
  
  return (
    <Box 
      borderStyle="single" 
      borderColor="green" 
      flexDirection="column" 
      paddingX={1}
      minHeight={12}
    >
      <Box flexDirection="row" justifyContent="space-between">
        <Text bold>Worker Output</Text>
        {currentTask && (
          <Text color="yellow">
            🔄 Running: "{currentTask.description.slice(0, 30)}..."
          </Text>
        )}
      </Box>
      
      {currentTask && (
        <Text color="blue">
          &gt; goose run -i instructions.md
        </Text>
      )}
      
      <Box flexDirection="column" flexGrow={1}>
        {output.length === 0 ? (
          <Text color="gray">Waiting for worker output...</Text>
        ) : (
          output.slice(-20).map((line, index) => (
            <Text key={index} color={getLineColor(line.level)}>
              [{formatTimestamp(line.timestamp)}] {line.line}
            </Text>
          ))
        )}
      </Box>
      
      {logFile && (
        <Box marginTop={1}>
          <Text color="blue">📋 Logs: tail -f {logFile}</Text>
        </Box>
      )}
      
      <Box marginTop={1}>
        <Text color="gray">Press 'c' to clear output</Text>
      </Box>
    </Box>
  );
};