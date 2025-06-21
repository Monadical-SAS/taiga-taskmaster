/* eslint-disable functional/no-expression-statements */
export const sleep = (ms: number, options?: { signal?: AbortSignal }): Promise<void> => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    
    if (options?.signal) {
      // Handle abort signal
      if (options.signal.aborted) {
        clearTimeout(timeout);
        reject(new Error('Sleep aborted'));
        return;
      }
      
      options.signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        reject(new Error('Sleep aborted'));
      }, { once: true });
    }
  });
};