import React from 'react';
import { Box, Text } from 'ink';
import type { GitStatus as GitStatusType } from '../types/tui.js';

interface GitStatusProps {
  readonly status: GitStatusType;
}

export const GitStatus: React.FC<GitStatusProps> = ({ status }) => {
  const getStatusIcon = () => {
    return status.isClean ? '✅' : '⚠️';
  };
  
  const getStatusText = () => {
    return status.isClean ? 'Clean' : 'Modified';
  };
  
  const getStatusColor = () => {
    return status.isClean ? 'green' : 'yellow';
  };
  
  return (
    <Box 
      borderStyle="single" 
      borderColor="magenta" 
      flexDirection="column" 
      paddingX={1}
    >
      <Text bold>Git Status</Text>
      
      <Box flexDirection="row">
        <Text>📊 Status: </Text>
        <Text color={getStatusColor()}>
          {getStatusIcon()} {getStatusText()}
        </Text>
      </Box>
      
      <Box flexDirection="row">
        <Text>📈 Changes: </Text>
        <Text color={status.changedFiles > 0 ? 'yellow' : 'green'}>
          {status.changedFiles}
        </Text>
      </Box>
      
      <Box flexDirection="row">
        <Text>🌿 Branch: </Text>
        <Text color="blue">{status.branch}</Text>
      </Box>
      
      {status.lastCommit && (
        <Box flexDirection="row">
          <Text>📝 Last: </Text>
          <Text color="gray">{status.lastCommit.slice(0, 20)}...</Text>
        </Box>
      )}
    </Box>
  );
};