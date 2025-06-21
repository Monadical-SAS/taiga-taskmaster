// @vibe-generated: conforms to worker-interface
import * as fs from "fs/promises";
import * as path from "path";

export interface GooseDebugger {
  dumpGooseState: (label: string) => Promise<void>;
  verifyGooseWork: (taskDescription: string) => Promise<{
    outputFiles: string[];
    relevantFiles: string[];
    workCompleted: boolean;
  }>;
}

export const createGooseDebugger = (
  workingDir: string,
  gooseConfigDir: string,
  sessionId: string
): GooseDebugger => {
  const sessionDir = path.join(gooseConfigDir, sessionId);

  return {
    async dumpGooseState(label: string) {
      console.log(`\n🪿 [GOOSE DEBUG] ${label}`);
      console.log(`📁 Working directory: ${workingDir}`);
      console.log(`⚙️  Goose config dir: ${gooseConfigDir}`);
      console.log(`📁 Session directory: ${sessionDir}`);
      
      try {
        // Check instructions file
        const instructionsFile = path.join(sessionDir, "instructions.txt");
        try {
          const instructions = await fs.readFile(instructionsFile, "utf-8");
          console.log(`📋 Instructions file exists (${instructions.length} chars)`);
          console.log(`   Preview: "${instructions.substring(0, 150)}${instructions.length > 150 ? '...' : ''}"`);
        } catch (error) {
          console.log(`📋 Instructions file: ❌ (${error})`);
        }
        
        // Check session directory contents
        try {
          const sessionFiles = await fs.readdir(sessionDir);
          console.log(`📂 Session files (${sessionFiles.length}):`);
          await Promise.all(sessionFiles.map(async (file) => {
            try {
              const filePath = path.join(sessionDir, file);
              const stat = await fs.stat(filePath);
              const type = stat.isDirectory() ? '📁' : '📄';
              const size = stat.isFile() ? ` (${stat.size} bytes)` : '';
              console.log(`   ${type} ${file}${size}`);
            } catch (error) {
              console.log(`   ❓ ${file} (cannot stat: ${error})`);
            }
          }));
        } catch (error) {
          console.log(`📂 Cannot list session files: ${error}`);
        }
        
        // Check working directory for output files
        try {
          const workFiles = await fs.readdir(workingDir, { recursive: true });
          const outputFiles = workFiles.filter(f => 
            typeof f === 'string' && 
            !f.includes('.git/') && 
            !f.startsWith('.git') &&
            !f.includes('node_modules/') &&
            !f.includes('.goose/')
          );
          console.log(`📄 Working directory files (${outputFiles.length}):`);
          await Promise.all(outputFiles.slice(0, 10).map(async (file) => {
            try {
              const fullPath = path.join(workingDir, file.toString());
              const stat = await fs.stat(fullPath);
              const type = stat.isDirectory() ? '📁' : '📄';
              const size = stat.isFile() ? ` (${stat.size} bytes)` : '';
              console.log(`   ${type} ${file}${size}`);
              
              // Preview file content if it's small and text-like
              if (stat.isFile() && stat.size < 1000 && 
                  (file.toString().endsWith('.txt') || 
                   file.toString().endsWith('.md') || 
                   file.toString().endsWith('.js') ||
                   file.toString().endsWith('.py'))) {
                try {
                  const content = await fs.readFile(fullPath, 'utf-8');
                  const preview = content.substring(0, 100);
                  console.log(`     Preview: "${preview}${content.length > 100 ? '...' : ''}"`);
                } catch (error) {
                  console.log(`     Cannot preview: ${error}`);
                }
              }
            } catch (error) {
              console.log(`   ❓ ${file} (cannot stat: ${error})`);
            }
          }));
          if (outputFiles.length > 10) {
            console.log(`   ... and ${outputFiles.length - 10} more files`);
          }
        } catch (error) {
          console.log(`📄 Cannot list working directory files: ${error}`);
        }
        
        // Check environment variables relevant to Goose
        console.log(`🌍 Environment variables:`);
        const relevantEnvVars = ['GOOSE_API_KEY', 'OPENAI_API_KEY', 'PATH'];
        relevantEnvVars.forEach((envVar) => {
          const value = process.env[envVar];
          if (value) {
            const maskedValue = envVar.includes('KEY') ? 
              `${value.substring(0, 8)}***` : 
              value.length > 50 ? `${value.substring(0, 50)}...` : value;
            console.log(`   ${envVar}: ${maskedValue}`);
          } else {
            console.log(`   ${envVar}: ❌ (not set)`);
          }
        });
        
      } catch (error) {
        console.log(`🚨 [GOOSE DEBUG] Error during state dump: ${error}`);
      }
    },

    async verifyGooseWork(taskDescription: string) {
      console.log(`\n🔍 [GOOSE DEBUG] Verifying work for: "${taskDescription}"`);
      
      const result = {
        outputFiles: [] as string[],
        relevantFiles: [] as string[],
        workCompleted: false
      };
      
      try {
        // Find all output files in working directory
        const workFiles = await fs.readdir(workingDir, { recursive: true });
        const outputFiles = workFiles.filter(f => 
          typeof f === 'string' && 
          !f.includes('.git/') && 
          !f.startsWith('.git') &&
          !f.includes('node_modules/') &&
          !f.includes('.goose/')
        ).map(f => f.toString());
        
        const resultWithFiles = { ...result, outputFiles };
        console.log(`📄 Output files found: ${outputFiles.length}`);
        
        // Analyze files for relevance to the task
        const taskKeywords = taskDescription.toLowerCase().split(/\s+/).filter(word => 
          word.length > 3 && !['with', 'that', 'this', 'from', 'for'].includes(word)
        );
        
        const analysisResults = await Promise.all(outputFiles.map(async (file) => {
          try {
            const fullPath = path.join(workingDir, file);
            const stat = await fs.stat(fullPath);
            
            if (stat.isFile()) {
              console.log(`📄 Analyzing: ${file}`);
              
              // Check file name relevance
              const fileNameRelevant = taskKeywords.some(keyword => 
                file.toLowerCase().includes(keyword)
              );
              
              // Check file content relevance (for text files)
              // eslint-disable-next-line functional/no-let
              let contentRelevant = false;
              if (file.endsWith('.txt') || file.endsWith('.md') || 
                  file.endsWith('.js') || file.endsWith('.py') || 
                  file.endsWith('.json') || file.endsWith('.html')) {
                try {
                  const content = await fs.readFile(fullPath, 'utf-8');
                  contentRelevant = taskKeywords.some(keyword => 
                    content.toLowerCase().includes(keyword)
                  );
                  
                  // Special cases for different task types
                  if (taskDescription.toLowerCase().includes('time')) {
                    contentRelevant = contentRelevant || /time|date|hour|minute|second/i.test(content);
                  }
                  if (taskDescription.toLowerCase().includes('calculate') || taskDescription.toLowerCase().includes('math')) {
                    contentRelevant = contentRelevant || /\d+|\+|\-|\*|\/|calculation|result/i.test(content);
                  }
                  if (taskDescription.toLowerCase().includes('function')) {
                    contentRelevant = contentRelevant || /function|def |=>|return/i.test(content);
                  }
                  
                  console.log(`   Content preview: "${content.substring(0, 100)}${content.length > 100 ? '...' : ''}"`);
                } catch (error) {
                  console.log(`   Cannot read content: ${error}`);
                }
              }
              
              const isRelevant = fileNameRelevant || contentRelevant;
              console.log(`   Relevance: ${isRelevant ? '✅' : '❓'} (name: ${fileNameRelevant ? '✅' : '❌'}, content: ${contentRelevant ? '✅' : '❌'})`);
              
              return isRelevant ? file : null;
            }
            return null;
          } catch (error) {
            console.log(`   Error analyzing ${file}: ${error}`);
            return null;
          }
        }));
        
        const relevantFiles = analysisResults.filter((file): file is string => file !== null);
        const finalResult = { ...resultWithFiles, relevantFiles };
        
        // Determine if work was completed
        const hasRelevantFiles = finalResult.relevantFiles.length > 0;
        const hasAnyFiles = finalResult.outputFiles.length > 0;
        
        // Basic completion heuristics
        const workCompleted = hasRelevantFiles || (hasAnyFiles && finalResult.outputFiles.length >= 1);
        const completeResult = { ...finalResult, workCompleted };
        
        console.log(`📊 Verification summary:`);
        console.log(`   📄 Total output files: ${completeResult.outputFiles.length}`);
        console.log(`   🎯 Relevant files: ${completeResult.relevantFiles.length}`);
        console.log(`   ✅ Work completed: ${completeResult.workCompleted ? 'YES' : 'NO'}`);
        
        if (completeResult.relevantFiles.length > 0) {
          console.log(`   🎯 Relevant files:`);
          completeResult.relevantFiles.forEach((file) => {
            console.log(`     📄 ${file}`);
          });
        }
        
      } catch (error) {
        console.log(`🚨 [GOOSE DEBUG] Error during work verification: ${error}`);
      }
      
      return result;
    }
  };
};