import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

export interface MetadataDirectories {
  readonly metadataDir: string;
  readonly instructionsDir: string;
  readonly logsDir: string;
  readonly cleanup: () => Promise<void>;
}

/**
 * Creates a dedicated metadata directory structure for task execution
 * Separate from the working directory (git repo) to avoid metadata pollution
 */
export const createMetadataDirectories = async (prefix = "task-metadata-"): Promise<MetadataDirectories> => {
  const metadataDir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  
  const instructionsDir = path.join(metadataDir, "instructions");
  const logsDir = path.join(metadataDir, "logs");
  
  // Create subdirectories
  await Promise.all([
    fs.mkdir(instructionsDir, { recursive: true }),
    fs.mkdir(logsDir, { recursive: true })
  ]);
  
  const cleanup = async () => {
    try {
      await fs.rm(metadataDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to cleanup metadata directory ${metadataDir}:`, error);
    }
  };
  
  return {
    metadataDir,
    instructionsDir,
    logsDir,
    cleanup
  };
};

/**
 * Get paths for specific metadata files
 */
export const getMetadataPaths = (metadataDirs: MetadataDirectories, taskId?: string) => {
  const taskPrefix = taskId ? `task-${taskId}-` : '';
  
  return {
    instructionsFile: path.join(metadataDirs.instructionsDir, `${taskPrefix}instructions.md`),
    executionLog: path.join(metadataDirs.logsDir, `${taskPrefix}execution.log`),
    gooseOutput: path.join(metadataDirs.logsDir, `${taskPrefix}goose-output.log`)
  };
};