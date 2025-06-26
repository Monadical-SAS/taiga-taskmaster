import React from 'react';
import { render } from 'ink';
import { App } from './components/App.js';
import type { TUIProps } from './types/tui.js';
import type { TasksMachineMemoryPersistence } from './hooks/useTaskMachine.js';

interface TUIEntryProps extends TUIProps {
  readonly persistence: TasksMachineMemoryPersistence;
}

export const startTUI = (props: TUIEntryProps) => {
  // FUCK THE ALTERNATE SCREEN BUFFER - USE NORMAL MODE
  const { waitUntilExit } = render(<App {...props} />, {
    patchConsole: true,
    exitOnCtrlC: true
  });
  
  return waitUntilExit();
};

export * from './components/App.js';
export * from './types/tui.js';
export * from './hooks/useTaskMachine.js';
export * from './hooks/useWorkerOutput.js';
export * from './hooks/useGitStatus.js';