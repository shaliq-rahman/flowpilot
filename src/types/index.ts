export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done' | 'cancelled'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type MilestoneStatus = 'upcoming' | 'at_risk' | 'completed' | 'missed'
export type MemberRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  owner_id: string
  name: string
  description: string | null
  status: ProjectStatus
  start_date: string | null
  end_date: string | null
  completion_pct: number
  color: string
  created_at: string
  updated_at: string
  tasks?: Task[]
  milestones?: Milestone[]
}

export interface Task {
  id: string
  project_id: string
  assignee_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  start_date: string | null
  completion_pct: number
  estimated_hours: number | null
  actual_hours: number | null
  sort_order: number
  created_at: string
  updated_at: string
  assignee?: Profile
}

export interface Milestone {
  id: string
  project_id: string
  title: string
  description: string | null
  due_date: string
  status: MilestoneStatus
  created_at: string
  updated_at: string
}

export interface AIMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface AISuggestion {
  tasks?: Array<{
    title: string
    description: string
    priority: TaskPriority
    estimatedDays: number
  }>
  timelineAdvice?: Array<{
    type: 'warning' | 'recommendation' | 'risk'
    message: string
  }>
  completionAssessment?: {
    calculatedCompletion: number
    risks: string[]
    nextSteps: string[]
    assessment: string
  }
  reasoning?: string
}
