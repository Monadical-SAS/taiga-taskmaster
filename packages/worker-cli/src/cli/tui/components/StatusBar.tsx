import React from 'react';
import { Box, Text } from 'ink';
import type { TaskDisplayInfo } from '../types/tui.js';

interface StatusBarProps {
  readonly workingDir: string;
  readonly currentBranch: string;
  readonly workerStatus?: TaskDisplayInfo;
}

export const StatusBar: React.FC<StatusBarProps> = ({ 
  workingDir, 
  currentBranch, 
  workerStatus 
}) => {
  const getWorkerStatusText = () => {
    if (!workerStatus) {
      return <Text color="gray">IDLE</Text>;
    }
    
    switch (workerStatus.status) {
      case 'running':
        return <Text color="yellow">RUNNING</Text>;
      case 'failed':
        return <Text color="red">FAILED</Text>;
      default:
        return <Text color="blue">PENDING</Text>;
    }
  };
  
  return (
    <Box paddingX={1} paddingY={0}>
      <Text backgroundColor="blue" color="white" bold>
        {` 📁 ${workingDir} | 🌿 ${currentBranch} | 🔄 ${workerStatus?.status?.toUpperCase() || 'IDLE'} `}
      </Text>
    </Box>
  );
};