'use client'

import type { Document } from '@/lib/types'

interface DocumentListProps {
  documents: Document[]
}

function getFileIcon(fileType: string | null): string {
  if (!fileType) return '📄'
  const t = fileType.toLowerCase()
  if (t.includes('pdf')) return '📕'
  if (t.includes('image') || t.includes('png') || t.includes('jpg') || t.includes('jpeg')) return '🖼️'
  if (t.includes('spreadsheet') || t.includes('excel') || t.includes('csv') || t.includes('xls')) return '📊'
  if (t.includes('doc') || t.includes('word')) return '📝'
  if (t.includes('zip') || t.includes('archive') || t.includes('rar')) return '📦'
  return '📄'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DocumentList({ documents }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-gray-400">
        No documents yet
      </div>
    )
  }

  return (
    <ul className="divide-y divide-gray-100">
      {documents.map((doc) => (
        <li key={doc.id}>
          <a
            href={doc.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 py-3 px-1 rounded-md hover:bg-gray-50 transition-colors"
          >
            <span className="text-lg flex-shrink-0" role="img" aria-label={doc.file_type ?? 'file'}>
              {getFileIcon(doc.file_type)}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-700 truncate">{doc.name}</p>
              <p className="text-xs text-gray-400">
                Uploaded {formatDate(doc.created_at)}
              </p>
            </div>
            <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  )
}
