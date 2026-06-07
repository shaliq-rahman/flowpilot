import { z } from 'zod'

export const projectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  status: z.enum(['planning', 'active', 'on_hold', 'completed', 'cancelled']).default('planning'),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  color: z.string().default('#6366f1'),
})

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().nullable(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'done', 'cancelled']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  due_date: z.string().optional().nullable(),
  start_date: z.string().optional().nullable(),
  completion_pct: z.number().min(0).max(100).default(0),
  estimated_hours: z.number().optional().nullable(),
  project_id: z.string().uuid(),
})

export const milestoneSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional().nullable(),
  due_date: z.string().min(1, 'Due date is required'),
  project_id: z.string().uuid(),
})

export type ProjectFormValues = z.infer<typeof projectSchema>
export type TaskFormValues = z.infer<typeof taskSchema>
export type MilestoneFormValues = z.infer<typeof milestoneSchema>
