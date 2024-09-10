import dayjs from 'dayjs'
import { client, db } from '.'
import { goals, goalsCompletions } from './schema'

async function seed() {
  await db.delete(goalsCompletions)
  await db.delete(goals)

  const result = await db
    .insert(goals)
    .values([
      { title: 'Acordar cedo', desiredWeeklyFrequency: 5 },
      { title: 'Ir para academia', desiredWeeklyFrequency: 4 },
      { title: 'Estudar programacao', desiredWeeklyFrequency: 7 },
    ])
    .returning()

  const startOfWeek = dayjs().startOf('week')

  await db.insert(goalsCompletions).values([
    { goalsId: result[0].id, createdAt: startOfWeek.toDate() },
    { goalsId: result[1].id, createdAt: startOfWeek.add(1, 'day').toDate() },
  ])
}

seed().finally(() => {
  client.end()
})
