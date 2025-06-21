// @vibe-generated: conforms to worker-interface
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

export interface TempDirResult {
  readonly path: string;
  readonly cleanup: () => void;
}

/**
 * Creates a temporary directory with automatic cleanup functionality.
 * @param prefix - Optional prefix for the temporary directory name
 * @returns Object with path and cleanup function
 */
export const createTempDir = async (prefix = "worker-test-"): Promise<TempDirResult> => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  
  const cleanup = () => {
    // Use setImmediate to avoid blocking and handle cleanup asynchronously
    setImmediate(async () => {
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (error) {
        // Log but don't throw to avoid unhandled promise rejections during test cleanup
        console.warn(`Failed to cleanup temp directory ${tempDir}:`, error);
      }
    });
  };

  return {
    path: tempDir,
    cleanup
  };
};