import { HashMap } from 'effect'
import { type Artifact } from '@taiga-task-master/tasks-machine-simulator'

interface ArtifactsDisplayProps {
  artifacts: Artifact[]
}

export function ArtifactsDisplay({ artifacts }: ArtifactsDisplayProps) {
  return (
    <div className="artifacts">
      <h3>Completed Work (Artifacts)</h3>
      {artifacts.map((artifact) => (
        <div key={artifact.id} className="artifact">
          <h4>{artifact.id}</h4>
          <p><strong>Branch:</strong> {artifact.branchName}</p>
          <a href={artifact.prUrl} target="_blank" rel="noopener noreferrer">
            View PR
          </a>
          <a href={artifact.deploymentUrl} target="_blank" rel="noopener noreferrer">
            View Deployment
          </a>
          <p><strong>Tasks completed:</strong> {HashMap.size(artifact.tasks)}</p>
        </div>
      ))}
    </div>
  )
}