import { useState, useEffect } from 'react';
import type { GitStatus } from '../types/tui.js';

export const useGitStatus = (workingDir: string) => {
  const [gitStatus, setGitStatus] = useState<GitStatus>({
    branch: 'master',
    isClean: true,
    changedFiles: 0,
  });
  
  useEffect(() => {
    // This would integrate with actual git operations
    // For now, return mock data
    const updateGitStatus = async () => {
      try {
        // Mock implementation - in real version would use simple-git
        setGitStatus({
          branch: 'master',
          isClean: true,
          changedFiles: 0,
          lastCommit: 'Initial commit',
        });
      } catch (error) {
        // Handle git errors gracefully
        console.error('Failed to get git status:', error);
      }
    };
    
    updateGitStatus();
    const interval = setInterval(updateGitStatus, 2000);
    
    return () => clearInterval(interval);
  }, [workingDir]);
  
  return gitStatus;
};