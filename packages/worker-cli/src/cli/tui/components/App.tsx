import React from 'react';
import { Box } from 'ink';
import { StatusBar } from './StatusBar.js';
import { TaskQueue } from './TaskQueue.js';
import { WorkerOutput } from './WorkerOutput.js';
import { GitStatus } from './GitStatus.js';
import { Artifacts } from './Artifacts.js';
import { InputPanel } from './InputPanel.js';
import { useTaskMachine } from '../hooks/useTaskMachine.js';
import { useWorkerOutput } from '../hooks/useWorkerOutput.js';
import { useGitStatus } from '../hooks/useGitStatus.js';
import { useTerminalDimensions } from '../hooks/useTerminalDimensions.js';
import type { TUIProps } from '../types/tui.js';
import type { TasksMachineMemoryPersistence } from '../hooks/useTaskMachine.js';
import { getGlobalLogger } from '../../../utils/file-logger.js';

interface AppProps extends TUIProps {
  readonly persistence: TasksMachineMemoryPersistence;
}

export const App: React.FC<AppProps> = ({ 
  persistence, 
  workingDir, 
  onAddTask, 
  onEditTask,
  onStop,
  onWorkerOutput
}) => {
  const taskMachine = useTaskMachine(persistence);
  const workerOutput = useWorkerOutput();
  const gitStatus = useGitStatus(workingDir);
  const { width, height } = useTerminalDimensions();
  
  // Connect worker output to TUI state
  React.useEffect(() => {
    if (onWorkerOutput) {
      onWorkerOutput((line) => {
        workerOutput.addLine({
          timestamp: line.timestamp,
          line: line.line,
          level: (line.level as 'info' | 'error' | 'debug') || 'info'
        });
      });
    }
  }, [onWorkerOutput, workerOutput.addLine]);
  
  // Add initial welcome message to test output
  React.useEffect(() => {
    workerOutput.addLine({
      timestamp: Date.now(),
      line: '🚀 Taiga Task Master TUI started',
      level: 'info'
    });
  }, [workerOutput.addLine]);
  
  const handleAddTask = async (description: string) => {
    const logger = getGlobalLogger();
    
    try {
      if (logger) {
        logger.logFromSource('tui', 'info', `User adding task: "${description}"`).catch(() => {});
      }
      
      await onAddTask(description);
      
      if (logger) {
        logger.logFromSource('tui', 'info', `Task added successfully: "${description}"`).catch(() => {});
      }
    } catch (error) {
      const errorMessage = `Error adding task: ${error}`;
      workerOutput.addLine({
        timestamp: Date.now(),
        line: errorMessage,
        level: 'error',
      });
      
      if (logger) {
        logger.logFromSource('tui', 'error', errorMessage).catch(() => {});
      }
    }
  };

  const handleEditTask = async (taskId: string, description: string) => {
    const logger = getGlobalLogger();
    
    try {
      if (logger) {
        logger.logFromSource('tui', 'info', `User editing task ${taskId}: "${description}"`).catch(() => {});
      }
      
      if (onEditTask) {
        await onEditTask(taskId, description);
        
        const successMessage = `✏️ Task ${taskId} updated successfully`;
        workerOutput.addLine({
          timestamp: Date.now(),
          line: successMessage,
          level: 'info',
        });
        
        if (logger) {
          logger.logFromSource('tui', 'info', successMessage).catch(() => {});
        }
      } else {
        throw new Error('Edit task function not available');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const fullErrorMessage = `Error editing task: ${errorMessage}`;
      
      workerOutput.addLine({
        timestamp: Date.now(),
        line: fullErrorMessage,
        level: 'error',
      });
      
      if (logger) {
        logger.logFromSource('tui', 'error', fullErrorMessage).catch(() => {});
      }
      
      throw error; // Re-throw to let InputPanel handle display
    }
  };
  
  return (
    <Box flexDirection="column">
      <StatusBar 
        key="statusbar"
        workingDir={workingDir}
        currentBranch={gitStatus.branch}
        workerStatus={taskMachine.currentTask}
      />
      
      <Box flexDirection="row" minHeight={20}>
        <Box width="30%" flexDirection="column">
          <TaskQueue 
            key="taskqueue"
            tasks={taskMachine.tasks}
            currentTask={taskMachine.currentTask}
            queueSize={taskMachine.queueSize}
          />
          <GitStatus key="gitstatus" status={gitStatus} />
        </Box>
        
        <Box flexGrow={1} flexDirection="column">
          <WorkerOutput 
            key="workeroutput"
            output={workerOutput.output}
            logFile={workerOutput.currentLogFile}
            currentTask={taskMachine.currentTask}
            onClear={workerOutput.clearOutput}
          />
          <Artifacts key="artifacts" artifacts={taskMachine.artifacts} outputTasks={taskMachine.outputTasks} />
        </Box>
      </Box>
      
      <InputPanel 
        key="inputpanel" 
        onAddTask={handleAddTask} 
        onEditTask={handleEditTask}
        onStop={onStop}
        onClear={workerOutput.clearOutput}
        onStatus={() => {
          workerOutput.addLine({
            timestamp: Date.now(),
            line: `📊 Status: ${taskMachine.queueSize} queued, ${taskMachine.outputTasks.length} completed, ${taskMachine.artifacts.length} artifacts`,
            level: 'info'
          });
        }}
      />
    </Box>
  );
};