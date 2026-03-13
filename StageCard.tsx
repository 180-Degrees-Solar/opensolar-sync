'use client'

import { useState } from 'react'
import type { Stage, Task, Document, Update } from '@/lib/types'
import TaskChecklist from './TaskChecklist'
import DocumentList from './DocumentList'
import UpdateFeed from './UpdateFeed'

interface StageCardProps {
  stage: Stage
  tasks: Task[]
  documents: Document[]
  updates: Update[]
  isCurrent: boolean
}

function StatusBadge({ status }: { status: Stage['status'] }) {
  const config = {
    done: { bg: 'bg-green-100', text: 'text-green-700', label: 'Done' },
    in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'In Progress' },
    not_started: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Not Started' },
  }
  const c = config[status]
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  )
}

export default function StageCard({ stage, tasks, documents, updates, isCurrent }: StageCardProps) {
  const [isExpanded, setIsExpanded] = useState(isCurrent)

  return (
    <div className={`rounded-xl border ${isCurrent ? 'border-teal-300 shadow-md' : 'border-gray-200'} bg-white overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        {/* Stage number badge */}
        <span
          className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold flex-shrink-0 ${
            stage.status === 'done'
              ? 'bg-teal-500 text-white'
              : stage.status === 'in_progress'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-500'
          }`}
        >
          {stage.stage_number}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base font-semibold text-gray-900 truncate">{stage.title}</h3>
            <StatusBadge status={stage.status} />
          </div>
          {stage.timeframe && (
            <p className="text-xs text-gray-400 mt-0.5">{stage.timeframe}</p>
          )}
        </div>

        {/* Expand/collapse chevron */}
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-100 px-6 py-4 space-y-6">
          {/* What Happens description */}
          {stage.what_happens && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">What Happens</h4>
              <p className="text-sm text-gray-600 leading-relaxed">{stage.what_happens}</p>
            </div>
          )}

          {/* Tasks section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              Tasks
              {tasks.length > 0 && (
                <span className="text-xs text-gray-400 font-normal">
                  ({tasks.filter((t) => t.status === 'done').length}/{tasks.length} completed)
                </span>
              )}
            </h4>
            <TaskChecklist tasks={tasks} />
          </div>

          {/* Documents section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              Documents
              {documents.length > 0 && (
                <span className="text-xs text-gray-400 font-normal">({documents.length})</span>
              )}
            </h4>
            <DocumentList documents={documents} />
          </div>

          {/* Updates section */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              Updates
              {updates.length > 0 && (
                <span className="text-xs text-gray-400 font-normal">({updates.length})</span>
              )}
            </h4>
            <UpdateFeed updates={updates} />
          </div>
        </div>
      )}
    </div>
  )
}
