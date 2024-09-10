import { count } from 'console'
import { and, eq, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '../db'
import { goals, goalsCompletions } from '../db/schema'
import dayjs from 'dayjs'

interface CreateGoalCompletionRequest {
  goalId: string
}

export async function createGoalCompletion({
  goalId,
}: CreateGoalCompletionRequest) {
  const firstDayOfWeek = dayjs().startOf('week').toDate()
  const lastDayOfWeek = dayjs().endOf('week').toDate()

  const goalCompletionCounts = db.$with('goals_completion_counts').as(
    db
      .select({
        goalsId: goalsCompletions.goalsId,
        completionCount: count(goalsCompletions.id).as('completionCount'),
      })
      .from(goalsCompletions)
      .where(
        and(
          gte(goalsCompletions.createdAt, firstDayOfWeek),
          lte(goalsCompletions.createdAt, lastDayOfWeek)
        )
      )
      .groupBy(goalsCompletions.goalsId)
  )

  const result = await db.with(goalCompletionCounts).select({
    ' desiredWeeklyFrequency: goalsCreatedUpToWeek.desiredWeeklyFrequency,
      goalCompletionCounts: goalCompletionCounts.completionCount,
      completionCount: sql /*sql*/`
        COALESCE(${goalCompletionCounts.completionCount}, 0)
      `.mapWith(Number),
    })'
  }).from(goals).leftJoin(goalCompletionCounts, eq(goalCompletionCounts.goalsId, goals.id))

  const result = await db
    .insert(goalsCompletions)
    .values({
      goalId,
    })
    .returning()

  const goalCompletion = result[0]

  return {
    goalCompletion,
  }
}
