'use client'

import { useState, useRef, useEffect } from 'react'
import { Project, Task, Milestone, AIMessage } from '@/types'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Sparkles, Activity, ListChecks, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

interface AIAssistantPanelProps {
  open: boolean
  onClose: () => void
  project: Project
  tasks: Task[]
  milestones: Milestone[]
  onApplyTasks?: (tasks: Array<{ title: string; description: string; priority: string; estimatedDays: number }>) => void
}

const actions = [
  { id: 'suggest-tasks', icon: ListChecks, label: 'Suggest Tasks', desc: 'AI task breakdown' },
  { id: 'review-timeline', icon: Sparkles, label: 'Review Timeline', desc: 'Schedule analysis' },
  { id: 'assess-completion', icon: Activity, label: 'Assess Health', desc: 'Risk & progress' },
]

export default function AIAssistantPanel({ open, onClose, project, tasks, milestones, onApplyTasks }: AIAssistantPanelProps) {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  function addMessage(role: 'user' | 'assistant', content: string) {
    setMessages((prev) => [...prev, { role, content }])
  }

  async function handleAction(id: string) {
    setLoading(true)
    setActiveAction(id)

    if (id === 'suggest-tasks') {
      if (!project.start_date || !project.end_date) {
        toast.error('Set project start and end dates first')
        setLoading(false); setActiveAction(null); return
      }
      addMessage('user', `Suggest a task breakdown for "${project.name}"`)
      const res = await fetch('/api/ai/suggest-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName: project.name,
          projectDescription: project.description ?? '',
          startDate: project.start_date,
          endDate: project.end_date,
          existingTasks: tasks.map((t) => t.title),
        }),
      })
      let fullText = ''
      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      if (reader) {
        setMessages((prev) => [...prev, { role: 'assistant', content: '…' }])
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const lines = decoder.decode(value).split('\n')
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const { text } = JSON.parse(line.slice(6))
                fullText += text
                setMessages((prev) => {
                  const updated = [...prev]
                  updated[updated.length - 1] = { role: 'assistant', content: fullText }
                  return updated
                })
              } catch {}
            }
          }
        }
      }
      try {
        const match = fullText.match(/\{[\s\S]*\}/)
        if (match) {
          const parsed = JSON.parse(match[0])
          if (parsed.tasks && onApplyTasks) {
            setMessages((prev) => [...prev, { role: 'assistant', content: `__APPLY__${JSON.stringify(parsed.tasks)}` }])
          }
        }
      } catch {}
    }

    if (id === 'review-timeline') {
      addMessage('user', `Review the timeline for "${project.name}"`)
      const res = await fetch('/api/ai/suggest-timeline', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, tasks, milestones }),
      })
      const data = await res.json()
      if (data.error) { addMessage('assistant', 'AI not configured — add ANTHROPIC_API_KEY to .env.local') }
      else {
        const s = data.suggestions?.map((s: { type: string; message: string }) => `• [${s.type.toUpperCase()}] ${s.message}`).join('\n') ?? ''
        addMessage('assistant', `${data.overallAssessment}\n\n${s}`)
      }
    }

    if (id === 'assess-completion') {
      addMessage('user', `Assess health of "${project.name}"`)
      const res = await fetch('/api/ai/assess-completion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, tasks, milestones }),
      })
      const data = await res.json()
      if (data.error) { addMessage('assistant', 'AI not configured — add ANTHROPIC_API_KEY to .env.local') }
      else {
        const msg = [
          data.assessment,
          data.risks?.length ? `\nRisks:\n${data.risks.map((r: string) => `• ${r}`).join('\n')}` : '',
          data.nextSteps?.length ? `\nNext Steps:\n${data.nextSteps.map((s: string) => `• ${s}`).join('\n')}` : '',
          `\nAI Completion: ${data.calculatedCompletion}% (${data.confidence} confidence)`,
        ].join('\n')
        addMessage('assistant', msg)
      }
    }

    setLoading(false)
    setActiveAction(null)
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        className="w-[420px] flex flex-col p-0 gap-0"
        style={{ background: 'var(--pm-sidebar)', border: 'none' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--pm-sidebar-border)' }}
        >
          <div>
            <p className="text-white text-sm font-semibold">AI Assistant</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{project.name}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded" style={{ color: 'rgba(255,255,255,0.4)' }}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--pm-sidebar-border)' }}>
          <p className="text-[10px] font-medium uppercase tracking-widest mb-2.5" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Quick Actions
          </p>
          <div className="space-y-1.5">
            {actions.map(({ id, icon: Icon, label, desc }) => (
              <button
                key={id}
                disabled={loading}
                onClick={() => handleAction(id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all"
                style={{
                  background: activeAction === id ? 'var(--pm-sidebar-active)' : 'var(--pm-sidebar-hover)',
                  border: activeAction === id ? `1px solid var(--pm-accent)` : '1px solid transparent',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading && activeAction !== id ? 0.5 : 1,
                }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(44,82,216,0.15)' }}
                >
                  <Icon className="h-3.5 w-3.5" style={{ color: 'var(--pm-accent)' }} />
                </div>
                <div>
                  <p className="text-xs font-medium text-white">{label}</p>
                  <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'rgba(44,82,216,0.12)', border: '1px solid rgba(44,82,216,0.2)' }}
              >
                <Sparkles className="h-5 w-5" style={{ color: 'var(--pm-accent)' }} />
              </div>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Use the quick actions above<br />to get AI insights
              </p>
            </div>
          ) : (
            messages.map((msg, i) => {
              if (msg.content.startsWith('__APPLY__')) {
                const taskData = JSON.parse(msg.content.replace('__APPLY__', ''))
                return (
                  <div
                    key={i}
                    className="rounded-xl p-3"
                    style={{ background: 'rgba(44,82,216,0.12)', border: '1px solid rgba(44,82,216,0.3)' }}
                  >
                    <p className="text-xs font-medium mb-2" style={{ color: 'var(--pm-accent)' }}>
                      Apply {taskData.length} suggested tasks?
                    </p>
                    <button
                      onClick={() => onApplyTasks?.(taskData)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'var(--pm-accent)', color: '#fff' }}
                    >
                      Apply All Tasks
                    </button>
                  </div>
                )
              }

              const isUser = msg.role === 'user'
              return (
                <div key={i} className={`flex gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                    style={{
                      background: isUser ? 'rgba(255,255,255,0.1)' : 'rgba(44,82,216,0.2)',
                      color: isUser ? 'rgba(255,255,255,0.6)' : 'var(--pm-accent)',
                    }}
                  >
                    {isUser ? 'U' : 'AI'}
                  </div>
                  <div
                    className="max-w-[84%] rounded-xl px-3 py-2.5 text-xs leading-relaxed"
                    style={{
                      background: isUser ? 'rgba(255,255,255,0.08)' : 'var(--pm-sidebar-active)',
                      color: 'rgba(255,255,255,0.85)',
                    }}
                  >
                    <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
                  </div>
                </div>
              )
            })
          )}
          {loading && (
            <div className="flex gap-2">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(44,82,216,0.2)' }}
              >
                <Loader2 className="h-3 w-3 animate-spin" style={{ color: 'var(--pm-accent)' }} />
              </div>
              <div
                className="rounded-xl px-3 py-2.5 text-xs"
                style={{ background: 'var(--pm-sidebar-active)', color: 'rgba(255,255,255,0.4)' }}
              >
                Thinking…
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {messages.length > 0 && (
          <div className="px-4 py-3 flex-shrink-0" style={{ borderTop: '1px solid var(--pm-sidebar-border)' }}>
            <button
              onClick={() => setMessages([])}
              className="text-[11px]"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              Clear conversation
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
