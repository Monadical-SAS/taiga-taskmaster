import { HashMap, Array } from 'effect'
import { type Simulator, getCurrentState } from '@taiga-task-master/tasks-machine-simulator'

interface TasksVisualizerProps {
  simulator: Simulator
}

export function TasksVisualizer({ simulator }: TasksVisualizerProps) {
  const state = getCurrentState(simulator)
  const taskEntries = Array.fromIterable(HashMap.toEntries(state.tasks))
  const outputTasks = state.outputTasks

  return (
    <div>
      <h3>Tasks Overview</h3>
      <div className="tasks-grid">
        {/* Pending tasks */}
        {taskEntries.map(([taskId, task]) => (
          <div key={taskId} className="task task--pending">
            <h4>Task {taskId}</h4>
            <p>{task.title}</p>
            <span className="status">pending</span>
          </div>
        ))}
        
        {/* Output tasks (completed but not in artifact yet) */}
        {outputTasks.length > 0 && (
          <>
            <h4 style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>Completed Tasks (Not Yet in Artifact)</h4>
            {outputTasks.map(([taskId, task]) => (
              <div key={`output-${taskId}`} className="task task--completed">
                <h4>Task {taskId}</h4>
                <p>{task.title}</p>
                <span className="status">completed</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}