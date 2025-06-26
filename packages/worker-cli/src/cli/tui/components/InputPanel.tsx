import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

interface InputPanelProps {
  readonly onAddTask: (description: string) => Promise<void>;
  readonly onStop: () => void;
  readonly onClear?: () => void;
  readonly onStatus?: () => void;
  readonly onEditTask?: (taskId: string, description: string) => Promise<void>;
}

export const InputPanel: React.FC<InputPanelProps> = ({ onAddTask, onStop, onClear, onStatus, onEditTask }) => {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>('');

  const handleSlashCommand = async (command: string) => {
    const [cmd, ...args] = command.slice(1).split(' ');
    
    if (!cmd) {
      setLastMessage('Empty command. Type /help for available commands.');
      return;
    }
    
    switch (cmd.toLowerCase()) {
      case 'help':
        setLastMessage('Available commands: /help, /clear, /status, /stop, /quit, /edit <taskId> <description>');
        break;
      case 'clear':
        if (onClear) {
          onClear();
          setLastMessage('Output cleared');
        } else {
          setLastMessage('Clear not available');
        }
        break;
      case 'status':
        if (onStatus) {
          onStatus();
          setLastMessage('Status updated');
        } else {
          setLastMessage('Status not available');
        }
        break;
      case 'edit':
        if (!onEditTask) {
          setLastMessage('Edit command not available');
          break;
        }
        
        if (args.length < 2) {
          setLastMessage('Usage: /edit <taskId> <description> (taskId should be a number)');
          break;
        }
        
        const taskId = args[0];
        const description = args.slice(1).join(' ').trim();
        
        if (!taskId) {
          setLastMessage('Error: Task ID is required');
          break;
        }
        
        if (!description) {
          setLastMessage('Error: Description cannot be empty');
          break;
        }
        
        try {
          await onEditTask(taskId, description);
          setLastMessage(`Task ${taskId} updated successfully`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          setLastMessage(`Error editing task: ${errorMessage}`);
        }
        break;
      case 'stop':
      case 'quit':
      case 'exit':
        onStop();
        break;
      default:
        setLastMessage(`Unknown command: /${cmd}. Type /help for available commands.`);
    }
    
    // Clear message after 3 seconds
    setTimeout(() => setLastMessage(''), 3000);
  };
  
  const handleSubmit = async (value: string) => {
    if (!value.trim()) return;
    
    setIsSubmitting(true);
    try {
      const trimmedInput = value.trim();
      
      // Handle slash commands
      if (trimmedInput.startsWith('/')) {
        await handleSlashCommand(trimmedInput);
      } else {
        // Regular task
        await onAddTask(trimmedInput);
      }
      
      setInput('');
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Ctrl+C for exit
  useInput((inputChar, key) => {
    if (key.ctrl && inputChar === 'c') {
      onStop();
    }
  });
  
  return (
    <Box 
      borderStyle="single" 
      borderColor="white" 
      paddingX={1}
      minHeight={4}
    >
      <Box flexDirection="column" width="100%">
        <Text>
          &gt; Enter task description:
        </Text>
        <Box flexDirection="row">
          <Text color="green">❯ </Text>
          <TextInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            placeholder="Type a task description or /help for commands"
          />
          {isSubmitting && <Text color="yellow"> (submitting...)</Text>}
        </Box>
        <Text color="gray">
          Commands: /help, /clear, /status, /stop, /edit | Ctrl+C to exit
        </Text>
        {lastMessage && (
          <Text color="yellow">
            💬 {lastMessage}
          </Text>
        )}
      </Box>
    </Box>
  );
};