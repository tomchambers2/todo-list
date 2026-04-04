import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
  }

  const client = new Anthropic({ apiKey });
  const { taskTitle, existingTasks } = await request.json();

  const quickCount = existingTasks.filter((t: { category: string }) => t.category === 'quick').length;
  const mediumCount = existingTasks.filter((t: { category: string }) => t.category === 'medium').length;
  const tasksCount = existingTasks.filter((t: { category: string }) => t.category === 'tasks').length;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `You are a task sorting assistant. Categorize the following task into one of these categories:

- "quick": Tasks that can be done in under 10 minutes (currently ${quickCount} tasks, limit 20)
- "medium": Isolated tasks that take roughly 30 minutes to complete (currently ${mediumCount} tasks)
- "tasks": Big project-level tasks that take a week or more (currently ${tasksCount} tasks, limit 5)
- "delegate-ai": Tasks that an AI could do autonomously (research, writing drafts, analysis, etc.)

Task: "${taskTitle}"

Also suggest a due date if one seems implied by the task text. If the task is a big project ("tasks" category), suggest subtasks.

Respond in JSON only:
{
  "category": "quick" | "medium" | "tasks" | "delegate-ai",
  "suggestedDate": "YYYY-MM-DD" | null,
  "repeatInterval": "daily" | "weekdays" | "weekly" | "monthly" | "yearly" | null,
  "subtasks": ["subtask1", "subtask2"] (only for "tasks" category, empty array otherwise),
  "warning": "string or null - warn if a category limit is close to being reached"
}`,
      },
    ],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }

  const result = JSON.parse(jsonMatch[0]);
  return NextResponse.json(result);
}
