'use client'

import type { Task } from '@/lib/types'

interface TaskChecklistProps {
  tasks: Task[]
}

function StatusIcon({ status }: { status: Task['status'] }) {
  switch (status) {
    case 'done':
      return (
        <svg className="w-5 h-5 text-teal-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    case 'in_progress':
      return (
        <svg className="w-5 h-5 text-blue-500 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )
    case 'pending':
    default:
      return (
        <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0" />
      )
  }
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function TaskChecklist({ tasks }: TaskChecklistProps) {
  if (tasks.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-gray-400">
        No tasks for this stage
      </div>
    )
  }

  return (
    <ul className="divide-y divide-gray-100">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center gap-3 py-3 px-1">
          <StatusIcon status={task.status} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
              {task.title}
            </p>
          </div>
          {task.due_date && (
            <span className="text-xs text-gray-400 flex-shrink-0">
              Due {formatDueDate(task.due_date)}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}
