import { useState, useCallback } from 'react'
import {
  createSimulator,
  step,
  back,
  forward,
  getCurrentState,
  getStateSummary,
  getHistoryInfo,
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

  const goBack = useCallback(() => {
    try {
      setSimulator(back(simulator))
    } catch (error) {
      console.error('Back failed:', error)
    }
  }, [simulator])

  const goForward = useCallback(() => {
    try {
      setSimulator(forward(simulator))
    } catch (error) {
      console.error('Forward failed:', error)
    }
  }, [simulator])

  const reset = useCallback(() => {
    resetCounters()
    setSimulator(createSimulator(5))
  }, [])

  const currentState = getCurrentState(simulator)
  const summary = getStateSummary(currentState)
  const historyInfo = getHistoryInfo(simulator)

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
        <p><strong>History:</strong> Step {historyInfo.currentIndex + 1} of {historyInfo.totalStates}</p>
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

      {/* History Navigation */}
      <div className="history-controls">
        <button 
          onClick={goBack}
          disabled={!historyInfo.canGoBack}
        >
          ← Back
        </button>
        <button 
          onClick={goForward}
          disabled={!historyInfo.canGoForward}
        >
          Forward →
        </button>
      </div>

      {/* Event Creator */}
      <EventCreator 
        onExecuteCommand={executeCommand}
        currentState={currentState}
      />

      {/* Tasks Visualization */}
      <TasksVisualizer simulator={simulator} />

      {/* Artifacts Display */}
      {currentState.artifacts.length > 0 && (
        <ArtifactsDisplay artifacts={currentState.artifacts} />
      )}
    </div>
  )
}

export default App