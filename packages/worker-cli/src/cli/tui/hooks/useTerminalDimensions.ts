import { useState, useEffect } from 'react';

export const useTerminalDimensions = () => {
  const [dimensions, setDimensions] = useState({
    width: process.stdout.columns || 80,
    height: process.stdout.rows || 24
  });

  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: process.stdout.columns || 80,
        height: process.stdout.rows || 24
      });
    };

    process.stdout.on('resize', updateDimensions);
    
    return () => {
      process.stdout.off('resize', updateDimensions);
    };
  }, []);

  return dimensions;
};