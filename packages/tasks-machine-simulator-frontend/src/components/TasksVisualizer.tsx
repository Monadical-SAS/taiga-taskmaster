import { HashMap, Array } from 'effect'
import { type Simulator, getCurrentState } from '@taiga-task-master/tasks-machine-simulator'

interface TasksVisualizerProps {
  simulator: Simulator
}

export function TasksVisualizer({ simulator }: TasksVisualizerProps) {
  const state = getCurrentState(simulator)
  const taskEntries = Array.fromIterable(HashMap.toEntries(state.tasks))

  return (
    <div>
      <h3>Tasks Overview</h3>
      <div className="tasks-grid">
        {taskEntries.map(([taskId, task]) => (
          <div key={taskId} className="task task--pending">
            <h4>Task {taskId}</h4>
            <p>{task.title}</p>
            <span className="status">pending</span>
          </div>
        ))}
      </div>
    </div>
  )
}