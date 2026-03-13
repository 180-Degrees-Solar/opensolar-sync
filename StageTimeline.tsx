'use client'

import { useRouter } from 'next/navigation'
import type { Stage } from '@/lib/types'
import { STAGES } from '@/lib/constants/stages'

interface StageTimelineProps {
  stages: Stage[]
  currentStage: number
}

export default function StageTimeline({ stages, currentStage }: StageTimelineProps) {
  const router = useRouter()

  function getStageStatus(stageNumber: number): 'done' | 'in_progress' | 'not_started' {
    const stage = stages.find((s) => s.stage_number === stageNumber)
    return stage?.status ?? 'not_started'
  }

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex items-start min-w-[800px] px-4">
        {STAGES.map((stageDef, index) => {
          const status = getStageStatus(stageDef.number)
          const isCurrent = stageDef.number === currentStage
          const isDone = status === 'done'
          const isLast = index === STAGES.length - 1

          return (
            <div key={stageDef.number} className="flex items-start flex-1">
              {/* Circle + line container */}
              <div className="flex flex-col items-center flex-shrink-0">
                {/* Circle row with connecting line */}
                <div className="flex items-center w-full">
                  {/* Circle */}
                  <button
                    onClick={() => router.push(`/dashboard/stages/${stageDef.number}`)}
                    className={`
                      relative flex items-center justify-center rounded-full
                      transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2
                      ${isCurrent
                        ? 'w-12 h-12 bg-teal-500 text-white shadow-lg animate-pulse'
                        : isDone
                          ? 'w-10 h-10 bg-teal-500 text-white'
                          : 'w-10 h-10 border-2 border-gray-300 text-gray-400 bg-white hover:border-gray-400'
                      }
                    `}
                    title={stageDef.title}
                  >
                    {isDone ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className={`text-sm font-semibold ${isCurrent ? 'text-white' : ''}`}>
                        {stageDef.number}
                      </span>
                    )}
                  </button>

                  {/* Connecting line */}
                  {!isLast && (
                    <div
                      className={`h-0.5 flex-1 mx-1 ${
                        isDone ? 'bg-teal-400' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>

                {/* Stage title */}
                <span
                  className={`
                    mt-2 text-xs text-center leading-tight max-w-[80px] truncate
                    ${isCurrent ? 'font-semibold text-teal-700' : isDone ? 'text-teal-600' : 'text-gray-500'}
                  `}
                  title={stageDef.title}
                >
                  {stageDef.title}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
