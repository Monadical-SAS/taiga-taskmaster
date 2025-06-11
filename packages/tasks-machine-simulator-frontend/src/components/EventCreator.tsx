import { useState } from 'react'
import { 
  type SimulationCommand, 
  type SimulationState,
  generateMockTasks
} from '@taiga-task-master/tasks-machine-simulator'
import { HashMap, Array } from 'effect'
import type { ArtifactId } from '@taiga-task-master/tasks-machine-simulator/dist/types.ts';

interface EventCreatorProps {
  onExecuteCommand: (command: SimulationCommand) => void
  currentState: SimulationState
}

export function EventCreator({ onExecuteCommand, currentState }: EventCreatorProps) {
  const [commandType, setCommandType] = useState<SimulationCommand['type']>('take_next_task')
  const [artifactId, setArtifactId] = useState('')
  const [progressText, setProgressText] = useState('')
  const [taskCount, setTaskCount] = useState(3)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [editTaskTitle, setEditTaskTitle] = useState('')
  const [editTaskDescription, setEditTaskDescription] = useState('')
  // Removed editTaskStatus since status is now positional
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([])
  const [newArtifactId, setNewArtifactId] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    let command: SimulationCommand

    try {
      switch (commandType) {
        case 'take_next_task':
          command = { type: 'take_next_task' }
          break
        // Removed start_task_execution command
        case 'agent_step':
          command = progressText 
            ? { type: 'agent_step', progressText }
            : { type: 'agent_step' }
          break
        case 'complete_current_task':
          command = { type: 'complete_current_task' }
          break
        case 'commit_artifact':
          if (!artifactId) {
            alert('Please provide an artifact ID')
            return
          }
          command = { type: 'commit_artifact', artifactId: artifactId as ArtifactId }
          break
        case 'append_tasks':
          const newTasks = generateMockTasks(taskCount)
          command = { type: 'append_tasks', tasks: newTasks }
          break
        case 'agent_fail':
          if (!errorMessage) {
            alert('Please provide an error message')
            return
          }
          command = { type: 'agent_fail', errorMessage }
          break
        case 'edit_task':
          if (!selectedTaskId) {
            alert('Please select a task to edit')
            return
          }
          if (!editTaskTitle) {
            alert('Please provide a task title')
            return
          }
          const taskIdNumber = parseInt(selectedTaskId, 10)
          if (isNaN(taskIdNumber)) {
            alert('Invalid task ID')
            return
          }
          command = { 
            type: 'edit_task', 
            taskId: taskIdNumber as any,
            task: {
              id: taskIdNumber as any,
              title: editTaskTitle,
              description: editTaskDescription || 'No description'
            }
          }
          break
        case 'add_artifact':
          if (!newArtifactId) {
            alert('Please provide an artifact ID')
            return
          }
          if (selectedTaskIds.length === 0) {
            alert('Please select at least one task for the artifact')
            return
          }
          const taskIdNumbers = selectedTaskIds.map(id => parseInt(id, 10))
          if (taskIdNumbers.some(id => isNaN(id))) {
            alert('Invalid task IDs selected')
            return
          }
          command = { 
            type: 'add_artifact', 
            artifactId: newArtifactId as any,
            taskIds: taskIdNumbers as any[]
          }
          break
        default:
          alert('Unknown command type')
          return
      }

      onExecuteCommand(command)
    } catch (error) {
      alert(`Command creation failed: ${error instanceof Error ? error.message : String(error)}`)
    }
    
    // Reset form
    setProgressText('')
    setArtifactId('')
    setErrorMessage('')
    setEditTaskTitle('')
    setEditTaskDescription('')
    // Removed editTaskStatus reset
    setSelectedTaskId('')
    setSelectedTaskIds([])
    setNewArtifactId('')
  }

  const availableArtifacts = currentState.artifacts
  
  // Get all tasks (current + artifact tasks) for editing
  const getAllTasks = () => {
    const currentTasks = Array.fromIterable(HashMap.toEntries(currentState.tasks))
      .map(([id, task]) => [String(id), task] as [string, any])
    const artifactTasks: Array<[string, any]> = []
    
    currentState.artifacts.forEach(artifact => {
      const tasks = Array.fromIterable(HashMap.toEntries(artifact.tasks))
        .map(([id, task]) => [String(id), task] as [string, any])
      artifactTasks.push(...tasks)
    })
    
    return [...currentTasks, ...artifactTasks]
  }
  
  // Get only current tasks for creating artifacts
  const getCurrentTasks = () => {
    return Array.fromIterable(HashMap.toEntries(currentState.tasks))
      .map(([id, task]) => [String(id), task] as [string, any])
  }
  
  const allTasks = getAllTasks()
  const currentTasks = getCurrentTasks()
  
  // Handle task selection for artifacts
  const handleTaskSelection = (taskId: string, checked: boolean) => {
    if (checked) {
      setSelectedTaskIds([...selectedTaskIds, taskId])
    } else {
      setSelectedTaskIds(selectedTaskIds.filter(id => id !== taskId))
    }
  }

  return (
    <div className="event-creator">
      <h3>Create Custom Event</h3>
      <form className="event-form" onSubmit={handleSubmit}>
        <div>
          <label>
            Command Type:
            <select 
              value={commandType} 
              onChange={(e) => setCommandType(e.target.value as SimulationCommand['type'])}
            >
              <option value="take_next_task">Take Next Task</option>
              <option value="agent_step">Agent Step</option>
              <option value="complete_current_task">Complete Current Task</option>
              <option value="commit_artifact">Commit Artifact</option>
              <option value="append_tasks">Add More Tasks</option>
              <option value="edit_task">Edit Task</option>
              <option value="add_artifact">Create Artifact</option>
              <option value="agent_fail">Agent Fail</option>
            </select>
          </label>
        </div>

        {/* Removed start_task_execution UI */}

        {commandType === 'agent_step' && (
          <div>
            <label>
              Progress Text (optional):
              <input
                type="text"
                value={progressText}
                onChange={(e) => setProgressText(e.target.value)}
                placeholder="e.g., Working on authentication module..."
              />
            </label>
          </div>
        )}

        {commandType === 'commit_artifact' && (
          <div>
            <label>
              Artifact ID:
              {availableArtifacts.length > 0 ? (
                <select
                  value={artifactId}
                  onChange={(e) => setArtifactId(e.target.value)}
                >
                  <option value="">Select an artifact...</option>
                  {availableArtifacts.map(artifact => (
                    <option key={artifact.id} value={artifact.id}>
                      {artifact.id}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={artifactId}
                  onChange={(e) => setArtifactId(e.target.value)}
                  placeholder="Enter artifact ID"
                />
              )}
            </label>
          </div>
        )}

        {commandType === 'append_tasks' && (
          <div>
            <label>
              Number of Tasks to Add:
              <input
                type="number"
                min="1"
                max="10"
                value={taskCount}
                onChange={(e) => setTaskCount(parseInt(e.target.value) || 1)}
                placeholder="Number of tasks"
              />
            </label>
          </div>
        )}

        {commandType === 'agent_fail' && (
          <div>
            <label>
              Error Message:
              <input
                type="text"
                value={errorMessage}
                onChange={(e) => setErrorMessage(e.target.value)}
                placeholder="e.g., Network timeout, compilation error..."
              />
            </label>
          </div>
        )}

        {commandType === 'edit_task' && (
          <div>
            <label>
              Select Task to Edit:
              <select
                value={selectedTaskId}
                onChange={(e) => {
                  const taskId = e.target.value
                  setSelectedTaskId(taskId)
                  if (taskId) {
                    const task = allTasks.find(([id]) => id === taskId)?.[1]
                    if (task) {
                      setEditTaskTitle(task.title)
                      setEditTaskDescription(task.description)
                    }
                  }
                }}
              >
                <option value="">Select a task...</option>
                {allTasks.map(([taskId, task]) => (
                  <option key={taskId} value={taskId}>
                    {task.title} (ID: {taskId})
                  </option>
                ))}
              </select>
            </label>
            
            {selectedTaskId && (
              <>
                <label>
                  Task Title:
                  <input
                    type="text"
                    value={editTaskTitle}
                    onChange={(e) => setEditTaskTitle(e.target.value)}
                    placeholder="Enter new task title"
                  />
                </label>
                
                <label>
                  Task Description:
                  <textarea
                    value={editTaskDescription}
                    onChange={(e) => setEditTaskDescription(e.target.value)}
                    placeholder="Enter new task description"
                    rows={3}
                  />
                </label>
                
                {/* Status is now positional - no need for status dropdown */}
              </>
            )}
          </div>
        )}

        {commandType === 'add_artifact' && (
          <div>
            <label>
              Artifact ID:
              <input
                type="text"
                value={newArtifactId}
                onChange={(e) => setNewArtifactId(e.target.value)}
                placeholder="e.g., feature-auth-branch"
              />
            </label>
            
            <div>
              <label>Select Tasks for Artifact (from current tasks only):</label>
              {currentTasks.length === 0 ? (
                <p style={{ fontStyle: 'italic', color: '#666' }}>
                  No current tasks available. Complete some artifact tasks to commit them first.
                </p>
              ) : (
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', padding: '0.5rem' }}>
                  {currentTasks.map(([taskId, task]) => (
                    <div key={taskId} style={{ marginBottom: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.includes(taskId)}
                          onChange={(e) => handleTaskSelection(taskId, e.target.checked)}
                        />
                        <span>
                          {task.title} (ID: {taskId}) - {task.status}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              )}
              {selectedTaskIds.length > 0 && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.9em', color: '#666' }}>
                  Selected: {selectedTaskIds.length} task(s)
                </p>
              )}
            </div>
          </div>
        )}

        <button type="submit" className="primary-button">
          Execute Command
        </button>
      </form>
      
      {availableArtifacts.length > 0 && (
        <div style={{ marginTop: '1rem', fontSize: '0.9em', opacity: 0.8 }}>
          Available artifacts: {availableArtifacts.map(a => a.id).join(', ')}
        </div>
      )}
    </div>
  )
}