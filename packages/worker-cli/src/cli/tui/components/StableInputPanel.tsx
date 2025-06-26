import React, { useState, useRef, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

interface StableInputPanelProps {
  readonly onAddTask: (description: string) => Promise<void>;
  readonly onStop: () => void;
}

export const StableInputPanel: React.FC<StableInputPanelProps> = ({ onAddTask, onStop }) => {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lastInputRef = useRef('');
  
  // Only update display when input actually changes
  const displayInput = input !== lastInputRef.current ? (lastInputRef.current = input, input) : lastInputRef.current;
  
  useInput((inputChar, key) => {
    // Handle Ctrl+C for exit
    if (key.ctrl && inputChar === 'c') {
      onStop();
      return;
    }
    
    // Handle Enter to submit
    if (key.return) {
      if (input.trim()) {
        setIsSubmitting(true);
        onAddTask(input.trim()).then(() => {
          setInput('');
          setIsSubmitting(false);
        }).catch(() => {
          setIsSubmitting(false);
        });
      }
      return;
    }
    
    // Handle backspace/delete
    if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1));
      return;
    }
    
    // Handle regular character input
    if (inputChar && inputChar.length === 1 && !key.ctrl && !key.meta) {
      setInput(prev => prev + inputChar);
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
          &gt; Enter task description or command:
        </Text>
        <Box flexDirection="row">
          <Text color="green">❯ </Text>
          <Text>
            {displayInput}
            <Text backgroundColor="white" color="black"> </Text>
          </Text>
          {isSubmitting && <Text color="yellow"> (submitting...)</Text>}
        </Box>
        <Text color="gray">
          Commands: /status, /clear, /stop, /quit | Ctrl+C to exit
        </Text>
      </Box>
    </Box>
  );
};