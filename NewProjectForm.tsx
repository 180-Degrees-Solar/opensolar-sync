'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProject } from './actions'

export default function NewProjectForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)

    const formData = new FormData(e.currentTarget)

    const result = await createProject({
      name: (formData.get('name') as string) ?? '',
      address: (formData.get('address') as string) ?? '',
      clientEmail: (formData.get('clientEmail') as string) ?? '',
      opensolarProjectIdentifier:
        (formData.get('opensolarProjectIdentifier') as string) ?? '',
      ghlOpportunityId: (formData.get('ghlOpportunityId') as string) ?? '',
      ghlContactId: (formData.get('ghlContactId') as string) ?? '',
    })

    setIsSubmitting(false)

    if (result.success && result.projectId) {
      setSuccess('Project created successfully!')
      setTimeout(() => {
        router.push(`/admin/projects/${result.projectId}`)
      }, 1000)
    } else {
      setError(result.error ?? 'An unknown error occurred.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">
          {success}
        </div>
      )}

      {/* Project Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Project Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="e.g., Smith Solar Installation"
        />
      </div>

      {/* Address */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <input
          type="text"
          id="address"
          name="address"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="123 Main St, City, State"
        />
      </div>

      {/* Client Email */}
      <div>
        <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700">
          Client Email
        </label>
        <input
          type="email"
          id="clientEmail"
          name="clientEmail"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          placeholder="client@example.com"
        />
        <p className="mt-1 text-xs text-gray-500">
          If the email matches an existing user, they will be linked as the project owner.
          Otherwise, they can be linked after registration.
        </p>
      </div>

      <hr className="border-gray-200" />

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          External System Identifiers (optional)
        </h3>

        {/* OpenSolar Project Identifier */}
        <div className="mb-4">
          <label
            htmlFor="opensolarProjectIdentifier"
            className="block text-sm font-medium text-gray-700"
          >
            OpenSolar Project Identifier
          </label>
          <input
            type="text"
            id="opensolarProjectIdentifier"
            name="opensolarProjectIdentifier"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="OS-12345"
          />
        </div>

        {/* GHL Opportunity ID */}
        <div className="mb-4">
          <label
            htmlFor="ghlOpportunityId"
            className="block text-sm font-medium text-gray-700"
          >
            GHL Opportunity ID
          </label>
          <input
            type="text"
            id="ghlOpportunityId"
            name="ghlOpportunityId"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="opp_abc123"
          />
        </div>

        {/* GHL Contact ID */}
        <div>
          <label
            htmlFor="ghlContactId"
            className="block text-sm font-medium text-gray-700"
          >
            GHL Contact ID
          </label>
          <input
            type="text"
            id="ghlContactId"
            name="ghlContactId"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            placeholder="con_xyz789"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </form>
  )
}
