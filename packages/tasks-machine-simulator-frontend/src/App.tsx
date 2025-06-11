import { useState, useCallback } from 'react'
import {
  createSimulator,
  step,
  getCurrentState,
  getStateSummary,
  resetCounters,
  generateMockTasks,
  type SimulationCommand,
} from '@taiga-task-master/tasks-machine-simulator'
import { TasksVisualizer } from './components/TasksVisualizer'
import { ArtifactsDisplay } from './components/ArtifactsDisplay'
import { EventCreator } from './components/EventCreator'

function App() {
  const [simulator, setSimulator] = useState(() => {
    resetCounters()
    return createSimulator(5)
  })

  const executeCommand = useCallback((command: SimulationCommand) => {
    try {
      const newSimulator = step(simulator, command)
      setSimulator(newSimulator)
    } catch (error) {
      console.error('Command failed:', error)
      alert(`Command failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [simulator])

  const reset = useCallback(() => {
    resetCounters()
    setSimulator(createSimulator(5))
  }, [])

  const currentState = getCurrentState(simulator)
  const summary = getStateSummary(currentState)

  return (
    <div className="simulator">
      <h1>TasksMachine Simulator</h1>
      
      {/* State Display */}
      <div className="state-info">
        <h3>Current State</h3>
        <p><strong>Agent:</strong> {summary.agentStatus}</p>
        <p>
          <strong>Tasks:</strong> {summary.taskCounts.pending} pending,{' '}
          {summary.taskCounts['in-progress']} running,{' '}
          {summary.taskCounts.completed} completed
        </p>
        <p><strong>Artifacts:</strong> {summary.artifactCount}</p>
        {summary.currentTask && <p><strong>Working on:</strong> Task {summary.currentTask}</p>}
        {summary.progressText && <p><strong>Progress:</strong> {summary.progressText}</p>}
      </div>

      {/* Quick Action Controls */}
      <div className="controls">
        <button
          onClick={() => executeCommand({ type: 'take_next_task' })}
          disabled={summary.agentStatus === 'running'}
          className="primary-button"
        >
          Take Next Task
        </button>

        <button
          onClick={() => executeCommand({ type: 'agent_step' })}
          disabled={summary.agentStatus !== 'running'}
          className="warning-button"
        >
          Agent Step
        </button>

        <button
          onClick={() => executeCommand({ type: 'complete_current_task' })}
          disabled={summary.agentStatus !== 'running'}
          className="success-button"
        >
          Complete Task
        </button>

        {currentState.artifacts.length > 0 && (
          <button
            onClick={() =>
              executeCommand({
                type: 'commit_artifact',
                artifactId: currentState.artifacts[0]!.id,
              })
            }
            className="success-button"
          >
            Commit Artifact
          </button>
        )}

        <button 
          onClick={() => executeCommand({ type: 'append_tasks', tasks: generateMockTasks(2) })}
        >
          + Add 2 Tasks
        </button>

        <button onClick={reset}>
          Reset Simulation
        </button>
      </div>

      {/* Event Creator */}
      <EventCreator 
        onExecuteCommand={executeCommand}
        currentState={currentState}
      />

      {/* Tasks and Artifacts Side by Side */}
      <div className="content-grid">
        {/* Tasks Visualization */}
        <div className="tasks-section">
          <TasksVisualizer simulator={simulator} />
        </div>

        {/* Artifacts Display */}
        <div className="artifacts-section">
          <ArtifactsDisplay artifacts={currentState.artifacts} />
        </div>
      </div>
    </div>
  )
}

export default App