import Anthropic from '@anthropic-ai/sdk'
import { Project, Task, Milestone } from '@/types'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? 'no-key',
})

const TASK_SUGGESTION_PROMPT = `You are a senior project manager. Given a project description, suggest a structured task breakdown as JSON.
Return ONLY valid JSON with this shape:
{
  "tasks": [{"title": string, "description": string, "priority": "low"|"medium"|"high"|"urgent", "estimatedDays": number}],
  "reasoning": string
}`

const TIMELINE_REVIEW_PROMPT = `You are a senior project manager reviewing a project timeline. Analyze the tasks and milestones and return ONLY valid JSON:
{
  "suggestions": [{"type": "warning"|"recommendation"|"risk", "message": string}],
  "overallAssessment": string
}`

const COMPLETION_ASSESSMENT_PROMPT = `You are a senior project manager assessing project health. Return ONLY valid JSON:
{
  "calculatedCompletion": number,
  "confidence": "low"|"medium"|"high",
  "risks": string[],
  "nextSteps": string[],
  "assessment": string
}`

export async function suggestTasksStream(context: {
  projectName: string
  projectDescription: string
  startDate: string
  endDate: string
  existingTasks?: string[]
}): Promise<ReadableStream> {
  const userPrompt = `Project: ${context.projectName}
Description: ${context.projectDescription}
Timeline: ${context.startDate} to ${context.endDate}
${context.existingTasks?.length ? `Existing tasks: ${context.existingTasks.join(', ')}` : ''}

Suggest a comprehensive task breakdown.`

  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    system: TASK_SUGGESTION_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  return new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
          )
        }
      }
      controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
      controller.close()
    },
  })
}

export async function reviewTimeline(project: Project, tasks: Task[], milestones: Milestone[]) {
  const prompt = `Project: ${project.name} (${project.status})
Timeline: ${project.start_date} to ${project.end_date}
Completion: ${project.completion_pct}%
Tasks: ${tasks.map((t) => `${t.title} (${t.status}, due: ${t.due_date}, ${t.completion_pct}%)`).join('; ')}
Milestones: ${milestones.map((m) => `${m.title} (due: ${m.due_date}, ${m.status})`).join('; ')}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: TIMELINE_REVIEW_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  return JSON.parse(text)
}

export async function assessCompletion(project: Project, tasks: Task[], milestones: Milestone[]) {
  const prompt = `Project: ${project.name}
Current completion (auto-calc): ${project.completion_pct}%
Status: ${project.status}
Tasks: ${tasks.map((t) => `${t.title}: status=${t.status}, completion=${t.completion_pct}%`).join('; ')}
Milestones: ${milestones.map((m) => `${m.title}: due=${m.due_date}, status=${m.status}`).join('; ')}
Today: ${new Date().toISOString().split('T')[0]}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: COMPLETION_ASSESSMENT_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
  return JSON.parse(text)
}
