'use client'

import { useState, useEffect } from 'react'
import { Project } from '@/types'
import ProjectCard from '@/components/projects/ProjectCard'
import ProjectForm from '@/components/projects/ProjectForm'
import { Plus, Search } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function ProjectsPage() {
  const { isAdmin } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)

  useEffect(() => {
    fetch('/api/projects')
      .then((r) => r.json())
      .then((data) => { setProjects(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-10 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1
            className="text-[2.6rem] leading-none mb-2"
            style={{ fontFamily: 'var(--font-sans)', fontWeight: 400, color: 'var(--pm-text)' }}
          >
            Projects
          </h1>
          <p className="text-sm" style={{ color: 'var(--pm-text-3)' }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setFormOpen(true)} className="fp-btn fp-btn-amber">
            <Plus className="h-4 w-4" /> New Project
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-7">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none" style={{ color: 'var(--pm-text-3)' }} />
        <input
          type="text"
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm transition-all outline-none bg-white"
          style={{ border: '1px solid var(--pm-border)', color: 'var(--pm-text)' }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--pm-accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(44,82,216,0.08)' }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--pm-border)'; e.target.style.boxShadow = 'none' }}
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl animate-pulse" style={{ background: 'var(--pm-border)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--pm-text)' }}>
            {search ? 'No matching projects' : 'No projects yet'}
          </p>
          <p className="text-xs mb-5" style={{ color: 'var(--pm-text-3)' }}>
            {search ? 'Try a different search term' : 'No projects available'}
          </p>
          {!search && isAdmin && (
            <button onClick={() => setFormOpen(true)} className="fp-btn fp-btn-amber">
              <Plus className="h-4 w-4" /> New Project
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p as Parameters<typeof ProjectCard>[0]['project']} />
          ))}
        </div>
      )}

      {isAdmin && (
        <ProjectForm
          open={formOpen}
          onClose={() => setFormOpen(false)}
          onSuccess={(p) => setProjects((prev) => [p, ...prev])}
        />
      )}
    </div>
  )
}
