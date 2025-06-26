import { useState, useCallback } from 'react';
import type { WorkerOutputLine } from '../types/tui.js';

export const useWorkerOutput = () => {
  const [output, setOutput] = useState<WorkerOutputLine[]>([]);
  const [currentLogFile, setCurrentLogFile] = useState<string>('');
  
  const addLine = useCallback((line: WorkerOutputLine) => {
    setOutput(prev => [...prev.slice(-50), line]); // Keep last 50 lines
  }, []);
  
  const clearOutput = useCallback(() => {
    setOutput([]);
  }, []);
  
  const setLogFile = useCallback((logFile: string) => {
    setCurrentLogFile(logFile);
  }, []);
  
  return { 
    output, 
    currentLogFile, 
    addLine, 
    setCurrentLogFile: setLogFile,
    clearOutput 
  };
};