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
    try {
      await onAddTask(description);
    } catch (error) {
      workerOutput.addLine({
        timestamp: Date.now(),
        line: `Error adding task: ${error}`,
        level: 'error',
      });
    }
  };

  const handleEditTask = async (taskId: string, description: string) => {
    try {
      if (onEditTask) {
        await onEditTask(taskId, description);
        workerOutput.addLine({
          timestamp: Date.now(),
          line: `✏️ Task ${taskId} updated successfully`,
          level: 'info',
        });
      } else {
        throw new Error('Edit task function not available');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      workerOutput.addLine({
        timestamp: Date.now(),
        line: `Error editing task: ${errorMessage}`,
        level: 'error',
      });
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